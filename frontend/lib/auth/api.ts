const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
      : detail;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function signup(email: string, password: string): Promise<AuthToken> {
  return request<AuthToken>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signin(email: string, password: string): Promise<AuthToken> {
  return request<AuthToken>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
