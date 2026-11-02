import { level } from "../lib/format";

interface Props {
  value: number | null | undefined;
  label: string;
  sub?: string;
  size?: number;
}

/** 环形仪表：0–100。 */
export function Gauge({ value, label, sub, size = 132 }: Props) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <figure className={`gauge lv-${level(value)}`} style={{ width: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${label} ${Math.round(v)}%`}>
        <circle className="gauge-track" cx="60" cy="60" r={r} />
        <circle className="gauge-ticks" cx="60" cy="60" r={r + 7} />
        <circle
          className="gauge-value"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="62" className="gauge-number">
          {value == null ? "—" : Math.round(v)}
        </text>
        <text x="60" y="80" className="gauge-unit">
          %
        </text>
      </svg>
      <figcaption>
        <span className="gauge-label">{label}</span>
        {sub && <span className="gauge-sub">{sub}</span>}
      </figcaption>
    </figure>
  );
}
