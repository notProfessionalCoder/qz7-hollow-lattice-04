import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

class FakeSocket {
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (ev: { data: string }) => void;
  close() {}
}

describe("App", () => {
  it("renders the HUD shell", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    render(<App />);
    expect(screen.getByText("J.A.R.V.I.S.")).toBeTruthy();
    expect(screen.getByText("系统诊断")).toBeTruthy();
  });
});
