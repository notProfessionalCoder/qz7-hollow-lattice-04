/**
 * 示例数据：服务没连上、或某个数据源还没接入时，面板用它占位，并在标题上标「示例」。
 * 全部是虚构内容。
 */
import type { SystemSnapshot } from "./types";

const GB = 1024 ** 3;

export const SAMPLE_SYSTEM: SystemSnapshot = {
  cpu: {
    percent: 23,
    per_core: [31, 12, 44, 8, 19, 27, 5, 61, 14, 22, 9, 36, 17, 25, 11, 40],
    freq_mhz: 4680,
    temp_c: 52,
  },
  memory: { used: 18.4 * GB, total: 64 * GB, percent: 28.8 },
  disks: [
    { mount: "C:\\", used: 412 * GB, total: 1000 * GB, percent: 41.2 },
    { mount: "D:\\", used: 1530 * GB, total: 2000 * GB, percent: 76.5 },
  ],
  net: { up_bps: 182_000, down_bps: 2_450_000, total_sent: 3.2 * GB, total_recv: 41.7 * GB },
  gpus: [
    {
      name: "NVIDIA GeForce RTX 5080",
      util: 31,
      mem_used: 3.1 * GB,
      mem_total: 16 * GB,
      temp_c: 54,
      power_w: 118,
      fan: 35,
    },
  ],
  alerts: [],
};

/** 示例网速曲线（字节/秒）。 */
export const SAMPLE_NET_HISTORY = {
  down: Array.from({ length: 90 }, (_, i) => 1_800_000 + Math.sin(i / 6) * 900_000 + (i % 7) * 60_000),
  up: Array.from({ length: 90 }, (_, i) => 160_000 + Math.cos(i / 5) * 70_000),
};

export interface InboxItem {
  source: "gmail" | "outlook";
  from: string;
  subject: string;
  time: string;
  important?: boolean;
}

export const SAMPLE_INBOX: InboxItem[] = [
  { source: "gmail", from: "GitHub", subject: "CI 通过：Phase 1 构建完成", time: "09:42", important: true },
  { source: "outlook", from: "项目组", subject: "周会纪要和下周排期", time: "09:15", important: true },
  { source: "gmail", from: "航空公司", subject: "您的行程单已出票", time: "08:30" },
  { source: "outlook", from: "IT 服务台", subject: "账户安全提醒：新设备登录", time: "昨天" },
  { source: "gmail", from: "云服务商", subject: "本月账单已生成", time: "昨天" },
];

export const SAMPLE_BRIEF = [
  "2 封邮件需要今天回复：周会排期、CI 结果确认",
  "下午 3 点有一个会议，资料已在邮件里",
  "云服务账单比上月高 18%",
];

export interface AgendaItem {
  time: string;
  title: string;
  where?: string;
}

export const SAMPLE_AGENDA: AgendaItem[] = [
  { time: "10:00", title: "站会", where: "线上" },
  { time: "15:00", title: "需求评审", where: "会议室 B" },
  { time: "19:30", title: "健身" },
];

export const SAMPLE_TODOS = [
  { title: "回复周会排期邮件", due: "今天" },
  { title: "配置 Gmail / Outlook 凭据", due: "本周" },
  { title: "续费域名", due: "11 月 10 日" },
];
