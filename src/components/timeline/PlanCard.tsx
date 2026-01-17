import { useState, useRef, useEffect } from 'react';
import { Plan } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { useResizeIndicator } from '@/context/ResizeIndicatorContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  startOffset: number;
  width: number;
  stackIndex: number;
  onDoubleClick: () => void;
  onDragStart: (plan: Plan, e: React.MouseEvent) => void;
  isDraggingExternal: boolean;
  isDropTarget?: boolean;
}

export const PlanCard = ({ 
  plan, 
  startOffset, 
  width, 
  stackIndex, 
  onDoubleClick,
  onDragStart,
  isDraggingExternal,
  isDropTarget = false,
}: PlanCardProps) => {
  const { updatePlan, snapMode, getChildPlans } = usePlans();
  const { setIndicator, clearIndicator } = useResizeIndicator();
  const cardRef = useRef<HTMLDivElement>(null);

  // Snap date to week or month boundary
  const snapDate = (date: Date, isStart: boolean): Date => {
    if (snapMode === 'none') return date;
    
    if (snapMode === 'week') {
      // Snap to Monday (start of week) or Sunday (end of week)
      return isStart 
        ? startOfWeek(date, { weekStartsOn: 1 }) 
        : endOfWeek(date, { weekStartsOn: 1 });
    }
    
    if (snapMode === 'month') {
      return isStart ? startOfMonth(date) : endOfMonth(date);
    }
    
    return date;
  };
  const [isResizingStart, setIsResizingStart] = useState(false);
  const [isResizingEnd, setIsResizingEnd] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalOffset, setOriginalOffset] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(startOffset);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [previewStartDate, setPreviewStartDate] = useState<Date | null>(null);
  const [previewEndDate, setPreviewEndDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentOffset(startOffset);
    setCurrentWidth(width);
  }, [startOffset, width]);

  // Calculate preview dates during resize
  const getPixelsPerDay = () => {
    const timelineElement = document.querySelector('[data-timeline]');
    if (timelineElement) {
      const timelineWidth = timelineElement.clientWidth;
      const daysInYear = 365;
      return timelineWidth / daysInYear;
    }
    return 1;
  };

  const handleResizeStartBegin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingStart(true);
    setDragStartX(e.clientX);
    setOriginalOffset(currentOffset);
    setOriginalWidth(currentWidth);
  };

  const handleResizeEndBegin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingEnd(true);
    setDragStartX(e.clientX);
    setOriginalWidth(currentWidth);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle-start') || target.classList.contains('resize-handle-end')) {
      return;
    }
    e.stopPropagation();
    onDragStart(plan, e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pixelsPerDay = getPixelsPerDay();
      const timelineElement = document.querySelector('[data-timeline]');
      
      if (isResizingStart) {
        const deltaX = e.clientX - dragStartX;
        const newOffset = Math.max(0, originalOffset + deltaX);
        const newWidth = Math.max(60, originalWidth - deltaX);
        setCurrentOffset(newOffset);
        setCurrentWidth(newWidth);
        
        // Calculate preview start date with snap
        const daysDelta = Math.round((newOffset - originalOffset) / pixelsPerDay);
        const rawStartDate = new Date(plan.startDate);
        rawStartDate.setDate(rawStartDate.getDate() + daysDelta);
        const snappedStartDate = snapDate(rawStartDate, true);
        setPreviewStartDate(snappedStartDate);
        
        // Update resize indicator line at the left edge of the plan bar
        if (timelineElement) {
          const timelineRect = timelineElement.getBoundingClientRect();
          setIndicator({
            isActive: true,
            edgeX: newOffset,
            isStart: true,
            previewDate: snappedStartDate,
          });
        }
      }
      if (isResizingEnd) {
        const deltaX = e.clientX - dragStartX;
        const newWidth = Math.max(60, originalWidth + deltaX);
        setCurrentWidth(newWidth);
        
        // Calculate preview end date with snap
        const daysDelta = Math.round((newWidth - originalWidth) / pixelsPerDay);
        const rawEndDate = new Date(plan.endDate);
        rawEndDate.setDate(rawEndDate.getDate() + daysDelta);
        const snappedEndDate = snapDate(rawEndDate, false);
        setPreviewEndDate(snappedEndDate);
        
        // Update resize indicator line at the right edge of the plan bar
        if (timelineElement) {
          setIndicator({
            isActive: true,
            edgeX: currentOffset + newWidth,
            isStart: false,
            previewDate: snappedEndDate,
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingStart || isResizingEnd) {
        const timelineElement = document.querySelector('[data-timeline]');
        if (timelineElement) {
          const timelineWidth = timelineElement.clientWidth;
          const daysInYear = 365;
          const pixelsPerDay = timelineWidth / daysInYear;

          if (isResizingStart) {
            const daysDelta = Math.round((currentOffset - originalOffset) / pixelsPerDay);
            const rawStartDate = new Date(plan.startDate);
            rawStartDate.setDate(rawStartDate.getDate() + daysDelta);
            const newStartDate = snapDate(rawStartDate, true);

            if (newStartDate < plan.endDate) {
              updatePlan({
                ...plan,
                startDate: newStartDate,
              });
            }
          }

          if (isResizingEnd) {
            const daysDelta = Math.round((currentWidth - originalWidth) / pixelsPerDay);
            const rawEndDate = new Date(plan.endDate);
            rawEndDate.setDate(rawEndDate.getDate() + daysDelta);
            const newEndDate = snapDate(rawEndDate, false);

            if (newEndDate > plan.startDate) {
              updatePlan({
                ...plan,
                endDate: newEndDate,
              });
            }
          }
        }
      }
      clearIndicator();
      setIsResizingStart(false);
      setIsResizingEnd(false);
      setPreviewStartDate(null);
      setPreviewEndDate(null);
    };

    if (isResizingStart || isResizingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingStart, isResizingEnd, dragStartX, originalOffset, originalWidth, currentOffset, currentWidth, plan, updatePlan]);

  const isResizing = isResizingStart || isResizingEnd;
  const hasChildren = getChildPlans(plan.id).length > 0;

  return (
    <div
      ref={cardRef}
      data-plan-id={plan.id}
      className={cn(
        'absolute flex cursor-grab items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-all select-none',
        isResizing ? 'cursor-col-resize shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md',
        isDraggingExternal && 'opacity-50',
        isDropTarget && 'ring-2 ring-primary shadow-lg scale-105',
        plan.parentPlanId && 'border-l-4 border-l-primary/50',
      )}
      style={{
        left: `${currentOffset}px`,
        width: `${currentWidth}px`,
        top: `${stackIndex * 36 + 8}px`,
        backgroundColor: plan.color,
        color: 'hsl(265 4% 12.9%)',
        minWidth: '60px',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {/* Start date tooltip - positioned below to avoid header overlap */}
      {isResizingStart && previewStartDate && (
        <div className="absolute -left-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
          <div className="absolute left-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
          {format(previewStartDate, 'MMM d, yyyy')}
        </div>
      )}

      {/* End date tooltip - positioned below to avoid header overlap */}
      {isResizingEnd && previewEndDate && (
        <div className="absolute -right-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
          <div className="absolute right-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
          {format(previewEndDate, 'MMM d, yyyy')}
        </div>
      )}

      {/* Resize handle - Start */}
      <div
        className="resize-handle-start absolute left-0 top-0 h-full w-3 cursor-ew-resize rounded-l-full hover:bg-foreground/10"
        onMouseDown={handleResizeStartBegin}
      />

      {/* Sub-plan indicator */}
      {plan.parentPlanId && (
        <GitBranch className="h-3 w-3 text-foreground/60 shrink-0" />
      )}

      <span className="truncate font-semibold pointer-events-none">{plan.title}</span>
      
      {/* Child indicator */}
      {hasChildren && (
        <span className="text-xs bg-foreground/20 rounded-full px-1.5 py-0.5 shrink-0">
          {getChildPlans(plan.id).length}
        </span>
      )}
      
      <span className="ml-auto shrink-0 text-xs opacity-75 pointer-events-none">
        {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
      </span>

      {/* Resize handle - End */}
      <div
        className="resize-handle-end absolute right-0 top-0 h-full w-3 cursor-ew-resize rounded-r-full hover:bg-foreground/10"
        onMouseDown={handleResizeEndBegin}
      />
    </div>
  );
};
