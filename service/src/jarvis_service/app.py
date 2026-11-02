"""HTTP + WebSocket 接口。只给本机的 HUD 外壳用。"""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .registry import Registry

# Tauri 前端的来源：开发时是 Vite，打包后是 tauri 协议
ALLOWED_ORIGINS = [
    "http://localhost:1420",
    "tauri://localhost",
    "http://tauri.localhost",
]


def create_app(registry: Registry | None = None) -> FastAPI:
    reg = registry or Registry().discover()
    app = FastAPI(title="jarvis-service", version=__version__)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {"ok": True, "version": __version__}

    @app.get("/plugins")
    async def list_plugins() -> list[dict[str, Any]]:
        return [p.describe() for p in reg.all()]

    @app.get("/plugins/{plugin_id}")
    async def fetch_plugin(plugin_id: str) -> dict[str, Any]:
        try:
            return await reg.get(plugin_id).fetch()
        except KeyError as exc:
            raise HTTPException(404, f"no plugin {plugin_id}") from exc

    @app.post("/plugins/{plugin_id}/actions/{action}")
    async def run_action(plugin_id: str, action: str, params: dict[str, Any]) -> dict[str, Any]:
        try:
            plugin = reg.get(plugin_id)
        except KeyError as exc:
            raise HTTPException(404, f"no plugin {plugin_id}") from exc
        declared = {a.name: a for a in plugin.actions()}
        if action not in declared:
            raise HTTPException(404, f"no action {action}")
        if declared[action].needs_confirm:
            # 确认队列在 Phase 3/4 实现；在那之前一律拒绝需要确认的动作
            raise HTTPException(409, "action needs confirmation")
        return await plugin.run_action(action, params)

    @app.websocket("/ws")
    async def stream(ws: WebSocket) -> None:
        """按各插件 interval 推送快照：{"plugin": id, "data": {...}}。"""
        await ws.accept()
        loop = asyncio.get_running_loop()
        next_due = {p.id: 0.0 for p in reg.all()}
        try:
            while True:
                now = loop.time()
                for plugin in reg.all():
                    if now >= next_due[plugin.id]:
                        await ws.send_json({"plugin": plugin.id, "data": await plugin.fetch()})
                        next_due[plugin.id] = now + plugin.interval
                await asyncio.sleep(0.2)
        except WebSocketDisconnect:
            return

    return app
