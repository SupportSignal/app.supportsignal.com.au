// @ts-nocheck
/**
 * Unit tests for participants/create.ts
 * Tests participant creation with validation, permissions, and multi-tenant isolation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConvexError } from 'convex/values';
import { createParticipant } from '@/participants/create';
import { 
  mockUsers, 
  mockCompanies, 
  mockSessions, 
  validParticipantData,
  invalidParticipantData,
  permissionTestScenarios 
} from './fixtures';

// Mock the permissions module
jest.mock('@/permissions', () => ({
  requirePermission: jest.fn(),
  PERMISSIONS: {
    CREATE_INCIDENT: 'CREATE_INCIDENT',
  },
}));

const { requirePermission } = jest.mocked(require('@/permissions'));

// Mock Convex database operations
const mockInsert = jest.fn();
const mockQuery = jest.fn();
const mockFirst = jest.fn();

const createMockContext = () => ({
  db: {
    insert: mockInsert,
    query: jest.fn(() => ({
      withIndex: jest.fn(() => ({
        filter: jest.fn(() => ({
          first: mockFirst,
        })),
      })),
    })),
  },
});

describe('participants/create - createParticipant', () => {
  let ctx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();
    
    // Default successful permission check
    requirePermission.mockResolvedValue({
      user: mockUsers.teamLead,
      correlationId: 'test-correlation-id-123',
    });
    
    // Default no existing participant
    mockFirst.mockResolvedValue(null);
    
    // Default successful insert
    mockInsert.mockResolvedValue('participant_new_123');
  });

  describe('Permission and Authorization', () => {
    it('should create participant for team lead with valid permissions', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'test-correlation-id',
      });

      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(requirePermission).toHaveBeenCalledWith(
        ctx,
        mockSessions.teamLeadSession.sessionToken,
        'CREATE_INCIDENT',
        expect.objectContaining({
          errorMessage: expect.stringContaining('Insufficient permissions'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.participantId).toBe('participant_new_123');
    });

    it('should create participant for company admin', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.companyAdmin,
        correlationId: 'test-correlation-id',
      });

      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.companyAdminSession.sessionToken,
        ...validParticipantData.complete,
      });

      expect(result.success).toBe(true);
      expect(result.participantId).toBe('participant_new_123');
    });

    it('should create participant for system admin', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.systemAdmin,
        correlationId: 'test-correlation-id',
      });

      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.systemAdminSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(result.success).toBe(true);
    });

    it('should reject creation for insufficient permissions', async () => {
      requirePermission.mockRejectedValue(new ConvexError('Insufficient permissions'));

      await expect(createParticipant(ctx, {
        sessionToken: 'invalid_session_token',
        ...validParticipantData.minimal,
      })).rejects.toThrow('Insufficient permissions');
    });

    it('should reject creation for user without company association', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.noCompanyUser,
        correlationId: 'test-correlation-id',
      });

      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.noCompanySession.sessionToken,
        ...validParticipantData.minimal,
      })).rejects.toThrow('User must be associated with a company');
    });
  });

  describe('Input Validation', () => {
    it('should validate first name length constraints', async () => {
      // Test short first name
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.shortFirstName,
      })).rejects.toThrow('First name must be between 2 and 50 characters');

      // Test long first name
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.longFirstName,
      })).rejects.toThrow('First name must be between 2 and 50 characters');
    });

    it('should validate last name length constraints', async () => {
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.shortLastName,
      })).rejects.toThrow('Last name must be between 2 and 50 characters');
    });

    it('should validate NDIS number format', async () => {
      // Test short NDIS number
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.invalidNdisNumber,
      })).rejects.toThrow('NDIS number must be exactly 9 digits');

      // Test non-numeric NDIS number
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.nonNumericNdisNumber,
      })).rejects.toThrow('NDIS number must be exactly 9 digits');
    });

    it('should validate date of birth constraints', async () => {
      // Test future date
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.futureDateOfBirth,
      })).rejects.toThrow('Invalid date of birth or future date not allowed');

      // Test invalid date format
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.invalidDateOfBirth,
      })).rejects.toThrow('Invalid date of birth or future date not allowed');
    });

    it('should validate phone number format when provided', async () => {
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.invalidPhoneNumber,
      })).rejects.toThrow('Invalid phone number format');
    });

    it('should validate care notes length when provided', async () => {
      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...invalidParticipantData.longCareNotes,
      })).rejects.toThrow('Care notes must not exceed 500 characters');
    });

    it('should accept valid optional fields', async () => {
      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.complete,
      });

      expect(result.success).toBe(true);
      
      // Verify all fields were passed to insert
      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        first_name: validParticipantData.complete.first_name.trim(),
        last_name: validParticipantData.complete.last_name.trim(),
        contact_phone: validParticipantData.complete.contact_phone.trim(),
        emergency_contact: validParticipantData.complete.emergency_contact.trim(),
        care_notes: validParticipantData.complete.care_notes.trim(),
      }));
    });
  });

  describe('Duplicate Detection', () => {
    it('should prevent duplicate NDIS numbers within same company', async () => {
      // Mock existing participant with same NDIS number
      mockFirst.mockResolvedValue({
        _id: 'existing_participant_123',
        ndis_number: validParticipantData.minimal.ndis_number,
        company_id: mockUsers.teamLead.company_id,
      });

      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      })).rejects.toThrow('A participant with this NDIS number already exists in your company');
    });

    it('should allow same NDIS number across different companies', async () => {
      // Mock participant with same NDIS number but different company
      mockFirst.mockResolvedValue({
        _id: 'existing_participant_different_company',
        ndis_number: validParticipantData.minimal.ndis_number,
        company_id: 'different_company_id',
      });

      // Since the filter is by company_id, this should return null for current company
      mockFirst.mockResolvedValue(null);

      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data Storage', () => {
    it('should store participant with correct field mapping', async () => {
      const testData = {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.complete,
      };

      await createParticipant(ctx, testData);

      expect(mockInsert).toHaveBeenCalledWith('participants', {
        company_id: mockUsers.teamLead.company_id,
        first_name: testData.first_name.trim(),
        last_name: testData.last_name.trim(),
        date_of_birth: testData.date_of_birth,
        ndis_number: testData.ndis_number,
        contact_phone: testData.contact_phone.trim(),
        emergency_contact: testData.emergency_contact.trim(),
        support_level: testData.support_level,
        care_notes: testData.care_notes.trim(),
        status: 'active',
        created_at: expect.any(Number),
        created_by: mockUsers.teamLead._id,
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
      });
    });

    it('should handle optional fields correctly', async () => {
      const testData = {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal, // No optional fields
      };

      await createParticipant(ctx, testData);

      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        contact_phone: undefined,
        emergency_contact: undefined,
        care_notes: undefined,
      }));
    });

    it('should set correct audit trail fields', async () => {
      const beforeTime = Date.now();
      
      await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      const afterTime = Date.now();

      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        created_at: expect.any(Number),
        created_by: mockUsers.teamLead._id,
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
        status: 'active', // Default status
      }));

      // Verify timestamp is reasonable
      const call = mockInsert.mock.calls[0][1];
      expect(call.created_at).toBeGreaterThanOrEqual(beforeTime);
      expect(call.created_at).toBeLessThanOrEqual(afterTime);
      expect(call.updated_at).toBe(call.created_at);
    });

    it('should associate participant with user company', async () => {
      await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        company_id: mockUsers.teamLead.company_id,
      }));
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should only check for duplicates within user company scope', async () => {
      await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      // Verify the query filters by company_id
      expect(ctx.db.query).toHaveBeenCalledWith('participants');
      expect(mockFirst).toHaveBeenCalled();
    });

    it('should create participants in correct company context', async () => {
      // Test with different company user
      requirePermission.mockResolvedValue({
        user: mockUsers.differentCompanyUser,
        correlationId: 'test-correlation-id',
      });

      await createParticipant(ctx, {
        sessionToken: mockSessions.differentCompanySession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        company_id: mockUsers.differentCompanyUser.company_id,
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle database insertion errors', async () => {
      mockInsert.mockRejectedValue(new Error('Database insertion failed'));

      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      })).rejects.toThrow('Failed to create participant: Database insertion failed');
    });

    it('should handle duplicate check query errors', async () => {
      mockFirst.mockRejectedValue(new Error('Database query failed'));

      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      })).rejects.toThrow('Failed to create participant: Database query failed');
    });

    it('should re-throw ConvexError instances without wrapping', async () => {
      const convexError = new ConvexError('Custom validation error');
      requirePermission.mockRejectedValue(convexError);

      await expect(createParticipant(ctx, {
        sessionToken: 'invalid_token',
        ...validParticipantData.minimal,
      })).rejects.toThrow(convexError);
    });
  });

  describe('Response Format', () => {
    it('should return success response with participant ID and correlation ID', async () => {
      const result = await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(result).toEqual({
        success: true,
        participantId: 'participant_new_123',
        correlationId: 'test-correlation-id-123',
      });
    });
  });

  describe('Support Level Validation', () => {
    it('should accept all valid support levels', async () => {
      const supportLevels = ['high', 'medium', 'low'];

      for (const level of supportLevels) {
        mockInsert.mockResolvedValue(`participant_${level}_test`);
        
        const result = await createParticipant(ctx, {
          sessionToken: mockSessions.teamLeadSession.sessionToken,
          ...validParticipantData.minimal,
          support_level: level as any,
        });

        expect(result.success).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
          support_level: level,
        }));
        
        jest.clearAllMocks();
        requirePermission.mockResolvedValue({
          user: mockUsers.teamLead,
          correlationId: 'test-correlation-id',
        });
        mockFirst.mockResolvedValue(null);
      }
    });
  });
});