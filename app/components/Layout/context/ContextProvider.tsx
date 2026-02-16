"use client";

import { useEffect, useState } from "react";
import {
  GlobalContext,
  type ContextType,
  type User,
  type ResponseData,
} from "./Context";
import { apiUrl } from "../../../config/api";

interface Props {
  children: React.ReactNode;
}

export const ContextProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<ResponseData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const parsedUser = userStr ? JSON.parse(userStr) : null;
    if (stored && parsedUser !== "null") {
      setToken(stored);
      setUser(parsedUser);
      fetchUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(apiUrl("/api/auth/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        localStorage.removeItem("token");
      }
    } catch {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, remember = false) => {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await fetch(apiUrl("/api/auth/google"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch(apiUrl("/api/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const value: ContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    loginWithGoogle,
    signup,
    logout,
    responseData,
    setResponseData,
    setUser,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
