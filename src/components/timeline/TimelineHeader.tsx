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
import { Search, Calendar, Layers, Plus, Magnet, Settings, AlignJustify, LayoutList, LayoutDashboard } from 'lucide-react';

interface TimelineHeaderProps {
  onAddPlan: () => void;
  onManageLabels?: () => void;
}

export const TimelineHeader = ({ onAddPlan, onManageLabels }: TimelineHeaderProps) => {
  const { zoomLevel, setZoomLevel, filterText, setFilterText, snapMode, setSnapMode, cardDensity, setCardDensity } = usePlans();
  const { labelTypes, activeSwimlaneTypeId, setActiveSwimlaneTypeId } = useLabels();

  const densityOptions: { value: CardDensity; icon: typeof AlignJustify; label: string }[] = [
    { value: 'condensed', icon: AlignJustify, label: 'Condensed - Title & dates only' },
    { value: 'standard', icon: LayoutList, label: 'Standard - Title, dates & labels' },
    { value: 'comprehensive', icon: LayoutDashboard, label: 'Comprehensive - All details' },
  ];

  const activeLabelType = labelTypes.find(lt => lt.id === activeSwimlaneTypeId);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Calendar className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">MarketerOS</h1>
          <p className="text-sm text-muted-foreground">2025 Marketing Strategy</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
};
