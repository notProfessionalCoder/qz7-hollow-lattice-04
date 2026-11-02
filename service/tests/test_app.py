from fastapi.testclient import TestClient

from jarvis_service.app import create_app
from jarvis_service.plugin import Action, Plugin
from jarvis_service.registry import Registry


class DangerPlugin(Plugin):
    id = "danger"
    title = "危险动作"

    async def fetch(self):
        return {}

    def actions(self):
        return [Action(name="wipe", description="删东西", needs_confirm=True)]


def client(registry: Registry | None = None) -> TestClient:
    return TestClient(create_app(registry))


def test_health():
    r = client().get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_discovers_builtin_plugins():
    ids = [p["id"] for p in client().get("/plugins").json()]
    assert "heartbeat" in ids


def test_fetch_and_action():
    c = client()
    assert c.get("/plugins/heartbeat").json()["status"] == "online"
    assert c.post("/plugins/heartbeat/actions/ping", json={}).json() == {"reply": "pong"}


def test_unknown_plugin_and_action():
    c = client()
    assert c.get("/plugins/nope").status_code == 404
    assert c.post("/plugins/heartbeat/actions/nope", json={}).status_code == 404


def test_confirm_actions_are_blocked():
    reg = Registry()
    reg.register(DangerPlugin())
    r = client(reg).post("/plugins/danger/actions/wipe", json={})
    assert r.status_code == 409


def test_duplicate_plugin_id_rejected():
    reg = Registry()
    reg.register(DangerPlugin())
    try:
        reg.register(DangerPlugin())
    except ValueError:
        return
    raise AssertionError("expected ValueError")


def test_websocket_streams_snapshots():
    with client().websocket_connect("/ws") as ws:
        msg = ws.receive_json()
        assert msg["plugin"] == "heartbeat"
        assert msg["data"]["status"] == "online"


def test_wait_for_exit_returns_when_process_ends():
    import subprocess
    import sys
    import threading

    from jarvis_service.__main__ import wait_for_exit

    proc = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(0.5)"])
    done = threading.Event()
    threading.Thread(target=lambda: (wait_for_exit(proc.pid, 0.1), done.set()), daemon=True).start()
    proc.wait()
    assert done.wait(5), "wait_for_exit did not return after the process exited"
