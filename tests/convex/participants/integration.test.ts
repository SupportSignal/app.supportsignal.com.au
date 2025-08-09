// @ts-nocheck
/**
 * Integration tests for NDIS Participants Management system
 * Tests end-to-end workflows, role-based access control, and multi-tenant isolation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConvexError } from 'convex/values';
import { createParticipant } from '@/participants/create';
import { listParticipants } from '@/participants/list';
import { getParticipantById } from '@/participants/getById';
import { updateParticipant } from '@/participants/update';
import { updateParticipantStatus } from '@/participants/updateStatus';
import { searchParticipants } from '@/participants/search';
import { 
  mockUsers, 
  mockParticipants, 
  mockSessions, 
  validParticipantData,
  permissionTestScenarios,
  multiTenantTestData 
} from './fixtures';

// Mock the permissions module
jest.mock('@/permissions', () => ({
  requirePermission: jest.fn(),
  PERMISSIONS: {
    CREATE_INCIDENT: 'CREATE_INCIDENT',
    VIEW_INCIDENT: 'VIEW_INCIDENT',
    UPDATE_INCIDENT: 'UPDATE_INCIDENT',
  },
}));

const { requirePermission } = jest.mocked(require('@/permissions'));

// Mock database operations
const mockInsert = jest.fn();
const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockQuery = jest.fn();
const mockWithIndex = jest.fn();
const mockFilter = jest.fn();
const mockFirst = jest.fn();
const mockTake = jest.fn();
const mockCollect = jest.fn();

const createMockContext = () => ({
  db: {
    insert: mockInsert,
    get: mockGet,
    patch: mockPatch,
    query: mockQuery,
  },
});

// Helper to create mock query chain
const createMockQueryChain = (participants: any[]) => {
  const mockQueryChain = {
    withIndex: jest.fn(() => mockQueryChain),
    filter: jest.fn(() => mockQueryChain),
    take: jest.fn().mockResolvedValue(participants),
    collect: jest.fn().mockResolvedValue(participants),
    first: jest.fn().mockResolvedValue(participants[0] || null),
  };
  return mockQueryChain;
};

describe('NDIS Participants Management - Integration Tests', () => {
  let ctx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();

    // Setup default query chain
    const mockQueryChain = createMockQueryChain([mockParticipants.johnDoe]);
    mockQuery.mockReturnValue(mockQueryChain);
    
    // Default successful operations
    mockInsert.mockResolvedValue('participant_new_123');
    mockGet.mockResolvedValue(mockParticipants.johnDoe);
    mockPatch.mockResolvedValue('participant_updated_123');
    mockFirst.mockResolvedValue(null); // No duplicates by default
  });

  describe('End-to-End Participant Management Workflow', () => {
    it('should complete full participant lifecycle: create, list, view, update, status change', async () => {
      // Setup permissions for team lead
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'workflow-test-123',
      });

      // 1. Create participant
      const createResult = await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.complete,
      });

      expect(createResult.success).toBe(true);
      expect(createResult.participantId).toBe('participant_new_123');

      // 2. List participants (should include new participant)
      const createdParticipant = {
        ...mockParticipants.johnDoe,
        _id: createResult.participantId,
        ...validParticipantData.complete,
      };
      
      const listQueryChain = createMockQueryChain([createdParticipant]);
      mockQuery.mockReturnValue(listQueryChain);

      const listResult = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(listResult.participants).toHaveLength(1);
      expect(listResult.participants[0].first_name).toBe(validParticipantData.complete.first_name);

      // 3. Get participant by ID
      mockGet.mockResolvedValue(createdParticipant);

      const getResult = await getParticipantById(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: createResult.participantId,
      });

      expect(getResult.participant.first_name).toBe(validParticipantData.complete.first_name);

      // 4. Update participant
      const updateResult = await updateParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: createResult.participantId,
        first_name: 'Updated Name',
        care_notes: 'Updated care notes',
      });

      expect(updateResult.success).toBe(true);
      expect(mockPatch).toHaveBeenCalledWith(createResult.participantId, expect.objectContaining({
        first_name: 'Updated Name',
        care_notes: 'Updated care notes',
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
      }));

      // 5. Update status
      const statusUpdateResult = await updateParticipantStatus(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: createResult.participantId,
        status: 'inactive',
        reason: 'Temporary service suspension',
      });

      expect(statusUpdateResult.success).toBe(true);
      expect(mockPatch).toHaveBeenCalledWith(createResult.participantId, expect.objectContaining({
        status: 'inactive',
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
      }));
    });

    it('should handle participant search workflow', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'search-test-123',
      });

      // Setup multiple participants for search
      const searchParticipants = [
        { ...mockParticipants.johnDoe, first_name: 'John', last_name: 'Smith' },
        { ...mockParticipants.janeDoe, first_name: 'Jane', last_name: 'Johnson' },
        { ...mockParticipants.bobSmith, first_name: 'Bob', last_name: 'Smith' },
      ];

      const searchQueryChain = createMockQueryChain(searchParticipants);
      mockQuery.mockReturnValue(searchQueryChain);

      // Search by name
      const searchResult = await searchParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'Smith',
        filters: {},
      });

      expect(searchResult.participants.length).toBeGreaterThan(0);
      expect(searchResult.totalCount).toBeGreaterThan(0);
    });
  });

  describe('Role-Based Access Control Integration', () => {
    describe('System Admin Access', () => {
      beforeEach(() => {
        requirePermission.mockResolvedValue({
          user: mockUsers.systemAdmin,
          correlationId: 'sysadmin-test-123',
        });
      });

      it('should allow system admin full access to all participant operations', async () => {
        // System admin should be able to perform all operations
        const createResult = await createParticipant(ctx, {
          sessionToken: mockSessions.systemAdminSession.sessionToken,
          ...validParticipantData.minimal,
        });
        expect(createResult.success).toBe(true);

        const listResult = await listParticipants(ctx, {
          sessionToken: mockSessions.systemAdminSession.sessionToken,
        });
        expect(listResult.participants).toBeDefined();

        const updateResult = await updateParticipant(ctx, {
          sessionToken: mockSessions.systemAdminSession.sessionToken,
          participantId: 'test_id',
          first_name: 'Updated',
        });
        expect(updateResult.success).toBe(true);
      });
    });

    describe('Company Admin Access', () => {
      beforeEach(() => {
        requirePermission.mockResolvedValue({
          user: mockUsers.companyAdmin,
          correlationId: 'companyadmin-test-123',
        });
      });

      it('should allow company admin full access within their company', async () => {
        const createResult = await createParticipant(ctx, {
          sessionToken: mockSessions.companyAdminSession.sessionToken,
          ...validParticipantData.minimal,
        });
        expect(createResult.success).toBe(true);

        const updateResult = await updateParticipantStatus(ctx, {
          sessionToken: mockSessions.companyAdminSession.sessionToken,
          participantId: 'test_id',
          status: 'discharged',
          reason: 'Service completed',
        });
        expect(updateResult.success).toBe(true);
      });
    });

    describe('Team Lead Access', () => {
      beforeEach(() => {
        requirePermission.mockResolvedValue({
          user: mockUsers.teamLead,
          correlationId: 'teamlead-test-123',
        });
      });

      it('should allow team lead to manage participants', async () => {
        const createResult = await createParticipant(ctx, {
          sessionToken: mockSessions.teamLeadSession.sessionToken,
          ...validParticipantData.minimal,
        });
        expect(createResult.success).toBe(true);

        const updateResult = await updateParticipant(ctx, {
          sessionToken: mockSessions.teamLeadSession.sessionToken,
          participantId: 'test_id',
          care_notes: 'Updated by team lead',
        });
        expect(updateResult.success).toBe(true);
      });
    });

    describe('Frontline Worker Access', () => {
      it('should allow frontline workers to view participants but not modify', async () => {
        // Allow view access
        requirePermission.mockResolvedValue({
          user: mockUsers.frontlineWorker,
          correlationId: 'worker-view-test-123',
        });

        const listResult = await listParticipants(ctx, {
          sessionToken: mockSessions.frontlineWorkerSession.sessionToken,
        });
        expect(listResult.participants).toBeDefined();

        const getResult = await getParticipantById(ctx, {
          sessionToken: mockSessions.frontlineWorkerSession.sessionToken,
          participantId: 'test_id',
        });
        expect(getResult.participant).toBeDefined();

        // Deny modification access
        requirePermission.mockRejectedValue(new ConvexError('Insufficient permissions'));

        await expect(createParticipant(ctx, {
          sessionToken: mockSessions.frontlineWorkerSession.sessionToken,
          ...validParticipantData.minimal,
        })).rejects.toThrow('Insufficient permissions');

        await expect(updateParticipant(ctx, {
          sessionToken: mockSessions.frontlineWorkerSession.sessionToken,
          participantId: 'test_id',
          first_name: 'Updated',
        })).rejects.toThrow('Insufficient permissions');
      });
    });

    describe('Access Control Error Handling', () => {
      it('should handle expired session tokens', async () => {
        requirePermission.mockRejectedValue(new ConvexError('Session expired'));

        await expect(createParticipant(ctx, {
          sessionToken: mockSessions.expiredSession.sessionToken,
          ...validParticipantData.minimal,
        })).rejects.toThrow('Session expired');
      });

      it('should handle invalid session tokens', async () => {
        requirePermission.mockRejectedValue(new ConvexError('Invalid session'));

        await expect(listParticipants(ctx, {
          sessionToken: 'invalid_token_123',
        })).rejects.toThrow('Invalid session');
      });

      it('should handle users without company association', async () => {
        requirePermission.mockResolvedValue({
          user: mockUsers.noCompanyUser,
          correlationId: 'no-company-test-123',
        });

        await expect(createParticipant(ctx, {
          sessionToken: mockSessions.noCompanySession.sessionToken,
          ...validParticipantData.minimal,
        })).rejects.toThrow('User must be associated with a company');
      });
    });
  });

  describe('Multi-Tenant Isolation Integration', () => {
    it('should maintain strict company isolation across all operations', async () => {
      // Company A user
      requirePermission.mockResolvedValue({
        user: multiTenantTestData.companyA.users[0], // companyAdmin
        correlationId: 'company-a-test-123',
      });

      // Setup Company A participants
      const companyAQueryChain = createMockQueryChain(multiTenantTestData.companyA.participants);
      mockQuery.mockReturnValue(companyAQueryChain);

      // List participants - should only see Company A participants
      const companyAList = await listParticipants(ctx, {
        sessionToken: multiTenantTestData.companyA.sessions[0].sessionToken,
      });

      expect(companyAList.participants).toHaveLength(3); // Company A has 3 participants

      // Switch to Company B user
      requirePermission.mockResolvedValue({
        user: multiTenantTestData.companyB.users[0], // differentCompanyUser
        correlationId: 'company-b-test-123',
      });

      // Setup Company B participants
      const companyBQueryChain = createMockQueryChain(multiTenantTestData.companyB.participants);
      mockQuery.mockReturnValue(companyBQueryChain);

      // List participants - should only see Company B participants
      const companyBList = await listParticipants(ctx, {
        sessionToken: multiTenantTestData.companyB.sessions[0].sessionToken,
      });

      expect(companyBList.participants).toHaveLength(1); // Company B has 1 participant

      // Verify Company B user cannot access Company A participant
      mockGet.mockResolvedValue({
        ...multiTenantTestData.companyA.participants[0],
        company_id: multiTenantTestData.companyA.company._id,
      });

      await expect(getParticipantById(ctx, {
        sessionToken: multiTenantTestData.companyB.sessions[0].sessionToken,
        participantId: multiTenantTestData.companyA.participants[0]._id,
      })).rejects.toThrow('Participant not found or access denied');
    });

    it('should allow duplicate NDIS numbers across different companies', async () => {
      const duplicateNdisNumber = '123456789';

      // Company A creates participant with NDIS number
      requirePermission.mockResolvedValue({
        user: multiTenantTestData.companyA.users[0],
        correlationId: 'company-a-create-123',
      });

      // Mock no existing participant in Company A
      mockFirst.mockResolvedValue(null);

      const companyAResult = await createParticipant(ctx, {
        sessionToken: multiTenantTestData.companyA.sessions[0].sessionToken,
        ...validParticipantData.minimal,
        ndis_number: duplicateNdisNumber,
      });

      expect(companyAResult.success).toBe(true);

      // Company B creates participant with same NDIS number (should be allowed)
      requirePermission.mockResolvedValue({
        user: multiTenantTestData.companyB.users[0],
        correlationId: 'company-b-create-123',
      });

      // Mock no existing participant with this NDIS number in Company B
      mockFirst.mockResolvedValue(null);

      const companyBResult = await createParticipant(ctx, {
        sessionToken: multiTenantTestData.companyB.sessions[0].sessionToken,
        ...validParticipantData.minimal,
        ndis_number: duplicateNdisNumber, // Same NDIS number
      });

      expect(companyBResult.success).toBe(true);

      // But duplicate within same company should be rejected
      mockFirst.mockResolvedValue({
        _id: 'existing_participant',
        ndis_number: duplicateNdisNumber,
        company_id: multiTenantTestData.companyA.company._id,
      });

      await expect(createParticipant(ctx, {
        sessionToken: multiTenantTestData.companyA.sessions[0].sessionToken,
        ...validParticipantData.minimal,
        ndis_number: duplicateNdisNumber,
      })).rejects.toThrow('A participant with this NDIS number already exists in your company');
    });

    it('should enforce company scoping in search operations', async () => {
      // Setup search scenario across companies
      const allParticipants = [
        ...multiTenantTestData.companyA.participants,
        ...multiTenantTestData.companyB.participants,
      ];

      // Company A user search
      requirePermission.mockResolvedValue({
        user: multiTenantTestData.companyA.users[0],
        correlationId: 'company-a-search-123',
      });

      // Mock query should only return Company A participants
      const companyASearchChain = createMockQueryChain(
        multiTenantTestData.companyA.participants.filter(p => 
          p.first_name.toLowerCase().includes('john')
        )
      );
      mockQuery.mockReturnValue(companyASearchChain);

      const companyASearchResult = await searchParticipants(ctx, {
        sessionToken: multiTenantTestData.companyA.sessions[0].sessionToken,
        search: 'John',
        filters: {},
      });

      // Should only find participants from Company A
      companyASearchResult.participants.forEach(participant => {
        expect(participant.company_id).toBe(multiTenantTestData.companyA.company._id);
      });
    });
  });

  describe('Data Integrity and Audit Trail Integration', () => {
    it('should maintain proper audit trail throughout participant lifecycle', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'audit-trail-test-123',
      });

      const startTime = Date.now();

      // Create participant
      await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      // Verify create audit fields
      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        created_at: expect.any(Number),
        created_by: mockUsers.teamLead._id,
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
      }));

      const createCall = mockInsert.mock.calls[0][1];
      expect(createCall.created_at).toBeGreaterThanOrEqual(startTime);
      expect(createCall.updated_at).toBe(createCall.created_at);

      // Update participant
      const updateTime = Date.now();
      await updateParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: 'test_id',
        first_name: 'Updated Name',
      });

      // Verify update audit fields
      expect(mockPatch).toHaveBeenCalledWith('test_id', expect.objectContaining({
        updated_at: expect.any(Number),
        updated_by: mockUsers.teamLead._id,
      }));

      const updateCall = mockPatch.mock.calls[0][1];
      expect(updateCall.updated_at).toBeGreaterThanOrEqual(updateTime);
      expect(updateCall).not.toHaveProperty('created_at'); // Should not modify create fields
      expect(updateCall).not.toHaveProperty('created_by');
    });

    it('should track different users in audit trail', async () => {
      // Created by team lead
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'create-user-test-123',
      });

      await createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      });

      expect(mockInsert).toHaveBeenCalledWith('participants', expect.objectContaining({
        created_by: mockUsers.teamLead._id,
        updated_by: mockUsers.teamLead._id,
      }));

      // Updated by company admin
      requirePermission.mockResolvedValue({
        user: mockUsers.companyAdmin,
        correlationId: 'update-user-test-123',
      });

      await updateParticipant(ctx, {
        sessionToken: mockSessions.companyAdminSession.sessionToken,
        participantId: 'test_id',
        care_notes: 'Updated by admin',
      });

      expect(mockPatch).toHaveBeenCalledWith('test_id', expect.objectContaining({
        updated_by: mockUsers.companyAdmin._id, // Different user
      }));
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle cascading operation failures gracefully', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'cascade-failure-test-123',
      });

      // Simulate database failure during create
      mockInsert.mockRejectedValue(new Error('Database connection failed'));

      await expect(createParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        ...validParticipantData.minimal,
      })).rejects.toThrow('Failed to create participant: Database connection failed');

      // Simulate partial failure - permission check passes but get fails
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'partial-failure-test-123',
      });
      mockGet.mockRejectedValue(new Error('Record not found'));

      await expect(getParticipantById(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: 'nonexistent_id',
      })).rejects.toThrow('Failed to get participant: Record not found');
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // This test simulates concurrent updates to the same participant
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'concurrent-test-123',
      });

      const originalParticipant = mockParticipants.johnDoe;
      mockGet.mockResolvedValue(originalParticipant);

      // First update
      const update1Promise = updateParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: originalParticipant._id,
        first_name: 'Update 1',
      });

      // Second update (concurrent)
      const update2Promise = updateParticipant(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        participantId: originalParticipant._id,
        last_name: 'Update 2',
      });

      const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockPatch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle large participant lists efficiently', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.teamLead,
        correlationId: 'performance-test-123',
      });

      // Simulate large number of participants
      const largeParticipantList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockParticipants.johnDoe,
        _id: `participant_${index}`,
        first_name: `Participant${index}`,
        ndis_number: `${123456000 + index}`,
      }));

      // Test with limit
      const limitedQueryChain = createMockQueryChain(largeParticipantList.slice(0, 50));
      mockQuery.mockReturnValue(limitedQueryChain);

      const limitedResult = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        limit: 50,
      });

      expect(limitedResult.participants).toHaveLength(50);

      // Test search performance on large dataset
      const searchQueryChain = createMockQueryChain(
        largeParticipantList.filter(p => p.first_name.includes('100'))
      );
      mockQuery.mockReturnValue(searchQueryChain);

      const searchResult = await searchParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: '100',
        filters: {},
      });

      expect(searchResult.participants.length).toBeGreaterThan(0);
    });
  });
});