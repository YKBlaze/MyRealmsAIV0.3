export const ENGINE_ACTION_TYPES = ["move", "observe", "interact", "social", "combat", "use"] as const;
export const ENGINE_ACTION_SLOTS = ["primary", "secondary"] as const;

export type EngineActionType = (typeof ENGINE_ACTION_TYPES)[number];
export type EngineActionSlot = (typeof ENGINE_ACTION_SLOTS)[number];

export interface EngineAnchorInteractionState {
  opened: boolean;
  broken: boolean;
  touched: boolean;
  openCount: number;
  closeCount: number;
  pushCount: number;
  pullCount: number;
  knockCount: number;
  breakCount: number;
  touchCount: number;
}

export interface EngineSceneAnchor {
  id: string;
  label: string;
  neighborAnchorIds: string[];
  observationDetails: string[];
  interactionState: EngineAnchorInteractionState;
}

export interface EngineSceneState {
  id: string;
  label: string;
  anchors: EngineSceneAnchor[];
}

export interface EngineActorState {
  id: string;
  label: string;
  sceneId: string;
  currentAnchorId: string;
  observedAnchorIds: string[];
}

export interface EngineSessionState {
  sessionId: string;
  campaignId: string;
  turn: number;
  clock: number;
  activeSceneId: string;
  controlledActorId: string;
  scenes: EngineSceneState[];
  actors: EngineActorState[];
  sceneIds: string[];
  actorIds: string[];
  entityIds: string[];
  lastPlayerInput: string | null;
}

export interface EngineActionReference {
  targetId: string | null;
  targetHint: string | null;
  toolEntityId: string | null;
}

export interface EngineActionSelection extends EngineActionReference {
  type: EngineActionType;
  verb: string;
  tags: string[];
}

export interface EngineTurnRequest {
  sessionId: string;
  actorId: string;
  playerInput: string;
  primaryAction: EngineActionSelection;
  secondaryAction: EngineActionSelection | null;
}

export type EngineActionStatus = "resolved" | "rejected" | "skipped";

export interface EngineResolvedAction {
  slot: EngineActionSlot;
  type: EngineActionType;
  status: EngineActionStatus;
  reasonCode: string | null;
  worldChanges: string[];
}

export interface EngineWorldDelta {
  tickDelta: number;
  sceneChanged: boolean;
  actorIdsChanged: string[];
  entityIdsChanged: string[];
  entityIdsCreated: string[];
  entityIdsRemoved: string[];
  valueChanges: string[];
}

export interface EngineTurnResolution {
  sessionId: string;
  turn: number;
  playerInput: string;
  primaryAction: EngineResolvedAction;
  secondaryAction: EngineResolvedAction | null;
  worldDelta: EngineWorldDelta;
}

export interface EngineTurnResult {
  nextState: EngineSessionState;
  resolution: EngineTurnResolution;
}

export const ENGINE_DEFAULT_SCENE: EngineSceneState = {
  id: "scene-briarwatch-gate",
  label: "Briarwatch Gate",
  anchors: [
    {
      id: "anchor-gate",
      label: "gate",
      neighborAnchorIds: ["anchor-cart", "anchor-tree", "anchor-house"],
      observationDetails: [
        "The gate is shut.",
        "The stone arch is intact.",
        "The hinges show no visible damage.",
      ],
      interactionState: createDefaultInteractionState(),
    },
    {
      id: "anchor-tree",
      label: "tree",
      neighborAnchorIds: ["anchor-gate", "anchor-cart", "anchor-house"],
      observationDetails: [
        "The tree is mature and rooted beside the gate road.",
        "Its trunk is wide enough to use as cover.",
        "There are no obvious marks or damage on the bark.",
      ],
      interactionState: createDefaultInteractionState(),
    },
    {
      id: "anchor-cart",
      label: "cart",
      neighborAnchorIds: ["anchor-tree", "anchor-gate", "anchor-house"],
      observationDetails: [
        "The cart is parked near the gate.",
        "Its bed is empty.",
        "Both wheels appear intact.",
      ],
      interactionState: createDefaultInteractionState(),
    },
    {
      id: "anchor-house",
      label: "house",
      neighborAnchorIds: ["anchor-cart", "anchor-gate", "anchor-tree"],
      observationDetails: [
        "The house stands just off the gate approach.",
        "Its front door is closed.",
        "No movement is visible from the outside.",
      ],
      interactionState: createDefaultInteractionState(),
    },
  ],
};

export const ENGINE_DEFAULT_PLAYER: EngineActorState = {
  id: "actor-player",
  label: "Player",
  sceneId: ENGINE_DEFAULT_SCENE.id,
  currentAnchorId: "anchor-gate",
  observedAnchorIds: [],
};

export const ENGINE_CONTRACT = {
  version: "sandbox-v0",
  actionTypes: ENGINE_ACTION_TYPES,
  actionSlots: ENGINE_ACTION_SLOTS,
  rules: [
    "Every turn has exactly one primary action.",
    "A secondary action is optional and resolved only after the primary action.",
    "The engine validates and resolves structured action data, not raw language.",
    "The parser chooses the action family. The engine does not remap action families.",
    "The contract is deterministic. The same state and same request must produce the same result.",
  ],
  sessionFields: [
    "sessionId",
    "campaignId",
    "turn",
    "clock",
    "activeSceneId",
    "controlledActorId",
    "scenes",
    "actors",
    "sceneIds",
    "actorIds",
    "entityIds",
    "lastPlayerInput",
  ],
  requestFields: [
    "sessionId",
    "actorId",
    "playerInput",
    "primaryAction",
    "secondaryAction",
  ],
  actionFields: [
    "type",
    "verb",
    "targetId",
    "targetHint",
    "toolEntityId",
    "tags",
  ],
  resolutionFields: [
    "primaryAction",
    "secondaryAction",
    "worldDelta",
  ],
} as const;

export function createEngineSessionState(
  overrides: Partial<EngineSessionState> & Pick<EngineSessionState, "sessionId">,
): EngineSessionState {
  return {
    sessionId: overrides.sessionId,
    campaignId: overrides.campaignId ?? overrides.sessionId,
    turn: overrides.turn ?? 0,
    clock: overrides.clock ?? 0,
    activeSceneId: overrides.activeSceneId ?? ENGINE_DEFAULT_SCENE.id,
    controlledActorId: overrides.controlledActorId ?? ENGINE_DEFAULT_PLAYER.id,
    scenes: overrides.scenes ?? [cloneScene(ENGINE_DEFAULT_SCENE)],
    actors: overrides.actors ?? [cloneActor(ENGINE_DEFAULT_PLAYER)],
    sceneIds: overrides.sceneIds ?? [ENGINE_DEFAULT_SCENE.id],
    actorIds: overrides.actorIds ?? [ENGINE_DEFAULT_PLAYER.id],
    entityIds: overrides.entityIds ?? [],
    lastPlayerInput: overrides.lastPlayerInput ?? null,
  };
}

export const ENGINE_CONTRACT_EXAMPLE_REQUEST: EngineTurnRequest = {
  sessionId: "sandbox-session",
  actorId: "actor-player",
  playerInput: "I walk to the cart.",
  primaryAction: {
    type: "move",
    verb: "walk",
    targetId: null,
    targetHint: "the cart",
    toolEntityId: null,
    tags: [],
  },
  secondaryAction: null,
};

function cloneScene(scene: EngineSceneState): EngineSceneState {
  return {
    ...scene,
    anchors: scene.anchors.map((anchor) => ({
      ...anchor,
      neighborAnchorIds: [...anchor.neighborAnchorIds],
      observationDetails: [...anchor.observationDetails],
      interactionState: {
        ...anchor.interactionState,
      },
    })),
  };
}

function cloneActor(actor: EngineActorState): EngineActorState {
  return {
    ...actor,
  };
}

export function createDefaultInteractionState(): EngineAnchorInteractionState {
  return {
    opened: false,
    broken: false,
    touched: false,
    openCount: 0,
    closeCount: 0,
    pushCount: 0,
    pullCount: 0,
    knockCount: 0,
    breakCount: 0,
    touchCount: 0,
  };
}
