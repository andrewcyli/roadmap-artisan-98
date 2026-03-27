import { createContext, useContext, useState, ReactNode } from 'react';

interface ResizeIndicatorState {
  isActive: boolean;
  edgeX: number; // The X position of the plan bar edge being resized (relative to timeline)
  isStart: boolean; // Whether resizing start or end
  previewDate: Date | null;
}

interface ResizeIndicatorContextType {
  indicator: ResizeIndicatorState;
  setIndicator: (state: ResizeIndicatorState) => void;
  clearIndicator: () => void;
}

const ResizeIndicatorContext = createContext<ResizeIndicatorContextType | undefined>(undefined);

export const ResizeIndicatorProvider = ({ children }: { children: ReactNode }) => {
  const [indicator, setIndicatorState] = useState<ResizeIndicatorState>({
    isActive: false,
    edgeX: 0,
    isStart: true,
    previewDate: null,
  });

  const setIndicator = (state: ResizeIndicatorState) => {
    setIndicatorState(state);
  };

  const clearIndicator = () => {
    setIndicatorState({ isActive: false, edgeX: 0, isStart: true, previewDate: null });
  };

  return (
    <ResizeIndicatorContext.Provider value={{ indicator, setIndicator, clearIndicator }}>
      {children}
    </ResizeIndicatorContext.Provider>
  );
};

export const useResizeIndicator = () => {
  const context = useContext(ResizeIndicatorContext);
  if (!context) {
    throw new Error('useResizeIndicator must be used within a ResizeIndicatorProvider');
  }
  return context;
};
