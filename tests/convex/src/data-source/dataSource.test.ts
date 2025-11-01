// @ts-nocheck
/**
 * Story 11.1: Data Source Profile Tests
 *
 * Unit tests for data source profile management functions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConvexTestingHelper } from '../../helpers/ConvexTestingHelper';
import { api } from '@convex/_generated/api';

describe('Data Source Profile Management', () => {
  let helper: ConvexTestingHelper;
  let sessionToken: string;
  let userId: string;

  beforeEach(async () => {
    helper = new ConvexTestingHelper();
    await helper.setup();

    // Create authenticated user with MANAGE_USERS permission
    const authResult = await helper.createAuthenticatedUser({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'developer', // Developers have MANAGE_USERS permission
    });
    sessionToken = authResult.sessionToken;
    userId = authResult.userId;
  });

  describe('createDataSourceProfile', () => {
    it('should create a new data source profile', async () => {
      const dataSourceId = await helper.mutation(
        api.dataSource.createDataSourceProfile,
        {
          sessionToken,
          name: 'Test Incidents',
          description: 'Test incident data source',
          entity_type: 'incident',
          config: {
            filter: { status: 'active' },
          },
        }
      );

      expect(dataSourceId).toBeDefined();

      // Verify created profile
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        {}
      );

      const created = profiles.find((p: any) => p._id === dataSourceId);
      expect(created).toBeDefined();
      expect(created.name).toBe('Test Incidents');
      expect(created.entity_type).toBe('incident');
      expect(created.status).toBe('active');
      expect(created.created_by).toBe(userId);
    });

    it('should reject duplicate data source names', async () => {
      // Create first data source
      await helper.mutation(
        api.dataSource.createDataSourceProfile,
        {
          sessionToken,
          name: 'Duplicate Name',
          entity_type: 'narrative',
          config: {},
        }
      );

      // Attempt to create duplicate
      await expect(
        helper.mutation(
          api.dataSource.createDataSourceProfile,
          {
            sessionToken,
            name: 'Duplicate Name',
            entity_type: 'moment',
            config: {},
          }
        )
      ).rejects.toThrow();
    });

    it('should reject creation without MANAGE_USERS permission', async () => {
      // Create user without admin permission
      const { sessionToken: userToken } = await helper.createAuthenticatedUser({
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
      });

      await expect(
        helper.mutation(
          api.dataSource.createDataSourceProfile,
          {
            sessionToken: userToken,
            name: 'Unauthorized',
            entity_type: 'incident',
            config: {},
          }
        )
      ).rejects.toThrow();
    });

    it('should handle all entity types', async () => {
      const entityTypes = ['incident', 'narrative', 'moment'] as const;

      for (const entity_type of entityTypes) {
        const dataSourceId = await helper.mutation(
          api.dataSource.createDataSourceProfile,
          {
            sessionToken,
            name: `Test ${entity_type}`,
            entity_type,
            config: {},
          }
        );

        expect(dataSourceId).toBeDefined();
      }
    });
  });

  describe('listDataSourceProfiles', () => {
    beforeEach(async () => {
      // Create test data sources
      await helper.mutation(
        api.dataSource.createDataSourceProfile,
        {
          sessionToken,
          name: 'Active Incidents',
          entity_type: 'incident',
          config: {},
        }
      );

      await helper.mutation(
        api.dataSource.createDataSourceProfile,
        {
          sessionToken,
          name: 'Active Narratives',
          entity_type: 'narrative',
          config: {},
        }
      );
    });

    it('should list all data sources without filters', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        {}
      );

      expect(profiles.length).toBeGreaterThanOrEqual(2);
      expect(profiles.every((p: any) => p.prompt_count !== undefined)).toBe(true);
    });

    it('should filter by entity_type', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        { entity_type: 'incident' }
      );

      expect(profiles.every((p: any) => p.entity_type === 'incident')).toBe(true);
    });

    it('should filter by status', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        { status: 'active' }
      );

      expect(profiles.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should filter by both entity_type and status', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        { entity_type: 'narrative', status: 'active' }
      );

      expect(profiles.every((p: any) =>
        p.entity_type === 'narrative' && p.status === 'active'
      )).toBe(true);
    });

    it('should include prompt counts', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        {}
      );

      profiles.forEach((profile: any) => {
        expect(profile).toHaveProperty('prompt_count');
        expect(typeof profile.prompt_count).toBe('number');
      });
    });

    it('should order by creation date descending', async () => {
      const profiles = await helper.query(
        api.dataSource.listDataSourceProfiles,
        {}
      );

      for (let i = 1; i < profiles.length; i++) {
        expect(profiles[i - 1].created_at).toBeGreaterThanOrEqual(profiles[i].created_at);
      }
    });
  });
});
