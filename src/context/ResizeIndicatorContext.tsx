import { createContext, useContext, useState, ReactNode } from 'react';

interface ResizeIndicatorState {
  isActive: boolean;
  cursorX: number;
  timelineLeft: number;
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
    cursorX: 0,
    timelineLeft: 0,
  });

  const setIndicator = (state: ResizeIndicatorState) => {
    setIndicatorState(state);
  };

  const clearIndicator = () => {
    setIndicatorState({ isActive: false, cursorX: 0, timelineLeft: 0 });
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
