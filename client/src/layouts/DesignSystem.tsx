import React, { createContext, useContext } from 'react';

export type DesignMode = 'light';

type DesignSystemValue = {
  mode: DesignMode;
  primary: string;
  accent: string;
};

const DesignSystemContext = createContext<DesignSystemValue>({
  mode: 'light',
  primary: '#2563EB',
  accent: '#10B981'
});

export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  const value: DesignSystemValue = {
    mode: 'light',
    primary: '#2563EB',
    accent: '#10B981'
  };

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
}

export function useDesignSystem() {
  return useContext(DesignSystemContext);
}


