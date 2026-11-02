const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** 1536 → "1.5 KB"；按 1024 进位。 */
export function formatBytes(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  let v = n;
  let i = 0;
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024;
    i++;
  }
  return `${i === 0 ? Math.round(v) : v.toFixed(digits)} ${UNITS[i]}`;
}

/** 字节/秒 → "1.2 MB/s" */
export function formatRate(bps: number | null | undefined): string {
  const s = formatBytes(bps);
  return s === "—" ? s : `${s}/s`;
}

export function formatPercent(p: number | null | undefined): string {
  return p == null || !Number.isFinite(p) ? "—" : `${Math.round(p)}%`;
}

export function formatTemp(c: number | null | undefined): string {
  return c == null || !Number.isFinite(c) ? "—" : `${Math.round(c)}°C`;
}

/** 0–100 → 状态等级，用于颜色。 */
export function level(p: number | null | undefined, warn = 75, bad = 90): "ok" | "warn" | "bad" {
  if (p == null) return "ok";
  if (p >= bad) return "bad";
  if (p >= warn) return "warn";
  return "ok";
}

/** 追加一个采样并只保留最近 max 个。 */
export function pushSample(history: number[], value: number, max: number): number[] {
  const next = history.length >= max ? history.slice(history.length - max + 1) : history.slice();
  next.push(value);
  return next;
}
