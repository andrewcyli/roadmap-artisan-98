export type ZoomLevel = 'year' | 'quarter' | 'month';
export type CardDensity = 'condensed' | 'standard' | 'comprehensive';

// Label Types - user can create custom label categories
export interface LabelType {
  id: string;
  name: string;           // e.g., "Campaign", "Channel", "Business Unit"
  pluralName: string;     // e.g., "Campaigns", "Channels", "Business Units"
  icon?: string;          // lucide icon name
  color: string;          // HSL color string
}

// Individual Label within a type
export interface Label {
  id: string;
  typeId: string;         // references LabelType
  name: string;           // e.g., "Social Media", "Q1 Launch"
  color: string;          // HSL color string
  order: number;          // for sorting in swimlanes
}

// Updated Plan interface with flexible labels and hierarchy
export interface Plan {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  color: string;
  
  // Flexible labels (replaces fixed channel/teams)
  // Key is labelTypeId, value is labelId
  labels: Record<string, string>;
  
  // Tags for filtering only (not for swimlane organization)
  tags: string[];
  
  // Hierarchical relationships
  parentPlanId: string | null;
  useRelativeDates: boolean;       // When true, dates are offsets from parent
  relativeStartOffset?: number;    // Days from parent start
  relativeEndOffset?: number;      // Days from parent start
  
  // Individual display density override (null = use global setting)
  displayDensity?: CardDensity | null;
}

// Legacy types for backward compatibility during migration
export type Channel = 'social' | 'email' | 'events' | 'ads' | 'content';
export type Team = 'growth' | 'brand' | 'content' | 'design' | 'copy';

export const CHANNEL_LABELS: Record<Channel, string> = {
  social: 'Social Media',
  email: 'Email Marketing',
  events: 'Events',
  ads: 'Paid Ads',
  content: 'Content',
};

export const TEAM_LABELS: Record<Team, string> = {
  growth: 'Growth',
  brand: 'Brand',
  content: 'Content',
  design: 'Design',
  copy: 'Copy',
};

export const PLAN_COLORS = [
  { name: 'Purple', value: 'hsl(270 67% 72%)' },
  { name: 'Blue', value: 'hsl(210 80% 70%)' },
  { name: 'Green', value: 'hsl(150 60% 65%)' },
  { name: 'Orange', value: 'hsl(25 90% 68%)' },
  { name: 'Pink', value: 'hsl(330 70% 75%)' },
  { name: 'Teal', value: 'hsl(180 55% 60%)' },
  { name: 'Yellow', value: 'hsl(45 85% 70%)' },
  { name: 'Red', value: 'hsl(0 75% 70%)' },
];

// Default label type IDs for quick access
export const DEFAULT_LABEL_TYPES = {
  CHANNEL: 'channel',
  TEAM: 'team',
  CAMPAIGN: 'campaign',
} as const;
