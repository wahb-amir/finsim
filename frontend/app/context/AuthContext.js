"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      // adjust this depending on your backend response shape
      setUser(data.user ?? data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (payload) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    setUser(data.user ?? data);

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      fetchMe,
      login,
      logout,
      setUser,
    }),
    [user, loading, fetchMe, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
