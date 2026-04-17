export type DirectorIntentAction = {
  type: "move" | "observe" | "interact" | "social" | "combat" | "use";
  verb: string;
  targetHint: string | null;
};

export type DirectorIntent = {
  primaryAction: DirectorIntentAction;
  secondaryAction: DirectorIntentAction | null;
};

type SessionCombatPanelProps = {
  intent: DirectorIntent | null;
  intentStatus: string;
};

export function SessionCombatPanel({ intent, intentStatus }: SessionCombatPanelProps) {
  const intentLabel =
    intent === null
      ? intentStatus
      : intent.secondaryAction === null
        ? formatIntentAction(intent.primaryAction)
        : `${formatIntentAction(intent.primaryAction)} -> ${formatIntentAction(intent.secondaryAction)}`;

  return (
    <section className="panel combat-panel">
      <div>
        <strong>Current Scene</strong>
        <div>Briarwatch Gate shell view</div>
      </div>
      <div>
        <strong>Mode</strong>
        <div>Freeform placeholder</div>
      </div>
      <div>
        <strong>Active Systems</strong>
        <div>None connected</div>
      </div>
      <div>
        <strong>Intent</strong>
        <div>{intentLabel}</div>
      </div>
    </section>
  );
}

function formatIntentAction(action: DirectorIntentAction): string {
  return action.targetHint === null ? action.type : `${action.type} (${action.targetHint})`;
}
