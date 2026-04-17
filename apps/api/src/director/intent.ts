export const DIRECTOR_ACTION_TYPES = ["move", "observe", "interact", "social", "combat", "use"] as const;

export type DirectorActionType = (typeof DIRECTOR_ACTION_TYPES)[number];

export interface DirectorIntentRequest {
  input: string;
}

export interface DirectorIntentAction {
  type: DirectorActionType;
  verb: string;
  targetHint: string | null;
}

export interface DirectorIntentResponse {
  primaryAction: DirectorIntentAction;
  secondaryAction: DirectorIntentAction | null;
}

export function isDirectorActionType(value: unknown): value is DirectorActionType {
  return typeof value === "string" && DIRECTOR_ACTION_TYPES.includes(value as DirectorActionType);
}

export function isDirectorIntentAction(value: unknown): value is DirectorIntentAction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeAction = value as Record<string, unknown>;

  return (
    isDirectorActionType(maybeAction.type) &&
    typeof maybeAction.verb === "string" &&
    maybeAction.verb.trim().length > 0 &&
    (maybeAction.targetHint === null || typeof maybeAction.targetHint === "string")
  );
}
