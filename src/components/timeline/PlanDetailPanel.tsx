import { useState, useEffect } from 'react';
import { Plan, PLAN_COLORS, LabelType, Label } from '@/types/plan';
import { usePlans } from '@/context/PlansContext';
import { useLabels } from '@/context/LabelsContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label as UILabel } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays } from 'date-fns';
import { CalendarIcon, DollarSign, Trash2, X, Plus, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlanDetailPanelProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
  defaults?: Partial<Plan> | null;
}

export const PlanDetailPanel = ({ plan, isOpen, onClose, isNew = false, defaults }: PlanDetailPanelProps) => {
  const { updatePlan, addPlan, deletePlan, plans } = usePlans();
  const { labelTypes, getLabelsByType, activeSwimlaneTypeId } = useLabels();
  const [formData, setFormData] = useState<Plan | null>(null);
  const isMobile = useIsMobile();
  const [newTag, setNewTag] = useState('');

  // Get potential parent plans (exclude self and children)
  const availableParentPlans = plans.filter(p => 
    p.id !== formData?.id && p.parentPlanId !== formData?.id
  );

  useEffect(() => {
    if (plan) {
      setFormData({ ...plan });
    } else if (isNew) {
      const defaultLabels: Record<string, string> = {};
      
      // Set default label if provided
      if (defaults?.labels) {
        Object.assign(defaultLabels, defaults.labels);
      }
      
      setFormData({
        id: crypto.randomUUID(),
        title: '',
        description: '',
        startDate: defaults?.startDate || new Date(),
        endDate: defaults?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        budget: 0,
        labels: defaultLabels,
        tags: [],
        color: defaults?.color || PLAN_COLORS[0].value,
        parentPlanId: null,
        useRelativeDates: false,
      });
    }
  }, [plan, isNew, defaults]);

  const handleSave = () => {
    if (!formData) return;
    
    // If using relative dates and has parent, calculate relative offsets
    let planToSave = { ...formData };
    if (formData.useRelativeDates && formData.parentPlanId) {
      const parentPlan = plans.find(p => p.id === formData.parentPlanId);
      if (parentPlan) {
        planToSave.relativeStartOffset = differenceInDays(formData.startDate, parentPlan.startDate);
        planToSave.relativeEndOffset = differenceInDays(formData.endDate, parentPlan.startDate);
      }
    }
    
    if (isNew) {
      addPlan(planToSave);
    } else {
      updatePlan(planToSave);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!formData) return;
    deletePlan(formData.id);
    onClose();
  };

  const setLabel = (typeId: string, labelId: string | null) => {
    if (!formData) return;
    const newLabels = { ...formData.labels };
    if (labelId) {
      newLabels[typeId] = labelId;
    } else {
      delete newLabels[typeId];
    }
    setFormData({ ...formData, labels: newLabels });
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

  const handleParentChange = (parentId: string | null) => {
    if (!formData) return;
    setFormData({ 
      ...formData, 
      parentPlanId: parentId,
      useRelativeDates: parentId ? formData.useRelativeDates : false,
    });
  };

  if (!formData) return null;

  // Shared form content for both Sheet and Drawer
  const FormContent = () => (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Title */}
      <div className="space-y-2">
        <UILabel htmlFor="title">Title</UILabel>
        <Input
          id="title"
          value={formData!.title}
          onChange={(e) => setFormData({ ...formData!, title: e.target.value })}
          placeholder="e.g., Summer Campaign"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <UILabel htmlFor="description">Description</UILabel>
        <Textarea
          id="description"
          value={formData!.description || ''}
          onChange={(e) => setFormData({ ...formData!, description: e.target.value })}
          placeholder="Add a description for this plan..."
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <UILabel className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Parent Plan (Optional)
        </UILabel>
        <Select
          value={formData!.parentPlanId || '__none__'}
          onValueChange={(v) => handleParentChange(v === '__none__' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No parent (standalone)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No parent (standalone)</SelectItem>
            {availableParentPlans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {formData!.parentPlanId && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-muted">
            <Switch
              id="relative-dates"
              checked={formData!.useRelativeDates}
              onCheckedChange={(checked) => 
                setFormData({ ...formData!, useRelativeDates: checked })
              }
            />
            <UILabel htmlFor="relative-dates" className="text-sm cursor-pointer">
              Use relative dates (move with parent)
            </UILabel>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <UILabel>Start Date</UILabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData!.startDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData!.startDate}
                onSelect={(date) => date && setFormData({ ...formData!, startDate: date })}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <UILabel>End Date</UILabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData!.endDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData!.endDate}
                onSelect={(date) => date && setFormData({ ...formData!, endDate: date })}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Labels Section */}
      <div className="space-y-4">
        <UILabel className="text-base font-medium">Labels</UILabel>
        {labelTypes.map((labelType) => {
          const labelsForType = getLabelsByType(labelType.id);
          return (
            <div key={labelType.id} className="space-y-2">
              <UILabel className="text-sm text-muted-foreground">{labelType.name}</UILabel>
              <Select
                value={formData!.labels[labelType.id] || '__none__'}
                onValueChange={(v) => setLabel(labelType.id, v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${labelType.name.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {labelsForType.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <UILabel htmlFor="budget">Budget</UILabel>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="budget"
            type="number"
            value={formData!.budget}
            onChange={(e) => setFormData({ ...formData!, budget: Number(e.target.value) })}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <UILabel>Tags (for filtering)</UILabel>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData!.tags.map((tag) => (
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
        <UILabel>Color</UILabel>
        <div className="flex flex-wrap gap-2">
          {PLAN_COLORS.map((color) => (
            <button
              key={color.name}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 touch-manipulation',
                formData!.color === color.value ? 'border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => setFormData({ ...formData!, color: color.value })}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        {!isNew && (
          <Button variant="destructive" onClick={handleDelete} className="gap-2 order-last sm:order-first">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <div className="flex gap-3 sm:ml-auto">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            {isNew ? 'Create' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: Use Drawer from bottom
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{isNew ? 'New Plan' : 'Edit Plan'}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 pb-8">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Sheet from side
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-[480px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{isNew ? 'New Plan' : 'Edit Plan'}</SheetTitle>
        </SheetHeader>
        <FormContent />
      </SheetContent>
    </Sheet>
  );
};
