# PROTOTYPE_PACKAGE.md

## Purpose
Define three prototype directions against one locked v1 scope. These are not three different products. They are three different emphases over the same product definition.

Shared scope across all prototypes:
- marketing teams
- team planning
- full-year default horizon
- campaign-type swimlanes by default
- ideas/TBC pool
- campaign grouping
- PNG/PDF export
- lightweight sharing
- setup presets A/B/C
- blank year or sample populated year

## Non-negotiable shared mechanics
Every prototype must use the same:
- core object model from `PRODUCT_SPEC_V1.md`
- setup choices
- export requirements
- single-editor-first collaboration posture
- anti-overlap rules
- campaign group semantics

## Prototype 1 — Executive Canvas
### Job to win
Make annual planning and management review feel exceptionally clean.

### Primary user moment
Team lead or head of marketing reviewing the annual plan with stakeholders.

### Design emphasis
- strongest whitespace
- quiet chrome
- subtle campaign group framing
- highly legible year view first
- minimal metadata shown on cards

### What feels different
- review/presentation posture is the natural default feel
- side panel is subdued and secondary
- filters exist but stay lightweight
- export mode should feel almost identical to on-screen review mode

### Strengths
- strongest presentation readiness
- easiest executive scan
- most differentiated visual polish

### Risks
- could feel too sparse for operators
- can hide useful planning metadata if over-minimized

### Must prove in prototype
- annual view stays highly legible with real campaign density
- group boundaries read clearly without visual noise
- export looks board-ready with little or no cleanup

## Prototype 2 — Planner Pro
### Job to win
Give teams the clearest working planning environment without drifting into PM-tool heaviness.

### Primary user moment
Marketing manager actively shaping, editing, and aligning the plan with teammates.

### Design emphasis
- balanced density
- stronger visible filters
- clearer owner/status signals
- detail panel more present
- faster editing workflow on the canvas

### What feels different
- most utility-forward option
- metadata is more visible, but still constrained
- interactions prioritize speed over minimalism

### Strengths
- likely strongest day-to-day planning utility
- easiest bridge from planning into operational alignment
- safest option for frequent editing

### Risks
- easiest direction to accidentally become PM software
- visual density may hurt export cleanliness if not tightly controlled

### Must prove in prototype
- metadata remains readable without clutter
- planner speed improves meaningfully versus Executive Canvas
- UI stays marketing-native rather than work-management-native

## Prototype 3 — Strategy Studio
### Job to win
Own the fuzzy-front-door workflow from idea capture to structured campaign plan.

### Primary user moment
Team workshop or planning session where rough concepts are being shaped into a year plan.

### Design emphasis
- strongest ideas rail
- clearer distinction between unscheduled ideas and scheduled plan items
- campaign shaping before dates are final
- more expressive grouping and planning transitions

### What feels different
- entry into the product starts with idea formation, not timeline editing
- conversion from idea to plan is more central and more guided
- the product feels slightly more collaborative/discussion-oriented without requiring real-time multiplayer

### Strengths
- best support for early-stage planning
- strongest differentiation from rigid calendars and PM tools
- most aligned with fuzzy-first planning principle

### Risks
- can become concept-heavy if the timeline feels secondary
- annual review clarity may be weaker than Executive Canvas

### Must prove in prototype
- idea-to-schedule flow is materially better than the other two directions
- timeline discipline remains strong after ideation
- users do not get stuck in the backlog state

## Comparison summary
### Executive Canvas
Best at:
- review
- export
- annual storytelling

### Planner Pro
Best at:
- active editing
- visibility of status/owner/filtering
- day-to-day utility

### Strategy Studio
Best at:
- idea capture
- workshop planning
- shaping campaigns before dates lock

## Recommendation
Preferred direction to take forward after prototype review:
- visual cleanliness from Executive Canvas
- editing clarity from Planner Pro
- fuzzy-front-door flow from Strategy Studio

In practice this means the prototype package should be used to isolate tradeoffs, then converge into one hybrid v1 direction rather than treating the three concepts as competing scopes.

## Deliverables expected from design
For each prototype:
1. project setup flow
2. default year view
3. ideas-to-schedule interaction
4. overlap stack state
5. campaign-group visual treatment
6. export/review mode frame

## Evaluation rubric
Score each prototype 1-5 against:
- annual planning clarity
- team planning utility
- export readiness
- idea capture quality
- resistance to PM-tool creep
- ease of understanding on first use

## Lane handoff recommendations
### Researcher
- gather examples of how real marketing teams structure annual campaign calendars
- identify what metadata they truly need visible on-canvas vs hidden
- validate whether ideas/TBC areas are persistent or session-based in practice

### Designer
- create the 3 prototype directions on a shared component system
- keep identical data payloads across all prototype screens
- show one realistic populated example, not only idealized sparse states

### Builder
- prepare a technical feasibility memo, not full build
- assess rendering and export tradeoffs for the 3 directions
- identify whether one design direction materially reduces implementation risk

### Auditor
- pressure-test each direction using realistic crowded-year scenarios
- call out any direction that becomes unreadable, PM-like, or export-fragile
