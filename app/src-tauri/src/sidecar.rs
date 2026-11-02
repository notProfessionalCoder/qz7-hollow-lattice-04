//! 拉起 / 守护 / 关闭 Python 本地服务（打包时是安装目录下的 jarvis-service.exe）。
//!
//! - 开发时（debug）不拉起：自己在另一个终端跑 `python -m jarvis_service`
//! - 设置 JARVIS_NO_SIDECAR=1 也会跳过
//! - 服务意外退出时自动重启，最多 MAX_RESTARTS 次
//! - 所有启动过程和服务输出都写到 %APPDATA%\jarvis\logs\shell.log

use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_shell::{process::CommandChild, process::CommandEvent, ShellExt};

use crate::logfile;

const MAX_RESTARTS: u32 = 5;

#[derive(Default)]
pub struct ServiceProcess {
    child: Mutex<Option<CommandChild>>,
    stopping: Mutex<bool>,
}

impl ServiceProcess {
    pub fn stop(&self) {
        if let Ok(mut s) = self.stopping.lock() {
            *s = true;
        }
        if let Some(child) = self.child.lock().ok().and_then(|mut g| g.take()) {
            logfile::append("shell", "stopping jarvis-service");
            let _ = child.kill();
        }
    }

    fn is_stopping(&self) -> bool {
        self.stopping.lock().map(|s| *s).unwrap_or(true)
    }
}

pub fn start(app: &AppHandle) {
    logfile::append(
        "shell",
        &format!(
            "app start v{} exe={:?}",
            app.package_info().version,
            std::env::current_exe().ok()
        ),
    );
    if cfg!(debug_assertions) || std::env::var_os("JARVIS_NO_SIDECAR").is_some() {
        logfile::append(
            "shell",
            "sidecar disabled (debug build or JARVIS_NO_SIDECAR)",
        );
        return;
    }
    let app = app.clone();
    // 守护线程：启动 → 阻塞等退出 → 必要时重启
    std::thread::spawn(move || {
        for attempt in 0..=MAX_RESTARTS {
            if app.state::<ServiceProcess>().is_stopping() {
                return;
            }
            if attempt > 0 {
                std::thread::sleep(Duration::from_secs(2));
                logfile::append(
                    "shell",
                    &format!("restarting jarvis-service (attempt {attempt})"),
                );
            }
            match spawn_once(&app) {
                Ok(code) => logfile::append("shell", &format!("jarvis-service exited: {code:?}")),
                Err(err) => logfile::append("shell", &format!("spawn failed: {err}")),
            }
        }
        logfile::append("shell", "giving up restarting jarvis-service");
    });
}

/// 启动一次并阻塞到进程退出，返回退出码。
fn spawn_once(app: &AppHandle) -> Result<Option<i32>, String> {
    let cmd = app
        .shell()
        .sidecar("jarvis-service")
        .map_err(|e| e.to_string())?
        // PyInstaller 单文件 exe 会再起一个子进程；用作业对象才能整棵树一起关掉
        .set_process_group(true)
        .kill_on_drop(true)
        // 服务发现外壳进程没了会自行退出，避免外壳崩溃后留下孤儿进程占着端口
        .env("JARVIS_PARENT_PID", std::process::id().to_string());
    let (mut rx, child) = cmd.spawn().map_err(|e| e.to_string())?;
    logfile::append(
        "shell",
        &format!("jarvis-service started pid={}", child.pid()),
    );
    if let Ok(mut slot) = app.state::<ServiceProcess>().child.lock() {
        *slot = Some(child);
    }
    let code = tauri::async_runtime::block_on(async {
        let mut code = None;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                    logfile::append("shell", &format!("svc: {}", String::from_utf8_lossy(&line)));
                }
                CommandEvent::Error(e) => logfile::append("shell", &format!("svc error: {e}")),
                CommandEvent::Terminated(t) => {
                    code = t.code;
                    break;
                }
                _ => {}
            }
        }
        code
    });
    if let Ok(mut slot) = app.state::<ServiceProcess>().child.lock() {
        slot.take();
    }
    Ok(code)
}
