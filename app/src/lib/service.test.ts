import { describe, expect, it } from "vitest";
import { applyMessage } from "./service";

describe("applyMessage", () => {
  it("merges a plugin snapshot", () => {
    const next = applyMessage({}, { plugin: "heartbeat", data: { status: "online" } });
    expect(next).toEqual({ heartbeat: { status: "online" } });
  });

  it("replaces only the matching plugin", () => {
    const state = { a: { v: 1 }, b: { v: 2 } };
    expect(applyMessage(state, { plugin: "a", data: { v: 3 } })).toEqual({ a: { v: 3 }, b: { v: 2 } });
  });

  it("ignores malformed messages", () => {
    const state = { a: { v: 1 } };
    for (const bad of [null, 1, "x", {}, { plugin: 1, data: {} }, { plugin: "a", data: null }]) {
      expect(applyMessage(state, bad)).toBe(state);
    }
  });
});
