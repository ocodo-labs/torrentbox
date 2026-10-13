# Engineering Method: Curatorial Modular Design

Approach software design as a process of **curation, organization, and deliberate refinement**, not as the mechanical application of prescribed architectural patterns.

## Foundational principle

The system's design is inherent in the problem domain, its responsibilities, and the relationships between its parts. The engineer's task is to discover and express that structure through informed judgment.

Do not force the system into a predetermined template. Equally, do not mistake the absence of a template for the absence of design. Every structural change should be intentional and justified by an improved understanding of the system.

## Finding the boundaries

Determine where modular boundaries belong by examining:

- **Cohesion:** Which elements naturally belong together because they contribute to a coherent responsibility?
- **Independent change:** Which decisions can evolve independently and should therefore be encapsulated separately?
- **Coupling:** Which dependencies are necessary, and which arise from responsibilities that have been incorrectly combined?
- **Information hiding:** Which implementation decisions should remain local to a module rather than propagate through the system?
- **Comprehensibility:** Does the proposed decomposition make the system easier to understand, modify, test, and maintain?

The central question is not simply how to separate concerns, but **where to make the cuts**.

## The Goldilocks criterion

Avoid both extremes.

- **Too coarse:** Unrelated responsibilities and independent design decisions become entangled.
- **Too fine:** Excessive decomposition creates unnecessary interfaces, indirection, coordination, and fragmentation of cohesive behavior.
- **Appropriate decomposition:** Each boundary represents a meaningful responsibility or encapsulated design decision and provides a tangible benefit to the system.

Do not use file size, line count, function count, or module count as primary measures of design quality. Judge boundaries by the relationships between responsibilities and the consequences of change.

## SRP as a consequence of design

The Single Responsibility Principle follows naturally from sound modular decomposition. It is not a mechanical instruction to create a separate module for every operation or task.

A responsibility is a coherent area of behavior and decision-making, not necessarily a single function. Group elements that belong together; separate them when doing so establishes a meaningful boundary and allows independent evolution.

SRP is a property of good decomposition, not a recipe for producing it.

## Pruning as curation

Treat refactoring as the ongoing curation of an existing system.

- Preserve useful behavior and existing capabilities.
- Improve organization without removing functionality merely to simplify a file.
- Relocate responsibilities when their current placement obscures the design.
- Introduce abstractions when the system's structure warrants them, not because a methodology prescribes them.
- Avoid speculative architecture and unnecessary indirection.
- Recognize that sometimes the correct decision is to leave existing code untouched.

Pruning means cultivating the system's structure, not indiscriminately cutting it down.

## Working method

1. Understand the existing system and its behavioral contracts before changing it.
2. Identify the responsibilities, relationships, and design decisions already present.
3. Determine which boundaries would improve coherence, encapsulation, and independent change.
4. Make the smallest structural change that meaningfully improves the design.
5. Preserve observable behavior unless a behavior change is explicitly requested.
6. Verify the change and reassess the resulting structure.
7. Continue incrementally as understanding develops.

Do not impose a fixed sequence of architectural transformations. Let the actual problem and the evidence in the code determine the next step.

## When modifying an existing codebase

Before moving or rewriting code, establish what it does, what depends on it, and which behavior must remain intact. Distinguish genuine structural improvements from cosmetic rearrangement.

For each proposed module boundary, ask:

**If this responsibility changes, what else should have to change?**

If unrelated concerns must change together, investigate whether the boundary is too coarse. If understanding one cohesive behavior requires navigating unnecessary abstractions and fragmented modules, investigate whether the boundary is too fine.

Stop decomposing when further separation no longer produces a meaningful improvement.

## Expected engineering behavior

Act as a thoughtful engineering collaborator, not an architecture-template generator.

Explain structural decisions in terms of the responsibilities and dependencies of the actual system. Surface potential violations of separation of concerns before implementing them. Prefer a few well-justified boundaries over a proliferation of abstractions.

Do not equate smaller files with better design, more modules with greater modularity, or compliance with named principles with architectural quality.

**The objective is an intelligible, cohesive, adaptable system whose structure reflects the problem it solves. Design is deliberate; the boundaries are discovered through understanding; SRP follows from the decomposition; and pruning continuously improves the organization while preserving the system's useful capabilities.**
