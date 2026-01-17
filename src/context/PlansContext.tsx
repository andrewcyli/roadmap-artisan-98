import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Plan, ZoomLevel, CardDensity } from '@/types/plan';
import { mockPlans } from '@/data/mockPlans';

export type SnapMode = 'none' | 'week' | 'month';

interface PlansContextType {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  selectedPlan: Plan | null;
  setSelectedPlan: React.Dispatch<React.SetStateAction<Plan | null>>;
  zoomLevel: ZoomLevel;
  setZoomLevel: React.Dispatch<React.SetStateAction<ZoomLevel>>;
  filterText: string;
  setFilterText: React.Dispatch<React.SetStateAction<string>>;
  snapMode: SnapMode;
  setSnapMode: React.Dispatch<React.SetStateAction<SnapMode>>;
  cardDensity: CardDensity;
  setCardDensity: React.Dispatch<React.SetStateAction<CardDensity>>;
  updatePlan: (updatedPlan: Plan) => void;
  addPlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider = ({ children }: { children: ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('year');
  const [filterText, setFilterText] = useState('');
  const [snapMode, setSnapMode] = useState<SnapMode>('week');
  const [cardDensity, setCardDensity] = useState<CardDensity>('standard');

  const updatePlan = useCallback((updatedPlan: Plan) => {
    setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
  }, []);

  const addPlan = useCallback((plan: Plan) => {
    setPlans((prev) => [...prev, plan]);
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <PlansContext.Provider
      value={{
        plans,
        setPlans,
        selectedPlan,
        setSelectedPlan,
        zoomLevel,
        setZoomLevel,
        filterText,
        setFilterText,
        snapMode,
        setSnapMode,
        cardDensity,
        setCardDensity,
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
