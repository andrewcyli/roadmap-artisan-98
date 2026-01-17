import { usePlans } from '@/context/PlansContext';
import { Plan, Channel, CHANNEL_LABELS } from '@/types/plan';
import { TimelineGrid } from './TimelineGrid';
import { Swimlane } from './Swimlane';
import { useEffect, useState } from 'react';

interface TimelineCanvasProps {
  onPlanClick: (plan: Plan) => void;
}

export const TimelineCanvas = ({ onPlanClick }: TimelineCanvasProps) => {
  const { plans, groupBy, filterText } = usePlans();
  const [, setForceRender] = useState(0);

  // Force re-render on window resize for pixel calculations
  useEffect(() => {
    const handleResize = () => setForceRender((prev) => prev + 1);
    window.addEventListener('resize', handleResize);
    // Initial render after mount
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      plan.title.toLowerCase().includes(searchLower) ||
      plan.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  // Group plans
  const getGroupedPlans = (): { label: string; plans: Plan[] }[] => {
    if (groupBy === 'channel') {
      const channels: Channel[] = ['social', 'email', 'events', 'ads', 'content'];
      return channels.map((channel) => ({
        label: CHANNEL_LABELS[channel],
        plans: filteredPlans.filter((p) => p.channel === channel),
      }));
    } else {
      // Group by campaign tags
      const tagGroups = new Map<string, Plan[]>();
      filteredPlans.forEach((plan) => {
        plan.tags.forEach((tag) => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(plan);
        });
      });
      return Array.from(tagGroups.entries()).map(([tag, plans]) => ({
        label: tag,
        plans,
      }));
    }
  };

  const groupedPlans = getGroupedPlans();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <TimelineGrid />
      <div className="flex-1 overflow-y-auto">
        {groupedPlans.map((group) => (
          <Swimlane
            key={group.label}
            label={group.label}
            plans={group.plans}
            onPlanClick={onPlanClick}
          />
        ))}
      </div>
    </div>
  );
};
