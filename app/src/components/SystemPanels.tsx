import { formatBytes, formatPercent, formatRate, formatTemp } from "../lib/format";
import type { SystemSnapshot } from "../lib/types";
import { SAMPLE_NET_HISTORY, SAMPLE_SYSTEM } from "../lib/sample";
import { useHistory } from "../lib/useHistory";
import { Bar } from "./Bar";
import { Gauge } from "./Gauge";
import { Panel } from "./Panel";
import { Sparkline } from "./Sparkline";

/** sys 为空时用示例数据，并在面板上标「示例」。 */
type Props = { sys?: SystemSnapshot };

function pick(sys?: SystemSnapshot): { s: SystemSnapshot; sample: boolean } {
  return sys ? { s: sys, sample: false } : { s: SAMPLE_SYSTEM, sample: true };
}

export function CpuMemoryPanel({ sys }: Props) {
  const { s, sample } = pick(sys);
  const cpu = s.cpu;
  const mem = s.memory;
  return (
    <Panel title="核心" sample={sample} tag={cpu.freq_mhz ? `${(cpu.freq_mhz / 1000).toFixed(2)} GHz` : undefined}>
      <div className="gauges">
        <Gauge value={cpu.percent} label="CPU" sub={`温度 ${formatTemp(cpu.temp_c)}`} />
        <Gauge
          value={mem.percent}
          label="内存"
          sub={`${formatBytes(mem.used)} / ${formatBytes(mem.total)}`}
        />
      </div>
      <div className="cores" aria-label="各核心占用">
        {cpu.per_core.map((p, i) => (
          <div key={i} className="core-cell" title={`核心 ${i}: ${formatPercent(p)}`}>
            <div className="core-fill" style={{ height: `${p}%` }} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function GpuPanel({ sys }: Props) {
  const { s, sample } = pick(sys);
  const gpus = s.gpus;
  return (
    <Panel title="GPU" sample={sample} tag={gpus[0]?.name}>
      {gpus.length === 0 ? (
        <p className="muted">未检测到 NVIDIA GPU（详情见日志 service.log）</p>
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
  const { s, sample } = pick(sys);
  const net = s.net;
  const liveUp = useHistory(sys?.net.up_bps);
  const liveDown = useHistory(sys?.net.down_bps);
  const up = sample ? SAMPLE_NET_HISTORY.up : liveUp;
  const down = sample ? SAMPLE_NET_HISTORY.down : liveDown;
  return (
    <Panel title="网络" sample={sample}>
      <dl className="stats">
        <dt className="up">↑ 上行</dt>
        <dd className="num">{formatRate(net.up_bps)}</dd>
        <dt className="down">↓ 下行</dt>
        <dd className="num">{formatRate(net.down_bps)}</dd>
      </dl>
      <Sparkline
        series={[
          { values: down, className: "spark-down" },
          { values: up, className: "spark-up" },
        ]}
      />
      <p className="muted small">
        累计 ↑ {formatBytes(net.total_sent)} · ↓ {formatBytes(net.total_recv)}
      </p>
    </Panel>
  );
}

export function DiskPanel({ sys }: Props) {
  const { s, sample } = pick(sys);
  return (
    <Panel title="存储" sample={sample}>
      {s.disks.map((d) => (
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
  if (!sys) {
    return (
      <Panel title="告警">
        <p className="muted">核心服务离线，无法检测</p>
      </Panel>
    );
  }
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
