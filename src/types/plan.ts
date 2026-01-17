export type Channel = 'social' | 'email' | 'events' | 'ads' | 'content';
export type Team = 'growth' | 'brand' | 'content' | 'design' | 'copy';
export type ZoomLevel = 'year' | 'quarter' | 'month';
export type GroupBy = 'channel' | 'campaign';

export interface Plan {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  channel: Channel;
  budget: number;
  teams: Team[];
  tags: string[];
  color: string;
}

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
