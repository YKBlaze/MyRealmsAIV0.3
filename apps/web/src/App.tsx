import { useCallback, useEffect, useRef, useState } from "react";
import { ChatComposer } from "./features/chat/ChatComposer";
import { TranscriptPanel } from "./features/chat/TranscriptPanel";
import { DebugInspector } from "./features/debug/DebugInspector";
import { SessionCombatPanel, type DirectorIntent } from "./features/session/SessionCombatPanel";
import { SessionSetupPanel } from "./features/session/SessionSetupPanel";
import { SessionStatusPanel } from "./features/session/SessionStatusPanel";

const LS = {
  leftWidth: "v03.ui.leftWidth",
  rightWidth: "v03.ui.rightWidth",
  leftCollapsed: "v03.ui.leftCollapsed",
  rightCollapsed: "v03.ui.rightCollapsed",
} as const;

const MIN_PANE = 240;
const MAX_PANE = 720;
const DEFAULT_LEFT = 400;
const DEFAULT_RIGHT = 440;

export type TranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

function readNumber(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function readBool(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const transcriptRef = useRef<HTMLElement | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [latestIntent, setLatestIntent] = useState<DirectorIntent | null>(null);
  const [intentStatus, setIntentStatus] = useState("No action classified yet.");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [startSessionError, setStartSessionError] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(() => readNumber(LS.leftWidth, DEFAULT_LEFT));
  const [rightWidth, setRightWidth] = useState(() => readNumber(LS.rightWidth, DEFAULT_RIGHT));
  const [leftCollapsed, setLeftCollapsed] = useState(() => readBool(LS.leftCollapsed));
  const [rightCollapsed, setRightCollapsed] = useState(() => readBool(LS.rightCollapsed));

  useEffect(() => {
    try {
      localStorage.setItem(LS.leftWidth, String(Math.round(leftWidth)));
      localStorage.setItem(LS.rightWidth, String(Math.round(rightWidth)));
      localStorage.setItem(LS.leftCollapsed, leftCollapsed ? "1" : "0");
      localStorage.setItem(LS.rightCollapsed, rightCollapsed ? "1" : "0");
    } catch {}
  }, [leftCollapsed, leftWidth, rightCollapsed, rightWidth]);

  useEffect(() => {
    const element = transcriptRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      if (event.key === "[") {
        event.preventDefault();
        setLeftCollapsed((value) => !value);
      } else if (event.key === "]") {
        event.preventDefault();
        setRightCollapsed((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startResize = useCallback(
    (side: "left" | "right") => (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = side === "left" ? leftWidth : rightWidth;
      const setter = side === "left" ? setLeftWidth : setRightWidth;

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const next = side === "left" ? startWidth + dx : startWidth - dx;
        setter(Math.max(MIN_PANE, Math.min(MAX_PANE, next)));
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.classList.remove("is-resizing");
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      document.body.classList.add("is-resizing");
    },
    [leftWidth, rightWidth],
  );

  const resetLayout = () => {
    setLeftWidth(DEFAULT_LEFT);
    setRightWidth(DEFAULT_RIGHT);
    setLeftCollapsed(false);
    setRightCollapsed(false);
  };

  const startSession = useCallback(async () => {
    setIsStartingSession(true);
    setStartSessionError(null);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
      });
      const payload = (await response.json()) as
        | {
            ok: true;
            session: {
              sessionId: string;
            };
          }
        | {
            ok: false;
            error: string;
          };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Failed to start session." : payload.error);
      }

      setSessionId(payload.session.sessionId);
      setMessages([]);
      setInput("");
      setSendError(null);
      setLatestIntent(null);
      setIntentStatus("No action classified yet.");
    } catch (error) {
      setStartSessionError(error instanceof Error ? error.message : "Failed to start session.");
    } finally {
      setIsStartingSession(false);
    }
  }, []);

  const submitMessage = useCallback(async () => {
    const content = input.trim();

    if (content.length === 0 || isSending || sessionId === null) {
      return;
    }

    const userMessage: TranscriptMessage = {
      role: "user",
      content,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setSendError(null);
    setIntentStatus("Reading player intent...");
    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages,
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            turn: number;
            intent: DirectorIntent;
            message: TranscriptMessage;
          }
        | {
            ok: false;
            error: string;
          };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unknown chat error." : payload.error);
      }

      setLatestIntent(payload.intent);
      setIntentStatus(`Intent classified for turn ${payload.turn}.`);
      setMessages((currentMessages) => [...currentMessages, payload.message]);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unknown chat error.");
      setIntentStatus("Intent unavailable.");
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, sessionId]);

  const workspaceStyle = {
    ["--left-w" as any]: `${leftCollapsed ? 0 : leftWidth}px`,
    ["--right-w" as any]: `${rightCollapsed ? 0 : rightWidth}px`,
  } as React.CSSProperties;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">MyRealmsAI</span>
          <span className="brand-version">V0.3</span>
        </div>
        <div className="topbar-status">
          <SessionStatusPanel sessionId={sessionId} />
        </div>
        <div className="topbar-actions" role="toolbar" aria-label="Layout controls">
          <button
            type="button"
            className={`pane-toggle ${leftCollapsed ? "" : "active"}`}
            onClick={() => setLeftCollapsed((value) => !value)}
            aria-pressed={!leftCollapsed}
            title="Toggle left pane (Ctrl/Cmd + [)"
          >
            <span className="pane-toggle-icon pane-toggle-icon-left" aria-hidden />
            <span className="pane-toggle-label">Setup</span>
          </button>
          <button
            type="button"
            className={`pane-toggle ${rightCollapsed ? "" : "active"}`}
            onClick={() => setRightCollapsed((value) => !value)}
            aria-pressed={!rightCollapsed}
            title="Toggle right pane (Ctrl/Cmd + ])"
          >
            <span className="pane-toggle-label">Debug</span>
            <span className="pane-toggle-icon pane-toggle-icon-right" aria-hidden />
          </button>
          <button type="button" className="pane-toggle pane-toggle-reset" onClick={resetLayout}>
            Reset
          </button>
        </div>
      </header>

      <div className="workspace" style={workspaceStyle}>
        <aside className={`pane pane-left ${leftCollapsed ? "is-collapsed" : ""}`} aria-hidden={leftCollapsed}>
          <SessionSetupPanel
            sessionId={sessionId}
            isStartingSession={isStartingSession}
            startSessionError={startSessionError}
            onStartSession={startSession}
          />
        </aside>

        <div
          className={`resizer ${leftCollapsed ? "is-disabled" : ""}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize left pane"
          onPointerDown={leftCollapsed ? undefined : startResize("left")}
          onDoubleClick={() => setLeftWidth(DEFAULT_LEFT)}
        />

        <section className="pane pane-center">
          <div className="pane-center-header">
            <SessionCombatPanel intent={latestIntent} intentStatus={intentStatus} />
          </div>
          <TranscriptPanel messages={messages} transcriptRef={transcriptRef} />
          <div className="pane-center-composer">
            <ChatComposer
              input={input}
              setInput={setInput}
              onSubmit={submitMessage}
              isSending={isSending}
              error={sendError}
              sessionId={sessionId}
            />
          </div>
        </section>

        <div
          className={`resizer ${rightCollapsed ? "is-disabled" : ""}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize right pane"
          onPointerDown={rightCollapsed ? undefined : startResize("right")}
          onDoubleClick={() => setRightWidth(DEFAULT_RIGHT)}
        />

        <aside className={`pane pane-right ${rightCollapsed ? "is-collapsed" : ""}`} aria-hidden={rightCollapsed}>
          <DebugInspector />
        </aside>
      </div>
    </main>
  );
}
