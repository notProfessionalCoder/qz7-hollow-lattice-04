//! 拉起 / 关闭 Python 本地服务（打包时是 binaries/jarvis-service.exe）。
//!
//! 开发时不拉起：自己在另一个终端跑 `python -m jarvis_service`，方便热改。
//! 设置环境变量 JARVIS_NO_SIDECAR=1 也会跳过（比如服务已经在跑）。

use std::sync::Mutex;

use tauri::AppHandle;
use tauri_plugin_shell::{process::CommandChild, ShellExt};

#[derive(Default)]
pub struct ServiceProcess(Mutex<Option<CommandChild>>);

impl ServiceProcess {
    pub fn stop(&self) {
        if let Some(child) = self.0.lock().ok().and_then(|mut g| g.take()) {
            let _ = child.kill();
        }
    }
}

pub fn start(app: &AppHandle) {
    if cfg!(debug_assertions) || std::env::var_os("JARVIS_NO_SIDECAR").is_some() {
        log::info!("sidecar disabled; expecting jarvis-service to be running already");
        return;
    }
    let spawned = app
        .shell()
        .sidecar("jarvis-service")
        .and_then(|cmd| cmd.spawn());
    match spawned {
        Ok((_events, child)) => {
            use tauri::Manager;
            if let Ok(mut slot) = app.state::<ServiceProcess>().0.lock() {
                *slot = Some(child);
            }
        }
        Err(err) => log::error!("failed to start jarvis-service: {err}"),
    }
}
