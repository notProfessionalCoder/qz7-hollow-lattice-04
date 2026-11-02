"""入口：python -m jarvis_service，或打包后的 jarvis-service.exe（由 Tauri 作为 sidecar 拉起）。"""

import uvicorn

from .app import create_app
from .config import load_settings


def main() -> None:
    settings = load_settings()
    uvicorn.run(create_app(), host=settings.host, port=settings.port, log_level="info")


if __name__ == "__main__":
    main()
