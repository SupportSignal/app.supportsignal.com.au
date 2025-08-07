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
      if (error.message) {
        // Check if it's a Convex formatted error
        if (error.message.includes('User with this email already exists')) {
          errorMessage =
            'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Uncaught Error:')) {
          // Extract the error message after "Uncaught Error:"
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
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
      if (error.message) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage =
            'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    try {
      if (this.sessionToken) {
        await convex.mutation(api.auth.logoutUser, {
          sessionToken: this.sessionToken,
        });
      }

      this.sessionToken = null;

      // Remove session token and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session_token');
        // Clear remember me cookie
        document.cookie =
          'auth_remember_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict';
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.sessionToken) {
      return null;
    }

    try {
      const user = await convex.query(api.users.getCurrentUser, {
        sessionToken: this.sessionToken,
      });
      return user;
    } catch (error) {
      // If session is invalid, clear it
      this.sessionToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_session_token');
      }
      return null;
    }
  }

  getSessionToken(): string | null {
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
      if (error.message) {
        if (error.message.includes('Current password is incorrect')) {
          errorMessage = 'Current password is incorrect';
        } else if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const result = await convex.mutation(api.auth.requestPasswordReset, {
        email,
      });
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Password reset request failed';
      if (error.message) {
        if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email address';
        } else if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
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
      if (error.message) {
        if (error.message.includes('Invalid or expired token')) {
          errorMessage = 'Invalid or expired reset token';
        } else if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
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
      if (error.message) {
        if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
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
      if (error.message) {
        if (error.message.includes('Uncaught Error:')) {
          const match = error.message.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
          errorMessage = match ? match[1].trim() : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  }
}

export const authService = AuthService.getInstance();
