"""系统诊断插件：CPU / 内存 / 磁盘 / 网络 / NVIDIA GPU。

- GPU 走 NVML（随 NVIDIA 驱动安装），没有 N 卡或驱动时 gpus 为空列表
- CPU 温度：Windows 上 psutil 读不到，先返回 None；后续可接 LibreHardwareMonitor
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any

import psutil

from ..plugin import Plugin

log = logging.getLogger(__name__)

# 告警阈值（百分比 / 摄氏度）
THRESHOLDS = {
    "cpu_percent": 90.0,
    "memory_percent": 90.0,
    "disk_percent": 92.0,
    "gpu_temp_c": 83.0,
    "cpu_temp_c": 90.0,
}


@dataclass
class NetSample:
    t: float
    sent: int
    recv: int


def net_rates(prev: NetSample | None, cur: NetSample) -> tuple[float, float]:
    """返回 (上行, 下行) 字节/秒。第一次采样或时间没走时返回 0。"""
    if prev is None:
        return 0.0, 0.0
    dt = cur.t - prev.t
    if dt <= 0:
        return 0.0, 0.0
    up = max(cur.sent - prev.sent, 0) / dt
    down = max(cur.recv - prev.recv, 0) / dt
    return up, down


def build_alerts(snap: dict[str, Any]) -> list[dict[str, str]]:
    """根据快照生成告警列表：[{level, source, message}]。"""
    out: list[dict[str, str]] = []

    def warn(source: str, message: str) -> None:
        out.append({"level": "warn", "source": source, "message": message})

    cpu = snap.get("cpu", {})
    if cpu.get("percent", 0) >= THRESHOLDS["cpu_percent"]:
        warn("cpu", f"CPU 占用 {cpu['percent']:.0f}%")
    if (cpu.get("temp_c") or 0) >= THRESHOLDS["cpu_temp_c"]:
        warn("cpu", f"CPU 温度 {cpu['temp_c']:.0f}°C")
    mem = snap.get("memory", {})
    if mem.get("percent", 0) >= THRESHOLDS["memory_percent"]:
        warn("memory", f"内存占用 {mem['percent']:.0f}%")
    for disk in snap.get("disks", []):
        if disk.get("percent", 0) >= THRESHOLDS["disk_percent"]:
            warn("disk", f"{disk['mount']} 剩余空间不足（已用 {disk['percent']:.0f}%）")
    for gpu in snap.get("gpus", []):
        if (gpu.get("temp_c") or 0) >= THRESHOLDS["gpu_temp_c"]:
            warn("gpu", f"{gpu['name']} 温度 {gpu['temp_c']:.0f}°C")
    return out


def _s(v: Any) -> str:
    return v.decode() if isinstance(v, bytes) else str(v)


class _Nvml:
    """NVML 的薄封装；初始化失败（没 N 卡 / 没驱动）就永久禁用。"""

    def __init__(self) -> None:
        self.ok = False
        try:
            import pynvml

            pynvml.nvmlInit()
            self._nv = pynvml
            self.ok = True
            log.info(
                "NVML ok, driver %s, %d GPU(s)",
                _s(pynvml.nvmlSystemGetDriverVersion()),
                pynvml.nvmlDeviceGetCount(),
            )
        except Exception as exc:
            self.ok = False
            log.warning("NVML unavailable, GPU panel disabled: %r", exc)

    def read(self) -> list[dict[str, Any]]:
        if not self.ok:
            return []
        nv = self._nv
        gpus: list[dict[str, Any]] = []
        try:
            for i in range(nv.nvmlDeviceGetCount()):
                h = nv.nvmlDeviceGetHandleByIndex(i)
                name = nv.nvmlDeviceGetName(h)
                util = nv.nvmlDeviceGetUtilizationRates(h)
                mem = nv.nvmlDeviceGetMemoryInfo(h)
                gpu: dict[str, Any] = {
                    "name": _s(name),
                    "util": float(util.gpu),
                    "mem_used": int(mem.used),
                    "mem_total": int(mem.total),
                    "temp_c": float(nv.nvmlDeviceGetTemperature(h, nv.NVML_TEMPERATURE_GPU)),
                    "power_w": None,
                    "fan": None,
                }
                try:
                    gpu["power_w"] = nv.nvmlDeviceGetPowerUsage(h) / 1000.0
                except Exception:
                    pass
                try:
                    gpu["fan"] = float(nv.nvmlDeviceGetFanSpeed(h))
                except Exception:
                    pass
                gpus.append(gpu)
        except Exception as exc:
            log.warning("NVML read failed: %r", exc)
            return []
        return gpus


def _cpu_temp() -> float | None:
    reader = getattr(psutil, "sensors_temperatures", None)
    if reader is None:
        return None
    try:
        temps = reader()
    except Exception:
        return None
    for key in ("coretemp", "k10temp", "cpu_thermal", "acpitz"):
        if temps.get(key):
            return float(max(t.current for t in temps[key]))
    return None


def _disks() -> list[dict[str, Any]]:
    out = []
    for part in psutil.disk_partitions(all=False):
        if "cdrom" in part.opts or not part.fstype:
            continue
        try:
            usage = psutil.disk_usage(part.mountpoint)
        except (PermissionError, OSError):
            continue
        out.append(
            {
                "mount": part.mountpoint,
                "used": usage.used,
                "total": usage.total,
                "percent": usage.percent,
            }
        )
    return out


class SystemPlugin(Plugin):
    id = "system"
    title = "系统诊断"
    interval = 1.0

    def __init__(self) -> None:
        self._nvml: _Nvml | None = None
        self._prev_net: NetSample | None = None
        psutil.cpu_percent(percpu=True)  # 预热，下一次读才有值

    async def fetch(self) -> dict[str, Any]:
        if self._nvml is None:
            self._nvml = _Nvml()
        per_core = psutil.cpu_percent(percpu=True)
        freq = psutil.cpu_freq()
        vm = psutil.virtual_memory()
        io = psutil.net_io_counters()
        cur = NetSample(time.monotonic(), io.bytes_sent, io.bytes_recv)
        up, down = net_rates(self._prev_net, cur)
        self._prev_net = cur

        snap: dict[str, Any] = {
            "cpu": {
                "percent": sum(per_core) / len(per_core) if per_core else 0.0,
                "per_core": per_core,
                "freq_mhz": freq.current if freq else None,
                "temp_c": _cpu_temp(),
            },
            "memory": {"used": vm.used, "total": vm.total, "percent": vm.percent},
            "disks": _disks(),
            "net": {
                "up_bps": up,
                "down_bps": down,
                "total_sent": io.bytes_sent,
                "total_recv": io.bytes_recv,
            },
            "gpus": self._nvml.read(),
        }
        snap["alerts"] = build_alerts(snap)
        return snap
