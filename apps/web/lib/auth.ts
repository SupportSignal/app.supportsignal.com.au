// @ts-nocheck - Temporary workaround for complex nested API type issues
import { convex } from './convex';
import { api } from '@/lib/convex-api';

export interface User {
  _id: string;
  name: string;
  email: string;
  profile_image_url?: string;
  role: string;
  has_llm_access?: boolean;
  sessionToken?: string;
  _creationTime: number;
}

export interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
}

// Authentication service class
export class AuthService {
  private static instance: AuthService;
  private sessionToken: string | null = null;

  private constructor() {
    // Load session token from localStorage or remember cookie if available
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('auth_session_token');

      // If no session token in localStorage, check for remember cookie
      if (!this.sessionToken) {
        const rememberCookie = this.getCookie('auth_remember_token');
        if (rememberCookie) {
          this.sessionToken = rememberCookie;
          // Restore to localStorage for consistency
          localStorage.setItem('auth_session_token', rememberCookie);
        }
      }
    }
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(name: string, email: string, password: string) {
    try {
      const result = await convex.mutation(api.auth.registerUser, {
        name,
        email,
        password,
      });
      return { success: true, user: result };
    } catch (error: any) {
      // Extract the actual error message from Convex error format
      let errorMessage = 'Registration failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        // Check if it's a Convex formatted error
        if (errorText.includes('User with this email already exists')) {
          errorMessage =
            'An account with this email already exists. Please sign in instead.';
        } else if (errorText.includes('Uncaught Error:')) {
          // Extract the error message after "Uncaught Error:"
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async login(email: string, password: string, rememberMe?: boolean) {
    try {
      const result = await convex.mutation(api.auth.loginUser, {
        email,
        password,
        rememberMe,
      });

      this.sessionToken = result.sessionToken;

      // Store session token with appropriate persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session_token', result.sessionToken);

        // Set secure cookie for Remember Me sessions
        if (rememberMe) {
          // Create secure, HttpOnly-like cookie for extended sessions
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          document.cookie = `auth_remember_token=${result.sessionToken}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
        }
      }

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    } catch (error: any) {
      // Extract the actual error message from Convex error format
      let errorMessage = 'Login failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('Invalid email or password')) {
          errorMessage =
            'Invalid email or password. Please check your credentials.';
        } else if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    try {
      console.log('🔍 AUTH SERVICE - Logout initiated', {
        hasSessionToken: !!this.sessionToken,
        timestamp: new Date().toISOString()
      });

      if (this.sessionToken) {
        try {
          await convex.mutation(api.auth.logoutUser, {
            sessionToken: this.sessionToken,
          });
          console.log('🔍 AUTH SERVICE - Backend logout successful');
        } catch (backendError) {
          console.warn('🔍 AUTH SERVICE - Backend logout failed (continuing with local cleanup):', backendError);
          // Continue with local cleanup even if backend fails
        }
      }

      // Always clear local session data
      await this.clearSessionData();

      console.log('🔍 AUTH SERVICE - Logout completed', {
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error: any) {
      console.error('🔍 AUTH SERVICE - Logout error:', error);
      
      // Still try to clear local data on error
      try {
        await this.clearSessionData();
      } catch (cleanupError) {
        console.error('🔍 AUTH SERVICE - Cleanup error:', cleanupError);
      }
      
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.sessionToken) {
      console.log('🔍 AUTH SERVICE - No session token available');
      return null;
    }

    try {
      console.log('🔍 AUTH SERVICE - Getting current user', {
        sessionToken: this.sessionToken.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      
      const user = await convex.query(api.users.getCurrentUser, {
        sessionToken: this.sessionToken,
      });
      
      console.log('🔍 AUTH SERVICE - User retrieved successfully', {
        userId: user?._id,
        timestamp: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      console.error('🔍 AUTH SERVICE - Session validation failed, clearing session', {
        error: error instanceof Error ? error.message : error,
        sessionToken: this.sessionToken.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      
      // If session is invalid, clear it completely
      await this.clearSessionData();
      return null;
    }
  }

  // Helper method to completely clear all session data
  private async clearSessionData() {
    console.log('🔍 AUTH SERVICE - Clearing all session data', {
      hadToken: !!this.sessionToken,
      timestamp: new Date().toISOString()
    });
    
    this.sessionToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session_token');
      // Also clear remember me cookie
      document.cookie = 'auth_remember_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict';
    }
  }

  getSessionToken(): string | null {
    // Debug logging to track session token issues
    const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('auth_session_token') : null;
    const cookieToken = this.getCookie('auth_remember_token');

    console.log('🔍 AUTH SERVICE - getSessionToken DEBUG', {
      instanceToken: this.sessionToken ? this.sessionToken.substring(0, 10) + '...' : 'NULL',
      localStorageToken: localStorageToken ? localStorageToken.substring(0, 10) + '...' : 'NULL',
      cookieToken: cookieToken ? cookieToken.substring(0, 10) + '...' : 'NULL',
      timestamp: new Date().toISOString()
    });

    // If instance token is null but localStorage has a token, sync them
    if (!this.sessionToken && localStorageToken) {
      console.log('🔍 AUTH SERVICE - Syncing session token from localStorage');
      this.sessionToken = localStorageToken;
    }

    return this.sessionToken;
  }

  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (!this.sessionToken) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await convex.mutation(api.auth.changePassword, {
        sessionToken: this.sessionToken,
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Password change failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('Current password is incorrect')) {
          errorMessage = 'Current password is incorrect';
        } else if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const result = await convex.action(api.auth.requestPasswordReset, {
        email,
      });
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Password reset request failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('User not found')) {
          errorMessage = 'No account found with this email address';
        } else if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const result = await convex.mutation(api.auth.resetPassword, {
        token,
        newPassword,
      });
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Password reset failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('Invalid or expired token')) {
          errorMessage = 'Invalid or expired reset token';
        } else if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async getGitHubOAuthUrl() {
    try {
      const result = await convex.query(api.auth.getGitHubOAuthUrl, {});
      return { success: true, url: result.url, state: result.state };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async githubOAuthLogin(code: string, state?: string) {
    try {
      const result = await convex.action(api.auth.githubOAuthLogin, {
        code,
        state,
      });

      this.sessionToken = result.sessionToken;

      // Store session token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session_token', result.sessionToken);
      }

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    } catch (error: any) {
      let errorMessage = 'GitHub OAuth login failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async getGoogleOAuthUrl() {
    try {
      const result = await convex.query(api.auth.getGoogleOAuthUrl, {});
      return { success: true, url: result.url, state: result.state };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async googleOAuthLogin(code: string, state?: string) {
    try {
      const result = await convex.action(api.auth.googleOAuthLogin, {
        code,
        state,
      });

      this.sessionToken = result.sessionToken;

      // Store session token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_session_token', result.sessionToken);
      }

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
      };
    } catch (error: any) {
      let errorMessage = 'Google OAuth login failed';

      // In production, ConvexError puts the message in error.data, not error.message
      const errorText = error.data || error.message || '';

      if (errorText) {
        if (errorText.includes('Uncaught Error:')) {
          const match = errorText.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : errorText;
        } else {
          errorMessage = errorText;
        }
      }
      return { success: false, error: errorMessage };
    }
  }
}

export const authService = AuthService.getInstance();
