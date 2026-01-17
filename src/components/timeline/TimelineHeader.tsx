import { usePlans } from '@/context/PlansContext';
import { ZoomLevel, GroupBy } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, Layers, Plus } from 'lucide-react';

interface TimelineHeaderProps {
  onAddPlan: () => void;
}

export const TimelineHeader = ({ onAddPlan }: TimelineHeaderProps) => {
  const { zoomLevel, setZoomLevel, groupBy, setGroupBy, filterText, setFilterText } = usePlans();

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

        {/* Group By */}
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="channel">By Channel</SelectItem>
              <SelectItem value="campaign">By Campaign</SelectItem>
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
