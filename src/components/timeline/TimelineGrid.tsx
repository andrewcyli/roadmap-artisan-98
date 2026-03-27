import { usePlans } from '@/context/PlansContext';
import { format, eachMonthOfInterval, startOfYear, endOfYear, startOfQuarter, eachQuarterOfInterval, eachWeekOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export const TimelineGrid = () => {
  const { zoomLevel } = usePlans();
  const year = 2025;
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const getTimeMarkers = () => {
    switch (zoomLevel) {
      case 'year':
        return eachMonthOfInterval({ start: yearStart, end: yearEnd }).map((date) => ({
          date,
          label: format(date, 'MMM'),
          width: `${100 / 12}%`,
        }));
      case 'quarter':
        return eachMonthOfInterval({ start: yearStart, end: yearEnd }).map((date) => ({
          date,
          label: format(date, 'MMM'),
          width: `${100 / 12}%`,
          isQuarterStart: date.getMonth() % 3 === 0,
        }));
      case 'month':
        // Show weeks for current month (simulated as January for demo)
        const monthStart = startOfMonth(new Date(year, 0, 1));
        const monthEnd = endOfMonth(new Date(year, 0, 1));
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });
        return weeks.map((date, i) => ({
          date,
          label: `Week ${i + 1}`,
          width: `${100 / weeks.length}%`,
        }));
      default:
        return [];
    }
  };

  const markers = getTimeMarkers();

  return (
    <div className="flex border-b border-border bg-muted/30">
      {/* Empty space for swimlane labels - hidden on mobile */}
      <div className="hidden sm:flex w-32 md:w-48 shrink-0 border-r border-border bg-muted/50 px-2 md:px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {zoomLevel === 'year' ? '2025' : zoomLevel === 'quarter' ? 'Q1-Q4 2025' : 'January 2025'}
        </span>
      </div>

      {/* Time markers */}
      <div className="flex flex-1 overflow-x-auto">
        {markers.map((marker, i) => (
          <div
            key={i}
            className="border-r border-border/50 px-1 sm:px-2 py-2 text-center last:border-r-0 shrink-0 sm:shrink"
            style={{ width: marker.width, minWidth: '40px' }}
          >
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
              {marker.label}
            </span>
            {'isQuarterStart' in marker && marker.isQuarterStart && (
              <div className="mt-0.5 text-[8px] sm:text-[10px] font-bold text-primary">
                Q{Math.floor(marker.date.getMonth() / 3) + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
