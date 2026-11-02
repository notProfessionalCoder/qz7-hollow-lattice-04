interface Props {
  active: boolean;
  /** 外圈进度弧，0–100（显示 CPU 占用） */
  load?: number;
}

const TICKS = Array.from({ length: 120 }, (_, i) => i);
const SEGMENTS = Array.from({ length: 10 }, (_, i) => i);

/** 中央方舟反应堆：多层旋转圆环 + 外圈负载弧 + 脉动核心。纯 SVG + CSS 动画。 */
export function Reactor({ active, load = 0 }: Props) {
  const r = 230;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, load));
  return (
    <div className={`reactor ${active ? "" : "reactor-idle"}`} aria-hidden>
      <svg viewBox="-300 -300 600 600">
        <defs>
          <radialGradient id="core-grad">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#bff0ff" />
            <stop offset="0.7" stopColor="#3fd0ff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#3fd0ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 刻度环 */}
        <g className="rx-ticks spin-slow">
          {TICKS.map((i) => (
            <line
              key={i}
              x1="0"
              y1={-272}
              x2="0"
              y2={i % 10 === 0 ? -252 : -262}
              transform={`rotate(${i * 3})`}
            />
          ))}
        </g>

        {/* 负载弧 */}
        <circle className="rx-track" r={r} />
        <circle
          className="rx-load"
          r={r}
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform="rotate(-90)"
        />

        {/* 断续弧 */}
        <g className="rx-arcs spin-rev">
          <circle r="200" strokeDasharray="90 40 20 40" />
        </g>
        <g className="rx-arcs-thin spin-med">
          <circle r="176" strokeDasharray="4 10" />
        </g>

        {/* 十段线圈 */}
        <g className="rx-segments spin-fast">
          {SEGMENTS.map((i) => (
            <rect key={i} x="-16" y="-150" width="32" height="44" rx="4" transform={`rotate(${i * 36})`} />
          ))}
        </g>

        <circle className="rx-ring" r="100" />
        <circle className="rx-ring rx-ring-dim" r="86" />
        <circle className="rx-core" r="78" fill="url(#core-grad)" />
      </svg>
    </div>
  );
}
