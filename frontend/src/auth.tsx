import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "crednexis_access_token";
const REFRESH_TOKEN_KEY = "crednexis_refresh_token";
const USER_KEY = "crednexis_profile";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.REACT_APP_API_BASE_URL ??
  "/api";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  import.meta.env.REACT_APP_GOOGLE_CLIENT_ID ??
  "";

type AuthStatus = "idle" | "loading";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}

interface TokenResponsePayload {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  loginWithPassword: (email: string, password: string) => Promise<AuthUser>;
  registerWithPassword: (payload: { email: string; password: string; name?: string }) => Promise<AuthUser>;
  refreshSession: () => Promise<string | null>;
  logout: () => Promise<void>;
  googleClientId: string;
  apiBaseUrl: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(USER_KEY);
  return stored ? (JSON.parse(stored) as AuthUser) : null;
};

const readToken = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
};

const persistValue = (key: string, value: string | null): void => {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};

const persistUser = (value: AuthUser | null): void => {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(readUser());
  const [accessToken, setAccessToken] = useState<string | null>(readToken(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(readToken(REFRESH_TOKEN_KEY));
  const [status, setStatus] = useState<AuthStatus>("idle");

  const applySession = useCallback((payload: TokenResponsePayload) => {
    setUser(payload.user);
    setAccessToken(payload.access_token);
    setRefreshToken(payload.refresh_token);
    persistUser(payload.user);
    persistValue(TOKEN_KEY, payload.access_token);
    persistValue(REFRESH_TOKEN_KEY, payload.refresh_token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    persistUser(null);
    persistValue(TOKEN_KEY, null);
    persistValue(REFRESH_TOKEN_KEY, null);
  }, []);

  const callAuthEndpoint = useCallback(
    async (endpoint: string, body: Record<string, unknown>): Promise<TokenResponsePayload> => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(detail.detail || "Authentication failed");
      }
      return (await response.json()) as TokenResponsePayload;
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setStatus("loading");
      try {
        const payload = await callAuthEndpoint("/auth/google", { id_token: idToken });
        applySession(payload);
        return payload.user;
      } finally {
        setStatus("idle");
      }
    },
    [applySession, callAuthEndpoint]
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setStatus("loading");
      try {
        const payload = await callAuthEndpoint("/auth/login", { email, password });
        applySession(payload);
        return payload.user;
      } finally {
        setStatus("idle");
      }
    },
    [applySession, callAuthEndpoint]
  );

  const registerWithPassword = useCallback(
    async (input: { email: string; password: string; name?: string }) => {
      setStatus("loading");
      try {
        const payload = await callAuthEndpoint("/auth/register", input);
        applySession(payload);
        return payload.user;
      } finally {
        setStatus("idle");
      }
    },
    [applySession, callAuthEndpoint]
  );

  const refreshSession = useCallback(async () => {
    if (!refreshToken) return null;
    try {
      const payload = await callAuthEndpoint("/auth/refresh", {
        refresh_token: refreshToken,
      });
      applySession(payload);
      return payload.access_token;
    } catch (error) {
      clearSession();
      return null;
    }
  }, [applySession, callAuthEndpoint, clearSession, refreshToken]);

  const logout = useCallback(async () => {
    if (!refreshToken || !accessToken) {
      clearSession();
      return;
    }
    setStatus("loading");
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } finally {
      clearSession();
      setStatus("idle");
    }
  }, [accessToken, clearSession, refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      status,
      loginWithGoogle,
      loginWithPassword,
      registerWithPassword,
      refreshSession,
      logout,
      googleClientId: GOOGLE_CLIENT_ID,
      apiBaseUrl: API_BASE_URL,
    }),
    [
      accessToken,
      loginWithGoogle,
      loginWithPassword,
      logout,
      refreshSession,
      registerWithPassword,
      status,
      user,
      refreshToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("Auth context unavailable");
  }
  return ctx;
};

export const getStoredAccessToken = (): string | null => readToken(TOKEN_KEY);
export const getStoredRefreshToken = (): string | null => readToken(REFRESH_TOKEN_KEY);
export const getApiBaseUrl = (): string => API_BASE_URL;
export const getGoogleClientId = (): string => GOOGLE_CLIENT_ID;
