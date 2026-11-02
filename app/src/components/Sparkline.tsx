interface Props {
  series: { values: number[]; className: string }[];
  height?: number;
  points?: number;
}

/** 多条折线，自动按所有序列的最大值缩放。 */
export function Sparkline({ series, height = 80, points = 90 }: Props) {
  const width = 300;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const path = (values: number[]) =>
    values
      .map((v, i) => {
        const x = ((points - values.length + i) / (points - 1)) * width;
        const y = height - (v / max) * (height - 4) - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" height={height}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} className="spark-grid" x1="0" x2={width} y1={height * f} y2={height * f} />
      ))}
      {series.map((s) => s.values.length > 1 && <path key={s.className} className={s.className} d={path(s.values)} />)}
    </svg>
  );
}
