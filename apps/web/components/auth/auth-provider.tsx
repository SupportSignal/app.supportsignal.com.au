'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthState } from '../../lib/auth';

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  getGitHubOAuthUrl: () => Promise<{
    success: boolean;
    url?: string;
    state?: string;
    error?: string;
  }>;
  githubOAuthLogin: (
    code: string,
    state?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getGoogleOAuthUrl: () => Promise<{
    success: boolean;
    url?: string;
    state?: string;
    error?: string;
  }>;
  googleOAuthLogin: (
    code: string,
    state?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionToken: null,
    isLoading: true,
  });

  const refreshUser = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const user = await authService.getCurrentUser();
      const sessionToken = authService.getSessionToken();

      setAuthState({
        user,
        sessionToken,
        isLoading: false,
      });
    } catch {
      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {
    const result = await authService.login(email, password, rememberMe);

    if (result.success) {
      // Map user structure to User interface
      const mappedUser = result.user
        ? {
            _id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            profile_image_url: (result.user as { profile_image_url?: string })
              .profile_image_url,
            _creationTime: Date.now(), // Login users don't have creation time from backend
          }
        : null;

      setAuthState({
        user: mappedUser,
        sessionToken: result.sessionToken || null,
        isLoading: false,
      });
      return { success: true };
    } else {
      // Don't change loading state on error to prevent re-renders
      return { success: false, error: result.error };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);

    if (result.success) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      // After registration, automatically log in
      const loginResult = await authService.login(email, password);
      if (loginResult.success) {
        // Map user structure to User interface
        const mappedUser = loginResult.user
          ? {
              _id: loginResult.user.id,
              name: loginResult.user.name,
              email: loginResult.user.email,
              role: loginResult.user.role,
              profile_image_url: (
                loginResult.user as { profile_image_url?: string }
              ).profile_image_url,
              _creationTime: Date.now(), // Login users don't have creation time from backend
            }
          : null;

        setAuthState({
          user: mappedUser,
          sessionToken: loginResult.sessionToken || null,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      return { success: true };
    } else {
      // Don't change loading state on error to prevent re-renders
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    await authService.logout();

    setAuthState({
      user: null,
      sessionToken: null,
      isLoading: false,
    });
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    const result = await authService.changePassword(
      currentPassword,
      newPassword
    );
    return result;
  };

  const requestPasswordReset = async (email: string) => {
    const result = await authService.requestPasswordReset(email);
    return result;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const result = await authService.resetPassword(token, newPassword);
    return result;
  };

  const getGitHubOAuthUrl = async () => {
    const result = await authService.getGitHubOAuthUrl();
    return result;
  };

  const githubOAuthLogin = async (code: string, state?: string) => {
    const result = await authService.githubOAuthLogin(code, state);

    if (result.success) {
      // Map OAuth user structure to User interface
      const mappedUser = result.user
        ? {
            _id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            profile_image_url: result.user.profile_image_url,
            _creationTime: Date.now(), // OAuth users don't have creation time from backend
          }
        : null;

      setAuthState({
        user: mappedUser,
        sessionToken: result.sessionToken || null,
        isLoading: false,
      });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const getGoogleOAuthUrl = async () => {
    const result = await authService.getGoogleOAuthUrl();
    return result;
  };

  const googleOAuthLogin = async (code: string, state?: string) => {
    const result = await authService.googleOAuthLogin(code, state);

    if (result.success) {
      // Map OAuth user structure to User interface
      const mappedUser = result.user
        ? {
            _id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            profile_image_url: result.user.profile_image_url,
            _creationTime: Date.now(), // OAuth users don't have creation time from backend
          }
        : null;

      setAuthState({
        user: mappedUser,
        sessionToken: result.sessionToken || null,
        isLoading: false,
      });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
    getGitHubOAuthUrl,
    githubOAuthLogin,
    getGoogleOAuthUrl,
    googleOAuthLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
