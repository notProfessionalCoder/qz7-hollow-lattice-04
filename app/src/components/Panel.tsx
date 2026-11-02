import type { ReactNode } from "react";

interface Props {
  title: string;
  tag?: string;
  /** 显示示例数据时为 true，标题上会标「示例」 */
  sample?: boolean;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, tag, sample, className, children }: Props) {
  return (
    <section className={`panel ${sample ? "is-sample" : ""} ${className ?? ""}`}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <header className="panel-title">
        <span className="panel-name">{title}</span>
        <span className="panel-meta">
          {tag && <span className="panel-tag">{tag}</span>}
          {sample && <span className="sample-badge">示例</span>}
        </span>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
