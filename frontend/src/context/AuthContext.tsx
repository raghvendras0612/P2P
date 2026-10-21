import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../api/client';
import { CareerPath, StudentProfile, User } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Partial<StudentProfile> | null;
  selectedPath: CareerPath | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Partial<StudentProfile> | null>(null);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUserData = async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setProfile(data.profile);
      setSelectedPath(data.selected_path);
    } catch {
      setUser(null);
      setProfile(null);
      setSelectedPath(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        await api.auth.refresh();
        if (mounted) {
          await fetchCurrentUserData();
        }
      } catch {
        if (mounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      setUser(res.user);
      await fetchCurrentUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(payload);
      setUser(res.user);
      await fetchCurrentUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setProfile(null);
      setSelectedPath(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchCurrentUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        selectedPath,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
