const cards = [
  {
    title: "Session Store",
    body: "Not connected. Replace with a real local store or API adapter when V0.3 starts growing logic again.",
  },
  {
    title: "Narration / Engine Trace",
    body: "Removed on purpose. This pane is here only to preserve the UI footprint and future debug affordance.",
  },
  {
    title: "Meta Bootstrap",
    body: "Use /api/meta as the first integration seam if you want the setup selectors to become live again.",
  },
] as const;

export function DebugInspector() {
  return (
    <section className="panel debugger-panel">
      <div className="debugger-header">
        <div>Debug Skeleton</div>
      </div>
      {cards.map((card) => (
        <article key={card.title} className="debug-card">
          <div className="debug-card-title">{card.title}</div>
          <p className="debug-line">{card.body}</p>
        </article>
      ))}
    </section>
  );
}
