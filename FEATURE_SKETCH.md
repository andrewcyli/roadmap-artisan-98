# Roadmap Artisan 98 — Feature Sketch
## Marketing Campaign Planning Tool

---

## Core Philosophy

**"Information-packed, never cluttered"**

- Every pixel has purpose
- Smart defaults, powerful customization
- Quick capture → deep refinement workflow
- Always presentation-ready

---

## 🧠 Feature 1: The Backlog / Ideas Pool (TBC Area)

### Concept
A dedicated space for "ideas not yet scheduled" — marketing concepts, campaign themes, tactics that need to exist but don't have dates yet.

### UX Pattern
```
┌─────────────────────────────────────────────────────────┐
│  💡 IDEAS POOL                    [+ Quick Add]        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Q3 Product  │  │ Influencer  │  │ Holiday     │      │
│  │ Launch      │  │ Campaign    │  │ Flash Sale  │      │
│  │             │  │             │  │             │      │
│  │ #product    │  │ #social     │  │ #promo      │      │
│  │             │  │             │  │             │      │
│  │ [Drag to    │  │ [Drag to    │  │ [Drag to    │      │
│  │  timeline]  │  │  timeline]  │  │  timeline]  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                         │
│  [Filter: All ▼]  [Sort: Recent ▼]  [View: Grid ▼]     │
└─────────────────────────────────────────────────────────┘
```

### Key Behaviors
- **Quick Add**: `Cmd/Ctrl + N` or click "+" → type idea name → Enter → card created
- **Drag to Timeline**: Grab any idea card, drop onto timeline → auto-assigns dates
- **Smart Suggestions**: "This idea is similar to [Existing Plan] — group them?"
- **Idea Templates**: "Product Launch", "Social Campaign", "Email Series" — pre-filled structure

### Card States
| State | Visual |
|-------|--------|
| Raw Idea | Ghosted, minimal border |
| Has Description | Subtle fill, icon indicator |
| Has Assets | Thumbnail preview |
| Ready to Schedule | Highlighted, "Schedule" CTA |

---

## 📅 Feature 2: The Timeline Canvas

### Layout Principles

#### Swimlane Architecture
```
┌────────────────────────────────────────────────────────────┐
│                    Q1 2026    Q2 2026    Q3 2026          │
├──────────┬─────────────────────────────────────────────────┤
│ 📱 Social│ [Post Series]    [Influencer]                   │
│          │  Jan 15-30        Apr 1-15                     │
├──────────┼─────────────────────────────────────────────────┤
│ 📧 Email │     [Newsletter]      [Product]                  │
│          │      Feb 1            May 1                    │
├──────────┼─────────────────────────────────────────────────┤
│ 💰 Paid  │         [Retargeting]                           │
│          │          Mar 1-Apr 30                           │
├──────────┼─────────────────────────────────────────────────┤
│ 🎪 Events│              [Trade Show]                       │
│          │               Jun 15-17                          │
└──────────┴─────────────────────────────────────────────────┘
```

### Anti-Overlap System

**The Problem**: Plans overlap visually → cluttered mess

**The Solution**: Smart Stacking Algorithm

```
BEFORE (Cluttered):
│ [Plan A] [Plan B] [Plan C]  ← overlapping, unreadable
│

AFTER (Smart Stack):
│ ┌─────────┐
│ │ Plan A  │
│ ├─────────┤
│ │ Plan B  │ ← auto-stacked when overlap detected
│ ├─────────┤
│ │ Plan C  │
│ └─────────┘
```

**Rules**:
1. Same swimlane + overlapping dates = vertical stack
2. Max 3 items in stack before "+2 more" expander
3. Related plans (same campaign) = connected with subtle line
4. Hover stack → expand to show all

### Zoom Levels
| Level | Use Case |
|-------|----------|
| Year | Annual planning, board presentations |
| Quarter | Campaign overview, team alignment |
| Month | Detailed planning, resource allocation |
| Week | Execution phase, daily standups |

---

## 🏷️ Feature 3: Smart Grouping & Relationships

### Visual Grouping

**Campaign Clusters**: Plans that belong together get visual treatment

```
┌─────────────────────────────────────────────────────────┐
│  🎯 SPRING PRODUCT LAUNCH                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Teaser      │──│ Launch      │──│ Follow-up   │      │
│  │ Campaign    │  │ Campaign    │  │ Campaign    │      │
│  │ (Social)    │  │ (Multi)     │  │ (Email)     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│       Mar 1-15       Apr 1-7         Apr 8-30          │
└─────────────────────────────────────────────────────────┘
```

**Visual Cues**:
- Shared color theme (subtle gradient across group)
- Connector lines between related plans
- Group label floats above cluster
- Collapse/expand group

### Relationship Types
- **Sequence**: Plan A → Plan B (dependencies)
- **Campaign**: Multiple plans, one objective
- **Channel**: Same plan across channels (synced dates)
- **Milestone**: Key dates that anchor other plans

---

## 🎨 Feature 4: Presentation-First Design

### Always-Ready Modes

**1. Edit Mode** (Full features)
- All controls visible
- Drag-drop enabled
- Inline editing

**2. Review Mode** (Clean)
- Hide all chrome
- Show only timeline + plans
- Comments/annotations visible

**3. Presentation Mode** (Board-ready)
- Full screen
- No UI chrome
- Optimized for screenshot/projector
- Click plan → show details overlay

### One-Click Export

| Format | Use Case |
|--------|----------|
| PNG | Slack, quick share |
| PDF | Board deck, email |
| PPT | Executive presentation |
| Excel | Data handoff, finance |

**Export Options**:
- Current view only vs. Full timeline
- With/without swimlane labels
- With/without plan details
- Custom date range

---

## ⚡ Feature 5: Frictionless Input

### Quick Capture Everywhere

**Global Hotkey**: `Cmd/Ctrl + Shift + N`
```
┌─────────────────────────────────┐
│  + New Plan                      │
│  ─────────────────────────────── │
│  Name: [____________________]    │
│                                  │
│  [Add to Timeline]  [Save to     │
│                      Ideas]      │
└─────────────────────────────────┘
```

**Inline Creation**: Click empty space on timeline → type → Enter → plan created

**Smart Defaults**:
- Name → auto-suggests based on channel + date
- Duration → remembers last similar plan
- Color → channel-based auto-assign
- Labels → inherits from swimlane

### Progressive Disclosure

**Level 1: Card View** (Always visible)
- Plan name
- Date range
- Channel icon
- Status dot

**Level 2: Hover** (Quick peek)
- Brief description
- Owner avatar
- Key metrics preview

**Level 3: Click** (Full detail)
- Complete form
- Assets & attachments
- Comments & activity
- Related plans

**Level 4: Expand** (Deep dive)
- Full campaign view
- All related plans
- Timeline dependencies
- Resource allocation

---

## 🏷️ Feature 6: Intelligent Tagging & Organization

### Label System

**Swimlane Labels** (Primary organization)
- Channel: Social, Email, Paid, Events, PR, Content
- Team: Creative, Performance, Brand, Product
- Region: APAC, EMEA, Americas
- Custom: User-defined

**Plan Labels** (Secondary)
- Status: Draft, Review, Approved, Live, Completed, Paused
- Priority: P0, P1, P2, P3
- Campaign: Product Launch, Brand Campaign, Always-On
- Custom: User-defined

### Auto-Tagging
- "Product Launch" in name → auto-tag #product
- Date in Q4 → auto-tag #holiday (if contains holiday keywords)
- Owner is Performance team → auto-tag #paid

---

## 🎯 Feature 7: Management-Ready Views

### Pre-built Views

**1. The Board Deck**
- Year view
- Campaign clusters highlighted
- Key milestones marked
- Clean, minimal text

**2. The Team Standup**
- Month view
- Owner avatars visible
- Status colors prominent
- Blockers highlighted

**3. The Resource Plan**
- Quarter view
- Team swimlanes
- Workload indicators
- Conflict warnings

**4. The Channel Plan**
- Channel swimlanes
- Content calendar style
- Asset thumbnails
- Publish dates

---

## 🔄 Feature 8: Workflow States

### Plan Lifecycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  IDEA   │ →  │  DRAFT  │ →  │ REVIEW  │ →  │APPROVED │ →  │  LIVE   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     ↓              ↓              ↓              ↓              ↓
  [Ideas       [Timeline      [Comments     [Ready to     [Executing
   Pool]         visible]       enabled]      execute]      / Done]
```

### Visual State Indicators
- **Idea**: Dotted border, ghosted
- **Draft**: Solid border, muted color
- **Review**: Yellow accent, "pending" badge
- **Approved**: Green accent, checkmark
- **Live**: Full color, pulse animation
- **Completed**: Grayscale, checkmark
- **Paused**: Red accent, "paused" badge

---

## 🛠️ Implementation Notes

### Tech Considerations
- **Collision Detection**: Use existing libraries or custom overlap algorithm
- **Drag & Drop**: react-dnd or @dnd-kit
- **Zoom/Pan**: Custom implementation with CSS transforms
- **Export**: html2canvas for PNG, jsPDF for PDF, pptxgenjs for PPT (already in deps)

### Performance
- Virtualize timeline for large datasets
- Lazy load plan details
- Debounce drag operations
- Optimistic UI updates

---

## Next Steps

1. **Prioritize**: Which features are MVP vs. v2?
2. **Wireframe**: Detailed mockups of key interactions
3. **Prototype**: Build one feature end-to-end
4. **Test**: Get feedback from actual marketing users

---

*Sketch v1.0 — March 2026*
