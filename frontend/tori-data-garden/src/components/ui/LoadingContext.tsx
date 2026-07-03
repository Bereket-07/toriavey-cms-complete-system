import React, { createContext, useContext, useState } from "react";

interface LoadingContextType {
  loading: boolean;
  setLoading: (val: boolean) => void;
  showLoading: (duration?: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoading = (duration = 2000) => {
    setLoading(true);
    setTimeout(() => setLoading(false), duration);
  };

  return (
    <LoadingContext.Provider value={{ loading, setLoading, showLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
