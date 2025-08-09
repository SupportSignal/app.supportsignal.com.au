'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthState } from '../../lib/auth';
import { convex } from '../../lib/convex';
import { api } from '@/lib/convex-api';

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
  clearImpersonation: () => void;
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
  // Get initial session token immediately
  const initialSessionToken = authService.getSessionToken();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionToken: initialSessionToken, // Use the actual token if available
    isLoading: true,
  });

  // Add ref to track if refresh is in progress to prevent race conditions
  const refreshInProgress = React.useRef(false);

  // Helper function to clear impersonation session
  const clearImpersonation = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('impersonation_token');
      console.log('🧹 IMPERSONATION: Cleared stored token from sessionStorage');
    }
  };

  const refreshUser = async () => {
    // Prevent concurrent refresh operations
    if (refreshInProgress.current) {
      console.log('⏸️  AUTH: Refresh already in progress, skipping...');
      return;
    }
    
    refreshInProgress.current = true;
    console.log('🔄 AUTH: Starting refreshUser...');
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check for impersonation token in URL first, then sessionStorage
      let sessionToken = authService.getSessionToken();
      let isImpersonating = false;
      
      console.log('🔍 AUTH: Initial session token from authService:', sessionToken?.slice(0, 8) + '...');
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const impersonateToken = urlParams.get('impersonate_token');
        
        if (impersonateToken) {
          // New impersonation token from URL - use it and store in sessionStorage
          sessionToken = impersonateToken;
          isImpersonating = true;
          
          console.log('🎭 IMPERSONATION: Detected impersonation token from URL, switching to:', impersonateToken?.slice(0, 8) + '...');
          
          // Store impersonation token in sessionStorage for refresh persistence
          sessionStorage.setItem('impersonation_token', impersonateToken);
          console.log('💾 IMPERSONATION: Stored token in sessionStorage');
          
          // Clean the URL by removing the impersonate_token parameter
          urlParams.delete('impersonate_token');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
          
          console.log('🧹 URL: Cleaned impersonate_token from URL');
        } else {
          // Check for stored impersonation token in sessionStorage
          const storedImpersonationToken = sessionStorage.getItem('impersonation_token');
          
          if (storedImpersonationToken) {
            // Use stored impersonation token
            sessionToken = storedImpersonationToken;
            isImpersonating = true;
            
            console.log('🎭 IMPERSONATION: Using stored impersonation token:', storedImpersonationToken?.slice(0, 8) + '...');
          } else {
            console.log('👤 AUTH: No impersonation token, using regular session');
          }
        }
      }
      
      console.log('🎯 AUTH: About to call getCurrentUser with token:', sessionToken?.slice(0, 8) + '...');
      
      // Get user info using the session token (regular or impersonation)
      let user = null;
      
      if (sessionToken) {
        try {
          user = await convex.query(api.users.getCurrentUser, { sessionToken });
          
          console.log('✅ AUTH: getCurrentUser returned:', { 
            isImpersonating, 
            sessionToken: sessionToken?.slice(0, 8) + '...', 
            user: user ? { id: user._id, email: user.email, name: user.name, role: user.role } : null 
          });
        } catch (error) {
          console.error('❌ AUTH: getCurrentUser failed:', error);
          
          // If we have an impersonation token that failed, it might be expired/invalid
          if (isImpersonating) {
            console.log('🧹 IMPERSONATION: Clearing invalid impersonation token');
            clearImpersonation();
            
            // Fall back to regular session token
            const regularToken = authService.getSessionToken();
            if (regularToken && regularToken !== sessionToken) {
              console.log('🔄 AUTH: Falling back to regular session token:', regularToken?.slice(0, 8) + '...');
              sessionToken = regularToken;
              isImpersonating = false;
              
              try {
                user = await convex.query(api.users.getCurrentUser, { sessionToken: regularToken });
                console.log('✅ AUTH: Fallback authentication successful for user:', user?.name);
              } catch (fallbackError) {
                console.error('❌ AUTH: Fallback authentication also failed:', fallbackError);
                user = null;
                sessionToken = null;
              }
            } else {
              // No fallback available
              console.log('❌ AUTH: No regular session token available for fallback');
              user = null;
              sessionToken = null;
            }
          } else {
            // Regular session token failed
            console.log('❌ AUTH: Regular session token failed, clearing auth state');
            user = null;
            sessionToken = null;
          }
        }
      }
      
      // Add sessionToken to user object if user exists
      const userWithSessionToken = user && sessionToken ? {
        ...user,
        sessionToken
      } : user;

      console.log('🏁 AUTH: Setting final auth state');
      setAuthState({
        user: userWithSessionToken,
        sessionToken,
        isLoading: false,
      });
    } catch (error) {
      console.error('❌ AUTH ERROR:', error);
      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    } finally {
      // Always reset the refresh flag
      refreshInProgress.current = false;
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
            has_llm_access: (result.user as { has_llm_access?: boolean }).has_llm_access,
            sessionToken: result.sessionToken,
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
              has_llm_access: (loginResult.user as { has_llm_access?: boolean }).has_llm_access,
              sessionToken: loginResult.sessionToken,
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

    // Clear any stored impersonation tokens on logout
    clearImpersonation();

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
    console.log('🚀 AUTH: AuthProvider useEffect triggered');
    refreshUser();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    clearImpersonation,
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
