import { useResizeIndicator } from '@/context/ResizeIndicatorContext';
import { format } from 'date-fns';

export const ResizeIndicatorLine = () => {
  const { indicator } = useResizeIndicator();

  if (!indicator.isActive || !indicator.previewDate) return null;

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: `${indicator.edgeX}px`,
        top: 0,
        bottom: 0,
      }}
    >
      {/* Vertical line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
      
      {/* Date label at top - positioned above the line */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-7">
        <div className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg whitespace-nowrap">
          {format(indicator.previewDate, 'MMM d, yyyy')}
        </div>
        <div className="mx-auto h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-primary" />
      </div>
    </div>
  );
};
