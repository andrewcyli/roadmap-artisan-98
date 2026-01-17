import { useResizeIndicator } from '@/context/ResizeIndicatorContext';
import { format, startOfYear, addDays } from 'date-fns';

export const ResizeIndicatorLine = () => {
  const { indicator } = useResizeIndicator();

  if (!indicator.isActive) return null;

  // Calculate the date based on cursor position
  const timelineElement = document.querySelector('[data-timeline]');
  if (!timelineElement) return null;

  const timelineRect = timelineElement.getBoundingClientRect();
  const relativeX = indicator.cursorX - timelineRect.left;
  const timelineWidth = timelineRect.width;
  const daysInYear = 365;
  const pixelsPerDay = timelineWidth / daysInYear;
  const dayOfYear = Math.max(0, Math.min(daysInYear - 1, Math.floor(relativeX / pixelsPerDay)));
  
  const yearStart = startOfYear(new Date(2025, 0, 1));
  const currentDate = addDays(yearStart, dayOfYear);

  // Calculate line position relative to timeline container
  const lineLeft = Math.max(0, Math.min(timelineWidth, relativeX));

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: `${lineLeft}px`,
        top: 0,
        bottom: 0,
      }}
    >
      {/* Vertical line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-primary" />
      
      {/* Date label at top */}
      <div className="absolute -left-12 -top-6 w-24 text-center">
        <div className="inline-block rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg whitespace-nowrap">
          {format(currentDate, 'MMM d, yyyy')}
        </div>
        <div className="mx-auto h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-primary" />
      </div>
    </div>
  );
};
