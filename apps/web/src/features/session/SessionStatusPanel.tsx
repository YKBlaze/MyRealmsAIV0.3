export function SessionStatusPanel() {
  return (
    <section className="panel status-panel">
      <div>
        <strong>Shell</strong>
        <div>UI + API skeleton only</div>
      </div>
      <div>
        <strong>Session</strong>
        <div>Placeholder workspace</div>
      </div>
      <div>
        <strong>Focus</strong>
        <div>Rebuild surface without engine or LLM coupling</div>
      </div>
      <div>
        <strong>API</strong>
        <div>/api/health, /api/meta, /api/session, /api/messages</div>
      </div>
    </section>
  );
}
