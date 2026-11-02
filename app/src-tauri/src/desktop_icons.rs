//! 显示 / 隐藏 Windows 桌面图标（等同于桌面右键 → 查看 → 显示桌面图标）。
//!
//! 做法：找到承载桌面图标的 SHELLDLL_DefView 窗口，给它发 WM_COMMAND 0x7402（Explorer 的切换命令）。
//! 隐藏是 Explorer 的全局状态，所以退出时如果是我们隐藏的，会恢复显示。

#[cfg(windows)]
mod imp {
    use std::sync::atomic::{AtomicBool, Ordering};
    use windows_sys::Win32::Foundation::{HWND, LPARAM};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, FindWindowExW, FindWindowW, IsWindowVisible, SendMessageW, WM_COMMAND,
    };

    const TOGGLE_DESKTOP_ICONS: usize = 0x7402;
    static HIDDEN_BY_US: AtomicBool = AtomicBool::new(false);

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    unsafe extern "system" fn find_defview(hwnd: HWND, out: LPARAM) -> i32 {
        let class = wide("SHELLDLL_DefView");
        let view = FindWindowExW(hwnd, std::ptr::null_mut(), class.as_ptr(), std::ptr::null());
        if !view.is_null() {
            *(out as *mut HWND) = view;
            return 0; // 找到了，停止枚举
        }
        1
    }

    /// 桌面图标所在的 DefView：通常挂在 Progman 下，设过动态壁纸时会挂在某个 WorkerW 下。
    fn defview() -> Option<HWND> {
        unsafe {
            let progman = FindWindowW(wide("Progman").as_ptr(), std::ptr::null());
            if !progman.is_null() {
                let view = FindWindowExW(
                    progman,
                    std::ptr::null_mut(),
                    wide("SHELLDLL_DefView").as_ptr(),
                    std::ptr::null(),
                );
                if !view.is_null() {
                    return Some(view);
                }
            }
            let mut found: HWND = std::ptr::null_mut();
            EnumWindows(Some(find_defview), &mut found as *mut HWND as LPARAM);
            (!found.is_null()).then_some(found)
        }
    }

    fn list_view(view: HWND) -> HWND {
        unsafe {
            FindWindowExW(
                view,
                std::ptr::null_mut(),
                wide("SysListView32").as_ptr(),
                std::ptr::null(),
            )
        }
    }

    pub fn visible() -> Result<bool, String> {
        let view = defview().ok_or("desktop window not found")?;
        let list = list_view(view);
        Ok(!list.is_null() && unsafe { IsWindowVisible(list) } != 0)
    }

    pub fn set_visible(show: bool) -> Result<bool, String> {
        if visible()? != show {
            let view = defview().ok_or("desktop window not found")?;
            unsafe { SendMessageW(view, WM_COMMAND, TOGGLE_DESKTOP_ICONS, 0) };
            HIDDEN_BY_US.store(!show, Ordering::SeqCst);
        }
        visible()
    }

    pub fn restore() {
        if HIDDEN_BY_US.swap(false, Ordering::SeqCst) {
            let _ = set_visible(true);
        }
    }
}

#[cfg(not(windows))]
mod imp {
    pub fn visible() -> Result<bool, String> {
        Err("only supported on Windows".into())
    }
    pub fn set_visible(_show: bool) -> Result<bool, String> {
        visible()
    }
    pub fn restore() {}
}

/// 返回切换后图标是否可见。
#[tauri::command]
pub fn toggle_desktop_icons() -> Result<bool, String> {
    let now = imp::visible()?;
    imp::set_visible(!now)
}

#[tauri::command]
pub fn desktop_icons_visible() -> Result<bool, String> {
    imp::visible()
}

pub fn restore_on_exit() {
    imp::restore();
}
