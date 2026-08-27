"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AuthUser, clearStoredToken, fetchCurrentUser, getStoredToken, storeToken } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (token: string) => {
    try {
      setUser(await fetchCurrentUser(token));
    } catch {
      clearStoredToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const token = getStoredToken();
      if (token) {
        await loadUser(token);
      }
      setIsLoading(false);
    }

    void bootstrap();
  }, [loadUser]);

  const signIn = useCallback(
    async (token: string) => {
      storeToken(token);
      await loadUser(token);
    },
    [loadUser],
  );

  const signOut = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, signIn, signOut }), [user, isLoading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
