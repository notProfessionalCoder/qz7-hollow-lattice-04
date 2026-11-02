import { level } from "../lib/format";

interface Props {
  percent: number | null | undefined;
  label?: string;
  value?: string;
}

export function Bar({ percent, label, value }: Props) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <div className={`bar lv-${level(percent)}`}>
      {(label || value) && (
        <div className="bar-head">
          <span>{label}</span>
          <span className="num">{value}</span>
        </div>
      )}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
