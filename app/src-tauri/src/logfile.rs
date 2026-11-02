//! 极简文件日志：写到 %APPDATA%\jarvis\logs\<name>.log（非 Windows 为 ~/.jarvis/logs）。
//! 只为排查启动问题用，不依赖日志框架；单文件超过 1 MB 时截断重写。

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_BYTES: u64 = 1024 * 1024;

pub fn logs_dir() -> PathBuf {
    let base = std::env::var_os("APPDATA")
        .map(|p| PathBuf::from(p).join("jarvis"))
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".jarvis")))
        .unwrap_or_else(std::env::temp_dir);
    base.join("logs")
}

pub fn append(name: &str, line: &str) {
    let dir = logs_dir();
    if fs::create_dir_all(&dir).is_err() {
        return;
    }
    let path = dir.join(format!("{name}.log"));
    let too_big = fs::metadata(&path)
        .map(|m| m.len() > MAX_BYTES)
        .unwrap_or(false);
    let file = OpenOptions::new()
        .create(true)
        .write(true)
        .append(!too_big)
        .truncate(too_big)
        .open(&path);
    if let Ok(mut f) = file {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let _ = writeln!(f, "[{ts}] {}", line.trim_end());
    }
}
