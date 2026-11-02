import { useEffect, useState } from "react";
import { Clock } from "./components/Clock";
import { Panel } from "./components/Panel";
import { ParticleField } from "./components/ParticleField";
import { Reactor } from "./components/Reactor";
import { AlertsPanel, CpuMemoryPanel, DiskPanel, GpuPanel, NetworkPanel } from "./components/SystemPanels";
import { type Layer, nextLayer, setLayer } from "./lib/layer";
import { useService } from "./lib/service";
import type { HeartbeatSnapshot, SystemSnapshot } from "./lib/types";

const LINK_TEXT = { connecting: "连接中", online: "在线", offline: "离线" } as const;
const LAYER_TEXT: Record<Layer, string> = { bottom: "桌面层", top: "置顶", normal: "普通" };

function useLayerHotkey(): Layer {
  const [layer, setLayerState] = useState<Layer>("bottom");
  // F9 切换窗口层级：桌面层 → 置顶 → 普通
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F9") return;
      setLayerState((cur) => {
        const next = nextLayer(cur);
        void setLayer(next);
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return layer;
}

export default function App() {
  const { snapshots, link } = useService();
  const layer = useLayerHotkey();
  const heartbeat = snapshots.heartbeat as unknown as HeartbeatSnapshot | undefined;
  const sys = snapshots.system as unknown as SystemSnapshot | undefined;

  return (
    <div className="hud-root">
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
            {heartbeat && ` · ${Math.floor(heartbeat.uptime)}s`}
          </span>
          <span className="muted small">F9 层级：{LAYER_TEXT[layer]}</span>
        </div>
      </header>

      <main className="hud">
        <div className="col col-comms">
          <Panel title="通讯" tag="Gmail · Outlook">
            <p className="muted">邮箱未连接。按 docs/credentials.md 配好凭据后，这里显示合并收件箱和 AI 摘要。</p>
          </Panel>
          <Panel title="今日要点" tag="AI">
            <p className="muted">连接邮箱后生成</p>
          </Panel>
        </div>

        <div className="col col-agenda">
          <Panel title="日程">
            <p className="muted">Phase 3</p>
          </Panel>
          <Panel title="待办">
            <p className="muted">Phase 3</p>
          </Panel>
        </div>

        <div className="col col-center">
          <Reactor active={link === "online"} />
          <h1 className="wordmark">J.A.R.V.I.S.</h1>
          <p className="muted">语音唤醒（Phase 2）</p>
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
