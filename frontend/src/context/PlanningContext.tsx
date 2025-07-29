import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Interface du contexte Planning
interface PlanningContextType {
  // À définir selon les besoins
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

interface PlanningProviderProps {
  children: ReactNode;
}

export const PlanningProvider: React.FC<PlanningProviderProps> = ({ children }) => {
  // Logique du contexte Planning à implémenter
  
  const value: PlanningContextType = {
    // Valeurs à fournir
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanning = (): PlanningContextType => {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export default PlanningContext;
