"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { persistPrivacyPreference } from "@/lib/privacy";

type PrivacyContextValue = {
  hidden: boolean;
  toggle: () => void;
  setHidden: (hidden: boolean) => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

interface Props {
  initialHidden: boolean;
  children: React.ReactNode;
}

export function PrivacyProvider({ initialHidden, children }: Props) {
  const [hidden, setHiddenState] = useState(initialHidden);

  const setHidden = useCallback((next: boolean) => {
    setHiddenState(next);
    persistPrivacyPreference(next);
  }, []);

  const toggle = useCallback(() => setHidden(!hidden), [hidden, setHidden]);

  const value = useMemo(
    () => ({ hidden, toggle, setHidden }),
    [hidden, toggle, setHidden]
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy(): PrivacyContextValue {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}
