import { Plan, CardDensity } from '@/types/plan';
import { PlanCard, calculatePlanOverflowWidth } from './PlanCard';
import { usePlans } from '@/context/PlansContext';
import { startOfYear, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

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
  onDeletePlan: (plan: Plan) => void;
  onDuplicatePlan: (plan: Plan) => void;
}

const MIN_BAR_WIDTH_FOR_CONTENT = 120;

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
  onDeletePlan,
  onDuplicatePlan,
}: SwimlaneProps) => {
  const { zoomLevel, cardDensity } = usePlans();
  const yearStart = startOfYear(new Date(2025, 0, 1));
  const daysInYear = 365;

  // Get row height based on card density - matching PlanCard heights
  const getRowHeight = (density: CardDensity, plan?: Plan): number => {
    const effectiveDensity = plan?.displayDensity || density;
    switch (effectiveDensity) {
      case 'condensed': return 40;
      case 'standard': return 60;
      case 'comprehensive': return 88;
      default: return 60;
    }
  };

  // Calculate overflow width for a plan using shared function
  const calculateOverflowWidth = (plan: Plan, cardWidth: number) => {
    return calculatePlanOverflowWidth(plan, cardWidth, cardDensity);
  };

  // Calculate positions for each plan with collision detection
  // Now considers overflow content width for proper stacking
  const getStackedPlans = useMemo(() => {
    const sortedPlans = [...plans].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    const timelineEl = document.querySelector('[data-timeline]');
    const timelineWidth = timelineEl?.clientWidth || 1000;
    const pixelsPerDay = timelineWidth / daysInYear;

    const stacks: { plan: Plan; effectiveEnd: number }[][] = [];

    sortedPlans.forEach((plan) => {
      const startDayOfYear = differenceInDays(plan.startDate, yearStart);
      const planDuration = differenceInDays(plan.endDate, plan.startDate);
      const cardWidth = Math.max(40, planDuration * pixelsPerDay);
      const overflowWidth = calculateOverflowWidth(plan, cardWidth);
      const effectiveWidth = cardWidth + overflowWidth;
      const startPixel = startDayOfYear * pixelsPerDay;
      const effectiveEndPixel = startPixel + effectiveWidth;

      let placed = false;
      for (let i = 0; i < stacks.length; i++) {
        const lastInStack = stacks[i][stacks[i].length - 1];
        // Check if this plan's start is past the last plan's effective end (including overflow)
        if (startPixel >= lastInStack.effectiveEnd + 4) { // 4px gap
          stacks[i].push({ plan, effectiveEnd: effectiveEndPixel });
          placed = true;
          break;
        }
      }
      if (!placed) {
        stacks.push([{ plan, effectiveEnd: effectiveEndPixel }]);
      }
    });

    const planStackMap = new Map<string, number>();
    stacks.forEach((stack, stackIndex) => {
      stack.forEach(({ plan }) => {
        planStackMap.set(plan.id, stackIndex);
      });
    });

    return { planStackMap, stackCount: stacks.length };
  }, [plans, yearStart, daysInYear]);

  const { planStackMap, stackCount } = getStackedPlans;

  // Calculate max row height considering individual plan densities
  const maxRowHeight = useMemo(() => {
    const heights = plans.map(plan => {
      const effectiveDensity = plan.displayDensity || cardDensity;
      return getRowHeight(effectiveDensity);
    });
    return Math.max(getRowHeight(cardDensity), ...heights);
  }, [plans, cardDensity]);

  const minHeight = Math.max(60, stackCount * maxRowHeight + 24);

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
      {/* Label Column - Responsive width and hidden on mobile */}
      <div className="hidden sm:flex w-32 md:w-48 shrink-0 items-center gap-2 border-r border-border bg-muted/50 px-2 md:px-4 py-3">
        <div 
          className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full shrink-0" 
          style={{ backgroundColor: labelColor }}
        />
        <span className="text-xs md:text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      {/* Mobile: Floating label indicator */}
      <div 
        className="sm:hidden absolute left-1 top-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm"
        style={{ display: 'none' }}
      >
        <div 
          className="h-2 w-2 rounded-full" 
          style={{ backgroundColor: labelColor }}
        />
        <span className="text-[10px] font-medium text-foreground truncate max-w-[60px]">{label}</span>
      </div>

      {/* Timeline Area */}
      <div
        className={cn(
          'relative flex-1 transition-colors overflow-visible',
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
              width: Math.max(40, planDuration * pixelsPerDay),
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
                cardDensity={cardDensity}
                onDoubleClick={() => onPlanDoubleClick(plan)}
                onDragStart={onDragStart}
                isDraggingExternal={draggingPlan?.id === plan.id}
                onDelete={onDeletePlan}
                onDuplicate={onDuplicatePlan}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
