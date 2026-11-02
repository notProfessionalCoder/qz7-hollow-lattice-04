import { describe, expect, it } from "vitest";
import { formatBytes, formatPercent, formatRate, formatTemp, level, pushSample } from "./format";

describe("format", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(16 * 1024 ** 3)).toBe("16.0 GB");
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(-1)).toBe("—");
  });

  it("formats rates, percents, temps", () => {
    expect(formatRate(2048)).toBe("2.0 KB/s");
    expect(formatRate(undefined)).toBe("—");
    expect(formatPercent(42.6)).toBe("43%");
    expect(formatTemp(71.4)).toBe("71°C");
    expect(formatTemp(null)).toBe("—");
  });

  it("maps levels", () => {
    expect(level(10)).toBe("ok");
    expect(level(80)).toBe("warn");
    expect(level(95)).toBe("bad");
  });

  it("keeps a bounded history", () => {
    let h: number[] = [];
    for (let i = 0; i < 10; i++) h = pushSample(h, i, 4);
    expect(h).toEqual([6, 7, 8, 9]);
  });
});
