import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { SelectedPathDetail } from '../types';
import { useAuth } from './AuthContext';

interface SelectedPathContextType {
  selectedPath: SelectedPathDetail | null;
  isLoading: boolean;
  error: string | null;
  selectPath: (pathSlug: string, simulationId?: number) => Promise<SelectedPathDetail>;
  clearPath: () => Promise<void>;
  refreshSelectedPath: () => Promise<void>;
}

const SelectedPathContext = createContext<SelectedPathContextType | undefined>(undefined);

export const SelectedPathProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [selectedPath, setSelectedPath] = useState<SelectedPathDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSelectedPath = async () => {
    if (!isAuthenticated) {
      setSelectedPath(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.profile.getSelectedPath();
      setSelectedPath(res.selected_path);
    } catch (err: any) {
      setError(err?.message || 'Failed to load active career path');
      setSelectedPath(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedPath();
  }, [isAuthenticated]);

  const selectPath = async (pathSlug: string, simulationId?: number): Promise<SelectedPathDetail> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await api.profile.setSelectedPath({
        path_slug: pathSlug,
        simulation_id: simulationId,
      });
      setSelectedPath(updated);
      return updated;
    } catch (err: any) {
      const msg = err?.message || 'Failed to select career path';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPath = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.profile.clearSelectedPath();
      setSelectedPath(null);
    } catch (err: any) {
      const msg = err?.message || 'Failed to clear active career path';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSelectedPath = async (): Promise<void> => {
    await fetchSelectedPath();
  };

  return (
    <SelectedPathContext.Provider
      value={{
        selectedPath,
        isLoading,
        error,
        selectPath,
        clearPath,
        refreshSelectedPath,
      }}
    >
      {children}
    </SelectedPathContext.Provider>
  );
};

export const useSelectedPath = (): SelectedPathContextType => {
  const context = useContext(SelectedPathContext);
  if (!context) {
    throw new Error('useSelectedPath must be used within a SelectedPathProvider');
  }
  return context;
};
