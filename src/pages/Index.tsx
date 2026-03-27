import { useState } from 'react';
import { PlansProvider, usePlans } from '@/context/PlansContext';
import { LabelsProvider, useLabels } from '@/context/LabelsContext';
import { ResizeIndicatorProvider } from '@/context/ResizeIndicatorContext';
import { TimelineHeader } from '@/components/timeline/TimelineHeader';
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas';
import { PlanDetailPanel } from '@/components/timeline/PlanDetailPanel';
import { LabelSettingsDialog } from '@/components/labels/LabelSettingsDialog';
import { Plan, PLAN_COLORS } from '@/types/plan';
import { addDays } from 'date-fns';

const TimelineApp = () => {
  const { selectedPlan, setSelectedPlan } = usePlans();
  const { activeSwimlaneTypeId } = useLabels();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [newPlanDefaults, setNewPlanDefaults] = useState<Partial<Plan> | null>(null);
  const [isLabelSettingsOpen, setIsLabelSettingsOpen] = useState(false);

  const handlePlanDoubleClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsNewPlan(false);
    setNewPlanDefaults(null);
    setIsPanelOpen(true);
  };

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setIsNewPlan(true);
    setNewPlanDefaults(null);
    setIsPanelOpen(true);
  };

  const handleCreatePlan = (labelId: string, startDate: Date) => {
    setSelectedPlan(null);
    setIsNewPlan(true);
    setNewPlanDefaults({
      labels: { [activeSwimlaneTypeId]: labelId },
      startDate,
      endDate: addDays(startDate, 14),
      color: PLAN_COLORS[Math.floor(Math.random() * PLAN_COLORS.length)].value,
    });
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedPlan(null);
    setIsNewPlan(false);
    setNewPlanDefaults(null);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <TimelineHeader 
        onAddPlan={handleAddPlan} 
        onManageLabels={() => setIsLabelSettingsOpen(true)}
      />
      <TimelineCanvas 
        onPlanDoubleClick={handlePlanDoubleClick} 
        onCreatePlan={handleCreatePlan}
      />
      <PlanDetailPanel
        plan={selectedPlan}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        isNew={isNewPlan}
        defaults={newPlanDefaults}
      />
      <LabelSettingsDialog 
        isOpen={isLabelSettingsOpen} 
        onClose={() => setIsLabelSettingsOpen(false)} 
      />
    </div>
  );
};

// Main Index component with providers
const Index = () => {
  return (
    <LabelsProvider>
      <PlansProvider>
        <ResizeIndicatorProvider>
          <TimelineApp />
        </ResizeIndicatorProvider>
      </PlansProvider>
    </LabelsProvider>
  );
};

export default Index;
