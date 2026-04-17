# Text Game Physics Research

## Purpose

This note compares several mature text-game systems and research frameworks to extract patterns that can translate into
MyRealmsAI.

The goal is not to copy any one system directly. The goal is to identify what they solved well, what they assume that
MyRealmsAI does not assume, and what architectural lessons are worth stealing.

## The Main Takeaway

Most successful text-game systems do not model "physics" as freeform simulation. They model:

- authoritative world state
- legal actions or transitions
- preconditions for those transitions
- persistent consequences after the transition succeeds

That is encouraging for MyRealmsAI. It means the engine does not need to be a universal simulation. It needs to be a
deterministic state machine that can accept structured intent, validate it, and commit real mutations.

## Inform 7

### What it does well

Inform 7 treats play as actions moving through a staged rule pipeline. The Standard Rules split action handling into
stages such as before, instead, check, carry out, after, and report.

That separation matters because it keeps three concerns distinct:

- action viability
- state change
- narration/reporting

Inform also separates general action logic from contingent local rules. The general implementation of an action lives in
check, carry out, and report rules, while special local interventions live in before, instead, and after rules.

### What does not map cleanly

Inform is still fundamentally parser-IF. It assumes the engine and parser are part of one authored system, and its world
model is heavily tied to pre-authored objects and relations.

It is not built for an external LLM parser proposing new materialization.

### What MyRealmsAI should steal

- staged action handling
- no narration before resolution
- general action logic separated from situational overrides

### Translation to MyRealmsAI

Inform's action stages suggest a clean loop for MyRealmsAI:

1. parser emits structured action
2. engine validates legality
3. engine performs state mutation
4. narrator reports committed truth

The specific stage names do not need to match Inform. The architectural lesson is that legality, mutation, and
reporting should not be blended together.

## TADS 3

### What it does well

TADS 3 is the sharpest example of separating "what the player probably meant" from "what the world will allow."

Its action model distinguishes:

- verify: whether a command is logical from the player's perspective
- check: whether it can actually work right now
- action: the phase where state changes happen
- preconditions: explicit requirements that may need to be satisfied first

That distinction exists mainly to support disambiguation without corrupting world truth.

### What does not map cleanly

TADS assumes a traditional parser and a heavily authored world model. It is designed to disambiguate typed references to
existing objects, not to let an LLM propose new canonizable material.

Its implicit action system is also more forgiving than what MyRealmsAI currently wants for blueprint selection and hard
rejection.

### What MyRealmsAI should steal

- distinguish target interpretation from actual legality
- evaluate legality before mutation
- keep all state change in the final execution phase

### Translation to MyRealmsAI

The most useful TADS lesson is not the parser. It is the separation between:

- player-facing plausibility
- engine-facing legality

For MyRealmsAI this becomes:

- parser LLM chooses blueprint/action type and target reference
- engine checks whether that request can exist or succeed in current truth
- if valid, engine mutates state
- if invalid, engine rejects in full

This is very close to the engine boundary already emerging in this project.

## Dialog

### What it does well

Dialog defines actions explicitly as data structures representing the player's intentions. The parser constructs an
action, and then the rest of the game processes that action.

Its standard action flow is also staged:

- prevent
- perform
- after

It also has ticking and prerequisite actions, which means time progression and automatic prerequisite handling are first
class concerns.

The other important point is that Dialog identifies a small set of core actions that are actually capable of modifying
the world. Many other actions simply reveal information or divert into one of the core actions.

### What does not map cleanly

Dialog still assumes a parser-based authored world and does not solve LLM-driven materialization. Its action values are
closer to stylized parser output than to the kind of richer structured hints MyRealmsAI may eventually need.

### What MyRealmsAI should steal

- actions as explicit data, not prose
- a small set of core world-mutating operations
- time/tick progression as part of action handling
- prerequisite actions treated as system behavior, not narration tricks

### Translation to MyRealmsAI

Dialog suggests that MyRealmsAI may benefit from having many apparent player intents collapse into a smaller set of real
engine mutations.

That does not mean reducing the world to a tiny verb list. It means recognizing that the engine's real work may be
built from a smaller mutation grammar:

- create
- move
- damage
- heal
- open
- close
- equip
- unequip
- set or change values
- add or remove states

The parser can remain expressive while the engine stays compact.

## TextWorld

### What it does well

TextWorld is the clearest example of explicit symbolic world state and legal action application.

Its logic layer models:

- State: the current facts of the world
- Rule: preconditions and postconditions
- Action: an instantiated rule applied to a state

It can enumerate all applicable actions in a state, check whether an action is applicable, and apply an action only if
the preconditions hold.

This is the most directly relevant example of text-game state as formal truth rather than prose memory.

### What does not map cleanly

TextWorld is oriented toward symbolic logic and benchmarkable interactive fiction environments. It is cleaner than most
production games because it lives closer to planning formalisms.

MyRealmsAI likely does not want to live as pure symbolic predicate logic in day-to-day engine authoring.

### What MyRealmsAI should steal

- action legality as explicit preconditions
- action success producing concrete postconditions
- state queried as facts rather than by prose interpretation
- deterministic application of actions to state

### Translation to MyRealmsAI

TextWorld suggests a good discipline for the engine even if the final implementation is not predicate-based:

- every action should have explicit preconditions
- every successful action should emit explicit state deltas
- "can this happen" should be answerable from current state
- "what changed" should be representable without narration

This is especially relevant for creation/materialization. A materialization request should behave like an action with
preconditions and postconditions:

- preconditions: can this blueprint exist here, now, under these constraints
- postconditions: this concrete object now exists with these exact values

## Evennia

### What it does well

Evennia is less useful for parser/action logic and more useful for persistence architecture.

Its docs draw a useful line between in-world objects and non-physical systems. Objects, rooms, characters, and exits are
persistent game entities. Scripts are long-lived out-of-character systems that store data and can run timers.

This is a valuable reminder that not every game system should pretend to be a physical object.

### What does not map cleanly

Evennia is a MUD framework, not a deterministic single-action text RPG engine with LLM mediation. Its object model is
also broader and more inheritance-driven than what MyRealmsAI currently wants.

### What MyRealmsAI should steal

- persistence as a first-class concern
- clear separation between world objects and support systems
- time and periodic systems treated as explicit engine responsibilities

### Translation to MyRealmsAI

Evennia is useful as a warning and a guide:

- keep real world entities as real entities
- do not force every system into an entity
- background systems such as timers, weather, or combat trackers may need their own engine-side structures

This should not push MyRealmsAI into a large framework design now, but it is a good constraint for future growth.

## Comparison Summary

### The common pattern

Across these systems, the durable pattern is:

- parse or construct an action
- validate it against world truth
- mutate state only if valid
- report the result after mutation

### The main difference from MyRealmsAI

Traditional systems assume the parser is deterministic authored code working against a mostly pre-authored world.

MyRealmsAI instead wants:

- free-form player language
- an LLM intent parser
- engine-owned deterministic truth
- engine-approved materialization of new entities and lore
- narrator obedience to resolved truth

That means the parser-engine boundary matters more here than in older systems.

## What I Learned For MyRealmsAI

### 1. The engine should not be a prose reasoner

Every useful system separates language handling from world mutation somehow. Even when the parser and engine live in the
same codebase, they still distinguish player interpretation from actual state change.

This strongly supports the current project rule that the engine should not care about words.

### 2. Action staging matters more than ontology perfection

The old systems are not powerful because they found a perfect world schema. They are powerful because they separate:

- interpretation
- validation
- mutation
- reporting

That is a better place to invest discipline than trying to invent a universal entity ontology too early.

### 3. Preconditions and rejection are essential

TextWorld and TADS both reinforce the same point: actions need explicit legality checks before mutation.

For MyRealmsAI, this means materialization should be treated as a formal engine action, not a narration convenience.

### 4. A small mutation grammar can support broad play

Dialog's distinction between many player expressions and a smaller set of core world-changing actions is useful.

The player can say anything. The parser can interpret richly. But the engine may still only need a compact set of
deterministic mutation verbs.

### 5. Persistence architecture matters as much as action logic

Evennia is the reminder that long-lived state and timed systems are part of the problem, not an afterthought.

Because each session is a campaign in MyRealmsAI, persistence is part of physics.

## A Good Translation For MyRealmsAI

The strongest hybrid I see is:

1. Player input arrives as unrestricted language.
2. Parser LLM emits structured engine-readable action data.
3. Engine validates blueprint choice, targets, legality, and preconditions.
4. Engine either rejects in full or commits deterministic state mutations.
5. Narrator LLM describes only committed truth.

Under that model:

- Inform contributes staged action handling
- TADS contributes legality vs interpretation separation
- Dialog contributes actions as explicit data plus compact world-mutating verbs
- TextWorld contributes preconditions, postconditions, and state-as-facts discipline
- Evennia contributes persistence and separation of world entities from support systems

## What Not To Copy

- do not copy traditional parser ambiguity loops
- do not copy giant inherited object hierarchies
- do not copy systems that let narration stand in for state
- do not force every background system to masquerade as a physical object
- do not let the engine repair bad parser choices by guessing

## Conclusion

The research does not suggest a ready-made engine to import.

It does suggest that the right path is not inventing totally new laws of text-game physics. The right path is combining
well-proven action-state patterns with your stricter LLM boundary:

- language outside the engine
- deterministic truth inside the engine
- explicit legality before mutation
- persistent consequences after mutation
