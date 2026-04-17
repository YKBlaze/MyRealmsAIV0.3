import type {
  EngineActorState,
  EngineActionSelection,
  EngineActionSlot,
  EngineResolvedAction,
  EngineSceneAnchor,
  EngineSceneState,
  EngineSessionState,
} from "../contract";

export interface ActionOutcome {
  action: EngineResolvedAction;
  nextState: EngineSessionState;
}

export function rejectAction(state: EngineSessionState, slot: EngineActionSlot, type: string, reasonCode: string): ActionOutcome {
  return {
    action: {
      slot,
      type: type as any,
      status: "rejected",
      reasonCode,
      worldChanges: [],
    },
    nextState: state,
  };
}

export function unresolvedAction(
  state: EngineSessionState,
  slot: EngineActionSlot,
  type: EngineActionSelection["type"],
  reasonCode: string,
): ActionOutcome {
  return {
    action: {
      slot,
      type,
      status: "rejected",
      reasonCode,
      worldChanges: [],
    },
    nextState: state,
  };
}

export function skipAction(type: EngineActionSelection["type"], reasonCode: string): EngineResolvedAction {
  return {
    slot: "secondary",
    type,
    status: "skipped",
    reasonCode,
    worldChanges: [],
  };
}

export function getActor(state: EngineSessionState, actorId: string): EngineActorState | null {
  return state.actors.find((actor) => actor.id === actorId) ?? null;
}

export function getScene(state: EngineSessionState, sceneId: string): EngineSceneState | null {
  return state.scenes.find((scene) => scene.id === sceneId) ?? null;
}

export function resolveAnchorByReference(
  scene: EngineSceneState,
  targetId: string | null,
  targetHint: string | null,
): EngineSceneAnchor | null {
  if (targetId !== null) {
    const anchorById = scene.anchors.find((anchor) => anchor.id === targetId);

    if (anchorById) {
      return anchorById;
    }
  }

  if (targetHint === null || targetHint.trim().length === 0) {
    return null;
  }

  const normalizedTarget = normalizeReference(targetHint);
  const exactMatch = scene.anchors.find((anchor) => normalizeReference(anchor.label) === normalizedTarget);

  if (exactMatch) {
    return exactMatch;
  }

  const fuzzyMatch = scene.anchors.find((anchor) => {
    const normalizedLabel = normalizeReference(anchor.label);
    return normalizedTarget.includes(normalizedLabel) || normalizedLabel.includes(normalizedTarget);
  });

  return fuzzyMatch ?? null;
}

export function getAnchorLabel(scene: EngineSceneState, anchorId: string): string {
  return scene.anchors.find((anchor) => anchor.id === anchorId)?.label ?? anchorId;
}

export function normalizeReference(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
