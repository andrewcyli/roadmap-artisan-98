import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plan, CardDensity } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { useLabels } from '@/context/LabelsContext';
import { useResizeIndicator } from '@/context/ResizeIndicatorContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, Unlink, Pencil, Trash2, Copy, ChevronRight, LayoutList, List, Rows3 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const LONG_PRESS_DURATION = 400;
const MIN_BAR_WIDTH_FOR_CONTENT = 120; // Minimum bar width before overflow
const DRAG_THRESHOLD = 5;

// Fixed bar height for sleek look
const BAR_HEIGHT = 24;

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
  const { updatePlan, snapMode, getChildPlans, selectedPlan } = usePlans();
  const { labels } = useLabels();
  const { setIndicator, clearIndicator } = useResizeIndicator();
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
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
    
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    
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
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        hasDragged.current = true;
        if (isLongPressing && longPressTimer.current) {
          clearLongPressTimer();
          onDragStart(plan, e);
        }
      }
    }
  }, [isLongPressing, clearLongPressTimer, onDragStart, plan]);

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
  const childCount = getChildPlans(plan.id).length;
  const isSelected = selectedPlan?.id === plan.id;

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

  // Check if bar is too narrow for inline content
  const isNarrow = currentWidth < MIN_BAR_WIDTH_FOR_CONTENT;

  // Calculate total card height based on density
  const getCardHeight = () => {
    switch (effectiveDensity) {
      case 'condensed': return 32;  // Just bar + padding
      case 'standard': return 52;   // Bar + info row below
      case 'comprehensive': return 80; // Bar + description + metadata
    }
  };

  const cardHeight = getCardHeight();
  
  // Row height for stacking (includes gap between rows)
  const getRowHeight = () => {
    switch (effectiveDensity) {
      case 'condensed': return 40;
      case 'standard': return 60;
      case 'comprehensive': return 88;
    }
  };

  const rowHeight = getRowHeight();

  // Format budget for display
  const formatBudget = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    return `$${amount}`;
  };

  // Calculate overflow content width for narrow cards
  const getOverflowWidth = useMemo(() => {
    if (!isNarrow) return 0;
    const titleLength = plan.title.length * 7;
    const dateLength = 90;
    const extraContent = effectiveDensity === 'comprehensive' ? 100 : 60;
    return Math.max(140, titleLength + dateLength + extraContent);
  }, [isNarrow, plan.title, effectiveDensity]);

  const totalWidth = isNarrow ? currentWidth + getOverflowWidth : currentWidth;

  // Format date range compactly
  const dateRange = `${format(plan.startDate, 'MMM d')} – ${format(plan.endDate, 'MMM d')}`;

  // =================================
  // RENDER: Color Bar (title + dates)
  // =================================
  const renderColorBar = () => (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 rounded-xl shadow-sm transition-all",
        "hover:shadow-md cursor-grab active:cursor-grabbing",
        isResizing && "shadow-lg ring-2 ring-primary/30",
        isSelected && "ring-2 ring-primary ring-offset-1",
        isLongPressing && "ring-2 ring-primary/50 scale-[1.02]",
        isDropTarget && "ring-2 ring-primary shadow-lg scale-105"
      )}
      style={{
        backgroundColor: plan.color,
        height: BAR_HEIGHT,
        width: currentWidth,
        minWidth: 24,
      }}
    >
      {/* Long press indicator */}
      {isLongPressing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
          <div 
            className="absolute inset-0 bg-primary/20 origin-left"
            style={{ animation: `grow-width ${LONG_PRESS_DURATION}ms linear forwards` }}
          />
        </div>
      )}

      {/* Resize handle - Start */}
      <div
        className="resize-handle-start absolute left-0 top-0 h-full w-2 cursor-ew-resize hover:bg-foreground/10 rounded-l-xl z-10"
        onMouseDown={handleResizeStartBegin}
      />

      {/* Content inside bar - only if wide enough */}
      {!isNarrow && (
        <>
          <span className="text-[13px] font-semibold text-foreground/90 truncate flex-1 pointer-events-none">
            {plan.title}
          </span>
          <span className="text-[11px] text-foreground/70 whitespace-nowrap flex-shrink-0 pointer-events-none">
            {dateRange}
          </span>
        </>
      )}

      {/* Resize handle - End */}
      <div
        className="resize-handle-end absolute right-0 top-0 h-full w-2 cursor-ew-resize hover:bg-foreground/10 rounded-r-xl z-10"
        onMouseDown={handleResizeEndBegin}
      />

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
    </div>
  );

  // =================================
  // RENDER: Overflow Content (narrow cards)
  // =================================
  const renderOverflowContent = () => {
    if (!isNarrow) return null;

    return (
      <div 
        className="absolute left-full top-0 flex flex-col gap-0.5 pl-2 pointer-events-none"
        style={{ width: getOverflowWidth }}
      >
        {/* Title + Date row */}
        <div className="flex items-center gap-2 h-6">
          <span className="text-[13px] font-semibold text-foreground truncate">
            {plan.title}
          </span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {dateRange}
          </span>
        </div>

        {/* Standard/Comprehensive: Labels + Budget */}
        {effectiveDensity !== 'condensed' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {planLabels.slice(0, 3).map((label) => (
              <span
                key={label!.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
              >
                {label!.name}
              </span>
            ))}
            {hasChildren && (
              <span className="text-[10px] text-muted-foreground">↳{childCount}</span>
            )}
            {plan.budget > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {formatBudget(plan.budget)}
              </span>
            )}
          </div>
        )}

        {/* Comprehensive: Description */}
        {effectiveDensity === 'comprehensive' && plan.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[250px]">
            {plan.description}
          </p>
        )}
      </div>
    );
  };

  // =================================
  // RENDER: Below Bar Content (wide cards)
  // =================================
  const renderBelowBarContent = () => {
    if (isNarrow || effectiveDensity === 'condensed') return null;

    return (
      <div className="mt-1 pl-2 pointer-events-none">
        {/* Standard: Labels + Budget + Children */}
        {effectiveDensity === 'standard' && (
          <div className="flex items-center gap-1.5">
            {planLabels.slice(0, 3).map((label) => (
              <span
                key={label!.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
              >
                {label!.name}
              </span>
            ))}
            <div className="flex items-center gap-2 ml-auto pr-2">
              {hasChildren && (
                <span className="text-[10px] text-muted-foreground">↳ {childCount}</span>
              )}
              {plan.budget > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {formatBudget(plan.budget)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Comprehensive: Description + Labels + Tags + Budget */}
        {effectiveDensity === 'comprehensive' && (
          <div className="flex flex-col gap-1">
            {plan.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 pr-2">
                {plan.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {planLabels.map((label) => (
                <span
                  key={label!.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                >
                  {label!.name}
                </span>
              ))}
              {plan.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-primary/70"
                >
                  #{tag}
                </span>
              ))}
              <div className="flex items-center gap-2 ml-auto pr-2">
                {hasChildren && (
                  <span className="text-[10px] text-muted-foreground">↳ {childCount}</span>
                )}
                {plan.budget > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatBudget(plan.budget)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
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
            'absolute flex flex-col select-none',
            isDraggingExternal && 'opacity-50',
          )}
          style={{
            left: `${currentOffset}px`,
            width: `${currentWidth}px`,
            top: `${stackIndex * rowHeight + 8}px`,
            height: `${cardHeight}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!hasDragged.current && !isResizing) {
              onDoubleClick();
            }
          }}
        >
          {/* Color Bar - always present */}
          <div className="relative">
            {renderColorBar()}
            {renderOverflowContent()}
          </div>

          {/* Content below bar */}
          {renderBelowBarContent()}
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
        <div 
          className="relative"
          onMouseEnter={() => setShowDensitySubmenu(true)}
          onMouseLeave={() => setShowDensitySubmenu(false)}
        >
          <div
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <LayoutList className="h-4 w-4" />
            Display Size
            <ChevronRight className="h-4 w-4 ml-auto" />
          </div>
          
          {showDensitySubmenu && (
            <div className="absolute left-full top-0 ml-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md z-50">
              {densityOptions.map((option) => (
                <button
                  key={option.value ?? 'default'}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    (plan.displayDensity === option.value || (!plan.displayDensity && option.value === null)) && "bg-accent"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDisplayDensity(option.value);
                  }}
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

// Helper function for calculating overflow width (exported for Swimlane)
export const calculatePlanOverflowWidth = (plan: Plan, barWidth: number, density: CardDensity): number => {
  if (barWidth >= MIN_BAR_WIDTH_FOR_CONTENT) return 0;
  const effectiveDensity = plan.displayDensity || density;
  const titleLength = plan.title.length * 7;
  const dateLength = 90;
  const extraContent = effectiveDensity === 'comprehensive' ? 100 : 60;
  return Math.max(140, titleLength + dateLength + extraContent);
};
