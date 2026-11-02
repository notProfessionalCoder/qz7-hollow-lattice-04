"""运行配置。只监听本机回环地址；凭据不在这里，走系统凭据库。"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 8765


def load_settings() -> Settings:
    port = int(os.environ.get("JARVIS_PORT", Settings.port))
    return Settings(port=port)
