type ChatComposerProps = {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  isSending: boolean;
  error: string | null;
  sessionId: string | null;
};

export function ChatComposer({ input, setInput, onSubmit, isSending, error, sessionId }: ChatComposerProps) {
  const hint =
    error ??
    (sessionId === null
      ? "Start a session from Setup first."
      : isSending
        ? "Waiting for model response..."
        : "Enter sends. Shift+Enter adds a new line.");

  return (
    <section className="panel composer">
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Write your next action."
      />
      <div className="composer-row">
        <p className="composer-hint">{hint}</p>
        <button type="button" disabled={sessionId === null || isSending || input.trim().length === 0} onClick={onSubmit}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
