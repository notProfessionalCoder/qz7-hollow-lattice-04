export function Reactor({ active }: { active: boolean }) {
  return (
    <div className={`reactor ${active ? "" : "reactor-idle"}`} aria-hidden>
      <div className="ring r1" />
      <div className="ring r2" />
      <div className="ring r3" />
      <div className="ring r4" />
      <div className="core" />
    </div>
  );
}
