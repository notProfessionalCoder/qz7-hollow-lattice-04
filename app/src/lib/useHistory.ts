import { useEffect, useRef, useState } from "react";
import { pushSample } from "./format";

/** 每当 value 变化时追加一个采样，返回最近 max 个。 */
export function useHistory(value: number | undefined, max = 90): number[] {
  const [history, setHistory] = useState<number[]>([]);
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (value === undefined || value === last.current) return;
    last.current = value;
    setHistory((h) => pushSample(h, value, max));
  }, [value, max]);
  return history;
}
