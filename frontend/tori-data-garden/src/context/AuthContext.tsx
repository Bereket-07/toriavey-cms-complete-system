import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthToken } from "@/lib/oauth";

type User = {
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  isSuperAdmin?: boolean;
};

type AuthState = {
  token?: string;
  tokenType?: string;
  user?: User;
};

type AuthContextType = {
  auth: AuthState;
  isAuthenticated: boolean;
  hydrated: boolean; // true once we have read from storage
  login: (payload: { token: string; tokenType?: string; id?: string; name?: string; email?: string; picture?: string; isSuperAdmin?: boolean }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({});
  const [hydrated, setHydrated] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token") || undefined;
    const tokenType = localStorage.getItem("token_type") || undefined;
    const user: User = {
      id: localStorage.getItem("user_id") || undefined,
      name: localStorage.getItem("user_name") || undefined,
      email: localStorage.getItem("user_email") || undefined,
      picture: localStorage.getItem("user_picture") || undefined,
      isSuperAdmin: localStorage.getItem("user_super_admin") === "true",
    };

    setAuth({ token, tokenType, user });
    setAuthToken(token || null);
    setHydrated(true);
  }, []);

  const login: AuthContextType["login"] = ({ token, tokenType = "bearer", id, name, email, picture, isSuperAdmin }) => {
    // Persist
    localStorage.setItem("access_token", token);
    localStorage.setItem("token_type", tokenType);
    if (id) localStorage.setItem("user_id", id);
    if (name) localStorage.setItem("user_name", name);
    if (email) localStorage.setItem("user_email", email);
    if (picture) localStorage.setItem("user_picture", picture);
    if (isSuperAdmin !== undefined) localStorage.setItem("user_super_admin", String(isSuperAdmin));

    // Update state
    setAuth({ token, tokenType, user: { id, name, email, picture, isSuperAdmin } });
    setAuthToken(token || null);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_picture");
    localStorage.removeItem("user_super_admin");
    setAuth({});
    setAuthToken(null);
  };

  const value = useMemo<AuthContextType>(() => ({
    auth,
    isAuthenticated: Boolean(auth.token),
    hydrated,
    login,
    logout,
  }), [auth, hydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
