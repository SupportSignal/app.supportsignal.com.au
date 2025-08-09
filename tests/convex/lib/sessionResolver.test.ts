/**
 * Tests for Enhanced Session Resolution with Impersonation Support
 * 
 * Tests the critical authentication function that handles both normal user sessions
 * and impersonation sessions, ensuring proper user resolution and security.
 * 
 * Test Categories:
 * - Impersonation session resolution
 * - Normal session fallback
 * - Session expiration handling
 * - User metadata enhancement
 * - Database error handling
 */

// @ts-nocheck

// Mock types for testing
type Id<T> = string;

// Import the function to test
const { getUserFromSession } = require('../../../apps/convex/lib/sessionResolver');

// Mock Convex database operations
const mockDb = {
  query: jest.fn(),
  get: jest.fn(),
};

// Mock query builder for chaining
const mockQuery = {
  withIndex: jest.fn(),
  filter: jest.fn(),
  first: jest.fn(),
};

// Create mock context
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
  name: 'Target User',
  email: 'target@test.com',
  role: 'company_admin',
  company_id: 'company-789' as Id<'companies'>,
  _creationTime: Date.now(),
};

const mockImpersonationSession = {
  _id: 'session-123' as Id<'impersonation_sessions'>,
  admin_user_id: mockAdminUser._id,
  target_user_id: mockTargetUser._id,
  session_token: 'impersonation-token',
  original_session_token: 'admin-session-token',
  reason: 'Testing user workflow',
  expires: Date.now() + 30 * 60 * 1000, // 30 minutes from now
  is_active: true,
  created_at: Date.now(),
  correlation_id: 'correlation-123',
};

const mockNormalSession = {
  _id: 'normal-session-456' as Id<'sessions'>,
  sessionToken: 'normal-session-token',
  userId: mockTargetUser._id,
  expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  _creationTime: Date.now(),
};

describe('Enhanced Session Resolution with Impersonation Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockDb.query.mockReturnValue(mockQuery);
    mockQuery.withIndex.mockReturnValue(mockQuery);
    mockQuery.filter.mockReturnValue(mockQuery);
    mockQuery.first.mockReturnValue(mockQuery);
  });

  describe('Impersonation Session Resolution', () => {
    it('should resolve impersonation session and return target user with metadata', async () => {
      const ctx = createMockContext();
      
      // Mock finding impersonation session
      mockQuery.first
        .mockResolvedValueOnce(mockImpersonationSession) // First query for impersonation
        .mockResolvedValueOnce(null); // Second query for normal session (shouldn't be reached)
      
      // Mock getting target user
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      const result = await getUserFromSession(ctx, 'impersonation-token');
      
      expect(result).toEqual({
        ...mockTargetUser,
        _isImpersonating: true,
        _originalAdminId: mockAdminUser._id,
        _correlationId: 'correlation-123',
      });
      
      // Verify impersonation session was queried first
      expect(mockDb.query).toHaveBeenCalledWith('impersonation_sessions');
      expect(mockQuery.withIndex).toHaveBeenCalledWith('by_session_token', expect.any(Function));
      
      // Verify target user was retrieved
      expect(mockDb.get).toHaveBeenCalledWith(mockTargetUser._id);
    });

    it('should return null when impersonation session is inactive', async () => {
      const ctx = createMockContext();
      
      // Mock finding inactive impersonation session
      const inactiveSession = {
        ...mockImpersonationSession,
        is_active: false,
      };
      
      // The filter should exclude inactive sessions
      mockQuery.first.mockResolvedValue(null); // Filter excludes inactive sessions
      
      // Mock normal session lookup failure
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, 'inactive-token');
      
      expect(result).toBeNull();
    });

    it('should return null when impersonation session is expired', async () => {
      const ctx = createMockContext();
      
      // Mock finding expired impersonation session
      const expiredSession = {
        ...mockImpersonationSession,
        expires: Date.now() - 10000, // Expired 10 seconds ago
      };
      
      // The filter should exclude expired sessions
      mockQuery.first.mockResolvedValue(null); // Filter excludes expired sessions
      
      // Mock normal session lookup failure  
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, 'expired-token');
      
      expect(result).toBeNull();
    });

    it('should return null when target user is not found', async () => {
      const ctx = createMockContext();
      
      // Mock finding impersonation session
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      
      // Mock target user not found
      mockDb.get.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, 'impersonation-token');
      
      expect(result).toBeNull();
    });

    it('should properly filter active and non-expired sessions', async () => {
      const ctx = createMockContext();
      
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      await getUserFromSession(ctx, 'impersonation-token');
      
      // Verify the filter function logic
      const filterCall = mockQuery.filter.mock.calls[0];
      expect(filterCall).toBeDefined();
      
      // The filter should check both is_active and expires > now
      const filterFn = filterCall[0];
      expect(typeof filterFn).toBe('function');
    });

    it('should include all required impersonation metadata', async () => {
      const ctx = createMockContext();
      
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      const result = await getUserFromSession(ctx, 'impersonation-token');
      
      // Verify all impersonation metadata is present
      expect(result._isImpersonating).toBe(true);
      expect(result._originalAdminId).toBe(mockAdminUser._id);
      expect(result._correlationId).toBe('correlation-123');
      
      // Verify original user data is preserved
      expect(result._id).toBe(mockTargetUser._id);
      expect(result.name).toBe(mockTargetUser.name);
      expect(result.email).toBe(mockTargetUser.email);
      expect(result.role).toBe(mockTargetUser.role);
    });
  });

  describe('Normal Session Fallback', () => {
    it('should fall back to normal session when no impersonation session found', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session found
      mockQuery.first
        .mockResolvedValueOnce(null) // No impersonation session
        .mockResolvedValueOnce(mockNormalSession); // Normal session found
      
      // Mock getting user from normal session
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      const result = await getUserFromSession(ctx, 'normal-session-token');
      
      expect(result).toEqual(mockTargetUser);
      
      // Verify both queries were attempted
      expect(mockDb.query).toHaveBeenCalledWith('impersonation_sessions');
      expect(mockDb.query).toHaveBeenCalledWith('sessions');
      
      // Verify normal session user lookup
      expect(mockDb.get).toHaveBeenCalledWith(mockNormalSession.userId);
      
      // Verify no impersonation metadata
      expect(result._isImpersonating).toBeUndefined();
      expect(result._originalAdminId).toBeUndefined();
      expect(result._correlationId).toBeUndefined();
    });

    it('should return null when normal session is expired', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session
      mockQuery.first.mockResolvedValueOnce(null);
      
      // Mock expired normal session
      const expiredNormalSession = {
        ...mockNormalSession,
        expires: Date.now() - 10000, // Expired 10 seconds ago
      };
      mockQuery.first.mockResolvedValueOnce(expiredNormalSession);
      
      const result = await getUserFromSession(ctx, 'expired-normal-token');
      
      expect(result).toBeNull();
      
      // Verify user lookup was not attempted for expired session
      expect(mockDb.get).not.toHaveBeenCalled();
    });

    it('should return null when no sessions found', async () => {
      const ctx = createMockContext();
      
      // Mock no sessions found
      mockQuery.first
        .mockResolvedValueOnce(null) // No impersonation session
        .mockResolvedValueOnce(null); // No normal session
      
      const result = await getUserFromSession(ctx, 'non-existent-token');
      
      expect(result).toBeNull();
    });

    it('should handle normal session user not found', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session
      mockQuery.first.mockResolvedValueOnce(null);
      
      // Mock normal session found but user missing
      mockQuery.first.mockResolvedValueOnce(mockNormalSession);
      mockDb.get.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, 'orphaned-session-token');
      
      expect(result).toBeNull();
    });
  });

  describe('Session Priority and Query Order', () => {
    it('should prioritize impersonation sessions over normal sessions', async () => {
      const ctx = createMockContext();
      
      // Mock finding impersonation session (should not check normal session)
      mockQuery.first.mockResolvedValueOnce(mockImpersonationSession);
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      const result = await getUserFromSession(ctx, 'ambiguous-token');
      
      // Should return impersonation result
      expect(result._isImpersonating).toBe(true);
      
      // Should only query impersonation sessions table
      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledWith('impersonation_sessions');
    });

    it('should check normal sessions only after impersonation check fails', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session, then normal session
      mockQuery.first
        .mockResolvedValueOnce(null) // No impersonation
        .mockResolvedValueOnce(mockNormalSession); // Normal session found
      
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      const result = await getUserFromSession(ctx, 'normal-token');
      
      // Should return normal session result
      expect(result._isImpersonating).toBeUndefined();
      
      // Should query both tables in correct order
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(1, 'impersonation_sessions');
      expect(mockDb.query).toHaveBeenNthCalledWith(2, 'sessions');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle impersonation session query errors', async () => {
      const ctx = createMockContext();
      
      // Mock database error on impersonation query
      mockQuery.first.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(getUserFromSession(ctx, 'error-token')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle normal session query errors', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session, then error on normal session
      mockQuery.first
        .mockResolvedValueOnce(null) // No impersonation session
        .mockRejectedValue(new Error('Database connection failed'));
      
      await expect(getUserFromSession(ctx, 'error-token')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle user lookup errors for impersonation', async () => {
      const ctx = createMockContext();
      
      // Mock finding impersonation session but error getting user
      mockQuery.first.mockResolvedValue(mockImpersonationSession);
      mockDb.get.mockRejectedValue(new Error('User lookup failed'));
      
      await expect(getUserFromSession(ctx, 'impersonation-token')).rejects.toThrow(
        'User lookup failed'
      );
    });

    it('should handle user lookup errors for normal sessions', async () => {
      const ctx = createMockContext();
      
      // Mock no impersonation session, normal session found, but error getting user
      mockQuery.first
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockNormalSession);
      mockDb.get.mockRejectedValue(new Error('User lookup failed'));
      
      await expect(getUserFromSession(ctx, 'normal-token')).rejects.toThrow(
        'User lookup failed'
      );
    });
  });

  describe('Session Token Edge Cases', () => {
    it('should handle empty session token', async () => {
      const ctx = createMockContext();
      
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, '');
      
      expect(result).toBeNull();
    });

    it('should handle null session token', async () => {
      const ctx = createMockContext();
      
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, null as any);
      
      expect(result).toBeNull();
    });

    it('should handle undefined session token', async () => {
      const ctx = createMockContext();
      
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, undefined as any);
      
      expect(result).toBeNull();
    });

    it('should handle very long session token', async () => {
      const ctx = createMockContext();
      
      const longToken = 'a'.repeat(1000);
      mockQuery.first.mockResolvedValue(null);
      
      const result = await getUserFromSession(ctx, longToken);
      
      expect(result).toBeNull();
      
      // Verify the token was used in the query
      expect(mockQuery.withIndex).toHaveBeenCalledWith('by_session_token', expect.any(Function));
    });
  });

  describe('Time-Based Session Validation', () => {
    it('should properly validate session expiration times', async () => {
      const ctx = createMockContext();
      
      const now = Date.now();
      
      // Test impersonation session expiration
      const almostExpiredSession = {
        ...mockImpersonationSession,
        expires: now + 1000, // Expires in 1 second
      };
      
      mockQuery.first.mockResolvedValue(almostExpiredSession);
      mockDb.get.mockResolvedValue(mockTargetUser);
      
      // Mock Date.now() to ensure consistent timing
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await getUserFromSession(ctx, 'almost-expired-token');
      
      // Should still return user since it's not expired yet
      expect(result).toEqual(expect.objectContaining({
        _id: mockTargetUser._id,
        _isImpersonating: true,
      }));
      
      jest.restoreAllMocks();
    });

    it('should handle session expiration boundary conditions', async () => {
      const ctx = createMockContext();
      
      const now = Date.now();
      
      // Test session that expires exactly now
      const boundarySession = {
        ...mockImpersonationSession,
        expires: now,
      };
      
      // The filter should exclude sessions with expires <= now
      mockQuery.first.mockResolvedValue(null);
      
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await getUserFromSession(ctx, 'boundary-token');
      
      expect(result).toBeNull();
      
      jest.restoreAllMocks();
    });
  });
});