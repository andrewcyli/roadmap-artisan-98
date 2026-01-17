import { useState, useEffect, useRef } from 'react';
import { usePlans } from '@/context/PlansContext';
import { Plan, Channel, CHANNEL_LABELS } from '@/types/plan';
import { TimelineGrid } from './TimelineGrid';
import { Swimlane } from './Swimlane';
import { ResizeIndicatorLine } from './ResizeIndicatorLine';
import { startOfYear, addDays } from 'date-fns';
import { PLAN_COLORS } from '@/types/plan';

interface TimelineCanvasProps {
  onPlanDoubleClick: (plan: Plan) => void;
  onCreatePlan: (channel: Channel, startDate: Date) => void;
}

export const TimelineCanvas = ({ onPlanDoubleClick, onCreatePlan }: TimelineCanvasProps) => {
  const { plans, groupBy, filterText, updatePlan } = usePlans();
  const [, setForceRender] = useState(0);
  const [draggingPlan, setDraggingPlan] = useState<Plan | null>(null);
  const [dragTargetChannel, setDragTargetChannel] = useState<Channel | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  // Group plans
  const getGroupedPlans = (): { label: string; plans: Plan[]; channelKey?: Channel }[] => {
    if (groupBy === 'channel') {
      const channels: Channel[] = ['social', 'email', 'events', 'ads', 'content'];
      return channels.map((channel) => ({
        label: CHANNEL_LABELS[channel],
        channelKey: channel,
        plans: filteredPlans.filter((p) => p.channel === channel),
      }));
    } else {
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

  const handleDragStart = (plan: Plan, e: React.MouseEvent) => {
    setDraggingPlan(plan);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragCurrentPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !draggingPlan) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragCurrentPos({ x: e.clientX, y: e.clientY });

      // Find which swimlane we're over
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const swimlane = elements.find((el) => el.hasAttribute('data-channel'));
      if (swimlane) {
        const channel = swimlane.getAttribute('data-channel') as Channel;
        setDragTargetChannel(channel);
      } else {
        setDragTargetChannel(null);
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

          // Update channel if dropped on different lane
          if (dragTargetChannel && dragTargetChannel !== draggingPlan.channel) {
            updatedPlan.channel = dragTargetChannel;
          }

          updatePlan(updatedPlan);
        }
      }

      setDraggingPlan(null);
      setDragTargetChannel(null);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingPlan, dragStartPos, dragTargetChannel, updatePlan]);

  const handleEmptyClick = (channel: Channel | undefined, clickX: number) => {
    if (!channel || groupBy !== 'channel') return;
    
    // Convert click position to date
    const timelineElement = document.querySelector('[data-timeline]');
    if (timelineElement) {
      const timelineWidth = timelineElement.clientWidth;
      const daysInYear = 365;
      const pixelsPerDay = timelineWidth / daysInYear;
      const dayOfYear = Math.floor(clickX / pixelsPerDay);
      
      const yearStart = startOfYear(new Date(2025, 0, 1));
      const clickDate = addDays(yearStart, dayOfYear);
      
      onCreatePlan(channel, clickDate);
    }
  };

  const handleDragOver = (e: React.DragEvent, channel: Channel | undefined) => {
    e.preventDefault();
    if (channel) {
      setDragTargetChannel(channel);
    }
  };

  const handleDrop = (e: React.DragEvent, channel: Channel | undefined) => {
    e.preventDefault();
    setDragTargetChannel(null);
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
            key={group.label}
            label={group.label}
            channelKey={group.channelKey}
            plans={group.plans}
            onPlanDoubleClick={onPlanDoubleClick}
            onEmptyClick={handleEmptyClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragTarget={dragTargetChannel === group.channelKey && draggingPlan?.channel !== group.channelKey}
            draggingPlan={draggingPlan}
          />
        ))}
      </div>

      {/* Drag ghost */}
      {isDragging && draggingPlan && (
        <div
          className="fixed pointer-events-none z-50 rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg opacity-90"
          style={{
            left: dragCurrentPos.x - 50,
            top: dragCurrentPos.y - 15,
            backgroundColor: draggingPlan.color,
            color: 'hsl(265 4% 12.9%)',
          }}
        >
          {draggingPlan.title}
        </div>
      )}
    </div>
  );
};
