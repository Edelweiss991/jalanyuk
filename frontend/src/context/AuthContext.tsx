import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  loginWithSession: (token: string, user: User) => void;
  isAuthenticated: boolean;
  updateUser: (data: { fullName?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jalanyuk-token');
    if (token) {
      authApi
        .me()
        .then((response) => {
          setUser(response.user);
        })
        .catch(() => {
          localStorage.removeItem('jalanyuk-token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('jalanyuk-token', response.token);
    setUser(response.user);
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    const response = await authApi.register(data);
    localStorage.setItem('jalanyuk-token', response.token);
    setUser(response.user);
  };

  const loginWithSession = (token: string, sessionUser: User) => {
    localStorage.setItem('jalanyuk-token', token);
    setUser(sessionUser);
  };

  const updateUser = async (data: { fullName?: string; phone?: string }) => {
    const response = await authApi.updateMe(data);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('jalanyuk-token');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAdmin, loginWithSession, isAuthenticated: user !== null, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
