// 发布版不弹控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sidecar;

use tauri::{Manager, RunEvent, WebviewWindow};

/// HUD 窗口层级：bottom = 钉在桌面层，top = 置顶，normal = 普通窗口。
#[tauri::command]
fn set_layer(window: WebviewWindow, mode: String) -> Result<(), String> {
    let (bottom, top) = match mode.as_str() {
        "bottom" => (true, false),
        "top" => (false, true),
        "normal" => (false, false),
        other => return Err(format!("unknown layer mode: {other}")),
    };
    window
        .set_always_on_bottom(bottom)
        .and_then(|_| window.set_always_on_top(top))
        .map_err(|e| e.to_string())
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(sidecar::ServiceProcess::default())
        .setup(|app| {
            sidecar::start(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_layer])
        .build(tauri::generate_context!())
        .expect("failed to build tauri app");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            handle.state::<sidecar::ServiceProcess>().stop();
        }
    });
}
