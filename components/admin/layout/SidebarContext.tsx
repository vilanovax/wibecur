'use client';

import * as React from 'react';

const STORAGE_KEY = 'admin-sidebar-collapsed';

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    setCollapsedState(readStored());
    hydrated.current = true;
  }, []);

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo<SidebarContextValue>(
    () => ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, setCollapsed, mobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
