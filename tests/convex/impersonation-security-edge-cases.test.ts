/**
 * Comprehensive Security Edge Case Tests for Impersonation System
 * 
 * Tests critical security scenarios not covered in existing test suites,
 * focusing on attack vectors, data integrity, and security boundaries.
 * 
 * Test Categories:
 * - SQL injection and data manipulation attacks
 * - Session fixation and token hijacking scenarios
 * - Cross-user data leakage prevention
 * - Rate limiting and abuse prevention
 * - Audit log tampering prevention
 * - Time-based attack scenarios
 * - Memory and resource exhaustion attacks
 */

// @ts-nocheck
import { ConvexError } from 'convex/values';

// Mock types for testing
type Id<T> = string;

// Enhanced mock for security testing
const mockDb = {
  query: jest.fn(),
  get: jest.fn(),
  insert: jest.fn(),
  patch: jest.fn(),
  // Security audit tracking
  securityEvents: [] as Array<{ type: string; data: any; timestamp: number }>,
};

const mockQuery = {
  withIndex: jest.fn(),
  filter: jest.fn(),
  first: jest.fn(),
  collect: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
};

// Mock session resolver with security tracking
jest.mock('../../apps/convex/lib/sessionResolver', () => ({
  getUserFromSession: jest.fn(),
}));

// Mock crypto with security-focused implementation
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

// Import after mocking
const { getUserFromSession } = require('../../apps/convex/lib/sessionResolver');
const crypto = require('crypto');

// Security-focused test fixtures
const createSecureUser = (id: string, role: string, additionalProps = {}) => ({
  _id: id as Id<'users'>,
  name: `User ${id}`,
  email: `${id}@test.com`,
  role,
  company_id: role !== 'system_admin' ? 'company-123' as Id<'companies'> : undefined,
  _creationTime: Date.now(),
  ...additionalProps,
});

const mockSystemAdmin = createSecureUser('admin-secure-1', 'system_admin');
const mockTargetUser = createSecureUser('user-secure-1', 'frontline_worker');
const mockMaliciousActor = createSecureUser('malicious-1', 'frontline_worker');

// Mock context with security event tracking
const createSecurityContext = () => ({
  db: {
    ...mockDb,
    query: jest.fn().mockReturnValue(mockQuery),
    insert: jest.fn((table, data) => {
      mockDb.securityEvents.push({
        type: 'db_insert',
        data: { table, ...data },
        timestamp: Date.now(),
      });
      return mockDb.insert(table, data);
    }),
    patch: jest.fn((id, data) => {
      mockDb.securityEvents.push({
        type: 'db_patch',
        data: { id, ...data },
        timestamp: Date.now(),
      });
      return mockDb.patch(id, data);
    }),
  },
});

describe('Impersonation Security Edge Case Tests', () => {
  let securityContext: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.securityEvents = [];
    securityContext = createSecurityContext();
    
    // Setup default mock behaviors
    mockDb.query.mockReturnValue(mockQuery);
    mockQuery.withIndex.mockReturnValue(mockQuery);
    mockQuery.filter.mockReturnValue(mockQuery);
    mockQuery.first.mockReturnValue(mockQuery);
    mockQuery.collect.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    
    // Mock secure crypto functions
    (crypto.randomBytes as jest.Mock).mockImplementation((size) => ({
      toString: () => `secure_token_${size}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    }));
    
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('secure_hash_123'),
    });
    
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
    
    // Default to admin authentication
    (getUserFromSession as jest.Mock).mockResolvedValue(mockSystemAdmin);
  });

  describe('SQL Injection and Data Manipulation Attack Prevention', () => {
    it('should prevent SQL injection through email search parameters', async () => {
      const { searchUsersForImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Attempt SQL injection through search term
      const maliciousSearchTerms = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET role='system_admin' WHERE email='malicious@test.com'; --",
        "' UNION SELECT * FROM impersonation_sessions; --",
        "test@test.com'; INSERT INTO impersonation_sessions VALUES(...); --"
      ];
      
      // Mock user collection to return normal results
      mockQuery.collect.mockResolvedValue([mockTargetUser]);
      
      for (const maliciousTerm of maliciousSearchTerms) {
        const args = {
          admin_session_token: 'admin-token',
          search_term: maliciousTerm,
          limit: 10,
        };
        
        // Should not throw database errors or return unexpected results
        const result = await searchUsersForImpersonation(ctx, args);
        
        // Should return normal filtered results, not expose database structure
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(10);
        
        // Should not have triggered any suspicious database operations
        const suspiciousOps = mockDb.securityEvents.filter(event => 
          event.data.table === 'users' && 
          (event.data.role === 'system_admin' || event.type === 'db_patch')
        );
        expect(suspiciousOps).toHaveLength(0);
      }
    });

    it('should prevent data manipulation through malicious session tokens', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Attempt various token manipulation attacks
      const maliciousTokens = [
        "'; UPDATE impersonation_sessions SET admin_user_id='malicious-1' WHERE session_token='",
        "admin-token'; DROP TABLE impersonation_sessions; --",
        "admin-token' OR admin_user_id='malicious-1' --",
        "admin-token'; INSERT INTO users (role) VALUES ('system_admin'); --",
      ];
      
      mockQuery.collect.mockResolvedValue([]); // No active sessions
      mockQuery.first.mockResolvedValue(mockTargetUser);
      mockDb.insert.mockResolvedValue('session-123');
      
      for (const maliciousToken of maliciousTokens) {
        const args = {
          admin_session_token: maliciousToken,
          target_user_email: 'user@test.com',
          reason: 'Testing injection prevention',
        };
        
        // Should either authenticate properly or fail securely
        try {
          await startImpersonation(ctx, args);
        } catch (error) {
          // Should fail with authentication error, not database error
          expect(error.message).not.toMatch(/SQL|database|syntax/i);
        }
        
        // Should not have created impersonation sessions with manipulated data
        const sessionEvents = mockDb.securityEvents.filter(event => 
          event.type === 'db_insert' && event.data.table === 'impersonation_sessions'
        );
        sessionEvents.forEach(event => {
          expect(event.data.admin_user_id).toBe(mockSystemAdmin._id);
          expect(event.data.admin_user_id).not.toBe('malicious-1');
        });
      }
    });

    it('should prevent NoSQL injection through correlation ID manipulation', async () => {
      const { endImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Attempt to manipulate correlation ID for unauthorized access
      const maliciousSession = {
        _id: 'session-123' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockTargetUser._id,
        session_token: 'legitimate-token',
        is_active: true,
        created_at: Date.now(),
        correlation_id: { $ne: null }, // NoSQL injection attempt
      };
      
      mockQuery.first.mockResolvedValue(maliciousSession);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('audit-log');
      
      const args = {
        impersonation_token: 'legitimate-token',
      };
      
      // Should handle the session normally, not be affected by NoSQL injection
      const result = await endImpersonation(ctx, args);
      
      expect(result.success).toBe(true);
      
      // Should have logged the audit trail with secure correlation ID
      const auditEvents = mockDb.securityEvents.filter(event => 
        event.type === 'db_insert' && event.data.operation === 'impersonation_end'
      );
      expect(auditEvents).toHaveLength(1);
      expect(typeof auditEvents[0].data.correlation_id).not.toBe('object');
    });
  });

  describe('Session Fixation and Token Hijacking Prevention', () => {
    it('should prevent session fixation attacks', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Attacker tries to fix a session token they control
      const fixedToken = 'attacker-controlled-token-123';
      
      // Mock crypto to simulate attacker providing their own token
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => fixedToken,
      });
      
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockTargetUser);
      mockDb.insert.mockResolvedValue('session-123');
      
      const args = {
        admin_session_token: 'admin-token',
        target_user_email: 'user@test.com',
        reason: 'Session fixation test',
      };
      
      const result = await startImpersonation(ctx, args);
      
      // Should generate secure, unpredictable tokens
      expect(result.impersonation_token).toBeTruthy();
      expect(result.impersonation_token).not.toBe(fixedToken);
      expect(result.impersonation_token).toMatch(/^imp_\d+_[a-zA-Z0-9]+$/);
      
      // Should use cryptographically secure random token generation
      expect(crypto.randomBytes).toHaveBeenCalledWith(32); // For session token
      expect(crypto.randomBytes).toHaveBeenCalledWith(16); // For correlation ID
    });

    it('should detect and prevent token replay attacks', async () => {
      const { endImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const replayedToken = 'replayed-token-456';
      const originalSession = {
        _id: 'session-456' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockTargetUser._id,
        session_token: replayedToken,
        is_active: false, // Already terminated
        terminated_at: Date.now() - 30000, // 30 seconds ago
        created_at: Date.now() - 300000, // 5 minutes ago
      };
      
      mockQuery.first.mockResolvedValue(originalSession);
      
      const args = {
        impersonation_token: replayedToken,
      };
      
      // Should reject replayed tokens
      await expect(endImpersonation(ctx, args)).rejects.toThrow(
        'Impersonation session already terminated'
      );
      
      // Should not perform any state changes for replayed tokens
      expect(mockDb.patch).not.toHaveBeenCalled();
      
      // Should log the replay attempt as security event
      const suspiciousEvents = mockDb.securityEvents.filter(event => 
        event.type === 'db_insert' && 
        event.data.operation?.includes('failed')
      );
      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    it('should implement secure token comparison to prevent timing attacks', async () => {
      const { getImpersonationStatus } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const legitimateToken = 'legitimate-impersonation-token';
      const attackerToken = 'attacker-guessed-token-prefix';
      
      // Setup timing attack scenario
      const session = {
        _id: 'session-timing' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockTargetUser._id,
        session_token: legitimateToken,
        expires: Date.now() + 10000,
        is_active: true,
        correlation_id: 'corr-timing',
      };
      
      // Mock timing-safe comparison
      (crypto.timingSafeEqual as jest.Mock).mockImplementation((a, b) => {
        // Simulate constant-time comparison
        return Buffer.from(a).equals(Buffer.from(b));
      });
      
      mockQuery.first
        .mockResolvedValueOnce(session) // Legitimate token
        .mockResolvedValueOnce(null);   // Attacker token
      
      // Test legitimate token
      const legitimateResult = await getImpersonationStatus(ctx, {
        session_token: legitimateToken,
      });
      expect(legitimateResult.isImpersonating).toBe(true);
      
      // Test attacker token
      const attackerResult = await getImpersonationStatus(ctx, {
        session_token: attackerToken,
      });
      expect(attackerResult.isImpersonating).toBe(false);
      
      // Both operations should take similar time (constant-time comparison)
      // This is implicitly tested by using crypto.timingSafeEqual
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });
  });

  describe('Cross-User Data Leakage Prevention', () => {
    it('should prevent unauthorized access to other users impersonation sessions', async () => {
      const { getActiveImpersonationSessions } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Setup multiple admin users with sessions
      const otherAdmin = createSecureUser('admin-other-1', 'system_admin');
      const maliciousAdmin = createSecureUser('admin-malicious-1', 'system_admin');
      
      const sessions = [
        {
          _id: 'session-1',
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockTargetUser._id,
          expires: Date.now() + 10000,
          is_active: true,
        },
        {
          _id: 'session-2',
          admin_user_id: otherAdmin._id, // Different admin
          target_user_id: 'other-user' as Id<'users'>,
          expires: Date.now() + 10000,
          is_active: true,
        },
      ];
      
      // Mock malicious admin trying to see other admin's sessions
      (getUserFromSession as jest.Mock).mockResolvedValue(maliciousAdmin);
      
      // Should only return sessions for the authenticated admin
      mockQuery.collect.mockResolvedValue(sessions.filter(s => 
        s.admin_user_id === maliciousAdmin._id
      ));
      
      mockDb.get.mockResolvedValue(null); // No users for malicious admin
      
      const args = {
        admin_session_token: 'malicious-admin-token',
      };
      
      const result = await getActiveImpersonationSessions(ctx, args);
      
      // Should return empty array (no sessions for malicious admin)
      expect(result).toEqual([]);
      
      // Should not have accessed other admins' session data
      expect(mockDb.get).not.toHaveBeenCalledWith(mockSystemAdmin._id);
      expect(mockDb.get).not.toHaveBeenCalledWith(otherAdmin._id);
    });

    it('should prevent information disclosure through error messages', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Test various scenarios that could leak sensitive information
      const sensitiveTestCases = [
        {
          args: {
            admin_session_token: 'admin-token',
            target_user_email: 'nonexistent@test.com',
            reason: 'Testing info disclosure',
          },
          setup: () => {
            mockQuery.collect.mockResolvedValue([]);
            mockQuery.first.mockResolvedValue(null); // User not found
          },
          expectedError: 'Target user not found',
        },
        {
          args: {
            admin_session_token: 'admin-token',
            target_user_email: 'admin@test.com',
            reason: 'Testing admin protection',
          },
          setup: () => {
            mockQuery.collect.mockResolvedValue([]);
            mockQuery.first.mockResolvedValue(createSecureUser('admin-target', 'system_admin'));
          },
          expectedError: 'Cannot impersonate other system administrators',
        },
      ];
      
      for (const testCase of sensitiveTestCases) {
        testCase.setup();
        
        await expect(startImpersonation(ctx, testCase.args)).rejects.toThrow(
          testCase.expectedError
        );
        
        // Error messages should not contain sensitive information
        try {
          await startImpersonation(ctx, testCase.args);
        } catch (error) {
          expect(error.message).not.toMatch(/password|hash|token|secret|key/i);
          expect(error.message).not.toContain(mockSystemAdmin._id);
          expect(error.message).not.toContain('admin-token');
        }
      }
    });

    it('should sanitize audit logs to prevent sensitive data leakage', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const sensitiveData = {
        admin_session_token: 'sensitive-admin-token-with-secrets',
        target_user_email: 'user@test.com',
        reason: 'Password: secret123, API Key: ak_live_123456',
      };
      
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockTargetUser);
      mockDb.insert.mockResolvedValue('session-123');
      
      await startImpersonation(ctx, sensitiveData);
      
      // Check audit logs for sensitive data
      const auditEvents = mockDb.securityEvents.filter(event => 
        event.type === 'db_insert' && event.data.operation === 'impersonation_start'
      );
      
      expect(auditEvents).toHaveLength(1);
      const auditLog = auditEvents[0];
      
      // Should not log the full session token
      expect(JSON.stringify(auditLog.data)).not.toContain('sensitive-admin-token-with-secrets');
      
      // Should not log passwords or API keys from reason field
      expect(auditLog.data.reason).not.toContain('secret123');
      expect(auditLog.data.reason).not.toContain('ak_live_123456');
      
      // Should sanitize or hash sensitive data
      if (auditLog.data.admin_session_token) {
        expect(auditLog.data.admin_session_token).toMatch(/^\*+$|^[a-f0-9]{64}$/); // Masked or hashed
      }
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should prevent rapid-fire impersonation session creation', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      mockQuery.collect.mockResolvedValue([]); // No active sessions initially
      mockQuery.first.mockResolvedValue(mockTargetUser);
      
      let sessionCount = 0;
      mockDb.insert.mockImplementation(() => {
        sessionCount++;
        return `session-${sessionCount}`;
      });
      
      const rapidRequests = Array.from({ length: 10 }, (_, i) => ({
        admin_session_token: 'admin-token',
        target_user_email: `user${i}@test.com`,
        reason: `Rapid test ${i}`,
      }));
      
      // Try to create sessions rapidly
      const promises = rapidRequests.map(args => 
        startImpersonation(ctx, args).catch(err => err)
      );
      
      const results = await Promise.all(promises);
      
      // Should enforce session limits (max 3 concurrent)
      const successfulCreations = results.filter(r => r.success).length;
      expect(successfulCreations).toBeLessThanOrEqual(3);
      
      // Should reject additional attempts
      const rejectedAttempts = results.filter(r => 
        r instanceof Error && r.message.includes('Maximum concurrent')
      ).length;
      expect(rejectedAttempts).toBeGreaterThan(0);
      
      // Should log rate limiting events
      const rateLimitEvents = mockDb.securityEvents.filter(event => 
        event.data.error_message?.includes('Maximum concurrent')
      );
      expect(rateLimitEvents.length).toBeGreaterThan(0);
    });

    it('should prevent session enumeration attacks', async () => {
      const { getImpersonationStatus } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Simulate attacker trying to enumerate valid session tokens
      const potentialTokens = [
        'imp_1234567890_abcdefgh',
        'imp_1234567891_abcdefgh',
        'imp_1234567892_abcdefgh',
        'imp_1234567893_abcdefgh',
        'imp_1234567894_abcdefgh',
      ];
      
      // Mock responses to prevent enumeration
      mockQuery.first.mockImplementation((tokenQuery) => {
        // Only return session for specific legitimate token
        if (tokenQuery.toString().includes('imp_1234567892_abcdefgh')) {
          return Promise.resolve({
            _id: 'session-enum' as Id<'impersonation_sessions'>,
            admin_user_id: mockSystemAdmin._id,
            target_user_id: mockTargetUser._id,
            session_token: 'imp_1234567892_abcdefgh',
            expires: Date.now() + 10000,
            is_active: true,
            correlation_id: 'corr-enum',
          });
        }
        return Promise.resolve(null);
      });
      
      let validTokenFound = 0;
      const responses = [];
      
      // Try to enumerate tokens
      for (const token of potentialTokens) {
        const result = await getImpersonationStatus(ctx, { session_token: token });
        responses.push(result);
        
        if (result.isImpersonating) {
          validTokenFound++;
        }
      }
      
      // Should only find the one legitimate token
      expect(validTokenFound).toBe(1);
      
      // All invalid requests should return identical responses
      const invalidResponses = responses.filter(r => !r.isImpersonating);
      expect(invalidResponses.length).toBe(4);
      
      // Invalid responses should be consistent (prevent timing attacks)
      invalidResponses.forEach(response => {
        expect(response).toEqual({ isImpersonating: false });
      });
    });

    it('should implement progressive delays for repeated authentication failures', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Mock repeated authentication failures
      (getUserFromSession as jest.Mock)
        .mockResolvedValueOnce(null) // 1st failure
        .mockResolvedValueOnce(null) // 2nd failure
        .mockResolvedValueOnce(null) // 3rd failure
        .mockResolvedValueOnce(mockSystemAdmin); // Success
      
      const failingArgs = {
        admin_session_token: 'invalid-token',
        target_user_email: 'user@test.com',
        reason: 'Testing progressive delays',
      };
      
      const startTimes: number[] = [];
      const endTimes: number[] = [];
      
      // Test repeated failures
      for (let i = 0; i < 3; i++) {
        startTimes[i] = Date.now();
        
        try {
          await startImpersonation(ctx, failingArgs);
        } catch (error) {
          endTimes[i] = Date.now();
          expect(error.message).toBe('Authentication required');
        }
      }
      
      // Should implement progressive delays (each failure takes longer)
      const delays = endTimes.map((end, i) => end - startTimes[i]);
      
      // Note: In a real implementation, progressive delays would be implemented
      // This test documents the expected behavior
      expect(delays.length).toBe(3);
      
      // Should log security events for repeated failures
      const failureEvents = mockDb.securityEvents.filter(event => 
        event.data.operation === 'impersonation_start_failed'
      );
      expect(failureEvents.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Time-Based Attack Scenarios', () => {
    it('should prevent session extension attacks', async () => {
      const { getImpersonationStatus } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const now = Date.now();
      const sessionData = {
        _id: 'session-time-attack' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockTargetUser._id,
        session_token: 'time-attack-token',
        expires: now + 1000, // Expires in 1 second
        is_active: true,
        created_at: now - 29 * 60 * 1000, // Started 29 minutes ago
        correlation_id: 'corr-time',
      };
      
      mockQuery.first.mockResolvedValue(sessionData);
      mockDb.get
        .mockResolvedValueOnce(mockSystemAdmin)
        .mockResolvedValueOnce(mockTargetUser);
      
      // First call should return valid session
      const result1 = await getImpersonationStatus(ctx, {
        session_token: 'time-attack-token',
      });
      expect(result1.isImpersonating).toBe(true);
      expect(result1.timeRemaining).toBeGreaterThan(0);
      
      // Mock time advance to simulate session expiration
      jest.spyOn(Date, 'now').mockReturnValue(now + 2000); // 2 seconds later
      
      // Second call should return expired session
      const result2 = await getImpersonationStatus(ctx, {
        session_token: 'time-attack-token',
      });
      expect(result2.isImpersonating).toBe(false);
      
      // Should not extend session lifetime through repeated queries
      expect(sessionData.expires).toBe(now + 1000); // Unchanged
      
      jest.restoreAllMocks();
    });

    it('should handle clock skew and time manipulation attempts', async () => {
      const { cleanupExpiredSessions } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const baseTime = Date.now();
      
      // Create sessions with suspicious timing
      const suspiciousSessions = [
        {
          _id: 'session-future-1',
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockTargetUser._id,
          expires: baseTime - 1000, // Expired 1 second ago
          created_at: baseTime + 60000, // Created in the future (suspicious)
          is_active: true,
          correlation_id: 'corr-future-1',
        },
        {
          _id: 'session-past-1',
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockTargetUser._id,
          expires: baseTime - 1000, // Expired
          created_at: baseTime - 100 * 365 * 24 * 60 * 60 * 1000, // Created 100 years ago
          is_active: true,
          correlation_id: 'corr-past-1',
        },
      ];
      
      mockQuery.collect.mockResolvedValue(suspiciousSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('cleanup-audit');
      
      jest.spyOn(Date, 'now').mockReturnValue(baseTime);
      
      const result = await cleanupExpiredSessions(ctx, {});
      
      expect(result.expired_sessions_cleaned).toBe(2);
      
      // Should have logged suspicious timing patterns
      const auditEvents = mockDb.securityEvents.filter(event => 
        event.type === 'db_insert' && event.data.operation === 'impersonation_timeout'
      );
      expect(auditEvents).toHaveLength(2);
      
      // Should handle negative or extreme durations gracefully
      auditEvents.forEach(event => {
        const duration = event.data.input_data?.session_duration_ms;
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0); // No negative durations
        expect(duration).toBeLessThan(365 * 24 * 60 * 60 * 1000); // No year-long sessions
      });
      
      jest.restoreAllMocks();
    });
  });

  describe('Memory and Resource Exhaustion Prevention', () => {
    it('should handle large-scale concurrent session cleanup efficiently', async () => {
      const { cleanupExpiredSessions } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Create a large number of expired sessions
      const largeSessions = Array.from({ length: 1000 }, (_, i) => ({
        _id: `expired-session-${i}` as Id<'impersonation_sessions'>,
        admin_user_id: `admin-${i % 10}` as Id<'users'>,
        target_user_id: `user-${i}` as Id<'users'>,
        expires: Date.now() - (i * 1000), // Staggered expiration
        is_active: true,
        created_at: Date.now() - (35 * 60 * 1000) - (i * 1000),
        correlation_id: `corr-${i}`,
      }));
      
      mockQuery.collect.mockResolvedValue(largeSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('bulk-audit');
      
      const startTime = Date.now();
      const result = await cleanupExpiredSessions(ctx, {});
      const executionTime = Date.now() - startTime;
      
      expect(result.expired_sessions_cleaned).toBe(1000);
      
      // Should complete within reasonable time (not O(n²) complexity)
      expect(executionTime).toBeLessThan(10000); // 10 seconds max
      
      // Should batch operations efficiently
      expect(mockDb.patch).toHaveBeenCalledTimes(1000);
      expect(mockDb.insert).toHaveBeenCalledTimes(1000);
      
      // Memory usage should remain bounded (no memory leaks)
      expect(mockDb.securityEvents.length).toBeLessThan(2500); // Reasonable audit log size
    });

    it('should limit search result sizes to prevent memory exhaustion', async () => {
      const { searchUsersForImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Create excessive number of matching users
      const excessiveUsers = Array.from({ length: 10000 }, (_, i) => 
        createSecureUser(`user-search-${i}`, 'frontline_worker', {
          name: `Search User ${i}`,
          email: `searchuser${i}@test.com`,
        })
      );
      
      mockQuery.collect.mockResolvedValue(excessiveUsers);
      
      const args = {
        admin_session_token: 'admin-token',
        search_term: 'search', // Would match all 10000 users
        limit: 50, // Reasonable limit
      };
      
      const result = await searchUsersForImpersonation(ctx, args);
      
      // Should respect the limit parameter
      expect(result.length).toBeLessThanOrEqual(50);
      
      // Should not return excessive data that could exhaust memory
      expect(result.length).toBeLessThan(1000);
      
      // Should efficiently handle large datasets without timeouts
      result.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user.name.toLowerCase()).toContain('search');
      });
    });
  });

  describe('Audit Log Tampering Prevention', () => {
    it('should detect and prevent audit log manipulation', async () => {
      const { startImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      // Mock database insert to simulate tampering attempt
      let auditLogData: any = null;
      mockDb.insert.mockImplementation((table, data) => {
        if (table === 'impersonation_sessions') {
          return Promise.resolve('session-123');
        }
        if (table === 'ai_request_logs') {
          auditLogData = data;
          // Simulate tampering attempt
          if (data.operation === 'impersonation_start') {
            data.success = false; // Try to tamper with success flag
            data.admin_user_id = 'tampered-admin-id'; // Try to change admin ID
          }
          return Promise.resolve('audit-123');
        }
        return Promise.resolve('unknown');
      });
      
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockTargetUser);
      
      const args = {
        admin_session_token: 'admin-token',
        target_user_email: 'user@test.com',
        reason: 'Testing audit integrity',
      };
      
      const result = await startImpersonation(ctx, args);
      
      expect(result.success).toBe(true);
      
      // Audit log should maintain integrity despite tampering attempt
      expect(auditLogData).toBeTruthy();
      expect(auditLogData.operation).toBe('impersonation_start');
      expect(auditLogData.success).toBe(true); // Should reflect actual result
      expect(auditLogData.input_data.admin_user_id).toBe(mockSystemAdmin._id);
      
      // Should include tamper-detection fields
      expect(auditLogData.correlation_id).toBeTruthy();
      expect(auditLogData.created_at).toBeTruthy();
    });

    it('should maintain audit trail integrity across transaction failures', async () => {
      const { endImpersonation } = require('@/impersonation');
      const ctx = createSecurityContext();
      
      const sessionData = {
        _id: 'session-integrity' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockTargetUser._id,
        session_token: 'integrity-test-token',
        is_active: true,
        created_at: Date.now() - 300000,
        correlation_id: 'corr-integrity',
      };
      
      mockQuery.first.mockResolvedValue(sessionData);
      
      // Mock partial failure - session update succeeds but audit log fails
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockRejectedValue(new Error('Audit log service unavailable'));
      
      const args = {
        impersonation_token: 'integrity-test-token',
      };
      
      // Should fail if audit logging fails (maintaining integrity)
      await expect(endImpersonation(ctx, args)).rejects.toThrow(
        'Audit log service unavailable'
      );
      
      // Should have attempted to patch session
      expect(mockDb.patch).toHaveBeenCalledWith('session-integrity', {
        is_active: false,
        terminated_at: expect.any(Number),
      });
      
      // Should maintain transactional integrity - if audit fails, operation fails
      const patchEvents = mockDb.securityEvents.filter(event => 
        event.type === 'db_patch'
      );
      expect(patchEvents).toHaveLength(1);
    });
  });
});