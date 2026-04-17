import type {
  EngineActionSelection,
  EngineActionSlot,
  EngineSceneAnchor,
  EngineSceneState,
  EngineSessionState,
} from "../contract";
import { getActor, getAnchorLabel, getScene, normalizeReference, rejectAction, resolveAnchorByReference, type ActionOutcome } from "./shared";

const GENERIC_MOVE_TARGETS = new Set([
  "around",
  "around here",
  "here",
  "nearby",
  "somewhere",
  "somewhere nearby",
]);

export function resolveMoveAction(
  state: EngineSessionState,
  actorId: string,
  slot: EngineActionSlot,
  action: EngineActionSelection,
): ActionOutcome {
  const actor = getActor(state, actorId);

  if (actor === null) {
    return rejectAction(state, slot, action.type, "move_actor_not_found");
  }

  const scene = getScene(state, actor.sceneId);

  if (scene === null) {
    return rejectAction(state, slot, action.type, "move_scene_not_found");
  }

  const targetAnchor = resolveMoveTarget(scene, actor.currentAnchorId, action);

  if (targetAnchor === null) {
    return rejectAction(state, slot, action.type, "move_target_not_found");
  }

  if (actor.currentAnchorId === targetAnchor.id) {
    return {
      action: {
        slot,
        type: action.type,
        status: "resolved",
        reasonCode: null,
        worldChanges: [`${actor.id} remains at ${targetAnchor.label}`],
      },
      nextState: state,
    };
  }

  const nextActors = state.actors.map((currentActor) =>
    currentActor.id === actor.id ? { ...currentActor, currentAnchorId: targetAnchor.id } : currentActor,
  );

  return {
    action: {
      slot,
      type: action.type,
      status: "resolved",
      reasonCode: null,
      worldChanges: [`${actor.id} moved from ${getAnchorLabel(scene, actor.currentAnchorId)} to ${targetAnchor.label}`],
    },
    nextState: {
      ...state,
      actors: nextActors,
    },
  };
}

function resolveMoveTarget(
  scene: EngineSceneState,
  currentAnchorId: string,
  action: EngineActionSelection,
): EngineSceneAnchor | null {
  if (isTargetlessMoveAction(action)) {
    return getNextNeighborAnchor(scene, currentAnchorId);
  }

  return resolveAnchorByReference(scene, action.targetId, action.targetHint);
}

function getNextNeighborAnchor(scene: EngineSceneState, currentAnchorId: string): EngineSceneAnchor | null {
  const currentAnchor = scene.anchors.find((anchor) => anchor.id === currentAnchorId);
  const nextNeighborId = currentAnchor?.neighborAnchorIds[0] ?? null;

  if (nextNeighborId === null) {
    return null;
  }

  return scene.anchors.find((anchor) => anchor.id === nextNeighborId) ?? null;
}

function isTargetlessMoveAction(action: EngineActionSelection): boolean {
  if (action.targetId !== null) {
    return false;
  }

  if (action.targetHint === null) {
    return true;
  }

  const normalizedTarget = normalizeReference(action.targetHint);

  return normalizedTarget.length === 0 || GENERIC_MOVE_TARGETS.has(normalizedTarget);
}
