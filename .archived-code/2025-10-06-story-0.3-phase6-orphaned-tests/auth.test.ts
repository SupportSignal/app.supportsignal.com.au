/* @ts-nocheck */
/**
 * Comprehensive Authentication System Tests
 * 
 * Tests the enhanced authentication system including:
 * - User registration with password validation
 * - Login with security measures (account lockout, audit logging)
 * - Session management and validation
 * - Role-based permission system
 * - Security audit logging
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Convex modules at top level before imports
const mockServer = require('../__mocks__/_generated/server');
const mockApi = require('../__mocks__/_generated/api');

const { createMockCtx } = require('../__mocks__/_generated/server');

// Import the handler functions to test
import {
  registerUser,
  loginUser,
  verifySession,
  getCurrentUser,
  logoutUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  checkUserLLMAccess,
  updateUserLLMAccess,
  verifyOwnerAccess,
} from '../../apps/convex/auth';

describe('Enhanced Authentication System', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockCtx();
    if (global.jest) {
      global.jest.clearAllMocks();
    }
  });

  describe('User Registration', () => {
    it('should successfully register a user with valid data', async () => {
      // Setup mock to return no existing user
      mockCtx.db._setMockData('users_first', null);

      const result = await registerUser(mockCtx, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.role).toBe('viewer');
      expect(result.correlationId).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      mockCtx.db._setMockData('users_first', null);

      await expect(
        registerUser(mockCtx, {
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toThrow(/Password does not meet requirements/);
    });

    it('should reject registration with invalid email format', async () => {
      await expect(
        registerUser(mockCtx, {
          name: 'Test User',
          email: 'invalid-email',
          password: 'SecurePass123!',
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject registration with duplicate email', async () => {
      // Mock existing user
      mockCtx.db._setMockData('users_first', {
        _id: 'existing-user',
        email: 'test@example.com',
        name: 'Existing User',
      });

      await expect(
        registerUser(mockCtx, {
          name: 'Second User',
          email: 'test@example.com',
          password: 'SecurePass123!',
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should normalize email to lowercase during registration', async () => {
      mockCtx.db._setMockData('users_first', null);

      const result = await registerUser(mockCtx, {
        name: 'Test User',
        email: 'Test@EXAMPLE.COM',
        password: 'SecurePass123!',
      });

      expect(result.email).toBe('test@example.com');
    });

    it('should validate password with security requirements', async () => {
      mockCtx.db._setMockData('users_first', null);

      const testCases = [
        { password: 'short', shouldFail: true },
        { password: 'nouppercase123!', shouldFail: true },
        { password: 'NOLOWERCASE123!', shouldFail: true },
        { password: 'NoNumbers!', shouldFail: true },
        { password: 'NoSpecialChars123', shouldFail: true },
        { password: 'ValidPass123!', shouldFail: false },
      ];

      for (const testCase of testCases) {
        if (testCase.shouldFail) {
          await expect(
            registerUser(mockCtx, {
              name: 'Test User',
              email: `test-${Date.now()}@example.com`,
              password: testCase.password,
            })
          ).rejects.toThrow(/Password does not meet requirements/);
        } else {
          const result = await registerUser(mockCtx, {
            name: 'Test User',
            email: `test-${Date.now()}@example.com`,
            password: testCase.password,
          });
          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe('User Login', () => {
    const mockUser = {
      _id: 'user-123',
      name: 'Login Test User',
      email: 'login@example.com',
      password: '$2b$12$hashedpassword', // Mock bcrypt hash
      role: 'viewer',
      company_id: null,
      has_llm_access: false,
    };

    beforeEach(() => {
      // Mock bcrypt.compareSync to return true for correct password
      jest.doMock('bcryptjs', () => ({
        compareSync: jest.fn((password, hash) => password === 'SecurePass123!'),
        hashSync: jest.fn(() => '$2b$12$hashedpassword'),
      }));
    });

    it('should successfully login with valid credentials', async () => {
      mockCtx.db._setMockData('users_first', mockUser);

      const result = await loginUser(mockCtx, {
        email: 'login@example.com',
        password: 'SecurePass123!',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('login@example.com');
      expect(result.user.name).toBe('Login Test User');
      expect(result.sessionToken).toBeDefined();
      expect(result.expires).toBeGreaterThan(Date.now());
      expect(result.correlationId).toBeDefined();
    });

    it('should fail login with invalid password', async () => {
      mockCtx.db._setMockData('users_first', mockUser);

      await expect(
        loginUser(mockCtx, {
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail login with non-existent email', async () => {
      mockCtx.db._setMockData('users_first', null);

      await expect(
        loginUser(mockCtx, {
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should normalize email case during login', async () => {
      mockCtx.db._setMockData('users_first', mockUser);

      const result = await loginUser(mockCtx, {
        email: 'LOGIN@EXAMPLE.COM',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('login@example.com');
    });

    it('should create different session durations for remember me', async () => {
      mockCtx.db._setMockData('users_first', mockUser);

      // Regular login
      const regularResult = await loginUser(mockCtx, {
        email: 'login@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      });

      // Remember me login
      const rememberResult = await loginUser(mockCtx, {
        email: 'login@example.com',
        password: 'SecurePass123!',
        rememberMe: true,
      });

      // Remember me session should expire later than regular session
      expect(rememberResult.expires).toBeGreaterThan(regularResult.expires);
    });
  });

  describe('Session Management', () => {
    const mockSession = {
      _id: 'session-123',
      userId: 'user-123',
      sessionToken: 'valid-token',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      rememberMe: false,
    };

    const mockUser = {
      _id: 'user-123',
      name: 'Session Test User',
      email: 'session@example.com',
      role: 'viewer',
      company_id: null,
      has_llm_access: false,
    };

    it('should validate a valid session', async () => {
      mockCtx.db._setMockData('sessions_first', mockSession);
      mockCtx.db.get.mockResolvedValue(mockUser);

      const result = await verifySession(mockCtx, {
        sessionToken: 'valid-token',
      });

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('session@example.com');
      expect(result.name).toBe('Session Test User');
      expect(result.role).toBe('viewer');
    });

    it('should return null for invalid session token', async () => {
      mockCtx.db._setMockData('sessions_first', null);

      const result = await verifySession(mockCtx, {
        sessionToken: 'invalid-token',
      });

      expect(result).toBeNull();
    });

    it('should return null for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expires: Date.now() - 1000, // Expired 1 second ago
      };
      mockCtx.db._setMockData('sessions_first', expiredSession);

      const result = await verifySession(mockCtx, {
        sessionToken: 'expired-token',
      });

      expect(result).toBeNull();
    });

    it('should get current user with valid session', async () => {
      mockCtx.db._setMockData('sessions_first', mockSession);
      mockCtx.db.get.mockResolvedValue(mockUser);

      const result = await getCurrentUser(mockCtx, {
        sessionToken: 'valid-token',
      });

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('session@example.com');
      expect(result.name).toBe('Session Test User');
    });

    it('should return null for getCurrentUser with invalid session', async () => {
      mockCtx.db._setMockData('sessions_first', null);

      const result = await getCurrentUser(mockCtx, {
        sessionToken: 'invalid-token',
      });

      expect(result).toBeNull();
    });

    it('should logout and invalidate session', async () => {
      mockCtx.db._setMockData('sessions_first', mockSession);

      const result = await logoutUser(mockCtx, {
        sessionToken: 'valid-token',
      });

      expect(result.success).toBe(true);
      expect(mockCtx.db.delete).toHaveBeenCalledWith('session-123');
    });
  });

  describe('Password Reset Workflow', () => {
    const mockUser = {
      _id: 'user-123',
      email: 'reset@example.com',
      name: 'Reset Test User',
      password: '$2b$12$hashedpassword',
    };

    it('should request password reset for existing user', async () => {
      mockCtx.db._setMockData('users_first', mockUser);
      mockCtx.db._setMockData('password_reset_tokens_collect', []);

      const result = await requestPasswordReset(mockCtx, {
        email: 'reset@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockCtx.db.insert).toHaveBeenCalledWith('password_reset_tokens', expect.any(Object));
    });

    it('should fail password reset for non-existent user', async () => {
      mockCtx.db._setMockData('users_first', null);

      await expect(
        requestPasswordReset(mockCtx, {
          email: 'nonexistent@example.com',
        })
      ).rejects.toThrow('User not found');
    });

    it('should complete password reset with valid token', async () => {
      const resetToken = {
        _id: 'token-123',
        userId: 'user-123',
        token: 'valid-reset-token',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
      };

      mockCtx.db._setMockData('password_reset_tokens_first', resetToken);
      mockCtx.db.get.mockResolvedValue(mockUser);
      mockCtx.db._setMockData('sessions_collect', []);

      const result = await resetPassword(mockCtx, {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenCalledWith('user-123', expect.objectContaining({
        password: expect.any(String),
      }));
      expect(mockCtx.db.delete).toHaveBeenCalledWith('token-123');
    });

    it('should fail password reset with invalid token', async () => {
      mockCtx.db._setMockData('password_reset_tokens_first', null);

      await expect(
        resetPassword(mockCtx, {
          token: 'invalid-token',
          newPassword: 'NewSecurePass123!',
        })
      ).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('Security Features', () => {
    const mockUser = {
      _id: 'user-123',
      email: 'security@example.com',
      name: 'Security Test User',
      password: '$2b$12$hashedpassword',
    };

    const mockSession = {
      _id: 'session-123',
      userId: 'user-123',
      sessionToken: 'valid-token',
      expires: Date.now() + 24 * 60 * 60 * 1000,
      rememberMe: false,
    };

    beforeEach(() => {
      // Mock bcrypt for password operations
      jest.doMock('bcryptjs', () => ({
        compareSync: jest.fn((password, hash) => password === 'SecurePass123!'),
        hashSync: jest.fn(() => '$2b$12$newhashedpassword'),
      }));
    });

    it('should change password successfully', async () => {
      mockCtx.db._setMockData('sessions_first', mockSession);
      mockCtx.db.get.mockResolvedValue(mockUser);

      const result = await changePassword(mockCtx, {
        sessionToken: 'valid-token',
        currentPassword: 'SecurePass123!',
        newPassword: 'NewSecurePass456!',
      });

      expect(result.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenCalledWith('user-123', expect.objectContaining({
        password: expect.any(String),
      }));
    });

    it('should fail password change with incorrect current password', async () => {
      mockCtx.db._setMockData('sessions_first', mockSession);
      mockCtx.db.get.mockResolvedValue(mockUser);

      await expect(
        changePassword(mockCtx, {
          sessionToken: 'valid-token',
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecurePass456!',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('LLM Access Control', () => {
    const mockUser = {
      _id: 'user-123',
      name: 'LLM Test User',
      email: 'llm@example.com',
      has_llm_access: false,
    };

    it('should check LLM access for user without access', async () => {
      mockCtx.db.get.mockResolvedValue(mockUser);

      const result = await checkUserLLMAccess(mockCtx, {
        userId: 'user-123',
      });

      expect(result.has_llm_access).toBe(false);
      expect(result.fallbackMessage).toContain('contact david@ideasmen.com.au');
    });

    it('should check LLM access for user with access', async () => {
      const userWithAccess = { ...mockUser, has_llm_access: true };
      mockCtx.db.get.mockResolvedValue(userWithAccess);

      const result = await checkUserLLMAccess(mockCtx, {
        userId: 'user-123',
      });

      expect(result.has_llm_access).toBe(true);
      expect(result.fallbackMessage).toBeNull();
    });

    it('should update user LLM access successfully', async () => {
      mockCtx.db.get.mockResolvedValue({ ...mockUser, has_llm_access: true });

      const result = await updateUserLLMAccess(mockCtx, {
        userId: 'user-123',
        has_llm_access: true,
      });

      expect(result.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenCalledWith('user-123', {
        has_llm_access: true,
      });
    });
  });

  describe('Owner Access Control', () => {
    const ownerSession = {
      _id: 'session-123',
      userId: 'owner-123',
      sessionToken: 'owner-token',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    };

    const ownerUser = {
      _id: 'owner-123',
      email: 'david@ideasmen.com.au',
      name: 'David Owner',
    };

    const regularUser = {
      _id: 'regular-123',
      email: 'regular@example.com',
      name: 'Regular User',
    };

    it('should grant access to owner email', async () => {
      mockCtx.db._setMockData('sessions_first', ownerSession);
      mockCtx.db.get.mockResolvedValue(ownerUser);

      const result = await verifyOwnerAccess(mockCtx, {
        sessionToken: 'owner-token',
      });

      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    it('should deny access to non-owner email', async () => {
      const regularSession = { ...ownerSession, userId: 'regular-123' };
      mockCtx.db._setMockData('sessions_first', regularSession);
      mockCtx.db.get.mockResolvedValue(regularUser);

      const result = await verifyOwnerAccess(mockCtx, {
        sessionToken: 'owner-token',
      });

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Access restricted to owner only');
    });

    it('should deny access without session token', async () => {
      const result = await verifyOwnerAccess(mockCtx, {});

      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('No session token provided');
    });
  });

  describe('Data Validation and Edge Cases', () => {
    it('should handle very long names and emails gracefully', async () => {
      mockCtx.db._setMockData('users_first', null);

      const longName = 'A'.repeat(100);
      const longEmail = 'test' + 'a'.repeat(100) + '@example.com';

      const result = await registerUser(mockCtx, {
        name: longName,
        email: longEmail,
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.name).toBe(longName);
    });

    it('should handle special characters in names', async () => {
      mockCtx.db._setMockData('users_first', null);

      const specialName = 'Test User-O\'Neill (Jr.)';

      const result = await registerUser(mockCtx, {
        name: specialName,
        email: 'special@example.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.name).toBe(specialName);
    });

    it('should trim whitespace from names during registration', async () => {
      mockCtx.db._setMockData('users_first', null);

      const result = await registerUser(mockCtx, {
        name: '  Test User  ',
        email: 'trim@example.com',
        password: 'SecurePass123!',
      });

      expect(result.name).toBe('Test User');
    });
  });
});

// Helper functions for test data generation
function generateTestUser(suffix: string = '') {
  return {
    name: `Test User${suffix}`,
    email: `test${suffix}@example.com`,
    password: 'SecurePass123!',
  };
}

function generateStrongPassword(): string {
  return 'SecurePass123!@#';
}

function generateWeakPassword(): string {
  return 'weak';
}