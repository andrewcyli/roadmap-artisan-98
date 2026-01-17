import { useState, useEffect, useRef } from 'react';
import { usePlans } from '@/context/PlansContext';
import { useLabels } from '@/context/LabelsContext';
import { Plan, Label } from '@/types/plan';
import { TimelineGrid } from './TimelineGrid';
import { Swimlane } from './Swimlane';
import { ResizeIndicatorLine } from './ResizeIndicatorLine';
import { startOfYear, addDays, differenceInDays, format } from 'date-fns';
import { PLAN_COLORS } from '@/types/plan';

interface TimelineCanvasProps {
  onPlanDoubleClick: (plan: Plan) => void;
  onCreatePlan: (labelId: string, startDate: Date) => void;
}

export const TimelineCanvas = ({ onPlanDoubleClick, onCreatePlan }: TimelineCanvasProps) => {
  const { plans, filterText, updatePlan } = usePlans();
  const { activeSwimlaneTypeId, getLabelsByType, getLabelName } = useLabels();
  const [, setForceRender] = useState(0);
  const [draggingPlan, setDraggingPlan] = useState<Plan | null>(null);
  const [dragTargetLabelId, setDragTargetLabelId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragPlanWidth, setDragPlanWidth] = useState(0);
  const [previewDates, setPreviewDates] = useState<{ start: Date; end: Date } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setForceRender((prev) => prev + 1);
    window.addEventListener('resize', handleResize);
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

  // Group plans by active swimlane label type
  const getGroupedPlans = (): { label: string; labelId: string; labelColor: string; plans: Plan[] }[] => {
    const activeLabels = getLabelsByType(activeSwimlaneTypeId);
    
    const groups = activeLabels.map((label) => ({
      label: label.name,
      labelId: label.id,
      labelColor: label.color,
      plans: filteredPlans.filter((p) => p.labels[activeSwimlaneTypeId] === label.id),
    }));

    // Add "Unassigned" group for plans without a label for this type
    const unassignedPlans = filteredPlans.filter(
      (p) => !p.labels[activeSwimlaneTypeId]
    );
    if (unassignedPlans.length > 0) {
      groups.push({
        label: 'Unassigned',
        labelId: '__unassigned__',
        labelColor: 'hsl(220 14% 60%)',
        plans: unassignedPlans,
      });
    }

    return groups;
  };

  const groupedPlans = getGroupedPlans();

  const handleDragStart = (plan: Plan, e: React.MouseEvent) => {
    // Calculate the plan's current width
    const timelineElement = document.querySelector('[data-timeline]');
    if (timelineElement) {
      const timelineWidth = timelineElement.clientWidth;
      const daysInYear = 365;
      const pixelsPerDay = timelineWidth / daysInYear;
      const planDuration = differenceInDays(plan.endDate, plan.startDate);
      setDragPlanWidth(Math.max(60, planDuration * pixelsPerDay));
    }
    
    setDraggingPlan(plan);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragCurrentPos({ x: e.clientX, y: e.clientY });
    setPreviewDates({ start: plan.startDate, end: plan.endDate });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !draggingPlan) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragCurrentPos({ x: e.clientX, y: e.clientY });

      // Calculate preview dates based on drag delta
      const deltaX = e.clientX - dragStartPos.x;
      const timelineElement = document.querySelector('[data-timeline]');
      if (timelineElement) {
        const timelineWidth = timelineElement.clientWidth;
        const daysInYear = 365;
        const pixelsPerDay = timelineWidth / daysInYear;
        const daysDelta = Math.round(deltaX / pixelsPerDay);

        const newStartDate = new Date(draggingPlan.startDate);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        const newEndDate = new Date(draggingPlan.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        setPreviewDates({ start: newStartDate, end: newEndDate });
      }

      // Find which swimlane we're over
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const swimlane = elements.find((el) => el.hasAttribute('data-label-id'));
      if (swimlane) {
        const labelId = swimlane.getAttribute('data-label-id');
        setDragTargetLabelId(labelId);
      } else {
        setDragTargetLabelId(null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingPlan && isDragging) {
        const deltaX = e.clientX - dragStartPos.x;
        
        // Calculate date change
        const timelineElement = document.querySelector('[data-timeline]');
        if (timelineElement) {
          const timelineWidth = timelineElement.clientWidth;
          const daysInYear = 365;
          const pixelsPerDay = timelineWidth / daysInYear;
          const daysDelta = Math.round(deltaX / pixelsPerDay);

          const newStartDate = new Date(draggingPlan.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysDelta);
          const newEndDate = new Date(draggingPlan.endDate);
          newEndDate.setDate(newEndDate.getDate() + daysDelta);

          const updatedPlan: Plan = {
            ...draggingPlan,
            startDate: newStartDate,
            endDate: newEndDate,
          };

          // Update label if dropped on different lane
          const currentLabelId = draggingPlan.labels[activeSwimlaneTypeId];
          if (dragTargetLabelId && dragTargetLabelId !== currentLabelId && dragTargetLabelId !== '__unassigned__') {
            updatedPlan.labels = {
              ...updatedPlan.labels,
              [activeSwimlaneTypeId]: dragTargetLabelId,
            };
          }

          updatePlan(updatedPlan);
        }
      }

      setDraggingPlan(null);
      setDragTargetLabelId(null);
      setIsDragging(false);
      setPreviewDates(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingPlan, dragStartPos, dragTargetLabelId, updatePlan, activeSwimlaneTypeId]);

  const handleEmptyClick = (labelId: string | undefined, clickX: number) => {
    if (!labelId || labelId === '__unassigned__') return;
    
    // Convert click position to date
    const timelineElement = document.querySelector('[data-timeline]');
    if (timelineElement) {
      const timelineWidth = timelineElement.clientWidth;
      const daysInYear = 365;
      const pixelsPerDay = timelineWidth / daysInYear;
      const dayOfYear = Math.floor(clickX / pixelsPerDay);
      
      const yearStart = startOfYear(new Date(2025, 0, 1));
      const clickDate = addDays(yearStart, dayOfYear);
      
      onCreatePlan(labelId, clickDate);
    }
  };

  const handleDragOver = (e: React.DragEvent, labelId: string | undefined) => {
    e.preventDefault();
    if (labelId) {
      setDragTargetLabelId(labelId);
    }
  };

  const handleDrop = (e: React.DragEvent, labelId: string | undefined) => {
    e.preventDefault();
    setDragTargetLabelId(null);
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Resize indicator that spans the entire timeline including header */}
      <div className="absolute left-48 right-0 top-0 bottom-0 pointer-events-none z-40">
        <ResizeIndicatorLine />
      </div>
      <TimelineGrid />
      <div className="relative flex-1 overflow-y-auto">
        {groupedPlans.map((group) => (
          <Swimlane
            key={group.labelId}
            label={group.label}
            labelId={group.labelId}
            labelColor={group.labelColor}
            plans={group.plans}
            onPlanDoubleClick={onPlanDoubleClick}
            onEmptyClick={handleEmptyClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragTarget={dragTargetLabelId === group.labelId && draggingPlan?.labels[activeSwimlaneTypeId] !== group.labelId}
            draggingPlan={draggingPlan}
          />
        ))}
      </div>

      {/* Drag ghost with proper sizing and date tooltips */}
      {isDragging && draggingPlan && previewDates && (
        <div
          className="fixed pointer-events-none z-50 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg"
          style={{
            left: dragCurrentPos.x - dragPlanWidth / 2,
            top: dragCurrentPos.y - 15,
            width: `${dragPlanWidth}px`,
            backgroundColor: draggingPlan.color,
            color: 'hsl(265 4% 12.9%)',
          }}
        >
          {/* Start date tooltip */}
          <div className="absolute -left-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
            <div className="absolute left-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
            {format(previewDates.start, 'MMM d, yyyy')}
          </div>

          <span className="truncate pointer-events-none">{draggingPlan.title}</span>
          <span className="ml-auto shrink-0 text-xs opacity-75 pointer-events-none">
            {format(previewDates.start, 'MMM d')} - {format(previewDates.end, 'MMM d')}
          </span>

          {/* End date tooltip */}
          <div className="absolute -right-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
            <div className="absolute right-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
            {format(previewDates.end, 'MMM d, yyyy')}
          </div>
        </div>
      )}
    </div>
  );
};
