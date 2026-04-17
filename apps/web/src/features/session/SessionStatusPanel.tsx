type SessionStatusPanelProps = {
  sessionId: string | null;
};

export function SessionStatusPanel({ sessionId }: SessionStatusPanelProps) {
  return (
    <section className="panel status-panel">
      <div>
        <strong>Shell</strong>
        <div>UI + API sandbox</div>
      </div>
      <div>
        <strong>Session</strong>
        <div>{sessionId ?? "No active session"}</div>
      </div>
      <div>
        <strong>Focus</strong>
        <div>Session turns and visible intent</div>
      </div>
      <div>
        <strong>API</strong>
        <div>/api/session, /api/messages, /api/director</div>
      </div>
    </section>
  );
}
