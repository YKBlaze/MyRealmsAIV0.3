# Project Guidelines

## Core Principle

Narration is AI. Truth is code.

## Project Definition

MyRealmsAI is a web RPG built on deterministic code with real memory.

The LLM is used to:

- tell the story
- parse the player's intent

The LLM is not used to decide what is true.

## Campaign Persistence

Each session is a unique campaign with its own structure and state.

From the first player input to the last, what happens in that campaign matters and remains. If a character dies, a door
breaks, or a relationship changes, that state stays in the campaign until deterministic code changes it.

Memory is real game state, not prompt-only flavor.

## Sandbox Goal

The first sandbox does not need a full world. It needs to prove that the game can take any player input, mutate a
session coherently, and resolve it deterministically.

The model is a live tabletop session:

- the player can say anything
- the LLM interprets what the player is trying to do
- the code decides rolls, stats, outcomes, and state changes
- the narrator reports what actually happened

## Basic Gameplay Loop

The core gameplay loop is:

1. Player input
2. Intent parser
3. Engine action
4. Chat response

The interface must accept free-form input, including nonsense, hostile input, and attempts to break the game.

The intent parser turns that free-form input into structured action data for the engine.

The engine resolves the action through deterministic code. It applies rules, rolls when needed, and updates persistent
world state according to the actual result.

The chat response narrates what happened after resolution. It describes the result and its consequences based on engine
output and real game state.

Every input must have action and consequence. Not every turn needs a dice roll, but every turn must matter. A turn may
change position, values, relationships, knowledge, scene state, materialized entities, time, or some other real part of
the world. Even failed attempts must have real consequences.

## LLM Roles

The intent parser is an LLM. Its job is to interpret free-form player input and output structured data the engine can
use.

The narrator is also an LLM, but it must narrate only what the engine and world state make true.

Neither LLM determines outcomes, success, failure, stats, or world truth.

## Hard Boundaries

- Every input is valid.
- The world must always keep spinning. The system must not block on `needs_clarification`.
- Only the engine determines outcomes.
- The narrator must adhere to truth.
- The AI must not hallucinate results or invent state changes.
- The AI must not help the player by overriding the game rules.

## Materialization And Canon

The LLM may propose new objects, NPCs, or lore-bearing elements when interpreting player intent. This is allowed. The
system should be able to incorporate player-driven mystery, drama, and invention.

The engine decides whether the proposal becomes real. If the engine accepts it, it is committed as campaign truth and
must exist as deterministic state.

The engine should reject only on hard contradiction or when the proposal cannot be turned into a deterministic object
with real gameplay value beyond words.

Plausibility alone is not a rejection reason. A proposal may be surprising or dramatic and still be valid.

If the engine rejects a materialization request, the whole request is rejected. There are no partial or downgraded
materializations.

The narrator must then respond only to what the engine accepted or rejected.

## Engine Model

The engine is the game's physics. It does not care about words. It works only with deterministic state, values,
constraints, and transitions.

The engine should think in terms of real gameplay state such as numbers, booleans, relations, and exact object state.
This includes both physical and abstract facts once they are canonized. Hostility, trust, injury, access, and similar
concepts are still engine state because they can be represented as real values.

The engine creates entities from strict templates. Templates are not broad optional bags of possible fields. An entity
either exists as a fully realized deterministic object or it does not exist.

Different entity types use separate templates. A human, sword, or door should not be forced into one broad shared
gameplay schema. The engine may still attach bookkeeping data such as ids and tracking metadata at creation time.

## Blueprint Selection And Rejection

The intent parser selects the blueprint type because the engine does not interpret language and cannot infer player
intent from words.

The engine then validates that exact blueprint request against deterministic rules and either instantiates that exact
template or rejects it.

There are no substitutions, remaps, downgraded variants, or partial creations. If the requested blueprint cannot be
created deterministically, the request is rejected in full.

There is also no parser-engine argument loop. The engine does not negotiate with the LLM about close matches or try to
repair a bad blueprint choice.
