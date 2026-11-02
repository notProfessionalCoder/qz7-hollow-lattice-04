import { invoke, isTauri } from "@tauri-apps/api/core";

/** 切换 Windows 桌面图标显示，返回切换后是否可见；非 Tauri 环境返回 null。 */
export async function toggleDesktopIcons(): Promise<boolean | null> {
  if (!isTauri()) return null;
  return invoke<boolean>("toggle_desktop_icons");
}

export async function desktopIconsVisible(): Promise<boolean | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<boolean>("desktop_icons_visible");
  } catch {
    return null;
  }
}

/** 日志目录（%APPDATA%\jarvis\logs）。 */
export async function logsDir(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string>("logs_dir");
  } catch {
    return null;
  }
}
