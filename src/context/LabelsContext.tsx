import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { LabelType, Label } from '@/types/plan';
import { defaultLabelTypes, defaultLabels } from '@/data/defaultLabels';

interface LabelsContextType {
  labelTypes: LabelType[];
  labels: Label[];
  activeSwimlaneTypeId: string;
  setActiveSwimlaneTypeId: (id: string) => void;
  
  // Label type CRUD
  addLabelType: (labelType: LabelType) => void;
  updateLabelType: (labelType: LabelType) => void;
  deleteLabelType: (id: string) => void;
  
  // Label CRUD
  addLabel: (label: Label) => void;
  updateLabel: (label: Label) => void;
  deleteLabel: (id: string) => void;
  
  // Helper functions
  getLabelType: (id: string) => LabelType | undefined;
  getLabel: (id: string) => Label | undefined;
  getLabelsByType: (typeId: string) => Label[];
  getLabelName: (labelId: string) => string;
  getLabelColor: (labelId: string) => string;
}

const LabelsContext = createContext<LabelsContextType | undefined>(undefined);

export const LabelsProvider = ({ children }: { children: ReactNode }) => {
  const [labelTypes, setLabelTypes] = useState<LabelType[]>(defaultLabelTypes);
  const [labels, setLabels] = useState<Label[]>(defaultLabels);
  const [activeSwimlaneTypeId, setActiveSwimlaneTypeId] = useState<string>('channel');

  // Label type CRUD
  const addLabelType = useCallback((labelType: LabelType) => {
    setLabelTypes(prev => [...prev, labelType]);
  }, []);

  const updateLabelType = useCallback((labelType: LabelType) => {
    setLabelTypes(prev => prev.map(lt => lt.id === labelType.id ? labelType : lt));
  }, []);

  const deleteLabelType = useCallback((id: string) => {
    setLabelTypes(prev => prev.filter(lt => lt.id !== id));
    // Also delete all labels of this type
    setLabels(prev => prev.filter(l => l.typeId !== id));
    // Reset swimlane if we deleted the active type
    if (activeSwimlaneTypeId === id) {
      setActiveSwimlaneTypeId(labelTypes[0]?.id || 'channel');
    }
  }, [activeSwimlaneTypeId, labelTypes]);

  // Label CRUD
  const addLabel = useCallback((label: Label) => {
    setLabels(prev => [...prev, label]);
  }, []);

  const updateLabel = useCallback((label: Label) => {
    setLabels(prev => prev.map(l => l.id === label.id ? label : l));
  }, []);

  const deleteLabel = useCallback((id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
  }, []);

  // Helper functions
  const getLabelType = useCallback((id: string) => {
    return labelTypes.find(lt => lt.id === id);
  }, [labelTypes]);

  const getLabel = useCallback((id: string) => {
    return labels.find(l => l.id === id);
  }, [labels]);

  const getLabelsByType = useCallback((typeId: string) => {
    return labels.filter(l => l.typeId === typeId).sort((a, b) => a.order - b.order);
  }, [labels]);

  const getLabelName = useCallback((labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.name || 'Unknown';
  }, [labels]);

  const getLabelColor = useCallback((labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.color || 'hsl(210 80% 70%)';
  }, [labels]);

  return (
    <LabelsContext.Provider
      value={{
        labelTypes,
        labels,
        activeSwimlaneTypeId,
        setActiveSwimlaneTypeId,
        addLabelType,
        updateLabelType,
        deleteLabelType,
        addLabel,
        updateLabel,
        deleteLabel,
        getLabelType,
        getLabel,
        getLabelsByType,
        getLabelName,
        getLabelColor,
      }}
    >
      {children}
    </LabelsContext.Provider>
  );
};

export const useLabels = () => {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error('useLabels must be used within a LabelsProvider');
  }
  return context;
};
