import type { RefObject } from "react";
import type { TranscriptMessage } from "../../App";

type TranscriptPanelProps = {
  messages: readonly TranscriptMessage[];
  transcriptRef: RefObject<HTMLElement | null>;
};

export function TranscriptPanel({ messages, transcriptRef }: TranscriptPanelProps) {
  return (
    <section className="transcript panel" ref={transcriptRef}>
      {messages.length === 0 ? <p className="empty" /> : null}
      {messages.map((message, index) => (
        <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
          <span className="role">{message.role}</span>
          <p>{message.content}</p>
        </article>
      ))}
    </section>
  );
}
