# Implementation Plan: Enhanced Plan Data Structure and Hierarchical Organization

## Overview
Transform the fixed channel/team structure into a flexible, user-defined label system with hierarchical plan relationships (parent-child) for Gantt-style project management.

---

## Phase 1: New Type Definitions and Data Model

### 1.1 Create Enhanced Type System (`src/types/plan.ts`)

**New Types:**
```typescript
// Label Types - user can create custom types
export interface LabelType {
  id: string;
  name: string;           // e.g., "Campaign", "Channel", "Business Unit"
  pluralName: string;     // e.g., "Campaigns", "Channels", "Business Units"
  icon?: string;          // lucide icon name
  color: string;
}

// Individual Label within a type
export interface Label {
  id: string;
  typeId: string;         // references LabelType
  name: string;           // e.g., "Social Media", "Q1 Launch"
  color: string;
  order: number;
}

// Updated Plan interface
export interface Plan {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  color: string;
  
  // Flexible labels (replaces fixed channel/teams)
  labels: Record<string, string>;  // { labelTypeId: labelId }
  
  // Tags for filtering only
  tags: string[];
  
  // Hierarchical relationships
  parentPlanId: string | null;
  useRelativeDates: boolean;      // When true, dates are offsets from parent
  relativeStartOffset?: number;    // Days from parent start
  relativeEndOffset?: number;      // Days from parent start
}
```

### 1.2 Default Label Types
Provide sensible defaults that users can customize:
- **Channel**: Social Media, Email, Events, Ads, Content
- **Team**: Growth, Brand, Content, Design, Copy
- **Campaign**: (user-defined)
- **Business Unit**: (user-defined)
- **Owner**: (user-defined)

---

## Phase 2: Context and State Management

### 2.1 Create Labels Context (`src/context/LabelsContext.tsx`)

**State to manage:**
- `labelTypes: LabelType[]` - All label type definitions
- `labels: Label[]` - All labels organized by type
- `activeSwimlaneType: string` - Which label type to use for swimlanes
- CRUD operations for label types and labels

### 2.2 Update Plans Context (`src/context/PlansContext.tsx`)

**Changes:**
- Remove hardcoded `GroupBy` enum
- Add `swimlaneTypeId: string` - references the label type for lanes
- Add helper functions:
  - `getChildPlans(parentId: string): Plan[]`
  - `getParentPlan(planId: string): Plan | null`
  - `calculateAbsoluteDates(plan: Plan): { startDate: Date, endDate: Date }`
  - `updatePlanDatesFromParent(planId: string)`

---

## Phase 3: Label Management UI

### 3.1 Label Settings Dialog (`src/components/labels/LabelSettingsDialog.tsx`)

**Features:**
- Tab-based UI for each label type
- Add/edit/delete label types
- Add/edit/delete labels within each type
- Drag to reorder labels (affects swimlane order)
- Color picker for labels
- Icon selector for label types

### 3.2 Header Integration

**Update TimelineHeader:**
- Replace hardcoded "Group By" dropdown with dynamic label type selector
- Add "Manage Labels" button to open settings dialog
- Show active swimlane type with icon

---

## Phase 4: Swimlane Dynamic Rendering

### 4.1 Update TimelineCanvas (`src/components/timeline/TimelineCanvas.tsx`)

**Changes:**
- Read `activeSwimlaneType` from context
- Get all labels of that type
- Group plans by their label value for that type
- Handle plans with no label for the active type (show in "Unassigned" lane)

### 4.2 Update Swimlane (`src/components/timeline/Swimlane.tsx`)

**Changes:**
- Accept generic `labelId` instead of `channelKey`
- Use label color for lane styling
- Support drag-drop between any lane types

---

## Phase 5: Plan Detail Panel Updates

### 5.1 Update PlanDetailPanel (`src/components/timeline/PlanDetailPanel.tsx`)

**New sections:**
- **Labels Section**: For each label type, show a dropdown to assign a label
- **Parent Plan Selection**: Dropdown to select parent plan (or "None")
- **Relative Dates Toggle**: When parent selected, option to use relative dates
- **Date Display**: Show both relative offset and calculated absolute dates
- **Tags Section**: Keep as-is for filtering purposes only

---

## Phase 6: Hierarchical Plan Rendering

### 6.1 Visual Hierarchy in Swimlanes

**Nested display options:**
- Sub-plans indented within their parent
- Connection lines from parent to children
- Parent plans show expand/collapse toggle
- Color-coded dependency lines

### 6.2 Create Plan as Sub-plan

**When dragging onto another plan:**
- Detect drop target is another plan card
- Show visual indicator for nesting
- Prompt: "Create as sub-plan of [Parent Title]?"
- Auto-set parent relationship

### 6.3 Relative Date Calculations

**Implementation:**
```typescript
function calculateAbsoluteDates(plan: Plan, parentPlan: Plan | null) {
  if (!plan.useRelativeDates || !parentPlan) {
    return { startDate: plan.startDate, endDate: plan.endDate };
  }
  return {
    startDate: addDays(parentPlan.startDate, plan.relativeStartOffset || 0),
    endDate: addDays(parentPlan.startDate, plan.relativeEndOffset || 0),
  };
}
```

**When parent plan dates change:**
- Automatically recalculate all child plan absolute dates
- Visual feedback showing the cascade update

---

## Phase 7: Filter System Enhancement

### 7.1 Separate Tags from Labels

**Clear distinction:**
- **Labels**: For organization/swimlanes (e.g., Channel = Social Media)
- **Tags**: For cross-cutting filters only (e.g., "Black Friday", "Urgent")

### 7.2 Enhanced Filter UI

**Filter capabilities:**
- Filter by tag (existing behavior)
- Filter by title search (existing behavior)
- Filter by any label type/value
- Filter by parent/children visibility

---

## Phase 8: Data Migration

### 8.1 Mock Data Update (`src/data/mockPlans.ts`)

**Changes:**
- Create default label types
- Create default labels (migrating current channels/teams)
- Update mock plans to use new label structure
- Add example parent-child relationships

### 8.2 Create Default Labels (`src/data/defaultLabels.ts`)

```typescript
export const defaultLabelTypes: LabelType[] = [
  { id: 'channel', name: 'Channel', pluralName: 'Channels', icon: 'Radio', color: 'blue' },
  { id: 'team', name: 'Team', pluralName: 'Teams', icon: 'Users', color: 'green' },
  { id: 'campaign', name: 'Campaign', pluralName: 'Campaigns', icon: 'Target', color: 'purple' },
];

export const defaultLabels: Label[] = [
  { id: 'social', typeId: 'channel', name: 'Social Media', color: 'hsl(210 80% 70%)', order: 0 },
  { id: 'email', typeId: 'channel', name: 'Email Marketing', color: 'hsl(270 67% 72%)', order: 1 },
  // ... more defaults
];
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/plan.ts` | Modify | New Label, LabelType, and updated Plan interfaces |
| `src/types/label.ts` | Create | Dedicated label types (optional, could keep in plan.ts) |
| `src/context/LabelsContext.tsx` | Create | Label type and label management context |
| `src/context/PlansContext.tsx` | Modify | Add hierarchy helpers, remove fixed GroupBy |
| `src/data/defaultLabels.ts` | Create | Default label types and labels |
| `src/data/mockPlans.ts` | Modify | Update to new structure with parent-child examples |
| `src/components/labels/LabelSettingsDialog.tsx` | Create | Full label management UI |
| `src/components/labels/LabelTypeTab.tsx` | Create | Individual label type editor |
| `src/components/labels/LabelItem.tsx` | Create | Single label editor row |
| `src/components/timeline/TimelineHeader.tsx` | Modify | Dynamic swimlane selector, manage labels button |
| `src/components/timeline/TimelineCanvas.tsx` | Modify | Dynamic grouping by selected label type |
| `src/components/timeline/Swimlane.tsx` | Modify | Generic label support, remove Channel-specific code |
| `src/components/timeline/PlanCard.tsx` | Modify | Show sub-plan indicators, handle nesting drop |
| `src/components/timeline/PlanDetailPanel.tsx` | Modify | Label dropdowns, parent selection, relative dates |
| `src/components/timeline/SubPlanIndicator.tsx` | Create | Visual indicator for child plans |

---

## Implementation Order

1. **Types and Data Layer** (Phase 1, 8)
   - Define new types
   - Create default data
   - Migrate mock plans

2. **Context Layer** (Phase 2)
   - LabelsContext
   - Update PlansContext

3. **Core Rendering** (Phase 4)
   - TimelineCanvas dynamic grouping
   - Swimlane generic labels

4. **Plan Editing** (Phase 5)
   - PlanDetailPanel with labels and parent selection

5. **Label Management** (Phase 3)
   - LabelSettingsDialog
   - Header integration

6. **Hierarchy Features** (Phase 6)
   - Visual nesting
   - Drag to create sub-plan
   - Relative date calculations

7. **Filter Enhancement** (Phase 7)
   - Updated filter logic

---

## User Experience Flow

### Creating Custom Labels
1. Click "Manage Labels" in header
2. See existing label types (Channel, Team, Campaign...)
3. Click "Add Label Type" to create new (e.g., "Business Unit")
4. Add labels within the type (e.g., "North America", "EMEA", "APAC")
5. Close dialog - new swimlane option available

### Switching Swimlanes
1. Click swimlane dropdown in header
2. Select any label type (Channel, Team, Campaign, Business Unit...)
3. Timeline reorganizes to show lanes for each label of that type

### Creating Sub-plans
1. Drag a plan bar onto another plan bar
2. Confirmation prompt appears
3. Select "Create as sub-plan"
4. Optional: Enable "Relative dates"
5. Child plan now moves when parent moves

### Filtering by Tags
1. Use search bar - searches titles and tags
2. Tags appear as badges on plan cards
3. Quick filter buttons for common tags
