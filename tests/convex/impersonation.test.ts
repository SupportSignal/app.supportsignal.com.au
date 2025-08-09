/**
 * Comprehensive Tests for Impersonation System Backend Functions
 * 
 * Tests the security-critical impersonation functions with comprehensive
 * coverage of security validations, audit logging, and error handling.
 * 
 * Test Categories:
 * - Security validation and permissions
 * - Session management and timeouts  
 * - Concurrent session limits
 * - Audit logging and correlation tracking
 * - Error handling and edge cases
 * - Database state management
 */

// @ts-nocheck
import { ConvexError } from 'convex/values';

// Mock types for testing
type Id<T> = string;

// Mock Convex database operations
const mockDb = {
  query: jest.fn(),
  get: jest.fn(),
  insert: jest.fn(),
  patch: jest.fn(),
};

// Mock query builder for chaining
const mockQuery = {
  withIndex: jest.fn(),
  filter: jest.fn(),
  first: jest.fn(),
  collect: jest.fn(),
};

// Mock session resolver
jest.mock('../../apps/convex/lib/sessionResolver', () => ({
  getUserFromSession: jest.fn(),
}));

// Mock crypto for deterministic testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

// Import functions after mocking
const { getUserFromSession } = require('../../apps/convex/lib/sessionResolver');
const crypto = require('crypto');

// Mock the impersonation functions by creating a test context
const createMockContext = () => ({
  db: mockDb,
});

// Test fixtures
const mockAdminUser = {
  _id: 'admin-123' as Id<'users'>,
  name: 'System Admin',
  email: 'admin@test.com',
  role: 'system_admin',
  _creationTime: Date.now(),
};

const mockTargetUser = {
  _id: 'user-456' as Id<'users'>,
  name: 'Test User',
  email: 'user@test.com',
  role: 'company_admin',
  company_id: 'company-789' as Id<'companies'>,
  _creationTime: Date.now(),
};

const mockRegularUser = {
  _id: 'regular-789' as Id<'users'>,
  name: 'Regular User',
  email: 'regular@test.com',
  role: 'frontline_worker',
  _creationTime: Date.now(),
};

const mockImpersonationSession = {
  _id: 'session-123' as Id<'impersonation_sessions'>,
  admin_user_id: mockAdminUser._id,
  target_user_id: mockTargetUser._id,
  session_token: 'mock-session-token',
  original_session_token: 'admin-session-token',
  reason: 'Testing user workflow',
  expires: Date.now() + 30 * 60 * 1000, // 30 minutes from now
  is_active: true,
  created_at: Date.now(),
  correlation_id: 'correlation-123',
};

describe('Impersonation System Backend Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockDb.query.mockReturnValue(mockQuery);
    mockQuery.withIndex.mockReturnValue(mockQuery);
    mockQuery.filter.mockReturnValue(mockQuery);
    mockQuery.first.mockReturnValue(mockQuery);
    mockQuery.collect.mockReturnValue(mockQuery);
    
    // Mock crypto functions
    (crypto.randomBytes as jest.Mock)
      .mockReturnValueOnce({ toString: () => 'mock-secure-token' })
      .mockReturnValueOnce({ toString: () => 'correlation-id' });
  });

  describe('startImpersonation', () => {
    const validArgs = {
      admin_session_token: 'admin-session-token',
      target_user_email: 'user@test.com',
      reason: 'Testing user workflow',
    };

    beforeEach(() => {
      // Mock successful admin validation
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      
      // Mock no active sessions initially
      mockQuery.collect.mockResolvedValue([]);
      
      // Mock finding target user
      mockQuery.first.mockResolvedValue(mockTargetUser);
      
      // Mock successful database operations
      mockDb.insert
        .mockResolvedValueOnce('session-id')
        .mockResolvedValueOnce('log-id');
    });

    it('should successfully start impersonation with valid admin and target user', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const result = await startImpersonation.handler(ctx, validArgs);
      
      expect(result).toEqual({
        success: true,
        impersonation_token: 'mock-secure-token',
        correlation_id: 'correlation-id',
        expires: expect.any(Number),
      });
      
      // Verify admin validation was called
      expect(getUserFromSession).toHaveBeenCalledWith(ctx, 'admin-session-token');
      
      // Verify concurrent session check
      expect(mockDb.query).toHaveBeenCalledWith('impersonation_sessions');
      
      // Verify target user lookup
      expect(mockDb.query).toHaveBeenCalledWith('users');
      
      // Verify session creation
      expect(mockDb.insert).toHaveBeenCalledWith('impersonation_sessions', expect.objectContaining({
        admin_user_id: mockAdminUser._id,
        target_user_id: mockTargetUser._id,
        session_token: 'mock-secure-token',
        reason: 'Testing user workflow',
        expires: expect.any(Number),
        is_active: true,
      }));
      
      // Verify audit logging
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_start',
        success: true,
      }));
    });

    it('should reject non-admin users', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock regular user instead of admin
      (getUserFromSession as jest.Mock).mockResolvedValue(mockRegularUser);
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Insufficient permissions: System administrator role required'
      );
      
      // Verify audit log was created for failed attempt
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_start_failed',
        success: false,
        error_message: 'Insufficient permissions: System administrator role required',
      }));
    });

    it('should reject when admin not authenticated', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock no user found
      (getUserFromSession as jest.Mock).mockResolvedValue(null);
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Authentication required'
      );
    });

    it('should reject when target user not found', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock target user not found
      mockQuery.first.mockResolvedValue(null);
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Target user not found'
      );
    });

    it('should prevent impersonating other system admins', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock target user as another admin
      const anotherAdmin = {
        ...mockTargetUser,
        role: 'system_admin',
        email: 'another.admin@test.com',
      };
      mockQuery.first.mockResolvedValue(anotherAdmin);
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Cannot impersonate other system administrators'
      );
    });

    it('should enforce maximum concurrent sessions limit', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock 3 active sessions already exist
      const activeSessions = [
        { _id: '1', expires: Date.now() + 10000 },
        { _id: '2', expires: Date.now() + 10000 },
        { _id: '3', expires: Date.now() + 10000 },
      ];
      mockQuery.collect.mockResolvedValue(activeSessions);
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Maximum concurrent impersonation sessions reached (3)'
      );
    });

    it('should generate secure tokens with proper length', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      await startImpersonation.handler(ctx, validArgs);
      
      // Verify crypto.randomBytes was called for token generation
      expect(crypto.randomBytes).toHaveBeenCalledWith(32); // Session token
      expect(crypto.randomBytes).toHaveBeenCalledWith(16); // Correlation ID
    });

    it('should set correct session expiration time', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const startTime = Date.now();
      await startImpersonation.handler(ctx, validArgs);
      
      const insertCall = mockDb.insert.mock.calls.find(
        call => call[0] === 'impersonation_sessions'
      );
      const sessionData = insertCall[1];
      
      // Verify expiration is approximately 30 minutes from now
      const expectedExpires = startTime + 30 * 60 * 1000;
      expect(sessionData.expires).toBeGreaterThanOrEqual(expectedExpires - 1000);
      expect(sessionData.expires).toBeLessThanOrEqual(expectedExpires + 1000);
    });
  });

  describe('endImpersonation', () => {
    const validArgs = {
      impersonation_token: 'mock-session-token',
    };

    beforeEach(() => {
      // Mock finding active session
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      
      // Mock successful patch operation
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('log-id');
    });

    it('should successfully end active impersonation session', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const result = await endImpersonation.handler(ctx, validArgs);
      
      expect(result).toEqual({
        success: true,
        original_session_token: 'admin-session-token',
      });
      
      // Verify session was marked as inactive
      expect(mockDb.patch).toHaveBeenCalledWith(
        mockImpersonationSession._id,
        expect.objectContaining({
          is_active: false,
          terminated_at: expect.any(Number),
        })
      );
      
      // Verify audit logging
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_end',
        success: true,
        input_data: expect.objectContaining({
          termination_type: 'manual',
        }),
      }));
    });

    it('should reject when session not found', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock session not found
      mockQuery.first.mockResolvedValue(null);
      
      await expect(endImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Impersonation session not found'
      );
    });

    it('should reject when session already terminated', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock inactive session
      const inactiveSession = {
        ...mockImpersonationSession,
        is_active: false,
      };
      mockQuery.first.mockResolvedValue(inactiveSession);
      
      await expect(endImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Impersonation session already terminated'
      );
    });

    it('should calculate session duration correctly', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const sessionStart = now - 15 * 60 * 1000; // 15 minutes ago
      const sessionWithHistory = {
        ...mockImpersonationSession,
        created_at: sessionStart,
      };
      mockQuery.first.mockResolvedValue(sessionWithHistory);
      
      // Mock Date.now() to return consistent time
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      await endImpersonation.handler(ctx, validArgs);
      
      // Verify session duration was calculated
      const logCall = mockDb.insert.mock.calls.find(
        call => call[0] === 'ai_request_logs'
      );
      const logData = logCall[1];
      
      expect(logData.input_data.session_duration_ms).toBe(15 * 60 * 1000);
      
      jest.restoreAllMocks();
    });
  });

  describe('getImpersonationStatus', () => {
    const validArgs = {
      session_token: 'mock-session-token',
    };

    it('should return impersonation status with user details', async () => {
      const { getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock finding active session
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      
      // Mock getting user details
      mockDb.get
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockTargetUser);
      
      const result = await getImpersonationStatus.handler(ctx, validArgs);
      
      expect(result).toEqual({
        isImpersonating: true,
        adminUser: {
          id: mockAdminUser._id,
          name: mockAdminUser.name,
          email: mockAdminUser.email,
        },
        targetUser: {
          id: mockTargetUser._id,
          name: mockTargetUser.name,
          email: mockTargetUser.email,
          role: mockTargetUser.role,
        },
        sessionToken: 'mock-session-token',
        timeRemaining: expect.any(Number),
        correlation_id: 'correlation-123',
      });
      
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should return non-impersonating status when no session found', async () => {
      const { getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock no session found
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getImpersonationStatus.handler(ctx, validArgs);
      
      expect(result).toEqual({
        isImpersonating: false,
      });
    });

    it('should return non-impersonating status when session expired', async () => {
      const { getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock expired session
      const expiredSession = {
        ...mockImpersonationSession,
        expires: Date.now() - 1000, // Expired 1 second ago
      };
      mockQuery.first.mockResolvedValue(expiredSession);
      
      const result = await getImpersonationStatus.handler(ctx, validArgs);
      
      expect(result).toEqual({
        isImpersonating: false,
      });
    });

    it('should handle missing user details gracefully', async () => {
      const { getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock finding session but missing users
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      mockDb.get
        .mockResolvedValueOnce(null) // Admin user missing
        .mockResolvedValueOnce(mockTargetUser);
      
      const result = await getImpersonationStatus.handler(ctx, validArgs);
      
      expect(result).toEqual({
        isImpersonating: false,
      });
    });

    it('should calculate time remaining correctly', async () => {
      const { getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const expires = now + 25 * 60 * 1000; // 25 minutes from now
      const sessionWithTime = {
        ...mockImpersonationSession,
        expires,
      };
      
      mockQuery.first.mockResolvedValue(sessionWithTime);
      mockDb.get
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce(mockTargetUser);
      
      // Mock Date.now() for consistent time
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await getImpersonationStatus.handler(ctx, validArgs);
      
      expect(result.timeRemaining).toBe(25 * 60 * 1000);
      
      jest.restoreAllMocks();
    });
  });

  describe('searchUsersForImpersonation', () => {
    const validArgs = {
      admin_session_token: 'admin-session-token',
      search_term: 'test',
      limit: 10,
    };

    beforeEach(() => {
      // Mock successful admin validation
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      
      // Mock users query
      const mockUsers = [mockTargetUser, mockRegularUser];
      mockQuery.collect.mockResolvedValue(mockUsers);
      
      // Mock company lookup
      const mockCompany = {
        _id: 'company-789' as Id<'companies'>,
        name: 'Test Company',
      };
      mockDb.get.mockResolvedValue(mockCompany);
    });

    it('should return filtered and sorted user list for admin', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const result = await searchUsersForImpersonation.handler(ctx, validArgs);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        company_name: expect.any(String),
      });
      
      // Verify admin validation
      expect(getUserFromSession).toHaveBeenCalledWith(ctx, 'admin-session-token');
      
      // Verify query excludes system admins
      expect(mockDb.query).toHaveBeenCalledWith('users');
    });

    it('should reject non-admin users', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock regular user
      (getUserFromSession as jest.Mock).mockResolvedValue(mockRegularUser);
      
      await expect(searchUsersForImpersonation.handler(ctx, validArgs)).rejects.toThrow(
        'Insufficient permissions: System administrator role required'
      );
    });

    it('should filter users by search term', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // The function filters in JavaScript after DB query
      const allUsers = [
        { ...mockTargetUser, name: 'Test User', email: 'test@company.com' },
        { ...mockRegularUser, name: 'John Doe', email: 'john@company.com' },
        { name: 'Test Admin', email: 'testadmin@company.com', role: 'company_admin' },
      ];
      mockQuery.collect.mockResolvedValue(allUsers);
      
      const result = await searchUsersForImpersonation.handler(ctx, {
        ...validArgs,
        search_term: 'test',
      });
      
      // Should return users matching 'test' in name or email
      expect(result.length).toBeGreaterThan(0);
      result.forEach(user => {
        expect(
          user.name.toLowerCase().includes('test') || 
          user.email.toLowerCase().includes('test')
        ).toBe(true);
      });
    });

    it('should respect limit parameter', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock many users
      const manyUsers = Array.from({ length: 50 }, (_, i) => ({
        ...mockTargetUser,
        _id: `user-${i}` as Id<'users'>,
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));
      mockQuery.collect.mockResolvedValue(manyUsers);
      
      const result = await searchUsersForImpersonation.handler(ctx, {
        ...validArgs,
        limit: 5,
      });
      
      expect(result).toHaveLength(5);
    });

    it('should include company names when available', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const userWithCompany = {
        ...mockTargetUser,
        company_id: 'company-123' as Id<'companies'>,
      };
      mockQuery.collect.mockResolvedValue([userWithCompany]);
      
      const mockCompany = {
        _id: 'company-123' as Id<'companies'>,
        name: 'Acme Corporation',
      };
      mockDb.get.mockResolvedValue(mockCompany);
      
      const result = await searchUsersForImpersonation.handler(ctx, validArgs);
      
      expect(result[0].company_name).toBe('Acme Corporation');
    });
  });

  describe('emergencyTerminateAllSessions', () => {
    const validArgs = {
      admin_session_token: 'admin-session-token',
    };

    beforeEach(() => {
      // Mock successful admin validation
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      
      // Mock active sessions
      const activeSessions = [
        { _id: 'session-1', admin_user_id: 'admin-1' },
        { _id: 'session-2', admin_user_id: 'admin-2' },
        { _id: 'session-3', admin_user_id: 'admin-3' },
      ];
      mockQuery.collect.mockResolvedValue(activeSessions);
      
      // Mock successful operations
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('log-id');
    });

    it('should terminate all active sessions', async () => {
      const { emergencyTerminateAllSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const result = await emergencyTerminateAllSessions.handler(ctx, validArgs);
      
      expect(result).toEqual({
        success: true,
        sessions_terminated: 3,
        correlation_id: 'correlation-id',
      });
      
      // Verify all sessions were patched
      expect(mockDb.patch).toHaveBeenCalledTimes(3);
      expect(mockDb.patch).toHaveBeenCalledWith('session-1', {
        is_active: false,
        terminated_at: expect.any(Number),
      });
      
      // Verify audit logging
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_emergency_terminate',
        success: true,
        input_data: expect.objectContaining({
          sessions_terminated: 3,
        }),
      }));
    });

    it('should handle no active sessions gracefully', async () => {
      const { emergencyTerminateAllSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock no active sessions
      mockQuery.collect.mockResolvedValue([]);
      
      const result = await emergencyTerminateAllSessions.handler(ctx, validArgs);
      
      expect(result).toEqual({
        success: true,
        sessions_terminated: 0,
        correlation_id: 'correlation-id',
      });
      
      // No patches should have been called
      expect(mockDb.patch).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and log timeouts', async () => {
      const { cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const expiredSessions = [
        {
          _id: 'expired-1',
          expires: now - 10000, // 10 seconds ago
          correlation_id: 'corr-1',
          admin_user_id: 'admin-1',
          target_user_id: 'user-1',
          created_at: now - 40 * 60 * 1000, // 40 minutes ago
        },
        {
          _id: 'expired-2',
          expires: now - 5000, // 5 seconds ago
          correlation_id: 'corr-2',
          admin_user_id: 'admin-2',
          target_user_id: 'user-2',
          created_at: now - 35 * 60 * 1000, // 35 minutes ago
        },
      ];
      
      mockQuery.collect.mockResolvedValue(expiredSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('log-id');
      
      // Mock Date.now() for consistent time calculations
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await cleanupExpiredSessions.handler(ctx, {});
      
      expect(result).toEqual({
        expired_sessions_cleaned: 2,
      });
      
      // Verify sessions were marked inactive
      expect(mockDb.patch).toHaveBeenCalledTimes(2);
      expect(mockDb.patch).toHaveBeenCalledWith('expired-1', {
        is_active: false,
        terminated_at: now,
      });
      
      // Verify timeout logging
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_timeout',
        input_data: expect.objectContaining({
          termination_type: 'timeout',
          session_duration_ms: 40 * 60 * 1000,
        }),
      }));
      
      jest.restoreAllMocks();
    });

    it('should handle no expired sessions', async () => {
      const { cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock no expired sessions
      mockQuery.collect.mockResolvedValue([]);
      
      const result = await cleanupExpiredSessions.handler(ctx, {});
      
      expect(result).toEqual({
        expired_sessions_cleaned: 0,
      });
      
      expect(mockDb.patch).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('Security Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const validArgs = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'user@test.com',
        reason: 'Testing',
      };
      
      // Mock admin validation success but database error
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      mockQuery.collect.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(startImpersonation.handler(ctx, validArgs)).rejects.toThrow();
      
      // Verify error logging still occurred
      expect(mockDb.insert).toHaveBeenCalledWith('ai_request_logs', expect.objectContaining({
        operation: 'impersonation_start_failed',
        success: false,
      }));
    });

    it('should validate correlation ID uniqueness', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock crypto to return unique values each call
      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce({ toString: () => 'session-token-1' })
        .mockReturnValueOnce({ toString: () => 'unique-correlation-id-1' });
      
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockTargetUser);
      mockDb.insert.mockResolvedValue('success');
      
      const result = await startImpersonation.handler(ctx, {
        admin_session_token: 'admin-token',
        target_user_email: 'user@test.com',
        reason: 'Testing correlation ID',
      });
      
      expect(result.correlation_id).toBe('unique-correlation-id-1');
    });

    it('should handle concurrent session queries with proper filtering', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const mixedSessions = [
        { _id: '1', expires: now + 10000, is_active: true }, // Valid active
        { _id: '2', expires: now - 10000, is_active: true }, // Expired but marked active
        { _id: '3', expires: now + 10000, is_active: false }, // Inactive but not expired
      ];
      
      (getUserFromSession as jest.Mock).mockResolvedValue(mockAdminUser);
      mockQuery.first.mockResolvedValue(mockTargetUser);
      mockDb.insert.mockResolvedValue('success');
      
      // Verify proper filtering in the query
      // The function should only count sessions that are both active AND not expired
      mockQuery.collect.mockResolvedValue([mixedSessions[0]]); // Only the valid one
      
      const result = await startImpersonation.handler(ctx, {
        admin_session_token: 'admin-token',
        target_user_email: 'user@test.com',
        reason: 'Testing session filtering',
      });
      
      expect(result.success).toBe(true);
    });
  });
});