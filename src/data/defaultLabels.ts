import { LabelType, Label } from '@/types/plan';

export const defaultLabelTypes: LabelType[] = [
  {
    id: 'channel',
    name: 'Channel',
    pluralName: 'Channels',
    icon: 'Radio',
    color: 'hsl(210 80% 70%)',
  },
  {
    id: 'team',
    name: 'Team',
    pluralName: 'Teams',
    icon: 'Users',
    color: 'hsl(150 60% 65%)',
  },
  {
    id: 'campaign',
    name: 'Campaign',
    pluralName: 'Campaigns',
    icon: 'Target',
    color: 'hsl(270 67% 72%)',
  },
];

export const defaultLabels: Label[] = [
  // Channel labels
  { id: 'social', typeId: 'channel', name: 'Social Media', color: 'hsl(210 80% 70%)', order: 0 },
  { id: 'email', typeId: 'channel', name: 'Email Marketing', color: 'hsl(270 67% 72%)', order: 1 },
  { id: 'events', typeId: 'channel', name: 'Events', color: 'hsl(150 60% 65%)', order: 2 },
  { id: 'ads', typeId: 'channel', name: 'Paid Ads', color: 'hsl(25 90% 68%)', order: 3 },
  { id: 'content', typeId: 'channel', name: 'Content', color: 'hsl(180 55% 60%)', order: 4 },
  
  // Team labels
  { id: 'growth', typeId: 'team', name: 'Growth', color: 'hsl(150 60% 65%)', order: 0 },
  { id: 'brand', typeId: 'team', name: 'Brand', color: 'hsl(330 70% 75%)', order: 1 },
  { id: 'content-team', typeId: 'team', name: 'Content', color: 'hsl(180 55% 60%)', order: 2 },
  { id: 'design', typeId: 'team', name: 'Design', color: 'hsl(270 67% 72%)', order: 3 },
  { id: 'copy', typeId: 'team', name: 'Copy', color: 'hsl(45 85% 70%)', order: 4 },
  
  // Campaign labels (examples)
  { id: 'q1-launch', typeId: 'campaign', name: 'Q1 Launch', color: 'hsl(210 80% 70%)', order: 0 },
  { id: 'black-friday', typeId: 'campaign', name: 'Black Friday', color: 'hsl(0 75% 70%)', order: 1 },
  { id: 'holiday', typeId: 'campaign', name: 'Holiday', color: 'hsl(150 60% 65%)', order: 2 },
];
