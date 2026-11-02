"""入口：python -m jarvis_service，或打包后的 jarvis-service.exe（由 Tauri 作为 sidecar 拉起）。"""

import logging
import platform
import sys

import uvicorn

from . import __version__
from .app import create_app
from .config import load_settings
from .logs import setup_logging


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
    try:
        # log_config=None：不让 uvicorn 覆盖上面的日志配置，它的日志统一进 service.log
        uvicorn.run(create_app(), host=settings.host, port=settings.port, log_config=None)
    except BaseException:
        log.exception("jarvis-service crashed")
        raise


if __name__ == "__main__":
    main()
