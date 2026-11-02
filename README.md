# qz7-hollow-lattice-04

Windows 桌面上的贾维斯式 AI 助手：全息 HUD 一屏看全，语音操控一切。功能规划见 [ROADMAP.md](ROADMAP.md)。

## 目录

- `app/`：Tauri 2 外壳 + React HUD 前端
- `app/src-tauri/`：Rust 端（窗口层级、拉起本地服务）
- `service/`：Python 本地服务（FastAPI，插件式数据源，只监听 127.0.0.1:8765）
- `.github/workflows/ci.yml`：lint、测试、Windows 安装包

## 本地开发（Windows）

前置：Node 22、Rust stable、Python 3.12、[Tauri 的 Windows 依赖](https://v2.tauri.app/start/prerequisites/)。

```powershell
# 1. 本地服务（单独一个终端）
cd service
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m jarvis_service
```

```powershell
# 2. HUD 外壳。tauri.windows.conf.json 要求 sidecar 文件存在，先打一次包：
cd service
pyinstaller --onefile --name jarvis-service --collect-submodules jarvis_service --collect-submodules uvicorn pyinstaller_entry.py
copy dist\jarvis-service.exe ..\app\src-tauri\binaries\jarvis-service-x86_64-pc-windows-msvc.exe

cd ..\app
npm ci
npx tauri dev
```

开发模式下外壳不会自己拉起服务（用第 1 步那个，改代码方便）；打包后的安装版会自动拉起。

HUD 里按 F9 切换窗口层级：桌面层 → 置顶 → 普通。

## 加一个数据源

在 `service/src/jarvis_service/plugins/` 下新建一个模块，写一个 `Plugin` 子类（`id`、`title`、`fetch()`，可选 `actions()`），服务启动时自动发现，并通过 `/ws` 推给 HUD。

## 凭据

邮箱的配置步骤见 [docs/credentials.md](docs/credentials.md)。

OAuth token、API key 只放本机（Windows 凭据管理器）或 GitHub Secrets，不要写进仓库。
