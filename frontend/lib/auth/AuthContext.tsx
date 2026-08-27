"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AuthUser, fetchCurrentUser } from "./api";

const TOKEN_STORAGE_KEY = "prelegal_token";

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
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        await loadUser(token);
      }
      setIsLoading(false);
    }

    void bootstrap();
  }, [loadUser]);

  const signIn = useCallback(
    async (token: string) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      await loadUser(token);
    },
    [loadUser],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
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
