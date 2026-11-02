import { SAMPLE_AGENDA, SAMPLE_BRIEF, SAMPLE_INBOX, SAMPLE_TODOS } from "../lib/sample";
import { Panel } from "./Panel";

// 邮件、日程、待办都还没接真实数据源，先显示示例

export function InboxPanel() {
  return (
    <Panel title="通讯" tag="Gmail · Outlook" sample>
      <ul className="list">
        {SAMPLE_INBOX.map((m, i) => (
          <li key={i} className={`mail ${m.important ? "important" : ""}`}>
            <span className={`src src-${m.source}`}>{m.source === "gmail" ? "G" : "O"}</span>
            <span className="mail-main">
              <span className="mail-from">{m.from}</span>
              <span className="mail-subject">{m.subject}</span>
            </span>
            <span className="mail-time num">{m.time}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function BriefPanel() {
  return (
    <Panel title="今日要点" tag="AI" sample>
      <ol className="brief">
        {SAMPLE_BRIEF.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ol>
    </Panel>
  );
}

export function AgendaPanel() {
  return (
    <Panel title="日程" sample>
      <ul className="list">
        {SAMPLE_AGENDA.map((a, i) => (
          <li key={i} className="agenda">
            <span className="agenda-time num">{a.time}</span>
            <span className="agenda-title">{a.title}</span>
            {a.where && <span className="agenda-where">{a.where}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TodoPanel() {
  return (
    <Panel title="待办" sample>
      <ul className="list">
        {SAMPLE_TODOS.map((t, i) => (
          <li key={i} className="todo">
            <span className="todo-box" />
            <span className="todo-title">{t.title}</span>
            <span className="todo-due">{t.due}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
