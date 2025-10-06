// @ts-nocheck
/**
 * Unit tests for participants/list.ts
 * Tests participant listing with company scoping, search, filtering, and sorting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConvexError } from 'convex/values';
import { listParticipants } from '@/participants/list';
import { 
  mockUsers, 
  mockParticipants, 
  mockSessions, 
  searchTestData,
  multiTenantTestData 
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
const mockTake = jest.fn();
const mockCollect = jest.fn();
const mockFilter = jest.fn();
const mockWithIndex = jest.fn();
const mockQuery = jest.fn();

const createMockContext = () => ({
  db: {
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
  };
  return mockQueryChain;
};

describe('participants/list - listParticipants', () => {
  let ctx: any;
  const defaultParticipants = [
    mockParticipants.johnDoe,
    mockParticipants.janeDoe,
    mockParticipants.bobSmith,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();

    // Default successful permission check
    requirePermission.mockResolvedValue({
      user: mockUsers.teamLead,
      correlationId: 'test-correlation-id-123',
    });

    // Setup default query chain
    const mockQueryChain = createMockQueryChain(defaultParticipants);
    mockQuery.mockReturnValue(mockQueryChain);
  });

  describe('Authentication and Authorization', () => {
    it('should list participants for authenticated team lead', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(requirePermission).toHaveBeenCalledWith(
        ctx,
        mockSessions.teamLeadSession.sessionToken,
        'CREATE_INCIDENT',
        expect.objectContaining({
          errorMessage: 'Authentication required to view participants',
        })
      );

      expect(result.participants).toHaveLength(3);
      expect(result.totalCount).toBe(3);
    });

    it('should allow company admin to list participants', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.companyAdmin,
        correlationId: 'test-correlation-id',
      });

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.companyAdminSession.sessionToken,
      });

      expect(result.participants).toHaveLength(3);
    });

    it('should allow frontline worker to list participants', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.frontlineWorker,
        correlationId: 'test-correlation-id',
      });

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.frontlineWorkerSession.sessionToken,
      });

      expect(result.participants).toHaveLength(3);
    });

    it('should reject unauthenticated requests', async () => {
      requirePermission.mockRejectedValue(new ConvexError('Authentication required'));

      await expect(listParticipants(ctx, {
        sessionToken: 'invalid_session_token',
      })).rejects.toThrow('Authentication required');
    });

    it('should reject users without company association', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.noCompanyUser,
        correlationId: 'test-correlation-id',
      });

      await expect(listParticipants(ctx, {
        sessionToken: mockSessions.noCompanySession.sessionToken,
      })).rejects.toThrow('User must be associated with a company');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should query participants by company ID', async () => {
      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(mockQuery).toHaveBeenCalledWith('participants');
      
      // The withIndex call should be made with company filter
      const queryChain = mockQuery.mock.results[0].value;
      expect(queryChain.withIndex).toHaveBeenCalledWith('by_company', expect.any(Function));
    });

    it('should only return participants from user company', async () => {
      // Create mixed participant data from different companies
      const mixedParticipants = [
        { ...mockParticipants.johnDoe, company_id: mockUsers.teamLead.company_id },
        { ...mockParticipants.aliceWilson, company_id: 'different_company_id' },
      ];

      // Mock query should only return participants from user's company
      const userCompanyParticipants = [mockParticipants.johnDoe];
      const mockQueryChain = createMockQueryChain(userCompanyParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].first_name).toBe('John');
    });

    it('should handle different company users correctly', async () => {
      requirePermission.mockResolvedValue({
        user: mockUsers.differentCompanyUser,
        correlationId: 'test-correlation-id',
      });

      // Mock different company participants
      const differentCompanyParticipants = [mockParticipants.aliceWilson];
      const mockQueryChain = createMockQueryChain(differentCompanyParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.differentCompanySession.sessionToken,
      });

      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].first_name).toBe('Alice');
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const mockQueryChain = createMockQueryChain([mockParticipants.johnDoe]);
      mockQuery.mockReturnValue(mockQueryChain);

      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        status: 'active',
      });

      // Verify filter was called for status
      expect(mockQueryChain.filter).toHaveBeenCalled();
    });

    it('should filter by support level', async () => {
      const mockQueryChain = createMockQueryChain([mockParticipants.janeDoe]);
      mockQuery.mockReturnValue(mockQueryChain);

      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        support_level: 'high',
      });

      // Verify filter was called for support level
      expect(mockQueryChain.filter).toHaveBeenCalled();
    });

    it('should handle multiple filters', async () => {
      const mockQueryChain = createMockQueryChain([mockParticipants.johnDoe]);
      mockQuery.mockReturnValue(mockQueryChain);

      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        status: 'active',
        support_level: 'medium',
      });

      // Verify filter was called multiple times
      expect(mockQueryChain.filter).toHaveBeenCalledTimes(2);
    });

    it('should ignore "all" filter values', async () => {
      const mockQueryChain = createMockQueryChain(defaultParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        status: 'all',
        support_level: 'all',
      });

      // Should not apply filters for "all" values
      expect(mockQueryChain.filter).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Use search test data
      const mockQueryChain = createMockQueryChain(searchTestData.participants);
      mockQuery.mockReturnValue(mockQueryChain);
    });

    it('should search by first name', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'John',
      });

      const foundParticipant = result.participants.find(p => p.first_name === 'John');
      expect(foundParticipant).toBeTruthy();
    });

    it('should search by last name', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'Smith',
      });

      const foundParticipants = result.participants.filter(p => p.last_name === 'Smith');
      expect(foundParticipants).toHaveLength(2); // John Smith and Robert Smith
    });

    it('should search by NDIS number', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: '111111111',
      });

      const foundParticipant = result.participants.find(p => p.ndis_number === '111111111');
      expect(foundParticipant).toBeTruthy();
    });

    it('should search by phone number', async () => {
      const participantsWithPhone = searchTestData.participants.map(p => ({
        ...p,
        contact_phone: p._id === 'search_john_001' ? '+61 2 1111 1111' : p.contact_phone,
      }));
      
      const mockQueryChain = createMockQueryChain(participantsWithPhone);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: '1111 1111',
      });

      expect(result.participants.length).toBeGreaterThan(0);
    });

    it('should perform case-insensitive search', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'JOHN',
      });

      const foundParticipant = result.participants.find(p => p.first_name.toLowerCase() === 'john');
      expect(foundParticipant).toBeTruthy();
    });

    it('should handle empty search strings', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: '',
      });

      expect(result.participants).toHaveLength(searchTestData.participants.length);
    });

    it('should handle whitespace-only search strings', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: '   \t\n   ',
      });

      expect(result.participants).toHaveLength(searchTestData.participants.length);
    });

    it('should return empty results for non-matching search', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'NonExistentName123',
      });

      expect(result.participants).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    it('should sort participants by last name then first name', async () => {
      // Create participants with specific names for sorting test
      const unsortedParticipants = [
        { ...mockParticipants.johnDoe, first_name: 'Charlie', last_name: 'Brown' },
        { ...mockParticipants.janeDoe, first_name: 'Alice', last_name: 'Anderson' },
        { ...mockParticipants.bobSmith, first_name: 'Bob', last_name: 'Anderson' },
      ];

      const mockQueryChain = createMockQueryChain(unsortedParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result.participants[0].last_name).toBe('Anderson');
      expect(result.participants[0].first_name).toBe('Alice');
      expect(result.participants[1].last_name).toBe('Anderson');
      expect(result.participants[1].first_name).toBe('Bob');
      expect(result.participants[2].last_name).toBe('Brown');
      expect(result.participants[2].first_name).toBe('Charlie');
    });
  });

  describe('Limit Handling', () => {
    it('should respect limit parameter', async () => {
      const mockQueryChain = createMockQueryChain(defaultParticipants.slice(0, 2));
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        limit: 2,
      });

      expect(mockQueryChain.take).toHaveBeenCalledWith(2);
      expect(result.participants).toHaveLength(2);
    });

    it('should collect all when no limit specified', async () => {
      const mockQueryChain = createMockQueryChain(defaultParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(mockQueryChain.collect).toHaveBeenCalled();
      expect(mockQueryChain.take).not.toHaveBeenCalled();
    });

    it('should handle zero limit', async () => {
      const emptyParticipants = [];
      const mockQueryChain = createMockQueryChain(emptyParticipants);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        limit: 0,
      });

      expect(mockQueryChain.take).toHaveBeenCalledWith(0);
      expect(result.participants).toHaveLength(0);
    });
  });

  describe('Response Format', () => {
    it('should return correctly formatted response', async () => {
      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result).toEqual({
        participants: expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            first_name: expect.any(String),
            last_name: expect.any(String),
            date_of_birth: expect.any(String),
            ndis_number: expect.any(String),
            support_level: expect.any(String),
            status: expect.any(String),
            created_at: expect.any(Number),
            updated_at: expect.any(Number),
          }),
        ]),
        totalCount: expect.any(Number),
        correlationId: 'test-correlation-id-123',
      });
    });

    it('should include optional fields when present', async () => {
      const participantWithOptionals = {
        ...mockParticipants.johnDoe,
        contact_phone: '+61 2 1234 5678',
        emergency_contact: 'Emergency contact info',
        care_notes: 'Care notes',
      };

      const mockQueryChain = createMockQueryChain([participantWithOptionals]);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result.participants[0]).toEqual(expect.objectContaining({
        contact_phone: '+61 2 1234 5678',
        emergency_contact: 'Emergency contact info',
        care_notes: 'Care notes',
      }));
    });

    it('should handle undefined optional fields', async () => {
      const participantWithoutOptionals = {
        ...mockParticipants.bobSmith,
        contact_phone: undefined,
        emergency_contact: undefined,
        care_notes: undefined,
      };

      const mockQueryChain = createMockQueryChain([participantWithoutOptionals]);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result.participants[0]).toEqual(expect.objectContaining({
        contact_phone: undefined,
        emergency_contact: undefined,
        care_notes: undefined,
      }));
    });

    it('should update totalCount after search filtering', async () => {
      const mockQueryChain = createMockQueryChain(searchTestData.participants);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        search: 'Smith', // Should match 2 participants
      });

      expect(result.totalCount).toBe(result.participants.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      mockQuery.mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await expect(listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      })).rejects.toThrow('Failed to list participants: Database query failed');
    });

    it('should re-throw ConvexError instances without wrapping', async () => {
      const convexError = new ConvexError('Custom query error');
      mockQuery.mockImplementation(() => {
        throw convexError;
      });

      await expect(listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      })).rejects.toThrow(convexError);
    });

    it('should handle empty participant lists', async () => {
      const mockQueryChain = createMockQueryChain([]);
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
      });

      expect(result.participants).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('Combined Filtering and Search', () => {
    it('should apply both filters and search correctly', async () => {
      const testParticipants = [
        { ...mockParticipants.johnDoe, status: 'active', support_level: 'medium', first_name: 'John' },
        { ...mockParticipants.janeDoe, status: 'active', support_level: 'high', first_name: 'Jane' },
        { ...mockParticipants.bobSmith, status: 'inactive', support_level: 'medium', first_name: 'John' },
      ];

      const mockQueryChain = createMockQueryChain(testParticipants.filter(p => 
        p.status === 'active' && p.support_level === 'medium'
      ));
      mockQuery.mockReturnValue(mockQueryChain);

      const result = await listParticipants(ctx, {
        sessionToken: mockSessions.teamLeadSession.sessionToken,
        status: 'active',
        support_level: 'medium',
        search: 'John',
      });

      // Should find John with active status and medium support level
      expect(result.participants).toHaveLength(1);
      expect(result.participants[0].first_name).toBe('John');
    });
  });
});