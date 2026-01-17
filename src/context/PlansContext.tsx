import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Plan, ZoomLevel, GroupBy } from '@/types/plan';
import { mockPlans } from '@/data/mockPlans';

interface PlansContextType {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  selectedPlan: Plan | null;
  setSelectedPlan: React.Dispatch<React.SetStateAction<Plan | null>>;
  zoomLevel: ZoomLevel;
  setZoomLevel: React.Dispatch<React.SetStateAction<ZoomLevel>>;
  groupBy: GroupBy;
  setGroupBy: React.Dispatch<React.SetStateAction<GroupBy>>;
  filterText: string;
  setFilterText: React.Dispatch<React.SetStateAction<string>>;
  updatePlan: (updatedPlan: Plan) => void;
  addPlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider = ({ children }: { children: ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('year');
  const [groupBy, setGroupBy] = useState<GroupBy>('channel');
  const [filterText, setFilterText] = useState('');

  const updatePlan = (updatedPlan: Plan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  };

  const addPlan = (plan: Plan) => {
    setPlans((prev) => [...prev, plan]);
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <PlansContext.Provider
      value={{
        plans,
        setPlans,
        selectedPlan,
        setSelectedPlan,
        zoomLevel,
        setZoomLevel,
        groupBy,
        setGroupBy,
        filterText,
        setFilterText,
        updatePlan,
        addPlan,
        deletePlan,
      }}
    >
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (!context) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};
