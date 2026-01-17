import { Plan } from '@/types/plan';
import { PlanCard } from './PlanCard';
import { usePlans } from '@/context/PlansContext';
import { startOfYear, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface SwimlaneProps {
  label: string;
  labelId: string;
  labelColor: string;
  plans: Plan[];
  onPlanDoubleClick: (plan: Plan) => void;
  onEmptyClick: (labelId: string | undefined, clickX: number) => void;
  onDragStart: (plan: Plan, e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent, labelId: string | undefined) => void;
  onDrop: (e: React.DragEvent, labelId: string | undefined) => void;
  isDragTarget: boolean;
  draggingPlan: Plan | null;
  dropTargetPlanId: string | null;
}

export const Swimlane = ({ 
  label, 
  labelId,
  labelColor,
  plans, 
  onPlanDoubleClick, 
  onEmptyClick,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
  draggingPlan,
  dropTargetPlanId,
}: SwimlaneProps) => {
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

  const handleLaneClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the lane, not on a card
    if ((e.target as HTMLElement).closest('.plan-card-wrapper')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    onEmptyClick(labelId, clickX);
  };

  // Convert label color to a subtle background using CSS variable approach
  const getLaneStyle = () => {
    // Use the label color with very low opacity for the lane background
    return {
      backgroundColor: labelColor.replace(')', ' / 0.08)').replace('hsl(', 'hsla('),
    };
  };

  return (
    <div className="flex border-b border-border">
      {/* Label Column */}
      <div className="flex w-48 shrink-0 items-center gap-2 border-r border-border bg-muted/50 px-4 py-3">
        <div 
          className="h-3 w-3 rounded-full shrink-0" 
          style={{ backgroundColor: labelColor }}
        />
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
      </div>

      {/* Timeline Area */}
      <div
        className={cn(
          'relative flex-1 transition-colors',
          isDragTarget && 'ring-2 ring-inset ring-primary/50 bg-primary/5',
        )}
        style={{ 
          minHeight: `${minHeight}px`,
          ...(!isDragTarget ? getLaneStyle() : {}),
        }}
        data-timeline
        data-label-id={labelId}
        onClick={handleLaneClick}
        onDragOver={(e) => onDragOver(e, labelId)}
        onDrop={(e) => onDrop(e, labelId)}
      >
        {plans.map((plan) => {
          const startDayOfYear = differenceInDays(plan.startDate, yearStart);
          const planDuration = differenceInDays(plan.endDate, plan.startDate);

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
            <div key={plan.id} className="plan-card-wrapper">
              <PlanCard
                plan={plan}
                startOffset={offset}
                width={width}
                stackIndex={stackIndex}
                onDoubleClick={() => onPlanDoubleClick(plan)}
                onDragStart={onDragStart}
                isDraggingExternal={draggingPlan?.id === plan.id}
                isDropTarget={dropTargetPlanId === plan.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
