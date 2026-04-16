type ChatComposerProps = {
  input: string;
  setInput: (value: string) => void;
};

export function ChatComposer({ input, setInput }: ChatComposerProps) {
  return (
    <section className="panel composer">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Type into the shell. Submission is intentionally disconnected in V0.3."
      />
      <div className="composer-row">
        <p className="composer-hint">This is a UI-only staging surface. No session logic is attached yet.</p>
        <button type="button" disabled>
          Send (Disconnected)
        </button>
      </div>
    </section>
  );
}
