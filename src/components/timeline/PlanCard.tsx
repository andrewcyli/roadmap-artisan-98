import { useState, useRef, useEffect } from 'react';
import { Plan, Channel } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  startOffset: number;
  width: number;
  stackIndex: number;
  onDoubleClick: () => void;
  onDragStart: (plan: Plan, e: React.MouseEvent) => void;
  isDraggingExternal: boolean;
}

export const PlanCard = ({ 
  plan, 
  startOffset, 
  width, 
  stackIndex, 
  onDoubleClick,
  onDragStart,
  isDraggingExternal 
}: PlanCardProps) => {
  const { updatePlan } = usePlans();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isResizingStart, setIsResizingStart] = useState(false);
  const [isResizingEnd, setIsResizingEnd] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalOffset, setOriginalOffset] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(startOffset);
  const [currentWidth, setCurrentWidth] = useState(width);

  useEffect(() => {
    setCurrentOffset(startOffset);
    setCurrentWidth(width);
  }, [startOffset, width]);

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
      if (isResizingStart) {
        const deltaX = e.clientX - dragStartX;
        const newOffset = Math.max(0, originalOffset + deltaX);
        const newWidth = Math.max(60, originalWidth - deltaX);
        setCurrentOffset(newOffset);
        setCurrentWidth(newWidth);
      }
      if (isResizingEnd) {
        const deltaX = e.clientX - dragStartX;
        setCurrentWidth(Math.max(60, originalWidth + deltaX));
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
            const newStartDate = new Date(plan.startDate);
            newStartDate.setDate(newStartDate.getDate() + daysDelta);

            if (newStartDate < plan.endDate) {
              updatePlan({
                ...plan,
                startDate: newStartDate,
              });
            }
          }

          if (isResizingEnd) {
            const daysDelta = Math.round((currentWidth - originalWidth) / pixelsPerDay);
            const newEndDate = new Date(plan.endDate);
            newEndDate.setDate(newEndDate.getDate() + daysDelta);

            if (newEndDate > plan.startDate) {
              updatePlan({
                ...plan,
                endDate: newEndDate,
              });
            }
          }
        }
      }
      setIsResizingStart(false);
      setIsResizingEnd(false);
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

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute flex cursor-grab items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-all select-none',
        isResizing ? 'cursor-col-resize shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md',
        isDraggingExternal && 'opacity-50',
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
      {/* Resize handle - Start */}
      <div
        className="resize-handle-start absolute left-0 top-0 h-full w-3 cursor-ew-resize rounded-l-full hover:bg-foreground/10"
        onMouseDown={handleResizeStartBegin}
      />

      <span className="truncate font-semibold pointer-events-none">{plan.title}</span>
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
