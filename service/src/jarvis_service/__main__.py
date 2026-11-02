"""入口：python -m jarvis_service，或打包后的 jarvis-service.exe（由 Tauri 作为 sidecar 拉起）。"""

import logging
import os
import platform
import sys
import threading
import time

import psutil
import uvicorn

from . import __version__
from .app import create_app
from .config import load_settings
from .logs import setup_logging


def wait_for_exit(pid: int, interval: float = 2.0) -> None:
    """阻塞到进程 pid 退出。

    Windows 上用 WaitForSingleObject：轮询 pid 不可靠，别的进程还握着句柄时，
    已退出的进程仍会被当成"存在"。
    """
    if sys.platform == "win32":
        import ctypes

        synchronize = 0x00100000
        infinite = 0xFFFFFFFF
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(synchronize, False, pid)
        if not handle:
            return  # 已经不在了
        try:
            kernel32.WaitForSingleObject(handle, infinite)
        finally:
            kernel32.CloseHandle(handle)
    else:
        while psutil.pid_exists(pid):
            time.sleep(interval)


def watch_parent(pid: int) -> None:
    """外壳进程退出后自行退出（外壳被强杀时不会通知我们）。"""
    log = logging.getLogger("jarvis")

    def run() -> None:
        wait_for_exit(pid)
        log.info("parent process %s is gone, exiting", pid)
        os._exit(0)

    threading.Thread(target=run, name="parent-watch", daemon=True).start()


def main() -> None:
    log_file = setup_logging()
    log = logging.getLogger("jarvis")
    settings = load_settings()
    log.info(
        "jarvis-service %s starting on %s:%s (python %s, %s, frozen=%s, log=%s)",
        __version__,
        settings.host,
        settings.port,
        platform.python_version(),
        platform.platform(),
        getattr(sys, "frozen", False),
        log_file,
    )
    parent = os.environ.get("JARVIS_PARENT_PID")
    if parent and parent.isdigit():
        watch_parent(int(parent))
    try:
        # log_config=None：不让 uvicorn 覆盖上面的日志配置，它的日志统一进 service.log
        uvicorn.run(create_app(), host=settings.host, port=settings.port, log_config=None)
    except BaseException:
        log.exception("jarvis-service crashed")
        raise


if __name__ == "__main__":
    main()
