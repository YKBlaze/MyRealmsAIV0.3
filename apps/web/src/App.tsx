import { useCallback, useEffect, useRef, useState } from "react";
import { ChatComposer } from "./features/chat/ChatComposer";
import { TranscriptPanel } from "./features/chat/TranscriptPanel";
import { DebugInspector } from "./features/debug/DebugInspector";
import { SessionCombatPanel } from "./features/session/SessionCombatPanel";
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

const placeholderMessages = [
  {
    role: "assistant",
    content:
      "MyRealmsAI V0.3 is a shell only. The workspace, panes, and composition surface are intact, but there is no engine or narrator connected yet.",
  },
  {
    role: "assistant",
    content:
      "Use this fork as a clean rebuild surface for UI and app flow before reconnecting any runtime or model logic.",
  },
] as const;

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
  const [input, setInput] = useState("");
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
  }, []);

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
          <SessionStatusPanel />
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
          <SessionSetupPanel />
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
            <SessionCombatPanel />
          </div>
          <TranscriptPanel messages={placeholderMessages} transcriptRef={transcriptRef} />
          <div className="pane-center-composer">
            <ChatComposer input={input} setInput={setInput} />
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
