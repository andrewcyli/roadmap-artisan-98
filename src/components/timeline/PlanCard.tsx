import { useState, useRef, useEffect } from 'react';
import { Plan } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  startOffset: number;
  width: number;
  stackIndex: number;
  onClick: () => void;
}

export const PlanCard = ({ plan, startOffset, width, stackIndex, onClick }: PlanCardProps) => {
  const { updatePlan } = usePlans();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalOffset, setOriginalOffset] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(startOffset);
  const [currentWidth, setCurrentWidth] = useState(width);

  useEffect(() => {
    setCurrentOffset(startOffset);
    setCurrentWidth(width);
  }, [startOffset, width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setOriginalOffset(currentOffset);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStartX(e.clientX);
    setOriginalWidth(currentWidth);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        setCurrentOffset(Math.max(0, originalOffset + deltaX));
      }
      if (isResizing) {
        const deltaX = e.clientX - dragStartX;
        setCurrentWidth(Math.max(60, originalWidth + deltaX));
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        // Calculate new dates based on pixel changes
        const timelineElement = document.querySelector('[data-timeline]');
        if (timelineElement) {
          const timelineWidth = timelineElement.clientWidth;
          const daysInYear = 365;
          const pixelsPerDay = timelineWidth / daysInYear;

          if (isDragging) {
            const daysDelta = Math.round((currentOffset - originalOffset) / pixelsPerDay);
            const newStartDate = new Date(plan.startDate);
            newStartDate.setDate(newStartDate.getDate() + daysDelta);
            const newEndDate = new Date(plan.endDate);
            newEndDate.setDate(newEndDate.getDate() + daysDelta);

            updatePlan({
              ...plan,
              startDate: newStartDate,
              endDate: newEndDate,
            });
          }

          if (isResizing) {
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
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStartX, originalOffset, originalWidth, currentOffset, currentWidth, plan, updatePlan]);

  const duration = differenceInDays(plan.endDate, plan.startDate);

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute flex cursor-grab items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-all',
        isDragging || isResizing ? 'cursor-grabbing shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md',
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
      onClick={(e) => {
        if (!isDragging && !isResizing) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <span className="truncate font-semibold">{plan.title}</span>
      <span className="ml-auto shrink-0 text-xs opacity-75">
        {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
      </span>

      {/* Resize handle */}
      <div
        className="resize-handle absolute right-0 top-0 h-full w-3 cursor-ew-resize rounded-r-full opacity-0 hover:opacity-100"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};
