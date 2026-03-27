# PROJECT_STATUS.md

## Marketing Canvas / roadmap-artisan-98

Last updated: 2026-03-25
Owner: Project Operator
Status: PARTIAL — discovery consolidated, scope sharpened, no build claimed

## Verified evidence
- `DISCOVERY_SCOPE.md` reviewed and scope lock extracted
- `FEATURE_SKETCH.md` reviewed and tightened into implementation-ready v1 product spec
- New operational artifacts created:
  - `PROJECT_STATUS.md`
  - `PRODUCT_SPEC_V1.md`
  - `PROTOTYPE_PACKAGE.md`

## Locked scope recommended for final v1
- User: marketing teams
- Primary use: team planning
- Planning horizon: full year by default
- Default swimlanes: campaign types
- Project setup presets: A/B/C campaign-type presets
- Starting mode at setup: blank year or sample populated year
- Export required: PNG + PDF
- Collaboration posture: lightweight share, single-editor-first

## Product stance
This is a marketing planning canvas, not a work-management suite.

What v1 must optimize for:
- fast idea capture
- structured year planning
- clean visual grouping
- presentation-ready outputs
- low-friction sharing

What v1 must avoid:
- task/subtask systems
- heavy assignee workflows
- dependency-heavy PM behavior
- analytics dashboards
- multiplayer editing complexity

## Current artifact state
- Discovery synthesis: VERIFIED
- v1 scope lock: VERIFIED
- implementation-ready product spec: VERIFIED
- prototype package definition: VERIFIED
- design exploration: PLANNED
- build implementation: PLANNED
- QA/audit: PLANNED

## Risks to manage now
1. Product drift into PM software
2. Excess metadata density reducing export cleanliness
3. Prototype exploration diverging from one shared data model
4. Collaboration requests expanding into true multi-user editing too early

## Decisions to hold firm
- Campaign groups are the primary planning object
- Campaign types are swimlanes by default in v1
- Ideas/TBC pool is required in v1
- Export quality is a product feature, not a post-processing add-on
- Same underlying scope across all prototypes; only interaction/visual emphasis changes

## Recommended next delegation
### Researcher
- Validate real marketing-team workflows against the locked v1 scope
- Produce 5-7 evidence-backed planning patterns and failure modes
- Stress-test whether campaign-type swimlanes beat channel-first for annual planning

### Designer
- Create 3 clickable prototype directions from the same spec:
  - Executive Canvas
  - Planner Pro
  - Strategy Studio
- Resolve key UX rules first: setup flow, ideas-to-schedule flow, overlap behavior, export mode

### Builder
- Do not build full app yet
- First produce technical plan for:
  - data model
  - timeline rendering strategy
  - overlap stacking rules
  - export architecture for PNG/PDF
  - share-link posture

### Auditor
- Pre-build audit of scope discipline
- Check prototype concepts and technical plan against:
  - PM-tool creep
  - unclear object model
  - export/readability failure
  - hidden complexity in sharing/editing assumptions

## Operator recommendation
Lock `PRODUCT_SPEC_V1.md` as the working source of truth for v1. Prototype work should branch from that spec without reopening core scope unless Andrew explicitly changes it.
