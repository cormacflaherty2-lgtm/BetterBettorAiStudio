import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AppContextType {
  isPro: boolean;
  setIsPro: (val: boolean) => void;
  unreadAlerts: number;
  setUnreadAlerts: (val: number) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(2);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AppContext.Provider value={{ 
      isPro, 
      setIsPro, 
      unreadAlerts, 
      setUnreadAlerts, 
      isAuthenticated, 
      setIsAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
