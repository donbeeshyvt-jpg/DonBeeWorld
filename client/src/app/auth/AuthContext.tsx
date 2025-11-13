"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  apiGet,
  apiPost,
  setAuthToken,
  setUnauthorizedHandler
} from "../../lib/api";

type Account = {
  id: number;
  username: string;
};

type Profile = {
  id: number;
  profileName: string;
  avatarUrl: string | null;
};

type AuthStatus = "loading" | "guest" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  account: Account | null;
  profile: Profile | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "donbeeworld.session";

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  token: null,
  account: null,
  profile: null,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => undefined
});

type AuthResponse = {
  token: string;
  account: Account;
  profile: Profile;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const applySession = useCallback((session: AuthResponse) => {
    setToken(session.token);
    setAccount(session.account);
    setProfile(session.profile);
    setAuthToken(session.token);
    localStorage.setItem(STORAGE_KEY, session.token);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setAccount(null);
    setProfile(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setStatus("guest");
  }, []);

  const fetchSession = useCallback(
    async (storedToken: string) => {
      try {
        setAuthToken(storedToken);
        const session = await apiGet<AuthResponse>("/api/auth/me");
        applySession(session);
      } catch {
        clearSession();
      }
    },
    [applySession, clearSession]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      fetchSession(stored);
    } else {
      clearSession();
    }
  }, [clearSession, fetchSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const session = await apiPost<AuthResponse>("/api/auth/login", {
        username,
        password
      });
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const session = await apiPost<AuthResponse>("/api/auth/register", {
        username,
        password
      });
      applySession(session);
    },
    [applySession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      account,
      profile,
      login,
      register,
      logout: clearSession
    }),
    [status, token, account, profile, login, register, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

