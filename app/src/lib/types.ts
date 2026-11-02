/** 与 service/src/jarvis_service/plugins/system.py 的快照结构对应。 */
export interface SystemSnapshot {
  cpu: { percent: number; per_core: number[]; freq_mhz: number | null; temp_c: number | null };
  memory: { used: number; total: number; percent: number };
  disks: { mount: string; used: number; total: number; percent: number }[];
  net: { up_bps: number; down_bps: number; total_sent: number; total_recv: number };
  gpus: {
    name: string;
    util: number;
    mem_used: number;
    mem_total: number;
    temp_c: number | null;
    power_w: number | null;
    fan: number | null;
  }[];
  alerts: { level: string; source: string; message: string }[];
}

export interface HeartbeatSnapshot {
  status: string;
  uptime: number;
}
