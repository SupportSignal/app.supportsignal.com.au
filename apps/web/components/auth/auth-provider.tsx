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
  
  console.log('🔍 AUTH PROVIDER - INITIAL STATE', {
    hasInitialSessionToken: !!initialSessionToken,
    sessionToken: initialSessionToken?.substring(0, 8) + '...',
    sessionTokenLength: initialSessionToken?.length,
    timestamp: new Date().toISOString()
  });
  
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
    }
  };

  const refreshUser = async () => {
    // Prevent concurrent refresh operations
    if (refreshInProgress.current) {
      console.log('🔍 AUTH PROVIDER - REFRESH SKIPPED (IN PROGRESS)');
      return;
    }
    
    refreshInProgress.current = true;
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check for impersonation token in URL first, then sessionStorage
      let sessionToken = authService.getSessionToken();
      
      // Verify the auth provider state is synchronized with AuthService
      if (authState.sessionToken !== sessionToken) {
        console.log('🔍 AUTH PROVIDER - SYNC MISMATCH DETECTED', {
          authStateToken: authState.sessionToken?.substring(0, 8) + '...',
          authServiceToken: sessionToken?.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('🔍 AUTH PROVIDER - REFRESH USER START', {
        hasSessionToken: !!sessionToken,
        sessionToken: sessionToken?.substring(0, 8) + '...',
        sessionTokenLength: sessionToken?.length,
        timestamp: new Date().toISOString()
      });
      let isImpersonating = false;
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const impersonateToken = urlParams.get('impersonate_token');
        
        if (impersonateToken) {
          // New impersonation token from URL - use it and store in sessionStorage
          sessionToken = impersonateToken;
          isImpersonating = true;
          
          // Store impersonation token in sessionStorage for refresh persistence
          sessionStorage.setItem('impersonation_token', impersonateToken);
          
          // Clean the URL by removing the impersonate_token parameter
          urlParams.delete('impersonate_token');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        } else {
          // Check for stored impersonation token in sessionStorage
          const storedImpersonationToken = sessionStorage.getItem('impersonation_token');

          if (storedImpersonationToken) {
            // SECURITY FIX: Validate stored impersonation token against localStorage
            // If localStorage has a different token, the impersonation token might be stale
            const localStorageToken = localStorage.getItem('auth_session_token');

            if (localStorageToken && storedImpersonationToken !== localStorageToken) {
              console.log('🔍 AUTH PROVIDER - DETECTED POTENTIAL STALE IMPERSONATION TOKEN', {
                storedImpersonationToken: storedImpersonationToken.substring(0, 10) + '...',
                localStorageToken: localStorageToken.substring(0, 10) + '...',
                timestamp: new Date().toISOString()
              });

              // Clear the potentially stale impersonation token
              sessionStorage.removeItem('impersonation_token');
              console.log('🔍 AUTH PROVIDER - CLEARED STALE IMPERSONATION TOKEN');

              // Continue with regular authentication flow
            } else {
              // Use stored impersonation token (it matches localStorage or localStorage is empty)
              sessionToken = storedImpersonationToken;
              isImpersonating = true;
            }
          }
        }
      }
      
      // Get user info using the session token (regular or impersonation)
      let user = null;
      
      if (sessionToken) {
        try {
          console.log('🔍 AUTH PROVIDER - ATTEMPTING USER LOOKUP', {
            sessionToken: sessionToken?.substring(0, 8) + '...',
            sessionTokenLength: sessionToken?.length,
            isImpersonating,
            timestamp: new Date().toISOString()
          });
          
          user = await convex.query(api.users.getCurrentUser, { sessionToken });
          
          if (user) {
            console.log('🔍 AUTH PROVIDER - USER LOOKUP SUCCESS', {
              userId: user?._id,
              userEmail: user?.email,
              sessionToken: sessionToken?.substring(0, 8) + '...',
              timestamp: new Date().toISOString()
            });
          } else {
            // If getCurrentUser returns null, the session is expired/invalid
            console.log('🔍 AUTH PROVIDER - SESSION EXPIRED/INVALID (null user returned)', {
              sessionToken: sessionToken?.substring(0, 8) + '...',
              isImpersonating,
              timestamp: new Date().toISOString()
            });
            
            // Trigger the same cleanup logic as if an error was thrown
            throw new Error('Session expired or invalid - user lookup returned null');
          }
        } catch (error) {
          console.error('🔍 AUTH PROVIDER - AUTHENTICATION FAILED:', {
            error: error instanceof Error ? error.message : error,
            sessionToken: sessionToken?.substring(0, 8) + '...',
            isImpersonating,
            timestamp: new Date().toISOString()
          });
          
          // If we have an impersonation token that failed, it might be expired/invalid
          if (isImpersonating) {
            console.log('🔍 AUTH PROVIDER - CLEARING IMPERSONATION', {
              sessionToken: sessionToken?.substring(0, 8) + '...',
              timestamp: new Date().toISOString()
            });
            clearImpersonation();
            
            // Fall back to regular session token
            const regularToken = authService.getSessionToken();
            if (regularToken && regularToken !== sessionToken) {
              sessionToken = regularToken;
              isImpersonating = false;
              
              try {
                user = await convex.query(api.users.getCurrentUser, { sessionToken: regularToken });
                
                if (user) {
                  console.log('🔍 AUTH PROVIDER - FALLBACK AUTHENTICATION SUCCESS', {
                    userId: user?._id,
                    sessionToken: regularToken?.substring(0, 8) + '...',
                    timestamp: new Date().toISOString()
                  });
                } else {
                  // Regular token also returned null user
                  console.log('🔍 AUTH PROVIDER - FALLBACK TOKEN ALSO EXPIRED', {
                    sessionToken: regularToken?.substring(0, 8) + '...',
                    timestamp: new Date().toISOString()
                  });
                  await authService.logout();
                  user = null;
                  sessionToken = null;
                }
              } catch (fallbackError) {
                console.error('🔍 AUTH PROVIDER - FALLBACK AUTHENTICATION FAILED:', fallbackError);
                // Clear the expired regular session too
                await authService.logout();
                user = null;
                sessionToken = null;
              }
            } else {
              // No fallback available
              user = null;
              sessionToken = null;
            }
          } else {
            // Regular session token failed - this is likely an expired session
            console.log('🔍 AUTH PROVIDER - REGULAR SESSION FAILED, CLEARING ALL AUTH DATA', {
              sessionToken: sessionToken?.substring(0, 8) + '...',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
            
            // Clear the expired session token from storage and AuthService
            await authService.logout();
            
            // Also clear any impersonation data just in case
            clearImpersonation();
            
            // CRITICAL: Set these to null to ensure React state is updated
            user = null;
            sessionToken = null;
            
            console.log('🔍 AUTH PROVIDER - SESSION CLEANUP COMPLETED', {
              authServiceToken: authService.getSessionToken(),
              clearedSessionToken: 'null',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      // Add sessionToken to user object if user exists
      const userWithSessionToken = user && sessionToken ? {
        ...user,
        sessionToken
      } : user;

      console.log('🔍 AUTH PROVIDER - SETTING FINAL AUTH STATE', {
        hasUser: !!userWithSessionToken,
        userId: userWithSessionToken?._id,
        hasSessionToken: !!sessionToken,
        sessionToken: sessionToken?.substring(0, 8) + '...',
        sessionTokenLength: sessionToken?.length,
        authServiceTokenSync: authService.getSessionToken()?.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });

      setAuthState({
        user: userWithSessionToken,
        sessionToken,
        isLoading: false,
      });
    } catch (error) {
      console.error('🔍 AUTH PROVIDER - UNEXPECTED ERROR IN REFRESH:', error);
      
      // On any unexpected error, ensure we clean up completely
      try {
        await authService.logout();
        clearImpersonation();
      } catch (cleanupError) {
        console.error('🔍 AUTH PROVIDER - CLEANUP ERROR:', cleanupError);
      }
      
      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    } finally {
      // Always reset the refresh flag
      refreshInProgress.current = false;
      
      console.log('🔍 AUTH PROVIDER - REFRESH COMPLETED', {
        finalAuthServiceToken: authService.getSessionToken()?.substring(0, 8) + '...' || 'null',
        timestamp: new Date().toISOString()
      });
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {
    try {
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
    } catch (error: any) {
      // Handle any unhandled exceptions from authService.login()
      console.error('🔍 AUTH PROVIDER - Login exception caught:', error);
      // Force deployment update to ensure production gets this error handling

      // Extract user-friendly error message
      let errorMessage = 'Login failed. Please try again.';

      if (error?.message) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Server Error')) {
          errorMessage = 'Unable to sign in. Please check your credentials or try again later.';
        } else if (error.message.includes('ConvexError')) {
          // Extract ConvexError message if possible
          const match = error.message.match(/ConvexError:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : 'Invalid email or password. Please check your credentials.';
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
      }

      return { success: false, error: errorMessage };
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
    console.log('🔍 AUTH PROVIDER - LOGOUT INITIATED', {
      currentUser: authState.user?._id,
      timestamp: new Date().toISOString()
    });
    
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await authService.logout();

      // Clear any stored impersonation tokens on logout
      clearImpersonation();

      console.log('🔍 AUTH PROVIDER - LOGOUT COMPLETED', {
        authServiceToken: authService.getSessionToken(),
        timestamp: new Date().toISOString()
      });

      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('🔍 AUTH PROVIDER - LOGOUT ERROR:', error);
      
      // Even if logout fails, clear the frontend state
      clearImpersonation();
      setAuthState({
        user: null,
        sessionToken: null,
        isLoading: false,
      });
    }
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
