import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

class FakeSocket {
  static last: FakeSocket | null = null;
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (ev: { data: string }) => void;
  constructor() {
    FakeSocket.last = this;
  }
  close() {}
  push(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

const SYSTEM = {
  cpu: { percent: 37, per_core: [10, 60], freq_mhz: 4200, temp_c: null },
  memory: { used: 8 * 1024 ** 3, total: 32 * 1024 ** 3, percent: 25 },
  disks: [{ mount: "C:\\", used: 500 * 1024 ** 3, total: 1024 ** 4, percent: 49 }],
  net: { up_bps: 1024, down_bps: 4096, total_sent: 1, total_recv: 2 },
  gpus: [
    { name: "NVIDIA GeForce RTX 5080", util: 12, mem_used: 2 * 1024 ** 3, mem_total: 16 * 1024 ** 3, temp_c: 48, power_w: 60, fan: 30 },
  ],
  alerts: [{ level: "warn", source: "disk", message: "D:\\ 剩余空间不足" }],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows an offline banner when the service drops", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    render(<App />);
    act(() => FakeSocket.last!.onclose?.());
    expect(screen.getByText(/核心服务未连接/)).toBeTruthy();
  });

  it("renders the HUD shell before data arrives", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    render(<App />);
    expect(screen.getAllByText("J.A.R.V.I.S.").length).toBeGreaterThan(0);
    // 没数据时用示例数据填充并标注
    expect(screen.getAllByText("示例").length).toBeGreaterThan(3);
    expect(screen.getByText("NVIDIA GeForce RTX 5080")).toBeTruthy();
  });

  it("shows system snapshot from the service", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    render(<App />);
    act(() => {
      FakeSocket.last!.onopen?.();
      FakeSocket.last!.push({ plugin: "system", data: SYSTEM });
    });
    expect(screen.getByText("NVIDIA GeForce RTX 5080")).toBeTruthy();
    expect(screen.getByText("4.0 KB/s")).toBeTruthy();
    expect(screen.getByText("D:\\ 剩余空间不足")).toBeTruthy();
    expect(screen.getByText(/核心服务 在线/)).toBeTruthy();
    // 系统面板换成真实数据后不再标示例（邮件/日程/待办仍是示例）
    expect(screen.getAllByText("示例").length).toBe(4);
  });
});
