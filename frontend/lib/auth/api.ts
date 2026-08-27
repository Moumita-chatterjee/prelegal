import { apiRequest } from "@/lib/apiClient";

const TOKEN_STORAGE_KEY = "prelegal_token";

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function signup(email: string, password: string): Promise<AuthToken> {
  return apiRequest<AuthToken>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signin(email: string, password: string): Promise<AuthToken> {
  return apiRequest<AuthToken>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
