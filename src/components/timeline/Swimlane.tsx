import { Plan, Channel, CHANNEL_LABELS } from '@/types/plan';
import { PlanCard } from './PlanCard';
import { usePlans } from '@/context/PlansContext';
import { startOfYear, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface SwimlaneProps {
  label: string;
  plans: Plan[];
  onPlanClick: (plan: Plan) => void;
}

const SWIMLANE_COLORS: Record<Channel, string> = {
  social: 'bg-[hsl(var(--swimlane-social))]',
  email: 'bg-[hsl(var(--swimlane-email))]',
  events: 'bg-[hsl(var(--swimlane-events))]',
  ads: 'bg-[hsl(var(--swimlane-ads))]',
  content: 'bg-[hsl(var(--swimlane-content))]',
};

export const Swimlane = ({ label, plans, onPlanClick }: SwimlaneProps) => {
  const { zoomLevel } = usePlans();
  const yearStart = startOfYear(new Date(2025, 0, 1));
  const daysInYear = 365;

  // Calculate positions for each plan with collision detection
  const getStackedPlans = () => {
    const sortedPlans = [...plans].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    const stacks: Plan[][] = [];

    sortedPlans.forEach((plan) => {
      let placed = false;
      for (let i = 0; i < stacks.length; i++) {
        const lastInStack = stacks[i][stacks[i].length - 1];
        if (plan.startDate >= lastInStack.endDate) {
          stacks[i].push(plan);
          placed = true;
          break;
        }
      }
      if (!placed) {
        stacks.push([plan]);
      }
    });

    const planStackMap = new Map<string, number>();
    stacks.forEach((stack, stackIndex) => {
      stack.forEach((plan) => {
        planStackMap.set(plan.id, stackIndex);
      });
    });

    return { planStackMap, stackCount: stacks.length };
  };

  const { planStackMap, stackCount } = getStackedPlans();
  const minHeight = Math.max(60, stackCount * 36 + 24);

  // Get channel from label for background color
  const channelKey = Object.entries(CHANNEL_LABELS).find(
    ([, v]) => v === label
  )?.[0] as Channel | undefined;

  return (
    <div className="flex border-b border-border">
      {/* Label Column */}
      <div className="flex w-48 shrink-0 items-center border-r border-border bg-muted/50 px-4 py-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>

      {/* Timeline Area */}
      <div
        className={cn(
          'relative flex-1',
          channelKey && SWIMLANE_COLORS[channelKey]
        )}
        style={{ minHeight: `${minHeight}px` }}
        data-timeline
      >
        {plans.map((plan) => {
          const startDayOfYear = differenceInDays(plan.startDate, yearStart);
          const planDuration = differenceInDays(plan.endDate, plan.startDate);

          // Get parent width for percentage calculations
          const getPixelValues = () => {
            const timelineEl = document.querySelector('[data-timeline]');
            if (!timelineEl) return { offset: 0, width: 100 };
            const timelineWidth = timelineEl.clientWidth;
            const pixelsPerDay = timelineWidth / daysInYear;
            return {
              offset: startDayOfYear * pixelsPerDay,
              width: Math.max(60, planDuration * pixelsPerDay),
            };
          };

          const { offset, width } = getPixelValues();
          const stackIndex = planStackMap.get(plan.id) || 0;

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              startOffset={offset}
              width={width}
              stackIndex={stackIndex}
              onClick={() => onPlanClick(plan)}
            />
          );
        })}
      </div>
    </div>
  );
};
