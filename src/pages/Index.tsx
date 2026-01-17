import { useState } from 'react';
import { PlansProvider, usePlans } from '@/context/PlansContext';
import { TimelineHeader } from '@/components/timeline/TimelineHeader';
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas';
import { PlanDetailPanel } from '@/components/timeline/PlanDetailPanel';
import { Plan } from '@/types/plan';

const TimelineApp = () => {
  const { selectedPlan, setSelectedPlan } = usePlans();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const handlePlanClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsNewPlan(false);
    setIsPanelOpen(true);
  };

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setIsNewPlan(true);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedPlan(null);
    setIsNewPlan(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <TimelineHeader onAddPlan={handleAddPlan} />
      <TimelineCanvas onPlanClick={handlePlanClick} />
      <PlanDetailPanel
        plan={selectedPlan}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        isNew={isNewPlan}
      />
    </div>
  );
};

const Index = () => {
  return (
    <PlansProvider>
      <TimelineApp />
    </PlansProvider>
  );
};

export default Index;
