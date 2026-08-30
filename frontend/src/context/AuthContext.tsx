import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  UserProfileUpdateData,
} from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UserProfileUpdateData) => Promise<User>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('api_workbench_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('api_workbench_token') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    api.clearAuthToken();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Fetch current user details on initial mount if token exists
  const refreshUser = useCallback(async () => {
    const existingToken = api.getAuthToken();
    if (!existingToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
      setToken(existingToken);
    } catch (err: any) {
      console.warn('Session restoration failed:', err.message);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.login(credentials);
      setToken(resp.access_token);
      setUser(resp.user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await api.register(credentials);
      setToken(resp.access_token);
      setUser(resp.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UserProfileUpdateData): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await api.updateMe(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.deleteMe();
      logout();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
