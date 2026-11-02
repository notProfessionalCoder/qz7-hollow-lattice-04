"""PyInstaller 打包入口（打成单文件 exe，给 Tauri 当 sidecar）。"""

from jarvis_service.__main__ import main

if __name__ == "__main__":
    main()
