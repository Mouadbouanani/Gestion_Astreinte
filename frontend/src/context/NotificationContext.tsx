import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Interface du contexte Notification
interface NotificationContextType {
  // À définir selon les besoins
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Logique du contexte Notification à implémenter
  
  const value: NotificationContextType = {
    // Valeurs à fournir
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
