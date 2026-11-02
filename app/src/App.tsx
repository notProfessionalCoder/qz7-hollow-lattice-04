import { useCallback, useEffect, useState } from "react";
import { Clock } from "./components/Clock";
import { AgendaPanel, BriefPanel, InboxPanel, TodoPanel } from "./components/CommsPanels";
import { ParticleField } from "./components/ParticleField";
import { Reactor } from "./components/Reactor";
import { AlertsPanel, CpuMemoryPanel, DiskPanel, GpuPanel, NetworkPanel } from "./components/SystemPanels";
import { desktopIconsVisible, logsDir, toggleDesktopIcons } from "./lib/desktop";
import { type Layer, nextLayer, setLayer } from "./lib/layer";
import { useService } from "./lib/service";
import type { HeartbeatSnapshot, SystemSnapshot } from "./lib/types";

const LINK_TEXT = { connecting: "连接中", online: "在线", offline: "离线" } as const;
const LAYER_TEXT: Record<Layer, string> = { bottom: "桌面层", top: "置顶", normal: "普通" };

function useDesktopControls() {
  const [layer, setLayerState] = useState<Layer>("bottom");
  const [iconsVisible, setIconsVisible] = useState<boolean | null>(null);

  const cycleLayer = useCallback(() => {
    setLayerState((cur) => {
      const next = nextLayer(cur);
      void setLayer(next);
      return next;
    });
  }, []);

  const toggleIcons = useCallback(async () => {
    try {
      setIconsVisible(await toggleDesktopIcons());
    } catch {
      /* 找不到桌面窗口时忽略 */
    }
  }, []);

  useEffect(() => {
    void desktopIconsVisible().then(setIconsVisible);
    // F9 切换窗口层级，F10 切换桌面图标
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F9") cycleLayer();
      if (e.key === "F10") {
        e.preventDefault();
        void toggleIcons();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleLayer, toggleIcons]);

  return { layer, cycleLayer, iconsVisible, toggleIcons };
}

export default function App() {
  const { snapshots, link } = useService();
  const { layer, cycleLayer, iconsVisible, toggleIcons } = useDesktopControls();
  const [logs, setLogs] = useState<string | null>(null);
  const heartbeat = snapshots.heartbeat as unknown as HeartbeatSnapshot | undefined;
  const sys = snapshots.system as unknown as SystemSnapshot | undefined;

  useEffect(() => {
    void logsDir().then(setLogs);
  }, []);

  return (
    <div className="hud-root">
      <div className="backdrop" aria-hidden />
      <ParticleField />
      <div className="scanlines" aria-hidden />

      <header className="topbar">
        <Clock />
        <div className="topbar-mid">
          <span className="wordmark-small">J.A.R.V.I.S.</span>
        </div>
        <div className="topbar-right">
          <span className={`link link-${link}`}>
            <i className="dot" /> 核心服务 {LINK_TEXT[link]}
            {heartbeat && link === "online" && <span className="num"> · {Math.floor(heartbeat.uptime)}s</span>}
          </span>
          <button className="hud-btn" onClick={() => void toggleIcons()} title="F10">
            桌面图标 {iconsVisible === null ? "" : iconsVisible ? "显示" : "隐藏"}
          </button>
          <button className="hud-btn" onClick={cycleLayer} title="F9">
            层级 {LAYER_TEXT[layer]}
          </button>
        </div>
      </header>

      {link === "offline" && (
        <div className="offline-banner">
          核心服务未连接，面板显示的是示例数据。正在自动重连{logs ? `；日志：${logs}` : ""}
        </div>
      )}

      <main className="hud">
        <div className="col col-comms">
          <InboxPanel />
          <BriefPanel />
        </div>

        <div className="col col-agenda">
          <AgendaPanel />
          <TodoPanel />
        </div>

        <div className="col col-center">
          <Reactor active={link === "online"} load={sys?.cpu.percent} />
          <h1 className="wordmark">J.A.R.V.I.S.</h1>
          <p className="subtitle">{link === "online" ? "系统在线 · 随时待命" : "等待核心服务"}</p>
        </div>

        <div className="col col-system">
          <CpuMemoryPanel sys={sys} />
          <GpuPanel sys={sys} />
        </div>

        <div className="col col-net">
          <NetworkPanel sys={sys} />
          <DiskPanel sys={sys} />
          <AlertsPanel sys={sys} />
        </div>
      </main>
    </div>
  );
}
