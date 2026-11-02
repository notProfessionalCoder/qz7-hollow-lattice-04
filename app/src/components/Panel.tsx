import type { ReactNode } from "react";

interface Props {
  title: string;
  tag?: string;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, tag, className, children }: Props) {
  return (
    <section className={`panel ${className ?? ""}`}>
      <header className="panel-title">
        <span>{title}</span>
        {tag && <span className="panel-tag">{tag}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
