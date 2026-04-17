# Materialization As Engine Action Research

## Purpose

This note focuses on one narrow question:

How should MyRealmsAI treat materialization as a formal engine action rather than as loose narration?

The prior research showed that older text-game systems are strong on action staging, legality, and persistence. This
note narrows that down to object creation, target grounding, and canonization.

## The Core Problem

MyRealmsAI wants the parser LLM to be able to propose new things that are not already authored into the current scene.

Examples:

- a door in a marketplace
- a hidden tunnel
- a fruit cart
- the blacksmith's lost son

The engine must then decide whether that proposal becomes real, deterministic campaign truth.

The research suggests that mature systems rarely solve this exact problem directly. Most of them assume one of two
models:

- the world is mostly pre-authored and actions select among existing objects
- builders or systems spawn objects from prototypes outside ordinary player action flow

MyRealmsAI needs a hybrid of those two models.

## What Existing Systems Actually Offer

## Inform 7, TADS 3, and Dialog

These systems are best at:

- parsing or constructing actions
- resolving ambiguity between known objects
- validating action legality
- mutating state only after validation

They are not primarily designed around player-driven runtime creation of new canonizable objects or lore. They assume a
world that is already mostly authored, with the player's input choosing among existing possibilities.

What they contribute is not direct materialization logic. What they contribute is the rule that object creation, if it
exists, should obey the same action discipline as every other world-changing event:

- explicit request
- explicit legality checks
- explicit mutation
- explicit reporting after the mutation

## TextWorld

TextWorld is useful because it treats actions as formal state transitions with preconditions and postconditions.

That makes it the cleanest conceptual source for materialization. Even if TextWorld is not focused on runtime lore
creation, its logic suggests that materialization should be treated as a normal action:

- preconditions: can this object legally come into existence here and now
- postconditions: this specific object now exists with exact values and world placement

This is the strongest research support for making materialization a real engine verb rather than a side effect of
narration.

## Evennia

Evennia is the most directly useful source for runtime instantiation.

Its prototype/spawner system treats object creation as instantiating concrete objects from structured prototype
definitions. Prototype values can be fixed, generated dynamically, inherited from parent prototypes, or computed at
spawn time.

This does not solve player-intent grounding, but it does strongly support the idea that creation should be:

- template-driven
- validated before creation
- deterministic at the engine layer
- committed as a real persistent object

This is very close to what MyRealmsAI wants structurally, even if the parser side is totally different.

## The Most Important Research Conclusion

There is no strong prior-art example of:

- free-form player language
- LLM parser
- engine-approved lore-bearing materialization
- deterministic persistent canonization

That exact combination appears to be unusual.

The closest useful pattern is therefore not to search for one identical system. It is to combine two proven ideas:

- TextWorld-style action legality and postconditions
- Evennia-style prototype instantiation

## A Good Formal Model For MyRealmsAI

The best translation I see is:

materialization is a first-class engine action

That means the engine should treat creation the same way it treats any other action:

1. receive a structured request
2. validate legality and constructibility
3. instantiate a real object from a strict template
4. commit it to campaign state
5. expose the result for narration

## What The Parser Should Propose

The parser should not create the object. It should propose a materialization request.

That request can contain structured hints such as:

- blueprint type
- suggested descriptors
- suggested role
- suggested tier or quality
- target placement
- intended relation to current scene or actor

The engine then decides whether that request can become deterministic truth.

## What The Engine Must Decide

The engine must answer:

- is this blueprint valid
- can this object exist here
- can all required values be filled deterministically
- does it contradict committed truth
- can it be stored as a real entity with gameplay value

If yes, create it.

If no, reject it in full.

## What Should Not Happen

The research strongly argues against several anti-patterns:

- narration inventing the object before the engine accepts it
- the engine silently downgrading the object to something else
- the engine remapping one blueprint request into a different blueprint
- partial creation where only some requested truth becomes real
- parser-engine debate loops trying to negotiate a close-enough version

Those patterns weaken the engine boundary and blur what became canon.

## Materialization Should Behave Like A Checkable Action

The most useful formalization is:

materialize is not special flavor logic

It is a standard deterministic action with:

- inputs
- preconditions
- generation rules
- rejection rules
- postconditions

That keeps it aligned with the rest of the engine.

## The Strongest Hybrid Pattern

If translated into MyRealmsAI terms, the most promising model looks like this:

1. Player says something that implies a new object, NPC, structure, or lore-bearing element.
2. Parser LLM emits a materialization request with an explicit blueprint type and structured hints.
3. Engine validates whether that blueprint can be instantiated under current truth.
4. Engine either rejects fully or creates a concrete entity with all required values filled.
5. Narrator describes only the accepted result.

This satisfies the current project rules:

- the parser handles words
- the engine handles truth
- creation is deterministic
- canon is persistent
- rejection is full

## What I Learned

### 1. Materialization should be formal, not magical

If new existence matters, it must be represented as a real engine action.

### 2. Materialization is closer to spawning than to parsing

The parser chooses the candidate blueprint and supplies hints, but the engine's job is much closer to a validated spawn
system than to text understanding.

### 3. Lore-bearing creation is acceptable if the engine canonizes it

The older systems do not model this exact case well, but nothing in the research suggests it is wrong. The important
rule is simply that the engine, not narration, decides whether the proposed lore becomes real.

### 4. Preconditions matter here more than anywhere else

Because creation changes existence itself, materialization needs especially strong legality checks.

### 5. Prototype systems are the most practical existing analogy

Evennia's prototypes are the best real-world reference I found for template-driven runtime creation, even though its use
case is different.

## Recommendation

For MyRealmsAI, materialization should be defined as a formal engine action:

- parser selects blueprint type
- parser supplies structured hints
- engine validates
- engine instantiates or rejects
- narrator reports only the outcome

This is the most defensible hybrid between old text-game action models and the LLM-fronted architecture of this project.
