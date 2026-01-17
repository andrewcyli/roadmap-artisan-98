import { useState, useEffect } from 'react';
import { Plan, Channel, Team, CHANNEL_LABELS, TEAM_LABELS, PLAN_COLORS } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, Trash2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanDetailPanelProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
  defaults?: Partial<Plan> | null;
}

export const PlanDetailPanel = ({ plan, isOpen, onClose, isNew = false, defaults }: PlanDetailPanelProps) => {
  const { updatePlan, addPlan, deletePlan } = usePlans();
  const [formData, setFormData] = useState<Plan | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({ ...plan });
    } else if (isNew) {
      setFormData({
        id: crypto.randomUUID(),
        title: '',
        startDate: defaults?.startDate || new Date(),
        endDate: defaults?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        channel: defaults?.channel || 'social',
        budget: 0,
        teams: [],
        tags: [],
        color: defaults?.color || PLAN_COLORS[0].value,
      });
    }
  }, [plan, isNew]);

  const handleSave = () => {
    if (!formData) return;
    if (isNew) {
      addPlan(formData);
    } else {
      updatePlan(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!formData) return;
    deletePlan(formData.id);
    onClose();
  };

  const toggleTeam = (team: Team) => {
    if (!formData) return;
    const newTeams = formData.teams.includes(team)
      ? formData.teams.filter((t) => t !== team)
      : [...formData.teams, team];
    setFormData({ ...formData, teams: newTeams });
  };

  const addTag = () => {
    if (!formData || !newTag.trim()) return;
    if (!formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!formData) return;
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  if (!formData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-[480px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{isNew ? 'New Plan' : 'Edit Plan'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Summer Campaign"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select
              value={formData.channel}
              onValueChange={(v) => setFormData({ ...formData, channel: v as Channel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-2">
            <Label>Teams</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TEAM_LABELS) as Team[]).map((team) => (
                <Badge
                  key={team}
                  variant={formData.teams.includes(team) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTeam(team)}
                >
                  {TEAM_LABELS[team]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PLAN_COLORS.map((color) => (
                <button
                  key={color.name}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    formData.color === color.value ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {!isNew && (
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="ml-auto">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isNew ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
