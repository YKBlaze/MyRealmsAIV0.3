# Engine Schema

## Purpose

The engine is the deterministic ground truth of the game.

It is responsible for everything that can be calculated, created, mutated, resolved, and persisted as real game state.

This document defines the architecture and rules of the engine folder. It is not a content catalog and not a prompt
format. It is a living document that will grow as new values and systems are added.

## Core Principle

The engine does not care about words. It cares only about deterministic state, values, constraints, and transitions.

The engine is the constructor and mutator of all real game truth.

## Responsibility

The engine is responsible for:

- creating entities from valid templates
- filling in all required values at creation time
- resolving checks, rolls, and outcomes deterministically
- mutating state through legal operations
- persisting accepted state changes
- rejecting requests that cannot become full deterministic truth

## Language Boundary

The engine does not interpret player language.

It only accepts structured engine-readable inputs from systems outside itself. Those inputs may suggest blueprint types,
tiers, tags, descriptors, and other structured hints, but the engine only works with them if they are valid in engine
terms.

The engine does not narrate, reason in prose, or decide intent from text.

## Templates

Entities are created from strict templates.

Templates are not loose optional bags of fields. A template defines exactly what kind of object can exist and what
values must be present for it to be real.

Each entity type uses its own template. Different entity types should not be forced into one broad gameplay schema.

At creation time the engine may still attach tracking data needed for bookkeeping, such as ids and other metadata needed
to persist and reference the object.

## Deterministic Generation

Creation is not only about choosing a template. The engine is also responsible for filling in the details of the
created object.

When a template is instantiated, the engine must deterministically produce all required runtime values using valid
structured inputs, generation rules, and engine math.

Those generation rules may include:

- value tables
- ranges
- enums
- stat tiers
- seeded rolls
- default states
- constraint checks

If all required values cannot be resolved into a full deterministic object, creation fails.

## Runtime State

Once an entity is created, it exists as complete runtime state.

There are no half-objects, no placeholder truth, and no deferred gameplay fields that matter later but do not exist
yet.

The engine should think only in terms of real values and real state. This includes both physical and abstract gameplay
facts once they are canonized. If something can be calculated and can affect outcomes, it belongs in engine state.

## Mutation

The engine mutates only real state.

Examples of mutation include:

- creating entities
- changing numeric values
- changing booleans
- applying or removing statuses
- moving entities between scenes
- changing inventory and equipment state
- applying damage, healing, death, access, hostility, trust, and similar gameplay values

Every accepted mutation must produce a real change in persistent game truth.

## Resolution

The engine resolves actions through deterministic rules and math.

Resolution may use:

- current entity values
- current scene values
- current status/state flags
- valid modifiers
- deterministic random rolls
- explicit rule logic

The engine does not decide what the player meant. It only resolves structured actions against current truth.

## Rejection

The engine must reject anything it cannot represent as full deterministic truth.

Rejection happens when a request:

- uses an invalid template
- cannot fill all required values
- contradicts committed state
- requests an illegal mutation
- cannot become a deterministic object or state change with real gameplay value

Rejected requests are rejected in full. There are no partial creations, no downgraded creations, no silent remaps, and
no hidden negotiation inside the engine.

## Persistence

Accepted engine output becomes real campaign state.

Once a state change is accepted, it must remain part of game truth until deterministic code changes it again.

The engine is therefore responsible not only for calculation, but for maintaining continuity of truth across the life of
the campaign.

## Evolution Rule

This document will evolve over time as the engine grows.

New values, systems, and rules may be added, but they must obey the same architecture:

- they must be deterministic
- they must be representable as real state
- they must be calculable by the engine
- they must be mutable through explicit rules
- they must have real gameplay consequences

If a proposed value or system cannot satisfy those conditions, it does not belong in the engine.
