import { formatBytes, formatPercent, formatRate, formatTemp } from "../lib/format";
import type { SystemSnapshot } from "../lib/types";
import { useHistory } from "../lib/useHistory";
import { Bar } from "./Bar";
import { Gauge } from "./Gauge";
import { Panel } from "./Panel";
import { Sparkline } from "./Sparkline";

type Props = { sys?: SystemSnapshot };

export function CpuMemoryPanel({ sys }: Props) {
  const cpu = sys?.cpu;
  const mem = sys?.memory;
  return (
    <Panel title="核心" tag={cpu?.freq_mhz ? `${(cpu.freq_mhz / 1000).toFixed(2)} GHz` : undefined}>
      <div className="gauges">
        <Gauge value={cpu?.percent} label="CPU" sub={`温度 ${formatTemp(cpu?.temp_c)}`} />
        <Gauge
          value={mem?.percent}
          label="内存"
          sub={mem ? `${formatBytes(mem.used)} / ${formatBytes(mem.total)}` : undefined}
        />
      </div>
      <div className="cores" aria-label="各核心占用">
        {(cpu?.per_core ?? []).map((p, i) => (
          <div key={i} className="core-cell" title={`核心 ${i}: ${formatPercent(p)}`}>
            <div className="core-fill" style={{ height: `${p}%` }} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function GpuPanel({ sys }: Props) {
  const gpus = sys?.gpus ?? [];
  return (
    <Panel title="GPU" tag={gpus[0]?.name}>
      {gpus.length === 0 ? (
        <p className="muted">未检测到 NVIDIA GPU</p>
      ) : (
        gpus.map((g) => (
          <div key={g.name} className="gpu">
            <div className="gauges">
              <Gauge value={g.util} label="负载" sub={`温度 ${formatTemp(g.temp_c)}`} />
              <Gauge
                value={(g.mem_used / g.mem_total) * 100}
                label="显存"
                sub={`${formatBytes(g.mem_used)} / ${formatBytes(g.mem_total)}`}
              />
            </div>
            <dl className="stats">
              <dt>功耗</dt>
              <dd className="num">{g.power_w == null ? "—" : `${Math.round(g.power_w)} W`}</dd>
              <dt>风扇</dt>
              <dd className="num">{formatPercent(g.fan)}</dd>
            </dl>
          </div>
        ))
      )}
    </Panel>
  );
}

export function NetworkPanel({ sys }: Props) {
  const net = sys?.net;
  const up = useHistory(net?.up_bps);
  const down = useHistory(net?.down_bps);
  return (
    <Panel title="网络">
      <dl className="stats">
        <dt className="up">↑ 上行</dt>
        <dd className="num">{formatRate(net?.up_bps)}</dd>
        <dt className="down">↓ 下行</dt>
        <dd className="num">{formatRate(net?.down_bps)}</dd>
      </dl>
      <Sparkline
        series={[
          { values: down, className: "spark-down" },
          { values: up, className: "spark-up" },
        ]}
      />
      <p className="muted small">
        累计 ↑ {formatBytes(net?.total_sent)} · ↓ {formatBytes(net?.total_recv)}
      </p>
    </Panel>
  );
}

export function DiskPanel({ sys }: Props) {
  return (
    <Panel title="存储">
      {(sys?.disks ?? []).map((d) => (
        <Bar
          key={d.mount}
          percent={d.percent}
          label={d.mount}
          value={`${formatBytes(d.used)} / ${formatBytes(d.total)}`}
        />
      ))}
    </Panel>
  );
}

export function AlertsPanel({ sys }: Props) {
  const alerts = sys?.alerts ?? [];
  return (
    <Panel title="告警" tag={alerts.length ? String(alerts.length) : undefined} className={alerts.length ? "alerting" : ""}>
      {alerts.length === 0 ? (
        <p className="muted">一切正常</p>
      ) : (
        <ul className="alerts">
          {alerts.map((a, i) => (
            <li key={i} className={`alert lv-${a.level === "warn" ? "warn" : "bad"}`}>
              {a.message}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
