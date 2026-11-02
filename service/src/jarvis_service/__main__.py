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
        from ctypes import wintypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.OpenProcess.restype = wintypes.HANDLE
        kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel32.WaitForSingleObject.restype = wintypes.DWORD
        kernel32.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel32.CloseHandle.argtypes = [wintypes.HANDLE]

        synchronize = 0x00100000
        handle = kernel32.OpenProcess(synchronize, False, pid)
        if not handle:
            err = ctypes.get_last_error()
            logging.getLogger("jarvis").warning("OpenProcess(%s) failed: %s", pid, err)
            # 打不开句柄时退回轮询
            while psutil.pid_exists(pid):
                time.sleep(interval)
            return
        try:
            kernel32.WaitForSingleObject(handle, 0xFFFFFFFF)
        finally:
            kernel32.CloseHandle(handle)
    else:
        while psutil.pid_exists(pid):
            time.sleep(interval)


def wait_for_stdin_eof() -> None:
    """外壳通过管道给我们 stdin；外壳一死管道写端关闭，这里读到 EOF。"""
    stream = sys.stdin.buffer if sys.stdin else None
    if stream is None:
        return
    while stream.read(1024):
        pass


def watch_parent(pid: int) -> None:
    """外壳进程退出后自行退出（外壳被强杀时不会通知我们）。两种信号谁先到算谁。"""
    log = logging.getLogger("jarvis")
    log.info("watching parent process %s", pid)

    def exit_after(waiter, reason: str) -> None:
        try:
            waiter()
        except Exception:
            log.exception("parent watch (%s) failed", reason)
            return
        log.info("parent process %s is gone (%s), exiting", pid, reason)
        logging.shutdown()
        os._exit(0)

    threading.Thread(
        target=exit_after, args=(lambda: wait_for_exit(pid), "handle"), daemon=True
    ).start()
    threading.Thread(target=exit_after, args=(wait_for_stdin_eof, "stdin"), daemon=True).start()


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
