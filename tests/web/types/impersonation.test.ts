/**
 * Comprehensive Tests for Impersonation TypeScript Interfaces and Types
 * 
 * Tests type definitions, constants, and interfaces used throughout the
 * impersonation system to ensure type safety and proper data structures.
 * 
 * Test Categories:
 * - Interface validation and type checking
 * - Configuration constants validation
 * - Type compatibility and extensions
 * - Default values and optional properties
 */

import { Id } from 'convex/_generated/dataModel';
import {
  ImpersonationSession,
  ImpersonationStatus,
  StartImpersonationRequest,
  StartImpersonationResponse,
  EndImpersonationRequest,
  EndImpersonationResponse,
  ImpersonationSearchResult,
  ImpersonationAuditEvent,
  IMPERSONATION_CONFIG
} from '@/types/impersonation';

describe('Impersonation Type Definitions', () => {
  describe('ImpersonationStatus Interface', () => {
    it('should validate complete impersonation status structure', () => {
      const completeStatus: ImpersonationStatus = {
        isImpersonating: true,
        adminUser: {
          id: 'admin-123' as Id<'users'>,
          name: 'System Admin',
          email: 'admin@test.com',
        },
        targetUser: {
          id: 'user-456' as Id<'users'>,
          name: 'Target User',
          email: 'target@test.com',
          role: 'company_admin',
        },
        sessionToken: 'session-token-123',
        timeRemaining: 25 * 60 * 1000, // 25 minutes
        correlation_id: 'correlation-123',
      };

      // All properties should be accessible
      expect(completeStatus.isImpersonating).toBe(true);
      expect(completeStatus.adminUser?.name).toBe('System Admin');
      expect(completeStatus.targetUser?.role).toBe('company_admin');
      expect(completeStatus.timeRemaining).toBe(1500000);
      expect(completeStatus.correlation_id).toBe('correlation-123');
    });

    it('should validate minimal non-impersonating status', () => {
      const minimalStatus: ImpersonationStatus = {
        isImpersonating: false,
      };

      expect(minimalStatus.isImpersonating).toBe(false);
      expect(minimalStatus.adminUser).toBeUndefined();
      expect(minimalStatus.targetUser).toBeUndefined();
      expect(minimalStatus.sessionToken).toBeUndefined();
      expect(minimalStatus.timeRemaining).toBeUndefined();
      expect(minimalStatus.correlation_id).toBeUndefined();
    });

    it('should handle optional properties correctly', () => {
      const partialStatus: ImpersonationStatus = {
        isImpersonating: true,
        sessionToken: 'partial-token',
        // Missing adminUser, targetUser, timeRemaining, correlation_id
      };

      expect(partialStatus.isImpersonating).toBe(true);
      expect(partialStatus.sessionToken).toBe('partial-token');
      expect(partialStatus.adminUser).toBeUndefined();
    });
  });

  describe('StartImpersonationRequest Interface', () => {
    it('should validate complete start request structure', () => {
      const request: StartImpersonationRequest = {
        admin_session_token: 'admin-session-token',
        target_user_email: 'target@company.com',
        reason: 'Testing user workflow for bug reproduction',
      };

      expect(request.admin_session_token).toBe('admin-session-token');
      expect(request.target_user_email).toBe('target@company.com');
      expect(request.reason).toBe('Testing user workflow for bug reproduction');
    });

    it('should require all properties', () => {
      // TypeScript would catch these errors, but we can test runtime behavior
      const request = {} as StartImpersonationRequest;
      
      expect(request.admin_session_token).toBeUndefined();
      expect(request.target_user_email).toBeUndefined();
      expect(request.reason).toBeUndefined();
    });
  });

  describe('StartImpersonationResponse Interface', () => {
    it('should validate successful response structure', () => {
      const successResponse: StartImpersonationResponse = {
        success: true,
        impersonation_token: 'new-impersonation-token',
        correlation_id: 'correlation-abc-123',
        expires: Date.now() + 30 * 60 * 1000,
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.impersonation_token).toBe('new-impersonation-token');
      expect(successResponse.correlation_id).toBe('correlation-abc-123');
      expect(successResponse.expires).toBeGreaterThan(Date.now());
      expect(successResponse.error).toBeUndefined();
    });

    it('should validate error response structure', () => {
      const errorResponse: StartImpersonationResponse = {
        success: false,
        error: 'Maximum concurrent sessions reached',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Maximum concurrent sessions reached');
      expect(errorResponse.impersonation_token).toBeUndefined();
      expect(errorResponse.correlation_id).toBeUndefined();
      expect(errorResponse.expires).toBeUndefined();
    });

    it('should handle mixed success/error state', () => {
      // Edge case: success but with error message
      const mixedResponse: StartImpersonationResponse = {
        success: true,
        impersonation_token: 'token',
        correlation_id: 'correlation',
        expires: Date.now() + 1000,
        error: 'Warning: Limited session time',
      };

      expect(mixedResponse.success).toBe(true);
      expect(mixedResponse.error).toBe('Warning: Limited session time');
    });
  });

  describe('EndImpersonationRequest Interface', () => {
    it('should validate end request structure', () => {
      const request: EndImpersonationRequest = {
        impersonation_token: 'session-token-to-end',
      };

      expect(request.impersonation_token).toBe('session-token-to-end');
    });
  });

  describe('EndImpersonationResponse Interface', () => {
    it('should validate successful end response', () => {
      const successResponse: EndImpersonationResponse = {
        success: true,
        original_session_token: 'original-admin-token',
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.original_session_token).toBe('original-admin-token');
      expect(successResponse.error).toBeUndefined();
    });

    it('should validate error end response', () => {
      const errorResponse: EndImpersonationResponse = {
        success: false,
        error: 'Session not found or already terminated',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Session not found or already terminated');
      expect(errorResponse.original_session_token).toBeUndefined();
    });
  });

  describe('ImpersonationSearchResult Interface', () => {
    it('should validate complete search result structure', () => {
      const result: ImpersonationSearchResult = {
        id: 'user-789' as Id<'users'>,
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'team_lead',
        company_name: 'Acme Corporation',
      };

      expect(result.id).toBe('user-789');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@company.com');
      expect(result.role).toBe('team_lead');
      expect(result.company_name).toBe('Acme Corporation');
    });

    it('should validate minimal search result without company', () => {
      const result: ImpersonationSearchResult = {
        id: 'user-456' as Id<'users'>,
        name: 'Jane Smith',
        email: 'jane@freelancer.com',
        role: 'frontline_worker',
        // company_name is optional
      };

      expect(result.company_name).toBeUndefined();
      expect(result.name).toBe('Jane Smith');
      expect(result.role).toBe('frontline_worker');
    });

    it('should handle various role types', () => {
      const roles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'];
      
      roles.forEach(role => {
        const result: ImpersonationSearchResult = {
          id: `user-${role}` as Id<'users'>,
          name: `User ${role}`,
          email: `${role}@test.com`,
          role: role,
        };

        expect(result.role).toBe(role);
      });
    });
  });

  describe('ImpersonationAuditEvent Interface', () => {
    it('should validate start action audit event', () => {
      const startEvent: ImpersonationAuditEvent = {
        action: 'start',
        admin_user_id: 'admin-123' as Id<'users'>,
        target_user_id: 'user-456' as Id<'users'>,
        correlation_id: 'correlation-abc-123',
        timestamp: Date.now(),
        reason: 'Testing user workflow',
      };

      expect(startEvent.action).toBe('start');
      expect(startEvent.reason).toBe('Testing user workflow');
      expect(startEvent.session_duration).toBeUndefined();
    });

    it('should validate end action audit event', () => {
      const endEvent: ImpersonationAuditEvent = {
        action: 'end',
        admin_user_id: 'admin-123' as Id<'users'>,
        target_user_id: 'user-456' as Id<'users'>,
        correlation_id: 'correlation-abc-123',
        timestamp: Date.now(),
        session_duration: 15 * 60 * 1000, // 15 minutes
      };

      expect(endEvent.action).toBe('end');
      expect(endEvent.session_duration).toBe(900000);
      expect(endEvent.reason).toBeUndefined();
    });

    it('should validate timeout action audit event', () => {
      const timeoutEvent: ImpersonationAuditEvent = {
        action: 'timeout',
        admin_user_id: 'admin-123' as Id<'users'>,
        target_user_id: 'user-456' as Id<'users'>,
        correlation_id: 'correlation-abc-123',
        timestamp: Date.now(),
        session_duration: 30 * 60 * 1000, // Full 30 minutes
      };

      expect(timeoutEvent.action).toBe('timeout');
      expect(timeoutEvent.session_duration).toBe(1800000);
    });

    it('should validate emergency_terminate action audit event', () => {
      const emergencyEvent: ImpersonationAuditEvent = {
        action: 'emergency_terminate',
        admin_user_id: 'admin-123' as Id<'users'>,
        target_user_id: 'user-456' as Id<'users'>,
        correlation_id: 'correlation-emergency-123',
        timestamp: Date.now(),
        reason: 'Security incident - terminate all sessions',
        session_duration: 5 * 60 * 1000, // 5 minutes before emergency
      };

      expect(emergencyEvent.action).toBe('emergency_terminate');
      expect(emergencyEvent.reason).toBe('Security incident - terminate all sessions');
      expect(emergencyEvent.session_duration).toBe(300000);
    });

    it('should handle all valid action types', () => {
      const actions: Array<ImpersonationAuditEvent['action']> = [
        'start', 'end', 'timeout', 'emergency_terminate'
      ];

      actions.forEach(action => {
        const event: ImpersonationAuditEvent = {
          action,
          admin_user_id: 'admin-123' as Id<'users'>,
          target_user_id: 'user-456' as Id<'users'>,
          correlation_id: `correlation-${action}-123`,
          timestamp: Date.now(),
        };

        expect(event.action).toBe(action);
      });
    });
  });

  describe('IMPERSONATION_CONFIG Constants', () => {
    it('should validate session duration configuration', () => {
      expect(IMPERSONATION_CONFIG.SESSION_DURATION_MS).toBe(30 * 60 * 1000);
      expect(IMPERSONATION_CONFIG.SESSION_DURATION_MS).toBe(1800000);
    });

    it('should validate concurrent sessions limit', () => {
      expect(IMPERSONATION_CONFIG.MAX_CONCURRENT_SESSIONS).toBe(3);
    });

    it('should validate token length configuration', () => {
      expect(IMPERSONATION_CONFIG.TOKEN_LENGTH).toBe(32);
    });

    it('should validate cleanup interval configuration', () => {
      expect(IMPERSONATION_CONFIG.CLEANUP_INTERVAL_MS).toBe(5 * 60 * 1000);
      expect(IMPERSONATION_CONFIG.CLEANUP_INTERVAL_MS).toBe(300000);
    });

    it('should ensure all config values are positive numbers', () => {
      const configValues = [
        IMPERSONATION_CONFIG.SESSION_DURATION_MS,
        IMPERSONATION_CONFIG.MAX_CONCURRENT_SESSIONS,
        IMPERSONATION_CONFIG.TOKEN_LENGTH,
        IMPERSONATION_CONFIG.CLEANUP_INTERVAL_MS,
      ];

      configValues.forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });

    it('should validate config is readonly', () => {
      // Config should be as const, making it immutable
      expect(() => {
        // @ts-expect-error - Should not allow modification
        (IMPERSONATION_CONFIG as any).SESSION_DURATION_MS = 60000;
      }).toThrow();
    });
  });

  describe('Type Compatibility and Extensions', () => {
    it('should allow extending user objects with impersonation metadata', () => {
      interface ExtendedUser {
        _id: Id<'users'>;
        name: string;
        email: string;
        role: string;
        _isImpersonating?: boolean;
        _originalAdminId?: Id<'users'>;
        _correlationId?: string;
      }

      const normalUser: ExtendedUser = {
        _id: 'user-123' as Id<'users'>,
        name: 'Normal User',
        email: 'normal@test.com',
        role: 'company_admin',
      };

      const impersonatingUser: ExtendedUser = {
        _id: 'user-456' as Id<'users'>,
        name: 'Impersonated User',
        email: 'impersonated@test.com',
        role: 'frontline_worker',
        _isImpersonating: true,
        _originalAdminId: 'admin-789' as Id<'users'>,
        _correlationId: 'correlation-xyz-789',
      };

      expect(normalUser._isImpersonating).toBeUndefined();
      expect(impersonatingUser._isImpersonating).toBe(true);
      expect(impersonatingUser._originalAdminId).toBe('admin-789');
      expect(impersonatingUser._correlationId).toBe('correlation-xyz-789');
    });

    it('should work with generic response patterns', () => {
      interface ApiResponse<T> {
        success: boolean;
        data?: T;
        error?: string;
      }

      const startResponse: ApiResponse<{ impersonation_token: string }> = {
        success: true,
        data: {
          impersonation_token: 'new-token',
        },
      };

      const errorResponse: ApiResponse<never> = {
        success: false,
        error: 'Authentication failed',
      };

      expect(startResponse.success).toBe(true);
      expect(startResponse.data?.impersonation_token).toBe('new-token');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.data).toBeUndefined();
    });

    it('should handle union types for different session states', () => {
      type SessionState = 
        | { type: 'normal'; userId: Id<'users'> }
        | { type: 'impersonating'; targetUserId: Id<'users'>; adminUserId: Id<'users'>; correlationId: string }
        | { type: 'expired' };

      const normalSession: SessionState = {
        type: 'normal',
        userId: 'user-123' as Id<'users'>,
      };

      const impersonatingSession: SessionState = {
        type: 'impersonating',
        targetUserId: 'user-456' as Id<'users'>,
        adminUserId: 'admin-789' as Id<'users'>,
        correlationId: 'correlation-123',
      };

      const expiredSession: SessionState = {
        type: 'expired',
      };

      expect(normalSession.type).toBe('normal');
      expect(impersonatingSession.type).toBe('impersonating');
      expect(expiredSession.type).toBe('expired');

      // Type narrowing should work
      if (impersonatingSession.type === 'impersonating') {
        expect(impersonatingSession.correlationId).toBe('correlation-123');
      }
    });
  });

  describe('Data Validation Helpers', () => {
    it('should validate session token format', () => {
      const isValidSessionToken = (token: string): boolean => {
        return token.length >= 16 && /^[a-f0-9]+$/.test(token);
      };

      expect(isValidSessionToken('abcdef1234567890')).toBe(true);
      expect(isValidSessionToken('short')).toBe(false);
      expect(isValidSessionToken('invalid-chars!')).toBe(false);
      expect(isValidSessionToken('')).toBe(false);
    });

    it('should validate correlation ID format', () => {
      const isValidCorrelationId = (id: string): boolean => {
        return id.length >= 8 && /^[a-f0-9\-]+$/.test(id);
      };

      expect(isValidCorrelationId('abc123def456')).toBe(true);
      expect(isValidCorrelationId('abc-123-def-456')).toBe(true);
      expect(isValidCorrelationId('short')).toBe(false);
      expect(isValidCorrelationId('UPPERCASE')).toBe(false);
    });

    it('should validate time remaining values', () => {
      const isValidTimeRemaining = (ms: number): boolean => {
        return ms >= 0 && ms <= IMPERSONATION_CONFIG.SESSION_DURATION_MS;
      };

      expect(isValidTimeRemaining(25 * 60 * 1000)).toBe(true); // 25 minutes
      expect(isValidTimeRemaining(0)).toBe(true); // Expired
      expect(isValidTimeRemaining(-1000)).toBe(false); // Negative
      expect(isValidTimeRemaining(35 * 60 * 1000)).toBe(false); // Over limit
    });

    it('should validate email formats in search results', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      const validResults = [
        'user@company.com',
        'john.doe@example.org',
        'admin+test@domain.co.uk',
      ];

      const invalidResults = [
        'notanemail',
        '@domain.com',
        'user@',
        'user@domain',
      ];

      validResults.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });

      invalidResults.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });
});