# Marketing Canvas — Discovery, Competitive Review, and Scope Proposal

## 1) Project Intent (reframed)

This is **not** another project-management tool.

The product intent is:
- help marketing teams **shape campaign plans fast**
- keep planning artifacts **visually neat, presentation-ready, and executive-friendly**
- support both **early fuzzy ideas** and **structured campaign timelines**
- make it easier to move from **idea → plan → review deck** without rebuilding slides manually

Core job to be done:
> "Help me turn rough campaign ideas into a clear, tidy, management-ready plan without the clutter and overhead of PM software."

## 2) What we already know

From earlier direction, the strongest product truths are:
- it is **more about planning than project management**
- the UI must feel **slick and aesthetically controlled**
- plans should **not visually overlap in a messy way**
- related plans should be **grouped clearly**
- users need a **TBC / ideas area** for concepts without dates
- users must be able to **input quickly first, enrich later**
- the output should be suitable for **management proposals and presentations**

## 3) Competitive review

Research source note:
- live search tooling was limited, so review was done primarily from official product pages and current product positioning pages.
- checked official pages from CoSchedule, Airtable, monday.com, Notion Calendar, Productboard, TeamGantt, and Smartsheet.

### A. CoSchedule Marketing Calendar
**Strengths**
- clearly positioned for marketing teams
- strong content/social/email/event planning framing
- calendar-centric organization
- useful for integrated campaign scheduling

**Weaknesses for our opportunity**
- feels more like a marketing operations calendar than a high-end campaign planning canvas
- execution/scheduling emphasis is stronger than strategic layout elegance
- less differentiated around executive storytelling / proposal readiness

**Takeaway**
Competes directly on marketing planning language. We should borrow:
- marketing-native terminology
- integrated campaign view
- calendar + campaign organization

But differentiate on:
- cleaner visual hierarchy
- idea-to-plan workflow
- boardroom-ready outputs

### B. Airtable
**Strengths**
- extremely flexible relational structure
- many views on shared data
- good for cross-team planning and asset relationships
- scales well organizationally

**Weaknesses for our opportunity**
- blank-canvas problem for normal marketing users
- configuration burden is high
- visually powerful, but not inherently elegant by default

**Takeaway**
Airtable wins on flexibility, loses on guided elegance.
We should borrow:
- flexible metadata model
- multi-view architecture
- shared source of truth

But provide:
- opinionated defaults
- better visual polish out of the box
- less setup burden

### C. monday.com
**Strengths**
- strong work management / campaign coordination positioning
- timelines, dashboards, automations, resource planning
- broad operational power

**Weaknesses for our opportunity**
- drifts into work-management heaviness quickly
- visual density can become operational rather than strategic
- can feel like software for running work, not selling the plan

**Takeaway**
monday is strong for execution operating systems.
Our product should avoid becoming "another operational dashboard".

### D. Notion Calendar / Notion ecosystem
**Strengths**
- elegant, simple, low-friction feel
- good time visibility and lightweight planning behavior
- integrates nicely into knowledge workflows

**Weaknesses for our opportunity**
- weak as a campaign planning canvas
- limited structured timeline storytelling
- not strong enough for grouped campaign architecture / presentation views

**Takeaway**
Borrow:
- low-friction interaction
- calm, polished UI feel

Do not stop there:
- we need stronger visual planning semantics
- we need campaign grouping and plan architecture beyond a calendar

### E. Productboard / Aha / roadmap tools
**Strengths**
- excellent at roadmap structure
- configurable views for different stakeholders
- strong hierarchy and prioritization models

**Weaknesses for our opportunity**
- oriented to product teams, not marketers
- often strategic but not visually delightful
- many are too abstract or too enterprise-heavy for campaign planning

**Takeaway**
Borrow:
- hierarchy: objectives → initiatives → items
- stakeholder-specific views
- synced roadmaps

Translate it into marketing language:
- objective → campaign theme
- initiative → campaign group
- item → channel plan / tactic / milestone

### F. TeamGantt / Smartsheet
**Strengths**
- timeline, dependencies, resource planning, clarity
- useful for schedule-driven execution

**Weaknesses for our opportunity**
- too PM-like for the emotional/aesthetic use case here
- timeline often reads as work breakdown rather than campaign narrative

**Takeaway**
Borrow:
- drag-and-drop schedule clarity
- dependency and sequencing mechanics

Avoid:
- construction-project feel
- spreadsheet-with-bars aesthetic

## 4) Strategic product gap

The gap is:

### Existing tools split into 3 camps
1. **Marketing calendars** → useful but operational and channel-centric
2. **Work management tools** → powerful but too heavy
3. **Roadmap/database tools** → flexible but not marketing-native or presentation-first

### Our opening
Create a **marketing planning canvas** that sits between:
- lightweight ideation
- structured timeline planning
- polished management communication

That combination is still under-served.

## 5) Product principles to lock

### Principle 1: Planning-first, not task-first
This product should focus on:
- campaigns
- initiatives
- channel rollout
- milestone sequencing
- narrative clarity

It should not lead with:
- subtasks
- assignee-heavy PM flows
- ticket management

### Principle 2: Presentation quality is a core feature
Not a nice-to-have.
The system must naturally produce layouts that are:
- clean
- understandable
- screenshot-friendly
- export-friendly

### Principle 3: Fuzzy-first workflow
Marketers often start with:
- a campaign idea
- a launch thought
- a seasonal concept
- a channel burst idea

The product must support:
- rough capture with low friction
- later scheduling and structuring

### Principle 4: High information density without visual clutter
We should pursue:
- safe spacing rules
- constrained card anatomy
- progressive disclosure
- intelligent overlap handling

## 6) Refined product spec proposal

## Core object model

### A. Idea
Unscheduled concept
- title
- short note
- tags
- related campaign/group
- suggested channel(s)
- status: idea / shortlisted / scheduled / dropped

### B. Plan item
Scheduled item on timeline
- title
- start/end
- channel / swimlane
- owner
- status
- tags
- linked campaign group
- notes

### C. Campaign group
Parent grouping object
- campaign name
- objective
- date range
- color
- related plan items
- summary note

### D. Milestone
Anchor date
- title
- date
- type: launch / review / approval / event / deadline

## 7) Recommended MVP scope

### MVP must-have
1. **Ideas pool / TBC board**
2. **Timeline canvas with swimlanes**
3. **Campaign grouping / parent-child plan structure**
4. **Auto anti-overlap stacking**
5. **Quick add flow**
6. **Detail side panel for editing**
7. **Views: Month / Quarter / Half-year**
8. **Presentation mode**
9. **PNG/PDF export**
10. **Clean color system + card anatomy rules**

### MVP should-have
11. filters by channel / owner / status / campaign
12. milestone markers
13. duplicated plan creation / templates
14. comments or notes field
15. saved views

### Not MVP yet
- full task management
- automation engine
- approvals workflow
- advanced analytics dashboards
- deep DAM integrations
- full resource management
- social publishing integrations
- AI strategy generation

## 8) UX recommendations

### Layout recommendation
Use a 3-zone structure:
1. **Ideas rail / backlog** (left or top collapsible)
2. **Main planning canvas** (center)
3. **Details / metadata panel** (right)

### Card anatomy recommendation
Visible by default:
- title
- date span
- channel marker
- status indicator
- group color

Visible on hover/open:
- summary
- owner
- tags
- metrics/notes

### Anti-clutter rules
- fixed padding rules for every card
- max visible metadata chips on card = 2
- overflow rolls into details panel
- stacked overlaps collapse after 3 visible rows
- group containers use subtle boundaries, not heavy borders

### Grouping recommendation
Primary grouping unit should be **campaign group**, not just channel.
Channels are the swimlanes.
Campaign groups span across lanes.
That is closer to how marketers think.

## 9) Three prototype directions to compare before build

### Prototype A — Executive Canvas
Best for:
- management review
- annual / quarterly campaign planning
- clean storytelling

Characteristics:
- minimal chrome
- strong whitespace
- subtle typography
- elegant grouped campaign frames

Risk:
- may under-serve operators if too sparse

### Prototype B — Planner Pro
Best for:
- marketing operations users
- teams needing more visible metadata
- planning + coordination balance

Characteristics:
- denser cards
- stronger filters
- clearer status and owner signals
- structured but still polished

Risk:
- can drift toward PM-tool feel if overdone

### Prototype C — Strategy Studio
Best for:
- ideation + strategic planning
- early campaign shaping
- collaborative discussion

Characteristics:
- stronger ideas pool
- flexible grouping visuals
- visual hierarchy between idea / plan / campaign
- slightly more expressive UI

Risk:
- can become too concept-heavy unless timeline discipline is maintained

## 10) Recommendation before build

My recommendation is:
- **lock the data model first**
- **choose one primary user and review moment**
- **build 3 research-backed prototypes around the same underlying spec**

### Most likely winning product posture
A hybrid of:
- **Prototype A visual cleanliness**
- **Prototype B clarity and control**
- **Prototype C fuzzy-front-door ideation**

## 11) Scope lock questions for Andrew

Before build, we should lock these:

1. **Primary user**
   - marketing manager
   - brand manager
   - head of marketing
   - agency account/project lead

2. **Primary review moment**
   - self-planning
   - team planning
   - leadership review
   - board/management presentation

3. **Default planning horizon**
   - quarter
   - half-year
   - year

4. **Primary swimlane dimension**
   - channel
   - business unit
   - campaign type
   - market/region

5. **Must-have export**
   - PNG only
   - PDF
   - PowerPoint

6. **Should MVP support collaboration now or later?**
   - single-user first
   - lightweight shared review
   - full multi-user collaboration

## 12) Scope decisions locked with Andrew

### Locked decisions
- **Primary user:** marketing teams
- **Primary review moment:** team planning
- **Default planning horizon:** full year
- **Default swimlane dimension:** campaign types
- **Mandatory export for v1:** PNG and PDF
- **Collaboration model for v1:** lightweight sharing

## 13) Locked v1 product definition

### Product statement
A **marketing planning canvas** for annual and quarterly team planning that helps marketing teams turn rough campaign ideas into neat, structured, presentation-ready plans.

### Primary use case
A marketing team is planning the year across campaign types and needs:
- a full-year visual plan
- a clean place for tentative ideas
- grouped campaign planning across the timeline
- exportable outputs for review and circulation

### Default information architecture
- **Primary canvas horizon:** full year
- **Primary swimlanes:** campaign types
- **Default campaign-type set:** Classic marketing mix (A)
- **Secondary metadata:** channel, owner, status, tags, notes
- **Supporting zone:** ideas/TBC pool

### Campaign-type presets at project creation
Users should choose a starting preset when creating a project:
- **Preset A — Classic marketing mix**
  - Brand
  - Product launch
  - Seasonal
  - Promo
  - Content
  - Always-on
- **Preset B — Channel-led planning**
  - Social
  - CRM / Email
  - Paid
  - PR
  - Events
  - Partnerships
- **Preset C — Strategy-led planning**
  - Awareness
  - Acquisition
  - Engagement
  - Conversion
  - Retention
  - Advocacy

For v1:
- default selection is **Preset A**
- user can choose A / B / C during project setup
- custom user-defined preset creation can come after v1

### Starting template choice at project creation
Users should choose one of:
- **Blank year**
- **Sample populated year**

Decision locked:
- v1 should offer **choose blank or sample** during project creation

### Collaboration posture for v1
Not true multiplayer editing yet.
Instead:
- shareable read/review links
- comment-light or note-light review behavior later if needed
- single-editor / low-complexity collaboration posture for initial build

## 14) Implications for prototype design

### Prototype A — Executive Canvas
Should optimize for:
- annual planning clarity
- clean swimlane/year layout
- tidy campaign grouping
- review-friendly export quality

### Prototype B — Planner Pro
Should optimize for:
- team planning utility
- richer metadata visibility
- easier filtering by type/status/owner
- operational clarity without becoming PM-heavy

### Prototype C — Strategy Studio
Should optimize for:
- TBC ideas to scheduled plan workflow
- exploratory planning at the top of funnel
- flexible grouping and campaign shaping before dates are final

## 15) Proposed next step

Now that scope is locked:
1. convert this into a tighter v1 feature spec
2. define shared object model + interaction rules
3. design 3 prototypes against the same locked scope
4. review with Andrew before implementation build

Only then build.
