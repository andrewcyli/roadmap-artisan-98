import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plan, CardDensity } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { useLabels } from '@/context/LabelsContext';
import { useResizeIndicator } from '@/context/ResizeIndicatorContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { GitBranch, Plus, Unlink, Pencil, Trash2, Copy, ChevronRight, LayoutList, List, Rows3 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const LONG_PRESS_DURATION = 400; // ms
const MIN_CARD_WIDTH_FOR_CONTENT = 100; // Minimum width before content overflows outside

interface PlanCardProps {
  plan: Plan;
  startOffset: number;
  width: number;
  stackIndex: number;
  cardDensity: CardDensity;
  onDoubleClick: () => void;
  onDragStart: (plan: Plan, e: React.MouseEvent) => void;
  isDraggingExternal: boolean;
  isDropTarget?: boolean;
  onCreateSubPlan?: (parentPlan: Plan) => void;
  onRemoveFromParent?: (plan: Plan) => void;
  onDelete?: (plan: Plan) => void;
  onDuplicate?: (plan: Plan) => void;
}

export const PlanCard = ({ 
  plan, 
  startOffset, 
  width, 
  stackIndex, 
  cardDensity: globalCardDensity,
  onDoubleClick,
  onDragStart,
  isDraggingExternal,
  isDropTarget = false,
  onCreateSubPlan,
  onRemoveFromParent,
  onDelete,
  onDuplicate,
}: PlanCardProps) => {
  const { updatePlan, snapMode, getChildPlans } = usePlans();
  const { labels } = useLabels();
  const { setIndicator, clearIndicator } = useResizeIndicator();
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showDensitySubmenu, setShowDensitySubmenu] = useState(false);

  // Use plan's individual density if set, otherwise use global
  const effectiveDensity = plan.displayDensity || globalCardDensity;

  // Get labels for this plan
  const planLabels = Object.entries(plan.labels)
    .map(([typeId, labelId]) => labels.find(l => l.id === labelId))
    .filter(Boolean);

  // Snap date to week or month boundary
  const snapDate = (date: Date, isStart: boolean): Date => {
    if (snapMode === 'none') return date;
    
    if (snapMode === 'week') {
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

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle-start') || target.classList.contains('resize-handle-end')) {
      return;
    }
    
    // Start long press timer
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      setMenuOpen(true);
      setIsLongPressing(false);
    }, LONG_PRESS_DURATION);
    
    e.stopPropagation();
  };

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current && !menuOpen) {
      clearLongPressTimer();
    }
  }, [clearLongPressTimer, menuOpen]);

  const handleMouseLeave = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // If mouse moves significantly, cancel long press and start drag
    if (isLongPressing && longPressTimer.current) {
      clearLongPressTimer();
      onDragStart(plan, e);
    }
  }, [isLongPressing, clearLongPressTimer, onDragStart, plan]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      const pixelsPerDay = getPixelsPerDay();
      const timelineElement = document.querySelector('[data-timeline]');
      
      if (isResizingStart) {
        const deltaX = e.clientX - dragStartX;
        const newOffset = Math.max(0, originalOffset + deltaX);
        const newWidth = Math.max(60, originalWidth - deltaX);
        setCurrentOffset(newOffset);
        setCurrentWidth(newWidth);
        
        const daysDelta = Math.round((newOffset - originalOffset) / pixelsPerDay);
        const rawStartDate = new Date(plan.startDate);
        rawStartDate.setDate(rawStartDate.getDate() + daysDelta);
        const snappedStartDate = snapDate(rawStartDate, true);
        setPreviewStartDate(snappedStartDate);
        
        if (timelineElement) {
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
        
        const daysDelta = Math.round((newWidth - originalWidth) / pixelsPerDay);
        const rawEndDate = new Date(plan.endDate);
        rawEndDate.setDate(rawEndDate.getDate() + daysDelta);
        const snappedEndDate = snapDate(rawEndDate, false);
        setPreviewEndDate(snappedEndDate);
        
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

    const handleResizeUp = () => {
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
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizingStart, isResizingEnd, dragStartX, originalOffset, originalWidth, currentOffset, currentWidth, plan, updatePlan]);

  const isResizing = isResizingStart || isResizingEnd;
  const hasChildren = getChildPlans(plan.id).length > 0;

  const handleMenuAction = (action: () => void) => {
    setMenuOpen(false);
    setShowDensitySubmenu(false);
    action();
  };

  const handleSetDisplayDensity = (density: CardDensity | null) => {
    updatePlan({ ...plan, displayDensity: density });
    setMenuOpen(false);
    setShowDensitySubmenu(false);
  };

  // Determine if card is too narrow for content
  const isNarrow = currentWidth < MIN_CARD_WIDTH_FOR_CONTENT;

  // Calculate card height based on density
  const getCardHeight = () => {
    switch (effectiveDensity) {
      case 'condensed': return 28;
      case 'standard': return 36;
      case 'comprehensive': return 72;
    }
  };

  const cardHeight = getCardHeight();
  const rowHeight = effectiveDensity === 'comprehensive' ? 76 : (effectiveDensity === 'standard' ? 44 : 36);

  // Format budget for display
  const formatBudget = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    }
    return `$${amount}`;
  };

  // Calculate overflow content width for narrow cards
  const getOverflowWidth = useMemo(() => {
    if (!isNarrow) return 0;
    // Calculate approximate width needed for title + date
    const titleLength = plan.title.length * 7; // ~7px per character
    const dateLength = 80; // "Mar 1 - 31" approx width
    return Math.max(120, titleLength + dateLength + 16);
  }, [isNarrow, plan.title]);

  // Total width including overflow area (for stacking calculations)
  const totalWidth = isNarrow ? currentWidth + getOverflowWidth : currentWidth;

  const renderCondensedCard = () => {
    if (isNarrow) {
      // Narrow card: just show colored bar, overflow content to the right
      return (
        <>
          {/* Color bar only */}
          <div className="w-full h-full" />
          {/* Overflow content outside the color box */}
          <div 
            className="absolute left-full top-1/2 -translate-y-1/2 flex items-center gap-2 pl-2 whitespace-nowrap pointer-events-none"
            style={{ minWidth: `${getOverflowWidth}px` }}
          >
            {plan.parentPlanId && (
              <span className="text-[10px] opacity-60 shrink-0">↳</span>
            )}
            <span className="text-xs font-semibold text-foreground">{plan.title}</span>
            <span className="text-[10px] text-muted-foreground">
              {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
            </span>
          </div>
        </>
      );
    }

    return (
      <>
        {plan.parentPlanId && (
          <span className="text-[10px] opacity-60 shrink-0">↳</span>
        )}
        <span className="truncate text-xs font-semibold pointer-events-none">{plan.title}</span>
        <span className="ml-auto shrink-0 text-[10px] opacity-75 pointer-events-none">
          {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
        </span>
      </>
    );
  };

  const renderStandardCard = () => {
    if (isNarrow) {
      // Narrow card: show colored bar with minimal content, overflow to right
      return (
        <>
          {/* Minimal content inside bar */}
          <span className="truncate text-xs font-semibold pointer-events-none">{plan.title.slice(0, 8)}{plan.title.length > 8 ? '…' : ''}</span>
          {/* Overflow content */}
          <div 
            className="absolute left-full top-1/2 -translate-y-1/2 flex items-center gap-2 pl-2 whitespace-nowrap pointer-events-none"
            style={{ minWidth: `${getOverflowWidth}px` }}
          >
            <span className="text-xs font-medium text-foreground">{plan.title}</span>
            {planLabels.slice(0, 2).map((label) => (
              <span
                key={label!.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground"
              >
                {label!.name}
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground">
              {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
            </span>
          </div>
        </>
      );
    }

    return (
      <>
        {plan.parentPlanId && (
          <GitBranch className="h-3 w-3 text-foreground/60 shrink-0" />
        )}
        <span className="truncate font-semibold pointer-events-none">{plan.title}</span>
        
        {/* Show up to 2 label badges */}
        <div className="flex gap-1 shrink-0">
          {planLabels.slice(0, 2).map((label) => (
            <span
              key={label!.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 truncate max-w-[60px]"
            >
              {label!.name}
            </span>
          ))}
        </div>
        
        {hasChildren && (
          <span className="text-xs bg-foreground/20 rounded-full px-1.5 py-0.5 shrink-0">
            {getChildPlans(plan.id).length}
          </span>
        )}
        
        <span className="ml-auto shrink-0 text-xs opacity-75 pointer-events-none">
          {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
        </span>
      </>
    );
  };

  const renderComprehensiveCard = () => {
    if (isNarrow) {
      // Narrow card: show colored bar, comprehensive overflow to right
      return (
        <>
          {/* Minimal content inside bar */}
          <div className="flex flex-col justify-center h-full overflow-hidden">
            <span className="truncate text-xs font-semibold pointer-events-none">{plan.title.slice(0, 6)}…</span>
          </div>
          {/* Comprehensive overflow content */}
          <div 
            className="absolute left-full top-0 flex flex-col gap-0.5 pl-2 py-1 pointer-events-none"
            style={{ minWidth: `${getOverflowWidth + 40}px` }}
          >
            <div className="flex items-center gap-2">
              {plan.parentPlanId && (
                <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className="font-semibold text-sm text-foreground">{plan.title}</span>
              {hasChildren && (
                <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 shrink-0">
                  {getChildPlans(plan.id).length} sub
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
              </span>
              {plan.budget > 0 && (
                <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-foreground">
                  {formatBudget(plan.budget)}
                </span>
              )}
            </div>
            {plan.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {plan.description}
              </p>
            )}
            <div className="flex items-center gap-1 flex-wrap">
              {planLabels.map((label) => (
                <span
                  key={label!.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground shrink-0"
                >
                  {label!.name}
                </span>
              ))}
              {plan.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="flex flex-col gap-1 w-full min-w-0 pointer-events-none">
        {/* Row 1: Title + Date + Budget */}
        <div className="flex items-center gap-2">
          {plan.parentPlanId && (
            <GitBranch className="h-3 w-3 text-foreground/60 shrink-0" />
          )}
          <span className="truncate font-semibold text-sm">{plan.title}</span>
          {hasChildren && (
            <span className="text-[10px] bg-foreground/20 rounded-full px-1.5 py-0.5 shrink-0">
              {getChildPlans(plan.id).length} sub
            </span>
          )}
          <span className="ml-auto shrink-0 text-xs opacity-75">
            {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d')}
          </span>
          {plan.budget > 0 && (
            <span className="shrink-0 text-xs font-medium bg-foreground/15 px-1.5 py-0.5 rounded">
              {formatBudget(plan.budget)}
            </span>
          )}
        </div>
        
        {/* Row 2: Description preview */}
        {plan.description && (
          <p className="text-xs opacity-70 truncate">
            {plan.description}
          </p>
        )}
        
        {/* Row 3: Labels + Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {planLabels.map((label) => (
            <span
              key={label!.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 shrink-0"
              style={{ 
                backgroundColor: label!.color.replace(')', ' / 0.3)').replace('hsl(', 'hsla('),
              }}
            >
              {label!.name}
            </span>
          ))}
          {plan.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 border border-foreground/20 shrink-0"
            >
              #{tag}
            </span>
          ))}
          {plan.tags.length > 3 && (
            <span className="text-[10px] opacity-60">+{plan.tags.length - 3}</span>
          )}
        </div>
      </div>
    );
  };

  const densityOptions: { value: CardDensity | null; label: string; icon: React.ReactNode }[] = [
    { value: null, label: 'Use Default', icon: null },
    { value: 'condensed', label: 'Condensed', icon: <List className="h-4 w-4" /> },
    { value: 'standard', label: 'Standard', icon: <LayoutList className="h-4 w-4" /> },
    { value: 'comprehensive', label: 'Comprehensive', icon: <Rows3 className="h-4 w-4" /> },
  ];

  return (
    <Popover open={menuOpen} onOpenChange={(open) => {
      setMenuOpen(open);
      if (!open) setShowDensitySubmenu(false);
    }}>
      <PopoverTrigger asChild>
        <div
          ref={cardRef}
          data-plan-id={plan.id}
          data-total-width={totalWidth}
          className={cn(
            'absolute flex cursor-grab items-center gap-2 shadow-sm transition-all select-none',
            effectiveDensity === 'comprehensive' 
              ? 'rounded-lg px-3 py-2' 
              : 'rounded-full px-3 py-1',
            effectiveDensity === 'condensed' && 'px-2',
            isResizing ? 'cursor-col-resize shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md',
            isDraggingExternal && 'opacity-50',
            isDropTarget && 'ring-2 ring-primary shadow-lg scale-105',
            plan.parentPlanId && effectiveDensity !== 'comprehensive' && 'border-l-4 border-l-primary/50',
            isLongPressing && 'ring-2 ring-primary/50 scale-[1.02]',
          )}
          style={{
            left: `${currentOffset}px`,
            width: `${currentWidth}px`,
            top: `${stackIndex * rowHeight + 8}px`,
            height: `${cardHeight}px`,
            backgroundColor: plan.color,
            color: 'hsl(265 4% 12.9%)',
            minWidth: '40px',
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onDoubleClick();
          }}
        >
          {/* Long press indicator */}
          {isLongPressing && (
            <div className={cn(
              "absolute inset-0 overflow-hidden pointer-events-none",
              effectiveDensity === 'comprehensive' ? 'rounded-lg' : 'rounded-full'
            )}>
              <div 
                className="absolute inset-0 bg-primary/20 origin-left animate-[grow-width_0.4s_linear]"
                style={{
                  animation: `grow-width ${LONG_PRESS_DURATION}ms linear forwards`,
                }}
              />
            </div>
          )}

          {/* Start date tooltip */}
          {isResizingStart && previewStartDate && (
            <div className="absolute -left-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
              <div className="absolute left-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
              {format(previewStartDate, 'MMM d, yyyy')}
            </div>
          )}

          {/* End date tooltip */}
          {isResizingEnd && previewEndDate && (
            <div className="absolute -right-1 top-full mt-1 z-50 rounded bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg whitespace-nowrap">
              <div className="absolute right-2 bottom-full h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-foreground" />
              {format(previewEndDate, 'MMM d, yyyy')}
            </div>
          )}

          {/* Resize handle - Start */}
          <div
            className={cn(
              "resize-handle-start absolute left-0 top-0 h-full w-3 cursor-ew-resize hover:bg-foreground/10",
              effectiveDensity === 'comprehensive' ? 'rounded-l-lg' : 'rounded-l-full'
            )}
            onMouseDown={handleResizeStartBegin}
          />

          {/* Card content based on density */}
          {effectiveDensity === 'condensed' && renderCondensedCard()}
          {effectiveDensity === 'standard' && renderStandardCard()}
          {effectiveDensity === 'comprehensive' && renderComprehensiveCard()}

          {/* Resize handle - End */}
          <div
            className={cn(
              "resize-handle-end absolute right-0 top-0 h-full w-3 cursor-ew-resize hover:bg-foreground/10",
              effectiveDensity === 'comprehensive' ? 'rounded-r-lg' : 'rounded-r-full'
            )}
            onMouseDown={handleResizeEndBegin}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-1" align="start" sideOffset={5}>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-foreground border-b border-border mb-1">
          <div 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: plan.color }}
          />
          <span className="truncate">{plan.title}</span>
        </div>
        
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => handleMenuAction(onDoubleClick)}
        >
          <Pencil className="h-4 w-4" />
          Edit Plan
        </button>
        
        {/* Display Size Submenu */}
        <div className="relative">
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => setShowDensitySubmenu(!showDensitySubmenu)}
          >
            <LayoutList className="h-4 w-4" />
            Display Size
            <ChevronRight className="h-4 w-4 ml-auto" />
          </button>
          
          {showDensitySubmenu && (
            <div className="absolute left-full top-0 ml-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md z-50">
              {densityOptions.map((option) => (
                <button
                  key={option.value ?? 'default'}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    (plan.displayDensity === option.value || (!plan.displayDensity && option.value === null)) && "bg-accent"
                  )}
                  onClick={() => handleSetDisplayDensity(option.value)}
                >
                  {option.icon}
                  {option.label}
                  {(plan.displayDensity === option.value || (!plan.displayDensity && option.value === null)) && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => handleMenuAction(() => onCreateSubPlan?.(plan))}
        >
          <Plus className="h-4 w-4" />
          Create Sub-plan
        </button>
        
        {plan.parentPlanId && (
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => handleMenuAction(() => onRemoveFromParent?.(plan))}
          >
            <Unlink className="h-4 w-4" />
            Remove from Parent
          </button>
        )}
        
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => handleMenuAction(() => onDuplicate?.(plan))}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
        
        <div className="my-1 h-px bg-border" />
        
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
          onClick={() => handleMenuAction(() => onDelete?.(plan))}
        >
          <Trash2 className="h-4 w-4" />
          Delete{hasChildren ? ' (with sub-plans)' : ''}
        </button>
      </PopoverContent>
    </Popover>
  );
};
