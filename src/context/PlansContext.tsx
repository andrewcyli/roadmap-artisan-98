import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Plan, ZoomLevel, CardDensity } from '@/types/plan';
import { mockPlans } from '@/data/mockPlans';
import { addDays, differenceInDays } from 'date-fns';

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
  
  // Hierarchy helpers
  getChildPlans: (parentId: string) => Plan[];
  getParentPlan: (planId: string) => Plan | null;
  calculateAbsoluteDates: (plan: Plan) => { startDate: Date; endDate: Date };
  updateChildPlansDates: (parentPlan: Plan) => void;
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
    setPlans((prev) => {
      const newPlans = prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      
      // If this plan has children with relative dates, update them
      const childPlans = newPlans.filter(p => p.parentPlanId === updatedPlan.id && p.useRelativeDates);
      if (childPlans.length > 0) {
        return newPlans.map(p => {
          if (p.parentPlanId === updatedPlan.id && p.useRelativeDates) {
            return {
              ...p,
              startDate: addDays(updatedPlan.startDate, p.relativeStartOffset || 0),
              endDate: addDays(updatedPlan.startDate, p.relativeEndOffset || 0),
            };
          }
          return p;
        });
      }
      
      return newPlans;
    });
  }, []);

  const addPlan = useCallback((plan: Plan) => {
    setPlans((prev) => [...prev, plan]);
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => {
      // Also delete child plans or orphan them
      return prev.filter((p) => p.id !== id && p.parentPlanId !== id);
    });
  }, []);

  const getChildPlans = useCallback((parentId: string) => {
    return plans.filter(p => p.parentPlanId === parentId);
  }, [plans]);

  const getParentPlan = useCallback((planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan?.parentPlanId) return null;
    return plans.find(p => p.id === plan.parentPlanId) || null;
  }, [plans]);

  const calculateAbsoluteDates = useCallback((plan: Plan) => {
    if (!plan.useRelativeDates || !plan.parentPlanId) {
      return { startDate: plan.startDate, endDate: plan.endDate };
    }
    
    const parentPlan = plans.find(p => p.id === plan.parentPlanId);
    if (!parentPlan) {
      return { startDate: plan.startDate, endDate: plan.endDate };
    }
    
    return {
      startDate: addDays(parentPlan.startDate, plan.relativeStartOffset || 0),
      endDate: addDays(parentPlan.startDate, plan.relativeEndOffset || 0),
    };
  }, [plans]);

  const updateChildPlansDates = useCallback((parentPlan: Plan) => {
    setPlans(prev => prev.map(p => {
      if (p.parentPlanId === parentPlan.id && p.useRelativeDates) {
        return {
          ...p,
          startDate: addDays(parentPlan.startDate, p.relativeStartOffset || 0),
          endDate: addDays(parentPlan.startDate, p.relativeEndOffset || 0),
        };
      }
      return p;
    }));
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
        getChildPlans,
        getParentPlan,
        calculateAbsoluteDates,
        updateChildPlansDates,
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
