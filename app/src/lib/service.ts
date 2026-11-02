import { useEffect, useState } from "react";

/** 本地服务地址。只连本机，端口与 service/config.py 一致。 */
export const SERVICE_WS = "ws://127.0.0.1:8765/ws";

export type Snapshot = Record<string, unknown>;
export type Snapshots = Record<string, Snapshot>;
export type Link = "connecting" | "online" | "offline";

export interface StreamMessage {
  plugin: string;
  data: Snapshot;
}

/** 把一条推送合并进快照表；格式不对就原样返回。 */
export function applyMessage(state: Snapshots, raw: unknown): Snapshots {
  if (typeof raw !== "object" || raw === null) return state;
  const msg = raw as Partial<StreamMessage>;
  if (typeof msg.plugin !== "string" || typeof msg.data !== "object" || msg.data === null) {
    return state;
  }
  return { ...state, [msg.plugin]: msg.data };
}

/** 连接本地服务的 WebSocket，断线后每 2 秒重连。 */
export function useService(url: string = SERVICE_WS) {
  const [snapshots, setSnapshots] = useState<Snapshots>({});
  const [link, setLink] = useState<Link>("connecting");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(url);
      ws.onopen = () => setLink("online");
      ws.onmessage = (ev) => {
        try {
          const parsed: unknown = JSON.parse(String(ev.data));
          setSnapshots((s) => applyMessage(s, parsed));
        } catch {
          /* 忽略坏消息 */
        }
      };
      ws.onclose = () => {
        setLink("offline");
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [url]);

  return { snapshots, link };
}
