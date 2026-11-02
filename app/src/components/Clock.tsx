import { useEffect, useState } from "react";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="clock">
      <span className="clock-time num">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="clock-sec">:{pad(now.getSeconds())}</span>
      </span>
      <span className="clock-date">
        {now.getFullYear()}.{pad(now.getMonth() + 1)}.{pad(now.getDate())} 星期{WEEK[now.getDay()]}
      </span>
    </div>
  );
}
