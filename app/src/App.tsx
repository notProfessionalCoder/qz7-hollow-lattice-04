import { useEffect, useState } from "react";
import { type Layer, nextLayer, setLayer } from "./layer";
import { useService } from "./service";

const LINK_TEXT = { connecting: "连接中", online: "在线", offline: "离线" } as const;
const LAYER_TEXT: Record<Layer, string> = { bottom: "桌面层", top: "置顶", normal: "普通" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <header className="panel-title">{title}</header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export default function App() {
  const { snapshots, link } = useService();
  const heartbeat = snapshots.heartbeat as { uptime?: number } | undefined;
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

  return (
    <main className="hud">
      <div className="column">
        <Panel title="通讯">
          <p className="muted">Gmail / Outlook 汇总（Phase 1）</p>
        </Panel>
      </div>

      <div className="column center">
        <div className="reactor" aria-hidden>
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="ring r3" />
          <div className="core" />
        </div>
        <h1 className="wordmark">J.A.R.V.I.S.</h1>
        <p className={`link link-${link}`}>
          核心服务 · {LINK_TEXT[link]}
          {heartbeat?.uptime !== undefined && ` · 运行 ${Math.floor(heartbeat.uptime)}s`}
        </p>
        <p className="muted hint">F9 切换窗口层级 · 当前：{LAYER_TEXT[layer]}</p>
      </div>

      <div className="column">
        <Panel title="系统诊断">
          <p className="muted">CPU / GPU / 网络（Phase 1）</p>
        </Panel>
      </div>
    </main>
  );
}
