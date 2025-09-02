// @ts-nocheck
/**
 * CRITICAL SECURITY TESTS: Multi-Tenant Data Isolation for Story 4.1
 * 
 * Tests the enhanced incident listing system including:
 * - Multi-tenant data isolation (Company A/B boundary enforcement)
 * - Permission-based access control (frontline_worker vs team_lead vs system_admin)
 * - Database query security (company_id filtering)
 * - Performance with large datasets (100+ incidents)
 * - Status workflow integration and consistency
 * 
 * SECURITY CRITICAL: These tests validate that Company A users cannot access Company B data
 * under ANY circumstances - including search, filter, pagination, and sorting operations.
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock Convex modules at top level before imports
jest.mock('../../apps/convex/lib/sessionResolver', () => 
  require('./__mocks__/lib/sessionResolver')
);

jest.mock('../../apps/convex/permissions', () => 
  require('./__mocks__/permissions')
);

const mockServer = require('./__mocks__/_generated/server');
const mockApi = require('./__mocks__/_generated/api');

const { createMockCtx } = require('./__mocks__/_generated/server');

// Import and unwrap the handler functions to test
const incidentsListingModule = require('../../apps/convex/incidents_listing');

// Extract the actual handler functions from the Convex wrappers
const getAllCompanyIncidents = incidentsListingModule.getAllCompanyIncidents.handler || incidentsListingModule.getAllCompanyIncidents;
const getMyIncidents = incidentsListingModule.getMyIncidents.handler || incidentsListingModule.getMyIncidents;
const getIncidentCounts = incidentsListingModule.getIncidentCounts.handler || incidentsListingModule.getIncidentCounts;
const getMyIncompleteIncidents = incidentsListingModule.getMyIncompleteIncidents.handler || incidentsListingModule.getMyIncompleteIncidents;

// Import permissions from mock
const { PERMISSIONS, ROLES } = require('./__mocks__/permissions');

describe('Multi-Tenant Security Validation - Story 4.1', () => {
  let mockCtx: any;
  
  // Test data setup - Company boundaries MUST be enforced
  const COMPANY_A_ID = 'company-a-id';
  const COMPANY_B_ID = 'company-b-id';
  
  // Company A Users with different roles
  const COMPANY_A_FRONTLINE_WORKER = {
    _id: 'user-a-frontline',
    name: 'Company A Frontline Worker',
    email: 'frontline@companya.com',
    role: ROLES.FRONTLINE_WORKER,
    company_id: COMPANY_A_ID,
  };
  
  const COMPANY_A_TEAM_LEAD = {
    _id: 'user-a-teamlead',
    name: 'Company A Team Lead',
    email: 'teamlead@companya.com',
    role: ROLES.TEAM_LEAD,
    company_id: COMPANY_A_ID,
  };
  
  const COMPANY_A_SYSTEM_ADMIN = {
    _id: 'user-a-admin',
    name: 'Company A System Admin',
    email: 'admin@companya.com',
    role: ROLES.SYSTEM_ADMIN,
    company_id: COMPANY_A_ID,
  };
  
  // Company B Users - MUST be isolated from Company A
  const COMPANY_B_FRONTLINE_WORKER = {
    _id: 'user-b-frontline',
    name: 'Company B Frontline Worker', 
    email: 'frontline@companyb.com',
    role: ROLES.FRONTLINE_WORKER,
    company_id: COMPANY_B_ID,
  };
  
  const COMPANY_B_TEAM_LEAD = {
    _id: 'user-b-teamlead',
    name: 'Company B Team Lead',
    email: 'teamlead@companyb.com', 
    role: ROLES.TEAM_LEAD,
    company_id: COMPANY_B_ID,
  };
  
  // Valid session tokens for each user (mock)
  const SESSION_TOKENS = {
    COMPANY_A_FRONTLINE: 'session-a-frontline-token',
    COMPANY_A_TEAMLEAD: 'session-a-teamlead-token', 
    COMPANY_A_ADMIN: 'session-a-admin-token',
    COMPANY_B_FRONTLINE: 'session-b-frontline-token',
    COMPANY_B_TEAMLEAD: 'session-b-teamlead-token',
  };

  beforeEach(() => {
    mockCtx = createMockCtx();
    if (global.jest) {
      global.jest.clearAllMocks();
    }
    
    // Setup mock session resolution for all test users
    mockCtx.mockSessionResolver = {
      [SESSION_TOKENS.COMPANY_A_FRONTLINE]: COMPANY_A_FRONTLINE_WORKER,
      [SESSION_TOKENS.COMPANY_A_TEAMLEAD]: COMPANY_A_TEAM_LEAD,
      [SESSION_TOKENS.COMPANY_A_ADMIN]: COMPANY_A_SYSTEM_ADMIN,
      [SESSION_TOKENS.COMPANY_B_FRONTLINE]: COMPANY_B_FRONTLINE_WORKER,
      [SESSION_TOKENS.COMPANY_B_TEAMLEAD]: COMPANY_B_TEAM_LEAD,
    };
  });

  describe('CRITICAL: Multi-Tenant Data Isolation', () => {
    beforeEach(() => {
      // Setup test incidents for both companies
      const companyAIncidents = [
        {
          _id: 'incident-a1',
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'Company A Participant 1',
          reporter_name: 'Company A Reporter 1',
          location: 'Company A Location 1',
          overall_status: 'capture_pending',
          created_at: Date.now() - 1000,
          updated_at: Date.now() - 1000,
        },
        {
          _id: 'incident-a2', 
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'Company A Participant 2',
          reporter_name: 'Company A Reporter 2', 
          location: 'Company A Location 2',
          overall_status: 'analysis_pending',
          created_at: Date.now() - 2000,
          updated_at: Date.now() - 2000,
        }
      ];
      
      const companyBIncidents = [
        {
          _id: 'incident-b1',
          company_id: COMPANY_B_ID,
          created_by: COMPANY_B_FRONTLINE_WORKER._id,
          participant_name: 'Company B Participant 1',
          reporter_name: 'Company B Reporter 1',
          location: 'Company B Location 1',
          overall_status: 'capture_pending',
          created_at: Date.now() - 1500,
          updated_at: Date.now() - 1500,
        },
        {
          _id: 'incident-b2',
          company_id: COMPANY_B_ID,
          created_by: COMPANY_B_FRONTLINE_WORKER._id,
          participant_name: 'Company B Participant 2',
          reporter_name: 'Company B Reporter 2',
          location: 'Company B Location 2',
          overall_status: 'completed',
          created_at: Date.now() - 3000,
          updated_at: Date.now() - 3000,
        }
      ];
      
      // Setup mock query responses - CRITICAL: Must filter by company_id
      mockCtx.db._setMockIndexData('incidents', 'by_company', {
        [COMPANY_A_ID]: companyAIncidents,
        [COMPANY_B_ID]: companyBIncidents
      });
      
      mockCtx.db._setMockIndexData('incidents', 'by_company_user', {
        [`${COMPANY_A_ID}_${COMPANY_A_FRONTLINE_WORKER._id}`]: companyAIncidents.filter(i => i.created_by === COMPANY_A_FRONTLINE_WORKER._id),
        [`${COMPANY_B_ID}_${COMPANY_B_FRONTLINE_WORKER._id}`]: companyBIncidents.filter(i => i.created_by === COMPANY_B_FRONTLINE_WORKER._id)
      });
    });

    it('SECURITY: Company A team lead should see ONLY Company A incidents', async () => {
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD
      });

      expect(result.incidents).toBeDefined();
      expect(result.incidents.length).toBe(2);
      expect(result.totalCount).toBe(2);
      
      // CRITICAL: Verify ALL incidents belong to Company A
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.participant_name).toMatch(/Company A/);
        expect(incident.reporter_name).toMatch(/Company A/);
        expect(incident.location).toMatch(/Company A/);
      });
      
      // CRITICAL: Verify NO Company B incidents are included
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_B_ID);
        expect(incident.participant_name).not.toMatch(/Company B/);
        expect(incident.reporter_name).not.toMatch(/Company B/);
        expect(incident.location).not.toMatch(/Company B/);
      });
      
      // Verify correlation ID for tracing
      expect(result.correlationId).toBeDefined();
    });

    it('SECURITY: Company B team lead should see ONLY Company B incidents', async () => {
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_B_TEAMLEAD
      });

      expect(result.incidents).toBeDefined();
      expect(result.incidents.length).toBe(2);
      expect(result.totalCount).toBe(2);
      
      // CRITICAL: Verify ALL incidents belong to Company B
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_B_ID);
        expect(incident.participant_name).toMatch(/Company B/);
        expect(incident.reporter_name).toMatch(/Company B/);
        expect(incident.location).toMatch(/Company B/);
      });
      
      // CRITICAL: Verify NO Company A incidents are included  
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_A_ID);
        expect(incident.participant_name).not.toMatch(/Company A/);
        expect(incident.reporter_name).not.toMatch(/Company A/);
        expect(incident.location).not.toMatch(/Company A/);
      });
      
      // Verify correlation ID for tracing
      expect(result.correlationId).toBeDefined();
    });

    it('SECURITY: Company A frontline worker should see ONLY their own Company A incidents', async () => {
      const result = await getMyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE
      });

      expect(result.incidents).toBeDefined();
      expect(result.incidents.length).toBe(2);
      expect(result.totalCount).toBe(2);
      
      // CRITICAL: Verify incidents belong to Company A AND created by this user
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.created_by).toBe(COMPANY_A_FRONTLINE_WORKER._id);
        expect(incident.participant_name).toMatch(/Company A/);
        expect(incident.reporter_name).toMatch(/Company A/);
      });
      
      // CRITICAL: Verify NO Company B incidents
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_B_ID);
        expect(incident.created_by).not.toBe(COMPANY_B_FRONTLINE_WORKER._id);
        expect(incident.participant_name).not.toMatch(/Company B/);
        expect(incident.reporter_name).not.toMatch(/Company B/);
      });
    });

    it('SECURITY: Company B frontline worker should see ONLY their own Company B incidents', async () => {
      const result = await getMyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_B_FRONTLINE
      });

      expect(result.incidents).toBeDefined();
      expect(result.incidents.length).toBe(2);
      expect(result.totalCount).toBe(2);
      
      // CRITICAL: Verify incidents belong to Company B AND created by this user
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_B_ID);
        expect(incident.created_by).toBe(COMPANY_B_FRONTLINE_WORKER._id);
        expect(incident.participant_name).toMatch(/Company B/);
        expect(incident.reporter_name).toMatch(/Company B/);
      });
      
      // CRITICAL: Verify NO Company A incidents  
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_A_ID);
        expect(incident.created_by).not.toBe(COMPANY_A_FRONTLINE_WORKER._id);
        expect(incident.participant_name).not.toMatch(/Company A/);
        expect(incident.reporter_name).not.toMatch(/Company A/);
      });
    });
  });

  describe('CRITICAL: Permission-Based Access Control', () => {
    it('SECURITY: Frontline worker should NOT be able to access getAllCompanyIncidents', async () => {
      // Mock permission check to fail for frontline worker
      mockCtx.db._setPermissionMockResult(COMPANY_A_FRONTLINE_WORKER, PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS, false);

      await expect(
        getAllCompanyIncidents(mockCtx, {
          sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE
        })
      ).rejects.toThrow(/Insufficient permissions/);
    });

    it('SECURITY: Team lead should be able to access getAllCompanyIncidents', async () => {
      // Mock permission check to pass for team lead
      mockCtx.db._setPermissionMockResult(COMPANY_A_TEAM_LEAD, PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS, true);

      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD
      });

      expect(result.incidents).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.correlationId).toBeDefined();
    });

    it('SECURITY: System admin should be able to access getAllCompanyIncidents', async () => {
      // Mock permission check to pass for system admin
      mockCtx.db._setPermissionMockResult(COMPANY_A_SYSTEM_ADMIN, PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS, true);

      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_ADMIN
      });

      expect(result.incidents).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.correlationId).toBeDefined();
    });

    it('SECURITY: All roles should be able to access their own incidents via getMyIncidents', async () => {
      // All users should have CREATE_INCIDENT permission to view their own incidents
      const testCases = [
        { token: SESSION_TOKENS.COMPANY_A_FRONTLINE, user: COMPANY_A_FRONTLINE_WORKER },
        { token: SESSION_TOKENS.COMPANY_A_TEAMLEAD, user: COMPANY_A_TEAM_LEAD },
        { token: SESSION_TOKENS.COMPANY_A_ADMIN, user: COMPANY_A_SYSTEM_ADMIN }
      ];

      for (const testCase of testCases) {
        mockCtx.db._setPermissionMockResult(testCase.user, PERMISSIONS.CREATE_INCIDENT, true);

        const result = await getMyIncidents(mockCtx, {
          sessionToken: testCase.token
        });

        expect(result.incidents).toBeDefined();
        expect(result.totalCount).toBeGreaterThanOrEqual(0);
        expect(result.correlationId).toBeDefined();
      }
    });
  });

  describe('CRITICAL: Search and Filter Security', () => {
    beforeEach(() => {
      // Setup test data for search/filter testing
      const searchTestIncidents = [
        {
          _id: 'search-a1',
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'SearchTarget CompanyA',
          reporter_name: 'ReporterA SearchTerm',
          location: 'SecretLocationA',
          overall_status: 'capture_pending',
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          _id: 'search-b1',
          company_id: COMPANY_B_ID,
          created_by: COMPANY_B_FRONTLINE_WORKER._id,
          participant_name: 'SearchTarget CompanyB', // Same search term - SHOULD NOT appear for Company A
          reporter_name: 'ReporterB SearchTerm', // Same search term - SHOULD NOT appear for Company A
          location: 'SecretLocationB', // Different location - SHOULD NOT appear for Company A
          overall_status: 'capture_pending',
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      ];

      mockCtx.db._setMockIndexData('incidents', 'by_company', {
        [COMPANY_A_ID]: [searchTestIncidents[0]],
        [COMPANY_B_ID]: [searchTestIncidents[1]]
      });
    });

    it('SECURITY: Search should NOT return cross-company results even with matching terms', async () => {
      // Company A user searches for "SearchTarget" - should only see Company A results
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
        filters: {
          searchText: 'SearchTarget'
        }
      });

      expect(result.incidents).toBeDefined();
      
      // Should find the Company A incident with SearchTarget
      expect(result.incidents.length).toBe(1);
      expect(result.incidents[0].participant_name).toBe('SearchTarget CompanyA');
      expect(result.incidents[0].company_id).toBe(COMPANY_A_ID);
      
      // CRITICAL: Should NOT find the Company B incident with same search term
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_B_ID);
        expect(incident.participant_name).not.toBe('SearchTarget CompanyB');
      });
    });

    it('SECURITY: Status filter should NOT reveal cross-company data', async () => {
      // Both companies have capture_pending incidents - Company A should only see theirs
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
        filters: {
          status: 'capture_pending'
        }
      });

      expect(result.incidents).toBeDefined();
      
      // Verify all returned incidents belong to Company A
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.overall_status).toBe('capture_pending');
      });
      
      // CRITICAL: Should NOT return Company B incidents even with same status
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_B_ID);
      });
    });
  });

  describe('CRITICAL: Database Query Security', () => {
    it('SECURITY: Database queries MUST include company_id filtering in by_company index', async () => {
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD
      });

      // Verify the mock was called with proper company filtering
      expect(mockCtx.db.query).toHaveBeenCalledWith('incidents');
      expect(mockCtx.db.queryBuilder.withIndex).toHaveBeenCalledWith('by_company', expect.any(Function));
      
      // Verify company_id was used in the index query
      const indexQueryCall = mockCtx.db.queryBuilder.withIndex.mock.calls[0];
      expect(indexQueryCall[0]).toBe('by_company');
      
      // The query function should have been called with company_id equality check
      expect(mockCtx.db.queryBuilder.eq).toHaveBeenCalledWith('company_id', COMPANY_A_TEAM_LEAD.company_id);
    });

    it('SECURITY: Personal incident queries MUST include both company_id AND user_id filtering', async () => {
      const result = await getMyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE
      });

      // Verify the mock was called with proper compound filtering  
      expect(mockCtx.db.query).toHaveBeenCalledWith('incidents');
      expect(mockCtx.db.queryBuilder.withIndex).toHaveBeenCalledWith('by_company_user', expect.any(Function));
      
      // The compound index should filter by both company_id AND created_by
      expect(mockCtx.db.queryBuilder.eq.mock.calls).toContainEqual(['company_id', COMPANY_A_FRONTLINE_WORKER.company_id]);
      expect(mockCtx.db.queryBuilder.eq.mock.calls).toContainEqual(['created_by', COMPANY_A_FRONTLINE_WORKER._id]);
    });

    it('SECURITY: No database queries should return unfiltered results', async () => {
      // Test both getAllCompanyIncidents and getMyIncidents
      await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD
      });
      
      await getMyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE  
      });

      // Verify that NO queries were made without index filtering
      const queryBuilderCalls = mockCtx.db.queryBuilder.collect.mock.calls;
      
      // All collect() calls should have been preceded by withIndex() calls
      expect(mockCtx.db.queryBuilder.withIndex).toHaveBeenCalledTimes(2);
      expect(queryBuilderCalls.length).toBe(2);
      
      // Verify no raw query.collect() calls without index filtering
      queryBuilderCalls.forEach((call, index) => {
        // Each collect() should have a corresponding withIndex() before it
        expect(mockCtx.db.queryBuilder.withIndex).toHaveBeenNthCalledWith(index + 1, expect.any(String), expect.any(Function));
      });
    });
  });

  describe('CRITICAL: Performance with Large Datasets', () => {
    beforeEach(() => {
      // Generate 100+ incidents per company for performance testing
      const generateLargeDataset = (companyId: string, userIds: string[], count: number = 120) => {
        const incidents = [];
        for (let i = 0; i < count; i++) {
          incidents.push({
            _id: `incident-${companyId}-${i}`,
            company_id: companyId,
            created_by: userIds[i % userIds.length],
            participant_name: `Participant ${companyId} ${i}`,
            reporter_name: `Reporter ${companyId} ${i}`,
            location: `Location ${companyId} ${i}`,
            overall_status: ['capture_pending', 'analysis_pending', 'completed'][i % 3],
            created_at: Date.now() - (i * 1000),
            updated_at: Date.now() - (i * 1000),
          });
        }
        return incidents;
      };

      const companyALargeDataset = generateLargeDataset(COMPANY_A_ID, [COMPANY_A_FRONTLINE_WORKER._id, COMPANY_A_TEAM_LEAD._id]);
      const companyBLargeDataset = generateLargeDataset(COMPANY_B_ID, [COMPANY_B_FRONTLINE_WORKER._id, COMPANY_B_TEAM_LEAD._id]);

      mockCtx.db._setMockIndexData('incidents', 'by_company', {
        [COMPANY_A_ID]: companyALargeDataset,
        [COMPANY_B_ID]: companyBLargeDataset
      });

      mockCtx.db._setMockIndexData('incidents', 'by_company_user', {
        [`${COMPANY_A_ID}_${COMPANY_A_FRONTLINE_WORKER._id}`]: companyALargeDataset.filter(i => i.created_by === COMPANY_A_FRONTLINE_WORKER._id),
        [`${COMPANY_B_ID}_${COMPANY_B_FRONTLINE_WORKER._id}`]: companyBLargeDataset.filter(i => i.created_by === COMPANY_B_FRONTLINE_WORKER._id)
      });
    });

    it('SECURITY: Large dataset queries should maintain company isolation', async () => {
      const startTime = Date.now();
      
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
        pagination: { limit: 50, offset: 0 }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance check - should complete in reasonable time
      expect(duration).toBeLessThan(2000); // Under 2 seconds

      // Verify pagination works correctly
      expect(result.incidents.length).toBe(50);
      expect(result.totalCount).toBe(120);
      expect(result.hasMore).toBe(true);
      
      // CRITICAL: Verify all paginated results belong to Company A
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.participant_name).toMatch(new RegExp(`Participant ${COMPANY_A_ID}`));
      });
    });

    it('SECURITY: Search on large dataset should maintain company boundaries', async () => {
      // Search that would match incidents in both companies
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
        filters: {
          searchText: 'Participant'  // This term exists in both companies
        }
      });

      // Should return Company A matches only, regardless of how many Company B matches exist
      expect(result.incidents.length).toBeGreaterThan(0);
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.participant_name).toMatch(/Participant company-a-id/);
      });
      
      // CRITICAL: Should never return Company B results even though they match the search
      result.incidents.forEach(incident => {
        expect(incident.company_id).not.toBe(COMPANY_B_ID);
        expect(incident.participant_name).not.toMatch(/Participant company-b-id/);
      });
    });

    it('SECURITY: Sorting on large dataset should not leak cross-company data', async () => {
      // Test different sorting options
      const sortingTests = [
        { field: 'date', direction: 'asc' },
        { field: 'status', direction: 'desc' },
        { field: 'participant', direction: 'asc' },
        { field: 'reporter', direction: 'desc' }
      ];

      for (const sorting of sortingTests) {
        const result = await getAllCompanyIncidents(mockCtx, {
          sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
          sorting: {
            field: sorting.field as any,
            direction: sorting.direction as any
          }
        });

        // Verify all results belong to Company A regardless of sorting
        expect(result.incidents.length).toBeGreaterThan(0);
        result.incidents.forEach(incident => {
          expect(incident.company_id).toBe(COMPANY_A_ID);
        });
      }
    });
  });

  describe('CRITICAL: Status Workflow Integration', () => {
    beforeEach(() => {
      // Setup incidents with different statuses for workflow testing
      const workflowTestIncidents = [
        {
          _id: 'status-a1',
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'Status Test A1',
          reporter_name: 'Reporter A1',
          location: 'Location A1',
          overall_status: 'capture_pending',
          created_at: Date.now() - 1000,
          updated_at: Date.now() - 1000,
        },
        {
          _id: 'status-a2',
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'Status Test A2',
          reporter_name: 'Reporter A2',
          location: 'Location A2',
          overall_status: 'analysis_pending',
          created_at: Date.now() - 2000,
          updated_at: Date.now() - 2000,
        },
        {
          _id: 'status-a3',
          company_id: COMPANY_A_ID,
          created_by: COMPANY_A_FRONTLINE_WORKER._id,
          participant_name: 'Status Test A3',
          reporter_name: 'Reporter A3',
          location: 'Location A3',
          overall_status: 'completed',
          created_at: Date.now() - 3000,
          updated_at: Date.now() - 3000,
        }
      ];

      mockCtx.db._setMockIndexData('incidents', 'by_company', {
        [COMPANY_A_ID]: workflowTestIncidents
      });

      mockCtx.db._setMockIndexData('incidents', 'by_company_user', {
        [`${COMPANY_A_ID}_${COMPANY_A_FRONTLINE_WORKER._id}`]: workflowTestIncidents
      });
    });

    it('SECURITY: Status filtering should respect company boundaries', async () => {
      // Test each status filter maintains company isolation
      const statusTests = ['capture_pending', 'analysis_pending', 'completed'];

      for (const status of statusTests) {
        const result = await getAllCompanyIncidents(mockCtx, {
          sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD,
          filters: {
            status
          }
        });

        // Verify all returned incidents have the correct status AND company
        result.incidents.forEach(incident => {
          expect(incident.overall_status).toBe(status);
          expect(incident.company_id).toBe(COMPANY_A_ID);
        });
      }
    });

    it('SECURITY: Incident counts should be scoped to company only', async () => {
      const result = await getIncidentCounts(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_TEAMLEAD
      });

      expect(result.capture_pending).toBe(1);
      expect(result.analysis_pending).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.total).toBe(3);
      expect(result.scope).toBe('company');

      // The counts should reflect ONLY Company A incidents
      // If Company B had incidents, they should NOT be included
    });

    it('SECURITY: Personal incident counts should be double-scoped (user + company)', async () => {
      const result = await getIncidentCounts(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE
      });

      // Frontline worker should see personal scope (their own incidents only)
      expect(result.total).toBe(3); // All test incidents were created by this user
      expect(result.scope).toBe('personal');
      
      // Should reflect only this user's incidents within Company A
      expect(result.capture_pending).toBe(1);
      expect(result.analysis_pending).toBe(1);
      expect(result.completed).toBe(1);
    });

    it('SECURITY: Incomplete incidents query should respect company + user boundaries', async () => {
      const result = await getMyIncompleteIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_A_FRONTLINE
      });

      expect(result.incidents).toBeDefined();
      expect(result.count).toBe(2); // capture_pending and analysis_pending (not completed)
      
      // Verify all incomplete incidents belong to the correct user + company
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_A_ID);
        expect(incident.created_by).toBe(COMPANY_A_FRONTLINE_WORKER._id);
        expect(incident.overall_status).not.toBe('completed');
      });
      
      expect(result.correlationId).toBeDefined();
    });
  });

  describe('CRITICAL: Authentication and Session Security', () => {
    it('SECURITY: Invalid session token should be rejected', async () => {
      await expect(
        getAllCompanyIncidents(mockCtx, {
          sessionToken: 'invalid-session-token'
        })
      ).rejects.toThrow(/Authentication required/);
    });

    it('SECURITY: Empty session token should be rejected', async () => {
      await expect(
        getAllCompanyIncidents(mockCtx, {
          sessionToken: ''
        })
      ).rejects.toThrow(/Authentication required/);
    });

    it('SECURITY: Expired session should be handled gracefully', async () => {
      // Mock expired session
      mockCtx.mockSessionResolver['expired-session'] = null;

      await expect(
        getAllCompanyIncidents(mockCtx, {
          sessionToken: 'expired-session'
        })
      ).rejects.toThrow(/Authentication required/);
    });

    it('SECURITY: Session from different user should not allow access to other company data', async () => {
      // This test ensures session tokens are properly validated against user context
      const result = await getAllCompanyIncidents(mockCtx, {
        sessionToken: SESSION_TOKENS.COMPANY_B_TEAMLEAD  // Company B session
      });

      // Should only return Company B data, never Company A
      result.incidents.forEach(incident => {
        expect(incident.company_id).toBe(COMPANY_B_ID);
        expect(incident.company_id).not.toBe(COMPANY_A_ID);
      });
    });
  });
});