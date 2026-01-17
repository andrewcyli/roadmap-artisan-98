import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plan } from '@/types/plan';
import { format, differenceInDays } from 'date-fns';
import { GitBranch, Calendar, Link2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface NestPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childPlan: Plan | null;
  parentPlan: Plan | null;
  onConfirm: (useRelativeDates: boolean) => void;
}

export const NestPlanDialog = ({
  open,
  onOpenChange,
  childPlan,
  parentPlan,
  onConfirm,
}: NestPlanDialogProps) => {
  const [useRelativeDates, setUseRelativeDates] = useState(true);

  if (!childPlan || !parentPlan) return null;

  const relativeStartOffset = differenceInDays(childPlan.startDate, parentPlan.startDate);
  const relativeEndOffset = differenceInDays(childPlan.endDate, parentPlan.startDate);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Create Sub-plan
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Nest "<span className="font-medium text-foreground">{childPlan.title}</span>" as a sub-plan of "<span className="font-medium text-foreground">{parentPlan.title}</span>"?
              </p>
              
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Parent:</span>
                  <span className="font-medium text-foreground">{parentPlan.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm pl-6">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {format(parentPlan.startDate, 'MMM d')} - {format(parentPlan.endDate, 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="border-l-2 border-primary/30 ml-2 pl-4 mt-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Sub-plan:</span>
                    <span className="font-medium text-foreground">{childPlan.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm pl-6 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(childPlan.startDate, 'MMM d')} - {format(childPlan.endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="relative-dates" className="text-sm font-medium">
                    Use relative dates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sub-plan will move when parent moves
                    {useRelativeDates && (
                      <span className="block mt-1 text-primary">
                        Offset: {relativeStartOffset >= 0 ? '+' : ''}{relativeStartOffset} to {relativeEndOffset >= 0 ? '+' : ''}{relativeEndOffset} days from parent start
                      </span>
                    )}
                  </p>
                </div>
                <Switch
                  id="relative-dates"
                  checked={useRelativeDates}
                  onCheckedChange={setUseRelativeDates}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(useRelativeDates)}>
            Create Sub-plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
