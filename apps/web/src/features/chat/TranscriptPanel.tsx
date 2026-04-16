import type { RefObject } from "react";

type TranscriptMessage = {
  role: string;
  content: string;
};

type TranscriptPanelProps = {
  messages: readonly TranscriptMessage[];
  transcriptRef: RefObject<HTMLElement | null>;
};

export function TranscriptPanel({ messages, transcriptRef }: TranscriptPanelProps) {
  return (
    <section className="transcript panel" ref={transcriptRef}>
      {messages.map((message, index) => (
        <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
          <span className="role">{message.role}</span>
          <p>{message.content}</p>
        </article>
      ))}
    </section>
  );
}
