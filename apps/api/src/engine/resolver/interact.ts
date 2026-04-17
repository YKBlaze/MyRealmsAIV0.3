import {
  createDefaultInteractionState,
  type EngineActionSelection,
  type EngineActionSlot,
  type EngineAnchorInteractionState,
  type EngineSessionState,
} from "../contract";
import { getActor, getScene, rejectAction, resolveAnchorByReference, type ActionOutcome } from "./shared";

type InteractVerb = "open" | "close" | "push" | "pull" | "touch" | "knock" | "break";

const INTERACT_VERB_MAP: Readonly<Record<string, InteractVerb>> = {
  open: "open",
  close: "close",
  push: "push",
  pull: "pull",
  touch: "touch",
  knock: "knock",
  break: "break",
};

export function resolveInteractAction(
  state: EngineSessionState,
  actorId: string,
  slot: EngineActionSlot,
  action: EngineActionSelection,
): ActionOutcome {
  const actor = getActor(state, actorId);

  if (actor === null) {
    return rejectAction(state, slot, action.type, "interact_actor_not_found");
  }

  const scene = getScene(state, actor.sceneId);

  if (scene === null) {
    return rejectAction(state, slot, action.type, "interact_scene_not_found");
  }

  const canonicalVerb = normalizeInteractVerb(action.verb);

  if (canonicalVerb === null) {
    return rejectAction(state, slot, action.type, "interact_verb_not_supported");
  }

  const targetAnchor =
    resolveAnchorByReference(scene, action.targetId, action.targetHint) ??
    scene.anchors.find((anchor) => anchor.id === actor.currentAnchorId) ??
    null;

  if (targetAnchor === null) {
    return rejectAction(state, slot, action.type, "interact_target_not_found");
  }

  const nextInteractionState = applyInteractVerb(targetAnchor.interactionState, canonicalVerb);
  const nextScenes = state.scenes.map((currentScene) =>
    currentScene.id !== scene.id
      ? currentScene
      : {
          ...currentScene,
          anchors: currentScene.anchors.map((anchor) =>
            anchor.id !== targetAnchor.id
              ? anchor
              : {
                  ...anchor,
                  interactionState: nextInteractionState,
                },
          ),
        },
  );

  return {
    action: {
      slot,
      type: action.type,
      status: "resolved",
      reasonCode: null,
      worldChanges: buildInteractionWorldChanges(targetAnchor.label, canonicalVerb, nextInteractionState),
    },
    nextState: {
      ...state,
      scenes: nextScenes,
    },
  };
}

export function collectInteractionValueChanges(previousState: EngineSessionState, nextState: EngineSessionState): string[] {
  const valueChanges: string[] = [];

  for (const nextScene of nextState.scenes) {
    const previousScene = previousState.scenes.find((candidate) => candidate.id === nextScene.id);

    if (!previousScene) {
      continue;
    }

    for (const nextAnchor of nextScene.anchors) {
      const previousAnchor = previousScene.anchors.find((candidate) => candidate.id === nextAnchor.id);

      if (!previousAnchor) {
        continue;
      }

      const previousInteractionState = previousAnchor.interactionState;
      const nextInteractionState = nextAnchor.interactionState;

      for (const [key, value] of Object.entries(nextInteractionState)) {
        const previousValue = previousInteractionState[key as keyof EngineAnchorInteractionState];

        if (previousValue !== value) {
          valueChanges.push(`${nextAnchor.id}.interactionState.${key}=${String(value)}`);
        }
      }
    }
  }

  return valueChanges;
}

function normalizeInteractVerb(value: string): InteractVerb | null {
  const normalizedVerb = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return INTERACT_VERB_MAP[normalizedVerb] ?? null;
}

function applyInteractVerb(state: EngineAnchorInteractionState, verb: InteractVerb): EngineAnchorInteractionState {
  const nextState = {
    ...createDefaultInteractionState(),
    ...state,
  };

  switch (verb) {
    case "open":
      nextState.opened = true;
      nextState.openCount += 1;
      return nextState;
    case "close":
      nextState.opened = false;
      nextState.closeCount += 1;
      return nextState;
    case "push":
      nextState.pushCount += 1;
      return nextState;
    case "pull":
      nextState.pullCount += 1;
      return nextState;
    case "touch":
      nextState.touched = true;
      nextState.touchCount += 1;
      return nextState;
    case "knock":
      nextState.knockCount += 1;
      return nextState;
    case "break":
      nextState.broken = true;
      nextState.breakCount += 1;
      return nextState;
  }
}

function buildInteractionWorldChanges(
  anchorLabel: string,
  verb: InteractVerb,
  interactionState: EngineAnchorInteractionState,
): string[] {
  const prefix = `interacted:${anchorLabel}:`;

  switch (verb) {
    case "open":
      return [
        `${prefix}You open the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.opened=${interactionState.opened}`,
        `${prefix}${anchorLabel}.openCount=${interactionState.openCount}`,
      ];
    case "close":
      return [
        `${prefix}You close the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.opened=${interactionState.opened}`,
        `${prefix}${anchorLabel}.closeCount=${interactionState.closeCount}`,
      ];
    case "push":
      return [
        `${prefix}You push the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.pushCount=${interactionState.pushCount}`,
      ];
    case "pull":
      return [
        `${prefix}You pull the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.pullCount=${interactionState.pullCount}`,
      ];
    case "touch":
      return [
        `${prefix}You touch the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.touched=${interactionState.touched}`,
        `${prefix}${anchorLabel}.touchCount=${interactionState.touchCount}`,
      ];
    case "knock":
      return [
        `${prefix}You knock on the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.knockCount=${interactionState.knockCount}`,
      ];
    case "break":
      return [
        `${prefix}You break the ${anchorLabel}.`,
        `${prefix}${anchorLabel}.broken=${interactionState.broken}`,
        `${prefix}${anchorLabel}.breakCount=${interactionState.breakCount}`,
      ];
  }
}
