/**
 * Integration Tests for Impersonation Security Scenarios
 * 
 * Comprehensive security, audit logging, and error handling tests that
 * simulate real-world scenarios and edge cases for the impersonation system.
 * 
 * Test Categories:
 * - Security validation and attack scenarios
 * - Concurrent session management
 * - Timeout and session lifecycle
 * - Audit trail and correlation tracking
 * - Error propagation and recovery
 * - Database transaction integrity
 */

// @ts-nocheck
import { ConvexError } from 'convex/values';

// Mock types and constants for testing
type Id<T> = string;
const IMPERSONATION_CONFIG = {
  SESSION_DURATION_MS: 30 * 60 * 1000,
  MAX_CONCURRENT_SESSIONS: 3,
  TOKEN_LENGTH: 32,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
};

// Mock Convex database operations with enhanced functionality
const mockDb = {
  query: jest.fn(),
  get: jest.fn(),
  insert: jest.fn(),
  patch: jest.fn(),
  // Track all operations for audit trail verification
  operations: [] as Array<{ type: string; table: string; data?: any; id?: string }>,
};

// Enhanced mock query builder
const mockQuery = {
  withIndex: jest.fn(),
  filter: jest.fn(),
  first: jest.fn(),
  collect: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
};

// Mock session resolver with enhanced tracking
jest.mock('../../apps/convex/lib/sessionResolver', () => ({
  getUserFromSession: jest.fn(),
}));

// Mock crypto with predictable but secure-looking tokens
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

// Import after mocking
const { getUserFromSession } = require('../../apps/convex/lib/sessionResolver');
const crypto = require('crypto');

// Enhanced test fixtures
const createMockUser = (id: string, role: string, name: string, email: string) => ({
  _id: id as Id<'users'>,
  name,
  email,
  role,
  company_id: role !== 'system_admin' ? 'company-123' as Id<'companies'> : undefined,
  _creationTime: Date.now(),
});

const mockSystemAdmin = createMockUser('admin-sys-1', 'system_admin', 'System Admin', 'sysadmin@test.com');
const mockCompanyAdmin = createMockUser('admin-comp-1', 'company_admin', 'Company Admin', 'companyadmin@test.com');
const mockTeamLead = createMockUser('lead-1', 'team_lead', 'Team Lead', 'teamlead@test.com');
const mockWorker1 = createMockUser('worker-1', 'frontline_worker', 'Worker One', 'worker1@test.com');
const mockWorker2 = createMockUser('worker-2', 'frontline_worker', 'Worker Two', 'worker2@test.com');
const mockAnotherAdmin = createMockUser('admin-sys-2', 'system_admin', 'Another Admin', 'admin2@test.com');

// Mock context factory
const createMockContext = () => ({
  db: {
    ...mockDb,
    query: jest.fn().mockReturnValue(mockQuery),
    get: jest.fn((id) => {
      mockDb.operations.push({ type: 'get', table: 'unknown', id });
      return mockDb.get(id);
    }),
    insert: jest.fn((table, data) => {
      mockDb.operations.push({ type: 'insert', table, data });
      return mockDb.insert(table, data);
    }),
    patch: jest.fn((id, data) => {
      mockDb.operations.push({ type: 'patch', table: 'unknown', id, data });
      return mockDb.patch(id, data);
    }),
  },
});

describe('Impersonation Security Integration Tests', () => {
  let tokenCounter = 0;
  let correlationCounter = 0;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.operations = [];
    tokenCounter = 0;
    correlationCounter = 0;
    
    // Setup default mock behaviors
    mockDb.query.mockReturnValue(mockQuery);
    mockQuery.withIndex.mockReturnValue(mockQuery);
    mockQuery.filter.mockReturnValue(mockQuery);
    mockQuery.first.mockReturnValue(mockQuery);
    mockQuery.collect.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    
    // Mock crypto with predictable tokens
    (crypto.randomBytes as jest.Mock).mockImplementation((size) => ({
      toString: () => size === 32 ? `session-token-${++tokenCounter}` : `correlation-${++correlationCounter}`,
    }));
    
    // Default to successful admin validation
    (getUserFromSession as jest.Mock).mockResolvedValue(mockSystemAdmin);
  });

  describe('Security Attack Scenarios', () => {
    it('should prevent privilege escalation attempts', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Attempt by company admin to impersonate (should fail)
      (getUserFromSession as jest.Mock).mockResolvedValue(mockCompanyAdmin);
      
      const args = {
        admin_session_token: 'company-admin-token',
        target_user_email: 'worker1@test.com',
        reason: 'Unauthorized access attempt',
      };
      
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Insufficient permissions: System administrator role required'
      );
      
      // Verify audit logging of failed attempt
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].data.operation).toBe('impersonation_start_failed');
      expect(auditLogs[0].data.success).toBe(false);
    });

    it('should prevent admin-to-admin impersonation attacks', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock finding target user as another admin
      mockQuery.collect.mockResolvedValue([]); // No active sessions
      mockQuery.first.mockResolvedValue(mockAnotherAdmin);
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'admin2@test.com',
        reason: 'Attempting to impersonate another admin',
      };
      
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Cannot impersonate other system administrators'
      );
      
      // Verify security event was logged
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].data.operation).toBe('impersonation_start_failed');
      expect(auditLogs[0].data.input_data.target_user_email).toBe('admin2@test.com');
    });

    it('should enforce session limits to prevent resource exhaustion', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock maximum active sessions already exist
      const activeSessions = Array.from({ length: 3 }, (_, i) => ({
        _id: `session-${i}`,
        admin_user_id: mockSystemAdmin._id,
        expires: Date.now() + 10000,
        is_active: true,
      }));
      mockQuery.collect.mockResolvedValue(activeSessions);
      mockQuery.first.mockResolvedValue(mockWorker1);
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Attempting to exceed session limit',
      };
      
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Maximum concurrent impersonation sessions reached (3)'
      );
      
      // Verify no session was created
      const sessionInserts = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'impersonation_sessions'
      );
      expect(sessionInserts).toHaveLength(0);
    });

    it('should validate session tokens to prevent token hijacking', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock session not found (invalid/hijacked token)
      mockQuery.first.mockResolvedValue(null);
      
      const args = {
        impersonation_token: 'hijacked-or-invalid-token',
      };
      
      await expect(endImpersonation.handler(ctx, args)).rejects.toThrow(
        'Impersonation session not found'
      );
      
      // No session should be terminated
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(0);
    });

    it('should prevent replay attacks on expired sessions', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock already terminated session
      const terminatedSession = {
        _id: 'session-123' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        session_token: 'terminated-token',
        is_active: false, // Already terminated
        terminated_at: Date.now() - 5000,
      };
      mockQuery.first.mockResolvedValue(terminatedSession);
      
      const args = {
        impersonation_token: 'terminated-token',
      };
      
      await expect(endImpersonation.handler(ctx, args)).rejects.toThrow(
        'Impersonation session already terminated'
      );
    });
  });

  describe('Concurrent Session Management', () => {
    it('should handle race conditions in session creation', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock scenario where sessions are created simultaneously
      let sessionCheckCount = 0;
      mockQuery.collect.mockImplementation(() => {
        sessionCheckCount++;
        // First check: 2 sessions, second check: 3 sessions (race condition)
        return Promise.resolve(
          Array.from({ length: sessionCheckCount === 1 ? 2 : 3 }, (_, i) => ({
            _id: `session-${i}`,
            expires: Date.now() + 10000,
            is_active: true,
          }))
        );
      });
      
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert.mockResolvedValue('new-session-id');
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing race condition handling',
      };
      
      // First call should succeed (2 sessions)
      const result1 = await startImpersonation.handler(ctx, args);
      expect(result1.success).toBe(true);
      
      // Second call should fail (would create 4th session)
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Maximum concurrent impersonation sessions reached (3)'
      );
    });

    it('should properly clean up expired sessions during concurrent checks', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      // Mock mix of active and expired sessions
      const mixedSessions = [
        { _id: 'active-1', expires: now + 10000, is_active: true },
        { _id: 'expired-1', expires: now - 10000, is_active: true }, // Should be filtered out
        { _id: 'active-2', expires: now + 10000, is_active: true },
      ];
      
      // The query filter should only return active non-expired sessions
      mockQuery.collect.mockResolvedValue([mixedSessions[0], mixedSessions[2]]);
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert.mockResolvedValue('new-session-id');
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing expired session filtering',
      };
      
      const result = await startImpersonation.handler(ctx, args);
      expect(result.success).toBe(true);
      
      // Should only count 2 active sessions, allowing new session
      const sessionInserts = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'impersonation_sessions'
      );
      expect(sessionInserts).toHaveLength(1);
    });

    it('should handle emergency termination of all sessions', async () => {
      const { emergencyTerminateAllSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const activeSessions = [
        { 
          _id: 'session-1' as Id<'impersonation_sessions'>,
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockWorker1._id,
          expires: now + 15 * 60 * 1000,
          is_active: true,
          created_at: now - 10 * 60 * 1000,
        },
        { 
          _id: 'session-2' as Id<'impersonation_sessions'>,
          admin_user_id: 'another-admin' as Id<'users'>,
          target_user_id: mockWorker2._id,
          expires: now + 20 * 60 * 1000,
          is_active: true,
          created_at: now - 5 * 60 * 1000,
        },
      ];
      
      mockQuery.collect.mockResolvedValue(activeSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('audit-log-id');
      
      const args = {
        admin_session_token: 'admin-session-token',
      };
      
      const result = await emergencyTerminateAllSessions.handler(ctx, args);
      
      expect(result).toEqual({
        success: true,
        sessions_terminated: 2,
        correlation_id: 'correlation-1',
      });
      
      // Verify all sessions were terminated
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(2);
      
      // Verify audit logging
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].data.operation).toBe('impersonation_emergency_terminate');
      expect(auditLogs[0].data.input_data.sessions_terminated).toBe(2);
    });
  });

  describe('Session Lifecycle and Timeout Management', () => {
    it('should automatically cleanup expired sessions', async () => {
      const { cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      const expiredSessions = [
        {
          _id: 'expired-1' as Id<'impersonation_sessions'>,
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockWorker1._id,
          expires: now - 10000, // Expired 10 seconds ago
          is_active: true,
          created_at: now - (35 * 60 * 1000), // Started 35 minutes ago
          correlation_id: 'correlation-expired-1',
        },
        {
          _id: 'expired-2' as Id<'impersonation_sessions'>,
          admin_user_id: 'another-admin' as Id<'users'>,
          target_user_id: mockWorker2._id,
          expires: now - 60000, // Expired 1 minute ago
          is_active: true,
          created_at: now - (40 * 60 * 1000), // Started 40 minutes ago
          correlation_id: 'correlation-expired-2',
        },
      ];
      
      mockQuery.collect.mockResolvedValue(expiredSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('cleanup-audit-log');
      
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await cleanupExpiredSessions.handler(ctx, {});
      
      expect(result).toEqual({
        expired_sessions_cleaned: 2,
      });
      
      // Verify sessions were marked inactive
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(2);
      expect(patches[0].data).toEqual({
        is_active: false,
        terminated_at: now,
      });
      
      // Verify timeout logging with proper duration calculation
      const timeoutLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && 
        op.table === 'ai_request_logs' &&
        op.data.operation === 'impersonation_timeout'
      );
      expect(timeoutLogs).toHaveLength(2);
      
      // Check session duration calculations
      expect(timeoutLogs[0].data.input_data.session_duration_ms).toBe(35 * 60 * 1000);
      expect(timeoutLogs[1].data.input_data.session_duration_ms).toBe(40 * 60 * 1000);
      
      jest.restoreAllMocks();
    });

    it('should handle session timeout edge cases', async () => {
      const { cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Edge case: session that expired exactly at cleanup time
      const now = Date.now();
      const edgeCaseSession = {
        _id: 'edge-session' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        expires: now, // Expires exactly now
        is_active: true,
        created_at: now - (30 * 60 * 1000), // Full 30-minute session
        correlation_id: 'correlation-edge',
      };
      
      mockQuery.collect.mockResolvedValue([edgeCaseSession]);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('edge-audit-log');
      
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const result = await cleanupExpiredSessions.handler(ctx, {});
      
      expect(result.expired_sessions_cleaned).toBe(1);
      
      // Verify exact session duration
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs[0].data.input_data.session_duration_ms).toBe(IMPERSONATION_CONFIG.SESSION_DURATION_MS);
      
      jest.restoreAllMocks();
    });

    it('should maintain session state consistency during concurrent operations', async () => {
      const { endImpersonation, cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx1 = createMockContext();
      const ctx2 = createMockContext();
      
      const now = Date.now();
      const sessionData = {
        _id: 'concurrent-session' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        session_token: 'concurrent-token',
        expires: now + 1000, // Expires in 1 second
        is_active: true,
        created_at: now - 1000,
        correlation_id: 'correlation-concurrent',
      };
      
      // Setup concurrent scenario
      mockQuery.first.mockResolvedValueOnce(sessionData); // For endImpersonation
      mockQuery.collect.mockResolvedValueOnce([sessionData]); // For cleanup (if it runs)
      
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('concurrent-audit-log');
      
      // Simulate concurrent operations
      const endPromise = endImpersonation.handler(ctx1, {
        impersonation_token: 'concurrent-token',
      });
      
      // Small delay then run cleanup
      setTimeout(async () => {
        await cleanupExpiredSessions.handler(ctx2, {});
      }, 50);
      
      const endResult = await endPromise;
      expect(endResult.success).toBe(true);
      
      // Verify only one termination occurred (manual end, not timeout)
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(1);
      
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      // Should have manual termination log
      const manualLogs = auditLogs.filter(log => log.data.operation === 'impersonation_end');
      expect(manualLogs).toHaveLength(1);
      expect(manualLogs[0].data.input_data.termination_type).toBe('manual');
    });
  });

  describe('Audit Trail and Correlation Tracking', () => {
    it('should maintain complete audit trail throughout session lifecycle', async () => {
      const { startImpersonation, endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Start impersonation
      mockQuery.collect.mockResolvedValue([]); // No active sessions
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert
        .mockResolvedValueOnce('session-123')
        .mockResolvedValueOnce('start-audit-log')
        .mockResolvedValueOnce('end-audit-log');
      
      const startResult = await startImpersonation.handler(ctx, {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing complete audit trail',
      });
      
      expect(startResult.success).toBe(true);
      const correlationId = startResult.correlation_id;
      
      // End impersonation
      const sessionForEnd = {
        _id: 'session-123' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        session_token: startResult.impersonation_token,
        original_session_token: 'admin-session-token',
        is_active: true,
        created_at: Date.now() - 15 * 60 * 1000,
        correlation_id: correlationId,
      };
      
      mockQuery.first.mockResolvedValue(sessionForEnd);
      mockDb.patch.mockResolvedValue(undefined);
      
      const endResult = await endImpersonation.handler(ctx, {
        impersonation_token: startResult.impersonation_token,
      });
      
      expect(endResult.success).toBe(true);
      
      // Verify complete audit trail
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      
      expect(auditLogs).toHaveLength(2);
      
      // Start log
      const startLog = auditLogs.find(log => log.data.operation === 'impersonation_start');
      expect(startLog).toBeDefined();
      expect(startLog.data.correlation_id).toBe(correlationId);
      expect(startLog.data.success).toBe(true);
      expect(startLog.data.input_data.admin_user_id).toBe(mockSystemAdmin._id);
      expect(startLog.data.input_data.target_user_email).toBe('worker1@test.com');
      expect(startLog.data.input_data.reason).toBe('Testing complete audit trail');
      
      // End log
      const endLog = auditLogs.find(log => log.data.operation === 'impersonation_end');
      expect(endLog).toBeDefined();
      expect(endLog.data.correlation_id).toBe(correlationId);
      expect(endLog.data.success).toBe(true);
      expect(endLog.data.input_data.termination_type).toBe('manual');
      expect(endLog.data.input_data.session_duration_ms).toBe(15 * 60 * 1000);
    });

    it('should track correlation IDs across all related operations', async () => {
      const { startImpersonation, getImpersonationStatus } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Start session
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert.mockResolvedValue('session-456');
      
      const startResult = await startImpersonation.handler(ctx, {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing correlation ID tracking',
      });
      
      const correlationId = startResult.correlation_id;
      
      // Check status (should return same correlation ID)
      const sessionForStatus = {
        _id: 'session-456' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        session_token: startResult.impersonation_token,
        expires: Date.now() + 25 * 60 * 1000,
        is_active: true,
        correlation_id: correlationId,
      };
      
      mockQuery.first.mockResolvedValue(sessionForStatus);
      mockDb.get
        .mockResolvedValueOnce(mockSystemAdmin) // Admin user
        .mockResolvedValueOnce(mockWorker1); // Target user
      
      const statusResult = await getImpersonationStatus.handler(ctx, {
        session_token: startResult.impersonation_token,
      });
      
      expect(statusResult.isImpersonating).toBe(true);
      expect(statusResult.correlation_id).toBe(correlationId);
      
      // Verify correlation ID consistency
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      
      auditLogs.forEach(log => {
        expect(log.data.correlation_id).toBe(correlationId);
      });
    });

    it('should handle audit logging failures gracefully', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Setup successful session creation but audit log failure
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert
        .mockResolvedValueOnce('session-789') // Session creation succeeds
        .mockRejectedValueOnce(new Error('Audit log database error')); // Audit log fails
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing audit log failure',
      };
      
      // Should still fail because audit logging is critical for security
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Audit log database error'
      );
      
      // Session should have been created
      const sessionInserts = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'impersonation_sessions'
      );
      expect(sessionInserts).toHaveLength(1);
      
      // But audit log would be missing (this is why the operation fails)
      const auditInserts = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditInserts).toHaveLength(0);
    });
  });

  describe('Error Propagation and Recovery', () => {
    it('should handle database transaction failures', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock session creation failure
      mockQuery.collect.mockResolvedValue([]);
      mockQuery.first.mockResolvedValue(mockWorker1);
      mockDb.insert
        .mockRejectedValueOnce(new Error('Database connection timeout')); // Session creation fails
      
      const args = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing database failure',
      };
      
      await expect(startImpersonation.handler(ctx, args)).rejects.toThrow(
        'Database connection timeout'
      );
      
      // Should still log the failure attempt
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].data.operation).toBe('impersonation_start_failed');
      expect(auditLogs[0].data.success).toBe(false);
      expect(auditLogs[0].data.error_message).toBe('Database connection timeout');
    });

    it('should handle ConvexError propagation correctly', async () => {
      const { startImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock authentication failure
      (getUserFromSession as jest.Mock).mockResolvedValue(null);
      
      const args = {
        admin_session_token: 'invalid-session-token',
        target_user_email: 'worker1@test.com',
        reason: 'Testing ConvexError handling',
      };
      
      const error = await startImpersonation.handler(ctx, args).catch(e => e);
      
      expect(error).toBeInstanceOf(ConvexError);
      expect(error.message).toBe('Authentication required');
      
      // Should log the ConvexError properly
      const auditLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && op.table === 'ai_request_logs'
      );
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].data.error_message).toBe('Authentication required');
    });

    it('should maintain data consistency during partial failures', async () => {
      const { endImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const sessionData = {
        _id: 'session-partial-fail' as Id<'impersonation_sessions'>,
        admin_user_id: mockSystemAdmin._id,
        target_user_id: mockWorker1._id,
        session_token: 'partial-fail-token',
        original_session_token: 'admin-token',
        is_active: true,
        created_at: Date.now() - 10000,
        correlation_id: 'correlation-partial',
      };
      
      mockQuery.first.mockResolvedValue(sessionData);
      mockDb.patch.mockResolvedValue(undefined); // Session update succeeds
      mockDb.insert.mockRejectedValue(new Error('Audit log service unavailable')); // Audit fails
      
      const args = {
        impersonation_token: 'partial-fail-token',
      };
      
      // Operation should fail due to audit logging failure
      await expect(endImpersonation.handler(ctx, args)).rejects.toThrow(
        'Audit log service unavailable'
      );
      
      // But session should have been patched (this shows partial failure)
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(1);
      expect(patches[0].data.is_active).toBe(false);
    });

    it('should handle network and timeout errors', async () => {
      const { searchUsersForImpersonation } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      // Mock network timeout during user search
      mockQuery.collect.mockRejectedValue(new Error('Network request timed out'));
      
      const args = {
        admin_session_token: 'admin-session-token',
        search_term: 'test',
        limit: 10,
      };
      
      await expect(searchUsersForImpersonation.handler(ctx, args)).rejects.toThrow(
        'Network request timed out'
      );
      
      // Verify admin validation was called before failure
      expect(getUserFromSession).toHaveBeenCalledWith(ctx, 'admin-session-token');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle large numbers of expired sessions efficiently', async () => {
      const { cleanupExpiredSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      // Create 100 expired sessions
      const manyExpiredSessions = Array.from({ length: 100 }, (_, i) => ({
        _id: `expired-session-${i}` as Id<'impersonation_sessions'>,
        admin_user_id: `admin-${i % 5}` as Id<'users'>, // 5 different admins
        target_user_id: `user-${i}` as Id<'users'>,
        expires: now - (i * 1000), // Staggered expiration times
        is_active: true,
        created_at: now - (35 * 60 * 1000) - (i * 1000),
        correlation_id: `correlation-${i}`,
      }));
      
      mockQuery.collect.mockResolvedValue(manyExpiredSessions);
      mockDb.patch.mockResolvedValue(undefined);
      mockDb.insert.mockResolvedValue('bulk-cleanup-log');
      
      const result = await cleanupExpiredSessions.handler(ctx, {});
      
      expect(result.expired_sessions_cleaned).toBe(100);
      
      // All sessions should be terminated
      const patches = mockDb.operations.filter(op => op.type === 'patch');
      expect(patches).toHaveLength(100);
      
      // All should have timeout logs
      const timeoutLogs = mockDb.operations.filter(op => 
        op.type === 'insert' && 
        op.table === 'ai_request_logs' &&
        op.data.operation === 'impersonation_timeout'
      );
      expect(timeoutLogs).toHaveLength(100);
    });

    it('should efficiently filter active sessions during concurrent checks', async () => {
      const { getActiveImpersonationSessions } = require('@/convex/impersonation');
      const ctx = createMockContext();
      
      const now = Date.now();
      // Mix of active, expired, and inactive sessions
      const mixedSessions = [
        { 
          _id: 'active-1',
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockWorker1._id,
          expires: now + 10000,
          is_active: true,
          created_at: now - 5000,
          correlation_id: 'active-1',
        },
        { 
          _id: 'expired-1',
          admin_user_id: mockSystemAdmin._id,
          target_user_id: mockWorker2._id,
          expires: now - 10000, // Expired
          is_active: true,
          created_at: now - 35 * 60 * 1000,
          correlation_id: 'expired-1',
        },
        { 
          _id: 'inactive-1',
          admin_user_id: 'another-admin' as Id<'users'>,
          target_user_id: mockTeamLead._id,
          expires: now + 10000,
          is_active: false, // Inactive
          created_at: now - 5000,
          correlation_id: 'inactive-1',
        },
      ];
      
      // Query should filter to only active, non-expired sessions
      mockQuery.collect.mockResolvedValue([mixedSessions[0]]); // Only the active one
      
      // Mock user lookups
      mockDb.get
        .mockResolvedValueOnce(mockSystemAdmin) // Admin
        .mockResolvedValueOnce(mockWorker1); // Target
      
      const args = {
        admin_session_token: 'admin-session-token',
      };
      
      const result = await getActiveImpersonationSessions.handler(ctx, args);
      
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('active-1');
      expect(result[0].adminUser.name).toBe('System Admin');
      expect(result[0].targetUser.name).toBe('Worker One');
    });
  });
});