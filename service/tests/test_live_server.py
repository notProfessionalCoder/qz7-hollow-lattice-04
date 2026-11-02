"""起一个真的 uvicorn 服务器测 WebSocket。

TestClient 不走 uvicorn，测不出「uvicorn 缺 WebSocket 库导致 /ws 404」这类问题，所以单独测一遍。
"""

import json
import socket
import threading
import time
import urllib.request

import uvicorn
from websockets.sync.client import connect

from jarvis_service.app import create_app


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def test_real_server_serves_websocket():
    port = _free_port()
    server = uvicorn.Server(
        uvicorn.Config(create_app(), host="127.0.0.1", port=port, log_config=None)
    )
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    try:
        deadline = time.time() + 10
        while not server.started:
            assert time.time() < deadline, "server did not start"
            time.sleep(0.05)

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health") as r:
            assert json.load(r)["ok"] is True

        seen = set()
        with connect(f"ws://127.0.0.1:{port}/ws", open_timeout=5) as ws:
            while len(seen) < 2:
                msg = json.loads(ws.recv(timeout=5))
                seen.add(msg["plugin"])
        assert {"heartbeat", "system"} <= seen
    finally:
        server.should_exit = True
        thread.join(timeout=5)
