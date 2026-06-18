import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ApiClient } from "../core/apiClient";
import { ApiService } from "../core/apiService";
import { Role } from "../core/models";
import { clearSession, loadSession, saveSession } from "../core/sessionStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const apiClient = useMemo(() => new ApiClient(), []);
  const apiService = useMemo(() => new ApiService(apiClient), [apiClient]);
  const [session, setSession] = useState(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSession()
      .then((stored) => {
        if (!alive) return;
        apiClient.setAccessToken(stored?.token);
        setSession(stored);
      })
      .finally(() => {
        if (alive) setBooted(true);
      });
    return () => {
      alive = false;
    };
  }, [apiClient]);

  const login = useCallback(
    async ({ email, password, role = Role.spectator }) => {
      const next = await apiService.login({ email, password, role });
      apiClient.setAccessToken(next.token);
      await saveSession(next);
      setSession(next);
      return next;
    },
    [apiClient, apiService]
  );

  const register = useCallback(
    async ({ name, email, password, role = Role.spectator }) => {
      const next = await apiService.register({ name, email, password, role });
      apiClient.setAccessToken(next.token);
      await saveSession(next);
      setSession(next);
      return next;
    },
    [apiClient, apiService]
  );

  const logout = useCallback(async () => {
    apiClient.setAccessToken(null);
    await clearSession();
    setSession(null);
  }, [apiClient]);

  const value = useMemo(
    () => ({
      apiClient,
      apiService,
      session,
      booted,
      isAuthenticated: Boolean(session),
      login,
      register,
      logout
    }),
    [apiClient, apiService, booted, login, logout, register, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
