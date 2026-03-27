import { createContext, useContext, type ReactNode } from "react";

interface UnlockContextValue {
  isUnlocked: boolean;
}

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function useUnlock() {
  const context = useContext(UnlockContext);
  if (!context) throw new Error("useUnlock must be used within UnlockProvider");
  return context;
}

export function UnlockProvider({ children }: { children: ReactNode }) {
  return (
    <UnlockContext.Provider value={{ isUnlocked: true }}>
      {children}
    </UnlockContext.Provider>
  );
}
