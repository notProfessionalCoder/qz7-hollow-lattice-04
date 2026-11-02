import { invoke, isTauri } from "@tauri-apps/api/core";

export type Layer = "bottom" | "top" | "normal";

const ORDER: Layer[] = ["bottom", "top", "normal"];

export function nextLayer(current: Layer): Layer {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
}

/** 切换 HUD 窗口层级。在浏览器里调试时（非 Tauri）什么都不做。 */
export async function setLayer(layer: Layer): Promise<void> {
  if (isTauri()) await invoke("set_layer", { mode: layer });
}
