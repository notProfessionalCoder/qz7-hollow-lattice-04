"""日志：写到 %APPDATA%\\jarvis\\logs\\service.log 并输出到 stderr。

非 Windows 上写到 ~/.jarvis/logs。
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


def logs_dir() -> Path:
    appdata = os.environ.get("APPDATA")
    base = Path(appdata) / "jarvis" if appdata else Path.home() / ".jarvis"
    return base / "logs"


def setup_logging() -> Path | None:
    """配置根日志。返回日志文件路径；目录不可写时只输出到 stderr，返回 None。"""
    # 被无控制台的进程拉起时 stdout/stderr 可能是 None，uvicorn 会因此崩溃
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")  # noqa: SIM115
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")  # noqa: SIM115

    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()

    stream = logging.StreamHandler(sys.stderr)
    stream.setFormatter(fmt)
    root.addHandler(stream)

    path: Path | None = logs_dir() / "service.log"
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(path, maxBytes=1_000_000, backupCount=3, encoding="utf-8")
        handler.setFormatter(fmt)
        root.addHandler(handler)
    except OSError:
        path = None
    return path
