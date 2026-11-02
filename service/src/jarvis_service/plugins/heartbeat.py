"""示例插件：服务心跳。用来验证插件框架和 HUD 通路，Phase 1 后保留作健康检查。"""

from __future__ import annotations

import time
from typing import Any

from ..plugin import Action, Plugin

_STARTED = time.monotonic()


class HeartbeatPlugin(Plugin):
    id = "heartbeat"
    title = "核心状态"
    interval = 1.0

    async def fetch(self) -> dict[str, Any]:
        return {"status": "online", "uptime": round(time.monotonic() - _STARTED, 1)}

    def actions(self) -> list[Action]:
        return [Action(name="ping", description="连通性测试")]

    async def run_action(self, name: str, params: dict[str, Any]) -> dict[str, Any]:
        if name == "ping":
            return {"reply": "pong"}
        return await super().run_action(name, params)
