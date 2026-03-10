import { usePlans, SnapMode } from '@/context/PlansContext';
import { useLabels } from '@/context/LabelsContext';
import { ZoomLevel, CardDensity } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Calendar, Layers, Plus, Magnet, Settings, AlignJustify, LayoutList, LayoutDashboard, Menu, Filter, Download, FileText, Table, Presentation } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToPDF, exportToPowerPoint } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { useState } from 'react';

interface TimelineHeaderProps {
  onAddPlan: () => void;
  onManageLabels?: () => void;
}

export const TimelineHeader = ({ onAddPlan, onManageLabels }: TimelineHeaderProps) => {
  const { zoomLevel, setZoomLevel, filterText, setFilterText, snapMode, setSnapMode, cardDensity, setCardDensity } = usePlans();
  const { labelTypes, activeSwimlaneTypeId, setActiveSwimlaneTypeId } = useLabels();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const densityOptions: { value: CardDensity; icon: typeof AlignJustify; label: string }[] = [
    { value: 'condensed', icon: AlignJustify, label: 'Condensed - Title & dates only' },
    { value: 'standard', icon: LayoutList, label: 'Standard - Title, dates & labels' },
    { value: 'comprehensive', icon: LayoutDashboard, label: 'Comprehensive - All details' },
  ];

  const activeLabelType = labelTypes.find(lt => lt.id === activeSwimlaneTypeId);

  // Desktop controls
  const DesktopControls = () => (
    <>
      {/* Search/Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter plans..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-64 pl-9"
        />
      </div>

      {/* Group By (Swimlane Type Selector) */}
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={activeSwimlaneTypeId} 
          onValueChange={setActiveSwimlaneTypeId}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Group by">
              {activeLabelType ? `By ${activeLabelType.name}` : 'Group by'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {labelTypes.map((labelType) => (
              <SelectItem key={labelType.id} value={labelType.id}>
                By {labelType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manage Labels Button */}
      {onManageLabels && (
        <Button variant="outline" size="icon" onClick={onManageLabels} title="Manage Labels">
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Card Density Toggle */}
      <div className="flex rounded-lg border border-border bg-muted p-1">
        {densityOptions.map(({ value, icon: Icon, label }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                variant={cardDensity === value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCardDensity(value)}
                className={`px-2 ${cardDensity === value ? 'bg-background shadow-sm' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Snap Mode */}
      <div className="flex items-center gap-2">
        <Magnet className="h-4 w-4 text-muted-foreground" />
        <Select value={snapMode} onValueChange={(v) => setSnapMode(v as SnapMode)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Snap" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Snap</SelectItem>
            <SelectItem value="week">Snap to Week</SelectItem>
            <SelectItem value="month">Snap to Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zoom Level */}
      <div className="flex rounded-lg border border-border bg-muted p-1">
        {(['year', 'quarter', 'month'] as ZoomLevel[]).map((level) => (
          <Button
            key={level}
            variant={zoomLevel === level ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setZoomLevel(level)}
            className={`capitalize ${zoomLevel === level ? 'bg-background shadow-sm' : ''}`}
          >
            {level}
          </Button>
        ))}
      </div>

      {/* Add Plan Button */}
      <Button onClick={onAddPlan} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Plan
      </Button>
    </>
  );

  // Mobile menu controls
  const MobileMenuContent = () => (
    <div className="flex flex-col gap-4 p-4">
      {/* Search/Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Filter</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter plans..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Group By */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Group By</label>
        <Select 
          value={activeSwimlaneTypeId} 
          onValueChange={setActiveSwimlaneTypeId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Group by">
              {activeLabelType ? `By ${activeLabelType.name}` : 'Group by'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {labelTypes.map((labelType) => (
              <SelectItem key={labelType.id} value={labelType.id}>
                By {labelType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card Density */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Display Size</label>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          {densityOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={cardDensity === value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCardDensity(value)}
              className={`flex-1 px-2 ${cardDensity === value ? 'bg-background shadow-sm' : ''}`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Snap Mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Snap Mode</label>
        <Select value={snapMode} onValueChange={(v) => setSnapMode(v as SnapMode)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Snap" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Snap</SelectItem>
            <SelectItem value="week">Snap to Week</SelectItem>
            <SelectItem value="month">Snap to Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zoom Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Zoom Level</label>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          {(['year', 'quarter', 'month'] as ZoomLevel[]).map((level) => (
            <Button
              key={level}
              variant={zoomLevel === level ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setZoomLevel(level)}
              className={`flex-1 capitalize ${zoomLevel === level ? 'bg-background shadow-sm' : ''}`}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Manage Labels Button */}
      {onManageLabels && (
        <Button 
          variant="outline" 
          onClick={() => {
            setMobileMenuOpen(false);
            onManageLabels();
          }} 
          className="w-full gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Labels
        </Button>
      )}
    </div>
  );

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
      {/* Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary shrink-0">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">MarketerOS</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">2025 Marketing Strategy</p>
        </div>
      </div>

      {/* Mobile: Menu + Add button */}
      {isMobile ? (
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
              <SheetHeader className="pb-2">
                <SheetTitle>Timeline Settings</SheetTitle>
              </SheetHeader>
              <MobileMenuContent />
            </SheetContent>
          </Sheet>
          
          <Button onClick={onAddPlan} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <DesktopControls />
        </div>
      )}
    </header>
  );
};
