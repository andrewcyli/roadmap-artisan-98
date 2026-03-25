# PRODUCT_SPEC_V1.md

## Product
Marketing Canvas

## Version
v1 pre-build product spec

## Product statement
A marketing planning canvas for annual and quarterly team planning that helps marketing teams turn rough campaign ideas into neat, structured, presentation-ready plans.

## Primary user
Marketing teams planning campaigns across a year.

## Primary use case
A team needs to shape a year plan across campaign types, keep tentative ideas visible, group related activity into campaigns, and export a clean planning view for review.

## Scope lock
### In scope for v1
- full-year planning canvas
- campaign-type swimlanes by default
- ideas/TBC pool
- campaign grouping across the timeline
- quick-add and lightweight editing
- overlap-safe layout
- PNG export
- PDF export
- lightweight sharing
- project setup presets A/B/C
- setup choice: blank year or sample populated year

### Explicitly out of scope for v1
- task/subtask management
- advanced dependencies
- automations
- deep analytics
- budget/resource management
- DAM/publishing integrations
- real-time multiplayer editing
- custom preset builder at setup
- PowerPoint export

## Product principles
1. Planning-first, not task-first
2. Presentation quality is a core feature
3. Fuzzy-first capture before structured refinement
4. High information density without visual clutter
5. Marketing-native language over generic PM language

## Core objects
### 1) Project
A planning workspace for one team or planning cycle.

Fields:
- id
- name
- year
- presetType: A | B | C
- startTemplate: blank | sample
- owner
- createdAt
- updatedAt

### 2) Campaign Group
Primary planning object that groups related activity.

Fields:
- id
- projectId
- title
- objective
- summary
- color
- startDate
- endDate
- status: draft | review | approved | live | completed | paused
- tags[]

### 3) Plan Item
A scheduled item rendered on the timeline inside one swimlane.

Fields:
- id
- projectId
- campaignGroupId
- title
- swimlaneKey
- channel
- owner
- status
- startDate
- endDate
- tags[]
- notes

### 4) Idea
An unscheduled concept in the ideas/TBC pool.

Fields:
- id
- projectId
- campaignGroupId (optional)
- title
- note
- suggestedSwimlaneKey
- suggestedChannels[]
- status: idea | shortlisted | scheduled | dropped
- tags[]

### 5) Milestone
A single anchor date displayed on the timeline.

Fields:
- id
- projectId
- campaignGroupId (optional)
- title
- date
- type: launch | review | approval | event | deadline

## Default swimlane presets
### Preset A — Classic marketing mix
- Brand
- Product launch
- Seasonal
- Promo
- Content
- Always-on

### Preset B — Channel-led planning
- Social
- CRM / Email
- Paid
- PR
- Events
- Partnerships

### Preset C — Strategy-led planning
- Awareness
- Acquisition
- Engagement
- Conversion
- Retention
- Advocacy

## Primary views
### Required in v1
- Year view — default
- Quarter view
- Half-year view

### Not required in v1
- Month view
- Week view

## Core screens / surfaces
### 1) Project setup
User chooses:
- project name
- planning year
- preset A/B/C
- blank year or sample populated year

### 2) Main planning workspace
Three-zone layout:
- ideas rail
- timeline canvas
- detail panel

### 3) Export / presentation mode
A cleaned view optimized for screenshot and formal sharing.

## Key interactions
### Quick add
User can create:
- idea in ideas rail
- plan item directly on timeline
- campaign group
- milestone

Requirement:
- title-first creation must be possible in one step
- metadata can be completed later in detail panel

### Ideas to schedule
User drags or converts an idea into a plan item.

Required behavior:
- dropped item inherits target swimlane
- user is prompted for date span if missing
- campaign group link is preserved if already assigned

### Grouping behavior
- campaign groups span multiple plan items
- group identity is visible without heavy borders
- timeline items can belong to one campaign group
- grouping must remain legible in export mode

### Overlap handling
If plan items overlap in the same swimlane:
- items stack vertically
- maximum 3 visible rows before collapse behavior
- collapsed stacks indicate hidden count
- hover or open state reveals all

### Editing behavior
Detail panel supports editing of:
- title
- dates
- swimlane
- campaign group
- owner
- status
- tags
- notes

## Card anatomy
### Timeline card — default visible fields
- title
- date span
- status indicator
- campaign color marker
- one secondary metadata signal only

### Hidden until detail panel / interaction
- full notes
- extra tags beyond limit
- owner details beyond simple indicator

Rule:
- max 2 metadata chips visible on the card face

## Status model
### Plan item / campaign statuses
- draft
- review
- approved
- live
- completed
- paused

### Idea statuses
- idea
- shortlisted
- scheduled
- dropped

## Filters
v1 filters:
- swimlane
- owner
- status
- campaign group
- tags

## Export requirements
### PNG
- export current visible view
- preserve color, spacing, grouping, and milestones

### PDF
- export current visible view
- readable on standard presentation page sizes
- no broken stacking or clipped labels

Export quality bar:
- outputs must be suitable for management review without redesign in slides

## Sharing requirements
Lightweight share only:
- shareable read/review link
- no multi-user simultaneous editing requirement
- comment system is not required for v1

## UX guardrails
- calm, polished visual hierarchy
- avoid dense enterprise dashboard feel
- avoid spreadsheet/Gantt visual language
- campaign groups come before PM-style dependencies
- editing chrome must be removable for clean review/export mode

## Success criteria for prototype-to-build handoff
A builder should be able to implement from this spec once the following are resolved by design/technical planning:
- exact timeline scale behavior across year/quarter/half-year
- final overlap stack interaction
- precise group visual treatment
- export rendering path
- share-link auth/access posture

## Acceptance criteria for v1
1. A user can create a new annual planning project in under 2 minutes.
2. A user can choose preset A/B/C and blank/sample during setup.
3. A user can capture unscheduled ideas without dates.
4. A user can place plan items on a timeline under campaign-type swimlanes.
5. A user can visually group multiple items into one campaign group.
6. Overlapping items do not become unreadable.
7. Year and quarter/half-year views remain legible.
8. A user can export a review-ready PNG or PDF.
9. A shared view can be opened without requiring collaborative editing workflows.

## Open questions intentionally deferred
- whether comments enter v1 or v1.1
- whether milestones are editable inline or panel-only
- whether saved views enter v1 or later

## Final recommendation
Use this document as the build-prep source of truth. Any new feature request should be tested against the core question:

Does this improve campaign planning clarity and presentation readiness without turning the product into project-management software?
