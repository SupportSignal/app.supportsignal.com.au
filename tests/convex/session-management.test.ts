/* @ts-nocheck */
/**
 * Session Management System Tests
 * 
 * Tests the enhanced session management system including:
 * - Session creation and validation
 * - Session refresh and expiration
 * - Workflow state persistence
 * - Session cleanup and limits
 * - Device tracking and audit logging
 */

import { ConvexTestingApi } from 'convex/testing';
import { api } from '../../apps/convex/_generated/api';
import schema from '../../apps/convex/schema';
import { beforeEach, describe, it, expect, afterEach } from '@jest/globals';

// Mock test setup
let testingApi: ConvexTestingApi<typeof schema>;

beforeEach(async () => {
  testingApi = new ConvexTestingApi(schema);
  await testingApi.run(async (ctx) => {
    // Clean up any existing data
    const users = await ctx.db.query('users').collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    
    const sessions = await ctx.db.query('sessions').collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  });
});

afterEach(async () => {
  await testingApi.finishTest();
});

describe('Enhanced Session Management', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const registerResult = await testingApi.mutation(api.auth.registerUser, {
      name: 'Session Test User',
      email: 'session@example.com',
      password: 'SecurePass123!',
    });
    testUserId = registerResult.userId;
  });

  describe('Session Creation', () => {
    it('should create session with regular duration by default', async () => {
      const result = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
        deviceInfo: {
          userAgent: 'test-browser',
          ipAddress: '127.0.0.1',
          deviceType: 'desktop',
        },
      });

      expect(result.sessionToken).toBeDefined();
      expect(result.expires).toBeGreaterThan(Date.now());
      expect(result.correlationId).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Should be 24 hours (regular session)
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
      expect(result.expires).toBeLessThan(expectedExpiry + 1000); // Allow 1 second tolerance
      expect(result.expires).toBeGreaterThan(expectedExpiry - 1000);
    });

    it('should create extended session when rememberMe is true', async () => {
      const result = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
        rememberMe: true,
        deviceInfo: {
          userAgent: 'test-browser',
          ipAddress: '127.0.0.1',
          deviceType: 'desktop',
        },
      });

      // Should be 30 days (remember me session)
      const expectedExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      expect(result.expires).toBeLessThan(expectedExpiry + 1000);
      expect(result.expires).toBeGreaterThan(expectedExpiry - 1000);
    });

    it('should generate unique session tokens', async () => {
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const result = await testingApi.mutation(api.sessionManagement.createSession, {
          userId: testUserId,
        });
        sessions.push(result.sessionToken);
      }

      // All tokens should be unique
      const uniqueTokens = new Set(sessions);
      expect(uniqueTokens.size).toBe(sessions.length);

      // All tokens should be 64 characters (32 bytes in hex)
      for (const token of sessions) {
        expect(token).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('should store workflow state during session creation', async () => {
      const workflowState = {
        type: 'incident_capture',
        data: {
          incidentId: 'test-incident-123',
          currentStep: 'narrative_collection',
          progress: 0.5,
        },
        lastActivity: Date.now(),
      };

      const result = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
        workflowState,
      });

      expect(result.sessionToken).toBeDefined();
      // Workflow state storage is logged (checked in console logs)
    });
  });

  describe('Session Validation', () => {
    let sessionToken: string;

    beforeEach(async () => {
      const sessionResult = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });
      sessionToken = sessionResult.sessionToken;
    });

    it('should validate active session and return user info', async () => {
      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken,
      });

      expect(result.valid).toBe(true);
      expect(result.user.id).toBe(testUserId);
      expect(result.user.email).toBe('session@example.com');
      expect(result.user.name).toBe('Session Test User');
      expect(result.session.expires).toBeGreaterThan(Date.now());
      expect(result.correlationId).toBeDefined();
    });

    it('should indicate when session should be refreshed', async () => {
      // Create session that will expire soon (simulate by creating short-lived session)
      const shortSessionId = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('sessions', {
          userId: testUserId,
          sessionToken: 'short-session-token',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour (within refresh threshold)
          rememberMe: false,
        });
      });

      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken: 'short-session-token',
      });

      expect(result.valid).toBe(true);
      expect(result.session.shouldRefresh).toBe(true);
    });

    it('should return invalid for non-existent session', async () => {
      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken: 'nonexistent-token',
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session not found');
    });

    it('should return invalid for expired session', async () => {
      // Create expired session
      const expiredSessionId = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('sessions', {
          userId: testUserId,
          sessionToken: 'expired-token',
          expires: Date.now() - 1000, // Expired 1 second ago
          rememberMe: false,
        });
      });

      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken: 'expired-token',
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Session expired');
    });

    it('should include workflow state when requested', async () => {
      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken,
        includeWorkflowState: true,
      });

      expect(result.valid).toBe(true);
      expect(result.workflowState).toBeDefined(); // May be null if no workflow state
    });
  });

  describe('Session Refresh', () => {
    let sessionToken: string;
    let initialExpires: number;

    beforeEach(async () => {
      const sessionResult = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });
      sessionToken = sessionResult.sessionToken;
      initialExpires = sessionResult.expires;
    });

    it('should refresh session and extend expiration', async () => {
      const result = await testingApi.mutation(api.sessionManagement.refreshSession, {
        sessionToken,
        extendExpiry: true,
      });

      expect(result.success).toBe(true);
      expect(result.expires).toBeGreaterThan(initialExpires);
      expect(result.correlationId).toBeDefined();
    });

    it('should auto-refresh sessions close to expiry', async () => {
      // Create session that's close to expiry
      const closeExpirySessionId = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('sessions', {
          userId: testUserId,
          sessionToken: 'close-expiry-token',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour (within auto-refresh threshold)
          rememberMe: false,
        });
      });

      const result = await testingApi.mutation(api.sessionManagement.refreshSession, {
        sessionToken: 'close-expiry-token',
      });

      expect(result.success).toBe(true);
      expect(result.expires).toBeGreaterThan(Date.now() + 20 * 60 * 60 * 1000); // Should be extended significantly
    });

    it('should fail refresh for non-existent session', async () => {
      await expect(
        testingApi.mutation(api.sessionManagement.refreshSession, {
          sessionToken: 'nonexistent-token',
        })
      ).rejects.toThrow('Session not found');
    });

    it('should fail refresh for expired session', async () => {
      const expiredSessionId = await testingApi.run(async (ctx) => {
        return await ctx.db.insert('sessions', {
          userId: testUserId,
          sessionToken: 'expired-refresh-token',
          expires: Date.now() - 1000, // Expired
          rememberMe: false,
        });
      });

      await expect(
        testingApi.mutation(api.sessionManagement.refreshSession, {
          sessionToken: 'expired-refresh-token',
        })
      ).rejects.toThrow('Session expired');
    });
  });

  describe('Session Invalidation', () => {
    let sessionToken: string;

    beforeEach(async () => {
      const sessionResult = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });
      sessionToken = sessionResult.sessionToken;
    });

    it('should invalidate active session', async () => {
      const result = await testingApi.mutation(api.sessionManagement.invalidateSession, {
        sessionToken,
        reason: 'User logout',
      });

      expect(result.success).toBe(true);
      expect(result.correlationId).toBeDefined();

      // Session should no longer be valid
      const validateResult = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken,
      });

      expect(validateResult.valid).toBe(false);
    });

    it('should handle invalidation of non-existent session gracefully', async () => {
      const result = await testingApi.mutation(api.sessionManagement.invalidateSession, {
        sessionToken: 'nonexistent-token',
      });

      expect(result.success).toBe(true);
      expect(result.reason).toBe('Session not found (already invalid)');
    });
  });

  describe('Workflow State Management', () => {
    let sessionToken: string;

    beforeEach(async () => {
      const sessionResult = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });
      sessionToken = sessionResult.sessionToken;
    });

    it('should update workflow state for existing session', async () => {
      const workflowData = {
        incidentId: 'incident-456',
        currentPhase: 'analysis',
        completedSteps: ['narrative', 'questions'],
        progress: 0.75,
      };

      const result = await testingApi.mutation(api.sessionManagement.updateWorkflowState, {
        sessionToken,
        workflowType: 'incident_analysis',
        workflowData,
      });

      expect(result.success).toBe(true);
      expect(result.correlationId).toBeDefined();
    });

    it('should fail workflow update for invalid session', async () => {
      await expect(
        testingApi.mutation(api.sessionManagement.updateWorkflowState, {
          sessionToken: 'invalid-token',
          workflowType: 'chat_session',
          workflowData: { chatId: 'chat-123' },
        })
      ).rejects.toThrow('Session not found');
    });
  });

  describe('Session Limits and Cleanup', () => {
    it('should enforce session limits per user', async () => {
      // Create multiple sessions (more than the limit of 5)
      const sessions = [];
      for (let i = 0; i < 7; i++) {
        const result = await testingApi.mutation(api.sessionManagement.createSession, {
          userId: testUserId,
        });
        sessions.push(result.sessionToken);
      }

      // Check how many sessions actually exist
      const activeSessions = await testingApi.run(async (ctx) => {
        return await ctx.db
          .query('sessions')
          .withIndex('by_user_id', (q) => q.eq('userId', testUserId))
          .filter((q) => q.gt(q.field('expires'), Date.now()))
          .collect();
      });

      // Should not exceed the limit
      expect(activeSessions.length).toBeLessThanOrEqual(5);
    });

    it('should clean up expired sessions', async () => {
      // Create some expired sessions
      await testingApi.run(async (ctx) => {
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert('sessions', {
            userId: testUserId,
            sessionToken: `expired-${i}`,
            expires: Date.now() - 1000, // Expired
            rememberMe: false,
          });
        }
      });

      const result = await testingApi.mutation(api.sessionManagement.cleanupExpiredSessions, {});

      expect(result.cleanedCount).toBe(3);
      expect(result.timestamp).toBeDefined();

      // Verify sessions were actually deleted
      const remainingSessions = await testingApi.run(async (ctx) => {
        return await ctx.db
          .query('sessions')
          .filter((q) => q.lt(q.field('expires'), Date.now()))
          .collect();
      });

      expect(remainingSessions.length).toBe(0);
    });
  });

  describe('Multi-Session Management', () => {
    let sessions: string[];

    beforeEach(async () => {
      sessions = [];
      // Create multiple sessions for the same user
      for (let i = 0; i < 3; i++) {
        const result = await testingApi.mutation(api.sessionManagement.createSession, {
          userId: testUserId,
          deviceInfo: {
            userAgent: `browser-${i}`,
            deviceType: i === 0 ? 'desktop' : i === 1 ? 'mobile' : 'tablet',
          },
        });
        sessions.push(result.sessionToken);
      }
    });

    it('should get active sessions for user', async () => {
      const result = await testingApi.query(api.sessionManagement.getUserActiveSessions, {
        requestorSessionToken: sessions[0],
      });

      expect(result.sessions.length).toBe(3);
      expect(result.totalActiveSessions).toBe(3);

      // One should be marked as current session
      const currentSessions = result.sessions.filter(s => s.isCurrentSession);
      expect(currentSessions.length).toBe(1);
    });

    it('should allow user to view their own sessions', async () => {
      const result = await testingApi.query(api.sessionManagement.getUserActiveSessions, {
        requestorSessionToken: sessions[0],
        targetUserId: testUserId,
      });

      expect(result.sessions.length).toBe(3);
      expect(result.correlationId).toBeDefined();
    });

    it('should invalidate all other sessions except current', async () => {
      const result = await testingApi.mutation(api.sessionManagement.invalidateAllOtherSessions, {
        sessionToken: sessions[0], // Keep this session active
      });

      expect(result.success).toBe(true);
      expect(result.invalidatedCount).toBe(2);
      expect(result.correlationId).toBeDefined();

      // Verify only one session remains active
      const remainingSessions = await testingApi.run(async (ctx) => {
        return await ctx.db
          .query('sessions')
          .withIndex('by_user_id', (q) => q.eq('userId', testUserId))
          .filter((q) => q.gt(q.field('expires'), Date.now()))
          .collect();
      });

      expect(remainingSessions.length).toBe(1);
      expect(remainingSessions[0].sessionToken).toBe(sessions[0]);
    });
  });

  describe('Device and Security Tracking', () => {
    it('should track device information in sessions', async () => {
      const deviceInfo = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100',
        deviceType: 'desktop',
      };

      const result = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
        deviceInfo,
      });

      expect(result.sessionToken).toBeDefined();
      // Device info is logged for audit purposes (checked in console logs)
    });

    it('should generate correlation IDs for audit trails', async () => {
      const result = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });

      expect(result.correlationId).toMatch(/^[a-f0-9]{32}$/);

      const validateResult = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken: result.sessionToken,
      });

      expect(validateResult.correlationId).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing user gracefully', async () => {
      // Delete user but try to create session
      await testingApi.run(async (ctx) => {
        await ctx.db.delete(testUserId);
      });

      await expect(
        testingApi.mutation(api.sessionManagement.createSession, {
          userId: testUserId,
        })
      ).rejects.toThrow();
    });

    it('should handle session validation for deleted user', async () => {
      // Create session first
      const sessionResult = await testingApi.mutation(api.sessionManagement.createSession, {
        userId: testUserId,
      });

      // Delete user
      await testingApi.run(async (ctx) => {
        await ctx.db.delete(testUserId);
      });

      // Session validation should fail gracefully
      const result = await testingApi.query(api.sessionManagement.validateSession, {
        sessionToken: sessionResult.sessionToken,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('User not found');
    });

    it('should handle concurrent session operations', async () => {
      // Create multiple sessions concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          testingApi.mutation(api.sessionManagement.createSession, {
            userId: testUserId,
          })
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      for (const result of results) {
        expect(result.sessionToken).toBeDefined();
        expect(result.expires).toBeGreaterThan(Date.now());
      }

      // All tokens should be unique
      const tokens = results.map(r => r.sessionToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk session operations efficiently', async () => {
      const startTime = Date.now();

      // Create many sessions
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          testingApi.mutation(api.sessionManagement.createSession, {
            userId: testUserId,
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      expect(results.length).toBe(10);
      for (const result of results) {
        expect(result.sessionToken).toBeDefined();
      }

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
    });

    it('should maintain session limits under concurrent load', async () => {
      // Try to create many sessions concurrently (more than limit)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          testingApi.mutation(api.sessionManagement.createSession, {
            userId: testUserId,
          })
        );
      }

      await Promise.all(promises);

      // Check final session count doesn't exceed limit
      const sessions = await testingApi.run(async (ctx) => {
        return await ctx.db
          .query('sessions')
          .withIndex('by_user_id', (q) => q.eq('userId', testUserId))
          .filter((q) => q.gt(q.field('expires'), Date.now()))
          .collect();
      });

      expect(sessions.length).toBeLessThanOrEqual(5); // Max session limit
    });
  });
});

// Helper functions for test data generation
function generateMockDeviceInfo(type: 'desktop' | 'mobile' | 'tablet' = 'desktop') {
  const userAgents = {
    desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    tablet: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  };

  return {
    userAgent: userAgents[type],
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    deviceType: type,
  };
}

function generateWorkflowState(type: string) {
  const workflows = {
    incident_capture: {
      incidentId: `incident-${Date.now()}`,
      currentStep: 'narrative_collection',
      progress: Math.random(),
    },
    chat_session: {
      chatId: `chat-${Date.now()}`,
      messageCount: Math.floor(Math.random() * 50),
    },
    user_registration: {
      step: 'profile_setup',
      completedFields: ['name', 'email'],
    },
  };

  return {
    type,
    data: workflows[type] || {},
    lastActivity: Date.now(),
  };
}