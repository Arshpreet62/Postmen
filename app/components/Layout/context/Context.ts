import { createContext, useContext } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export type ResponseData = {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
  };
  savedToHistory?: boolean;
};

export interface ContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  responseData: ResponseData | null;
  setResponseData: (data: ResponseData | null) => void;
  setUser: (user: User | null) => void;
}

export const GlobalContext = createContext<ContextType | null>(null);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within GlobalProvider");
  }
  return context;
};
