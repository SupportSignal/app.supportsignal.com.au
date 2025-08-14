// @ts-nocheck
/**
 * AI Enhancement Backend Functions Tests
 * 
 * Tests the AI Enhancement system for Story 3.3 including:
 * - Enhanced narrative creation with AI processing
 * - User edit tracking and version management
 * - Workflow completion validation
 * - Incident submission for analysis
 * - Error handling for authentication and AI service failures
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Convex modules at top level before imports
const mockServer = require('../__mocks__/_generated/server');
const mockApi = require('../__mocks__/_generated/api');

const { createMockCtx } = require('../__mocks__/_generated/server');

// Mock the auth module
jest.mock('../../../apps/convex/lib/auth', () => ({
  requirePermission: jest.fn(),
  PERMISSIONS: {
    INCIDENTS_WRITE: 'incidents:write',
    INCIDENTS_READ: 'incidents:read'
  }
}));

// Import the functions to test (these should be the actual implementations)
import {
  enhanceIncidentNarrative,
  createEnhancedNarrative,
  updateEnhancedNarrative,
  updateIncidentEnhancement,
  getEnhancedNarrative,
  validateWorkflowCompletion,
  submitIncidentForAnalysis
} from '../../../apps/convex/aiEnhancement';

describe('AI Enhancement Backend Functions', () => {
  let mockCtx: any;
  let mockUserId: string;
  let mockSessionToken: string;
  let mockIncidentId: string;
  let mockEnhancedNarrativeId: string;

  // Helper functions for test data creation
  const createTestUser = (overrides = {}) => ({
    _id: mockUserId,
    email: 'test.user@example.com',
    name: 'Test User',
    password: 'test-password',
    role: 'frontline_worker',
    company_id: 'test-company-id',
    profile_image_url: null,
    ...overrides
  });

  const createTestIncident = (overrides = {}) => ({
    _id: mockIncidentId,
    reporter_name: 'Test Reporter',
    participant_name: 'Test Participant',
    event_date_time: '2024-01-15T14:30:00Z',
    location: 'Test Location',
    capture_status: 'draft',
    analysis_status: 'not_started',
    overall_status: 'capture_pending',
    created_by: mockUserId,
    created_at: Date.now(),
    updated_at: Date.now(),
    narrative_hash: null,
    questions_generated: false,
    narrative_enhanced: false,
    analysis_generated: false,
    handoff_status: 'draft',
    company_id: 'test-company-id',
    _creationTime: Date.now(),
    ...overrides
  });

  const createTestNarratives = (overrides = {}) => ({
    _id: 'test-narrative-id',
    incident_id: mockIncidentId,
    before_event: 'Before event narrative content',
    during_event: 'During event narrative content',
    end_event: 'End event narrative content',
    post_event: 'Post event narrative content',
    created_at: Date.now(),
    updated_at: Date.now(),
    version: 1,
    ...overrides
  });

  const createTestEnhancedNarrative = (overrides = {}) => ({
    _id: mockEnhancedNarrativeId,
    incident_id: mockIncidentId,
    original_content: 'Original combined narrative content',
    clarification_responses: 'Combined clarification responses',
    enhanced_content: 'Enhanced narrative content with AI improvements',
    enhancement_version: 1,
    ai_model: 'claude-3-sonnet-20240229',
    processing_time_ms: 1250,
    quality_score: 0.92,
    user_edited: false,
    user_edits: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Generate test IDs
    mockUserId = `test-user-${Date.now()}`;
    mockSessionToken = `test-session-${Date.now()}`;
    mockIncidentId = `test-incident-${Date.now()}`;
    mockEnhancedNarrativeId = `test-enhanced-${Date.now()}`;

    // Create mock context
    mockCtx = createMockCtx();
    
    // Setup default mock behaviors
    const { requirePermission } = require('../../../apps/convex/lib/auth');
    
    // Mock successful authentication
    requirePermission.mockResolvedValue({
      user: { _id: mockUserId },
      session: { session_token: mockSessionToken }
    });

    // Setup database mocks
    mockCtx.db.get.mockImplementation((id) => {
      if (id === mockIncidentId) return Promise.resolve(createTestIncident());
      if (id === mockEnhancedNarrativeId) return Promise.resolve(createTestEnhancedNarrative());
      return Promise.resolve(null);
    });

    mockCtx.db.insert.mockImplementation((table, doc) => {
      if (table === 'enhanced_narratives') return Promise.resolve(mockEnhancedNarrativeId);
      return Promise.resolve(`mock-${table}-id`);
    });

    mockCtx.db.patch.mockResolvedValue(undefined);

    // Mock query builders
    const mockQueryBuilder = {
      withIndex: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      collect: jest.fn().mockResolvedValue([])
    };

    mockCtx.db.query.mockReturnValue(mockQueryBuilder);

    // Mock runQuery and runMutation
    mockCtx.runQuery = jest.fn().mockImplementation((apiFunc, args) => {
      if (apiFunc.toString().includes('incidents.getById')) {
        return Promise.resolve(createTestIncident());
      }
      if (apiFunc.toString().includes('narratives.getByIncident')) {
        return Promise.resolve(createTestNarratives());
      }
      if (apiFunc.toString().includes('promptTemplates.resolvePromptTemplate')) {
        return Promise.resolve({
          resolved_prompt: 'Test enhanced prompt with variables resolved'
        });
      }
      return Promise.resolve(null);
    });

    mockCtx.runAction = jest.fn().mockImplementation((apiFunc, args) => {
      if (apiFunc.toString().includes('aiService.generateResponse')) {
        return Promise.resolve({
          response_text: 'Enhanced narrative content with AI improvements and better structure.',
          confidence_score: 0.92,
          processing_time_ms: 1250
        });
      }
      return Promise.resolve({});
    });

    mockCtx.runMutation = jest.fn().mockImplementation((apiFunc, args) => {
      if (apiFunc.toString().includes('createEnhancedNarrative')) {
        return Promise.resolve(mockEnhancedNarrativeId);
      }
      if (apiFunc.toString().includes('updateIncidentEnhancement')) {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });
  });

  describe('enhanceIncidentNarrative', () => {
    it('should create enhanced narrative successfully', async () => {
      const result = await enhanceIncidentNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId
      });

      expect(result.success).toBe(true);
      expect(result.enhanced_narrative_id).toBe(mockEnhancedNarrativeId);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(typeof result.processing_time_ms).toBe('number');
    });

    it('should handle missing incident gracefully', async () => {
      mockCtx.runQuery.mockImplementation((apiFunc) => {
        if (apiFunc.toString().includes('incidents.getById')) {
          return Promise.resolve(null);
        }
        return Promise.resolve({});
      });
      
      const result = await enhanceIncidentNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: 'fake-incident-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Incident not found');
    });

    it('should validate required narrative content', async () => {
      mockCtx.runQuery.mockImplementation((apiFunc) => {
        if (apiFunc.toString().includes('incidents.getById')) {
          return Promise.resolve(createTestIncident());
        }
        if (apiFunc.toString().includes('narratives.getByIncident')) {
          return Promise.resolve(null); // No narratives found
        }
        return Promise.resolve({});
      });

      const result = await enhanceIncidentNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('narratives not found');
    });
  });

  describe('updateEnhancedNarrative', () => {
    it('should update enhanced narrative with user edits', async () => {
      const userEditedContent = 'User edited narrative content with additional details.';
      
      mockCtx.db.get.mockResolvedValue(createTestEnhancedNarrative());
      
      const result = await updateEnhancedNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        enhanced_narrative_id: mockEnhancedNarrativeId,
        user_edited_content: userEditedContent
      });

      expect(result).toBe(mockEnhancedNarrativeId);
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        mockEnhancedNarrativeId,
        expect.objectContaining({
          enhanced_content: userEditedContent,
          enhancement_version: 2, // Original + 1 edit
          user_edited: true,
          user_edits: userEditedContent
        })
      );
    });

    it('should increment version number on updates', async () => {
      const existingNarrative = createTestEnhancedNarrative({ enhancement_version: 2 });
      mockCtx.db.get.mockResolvedValue(existingNarrative);
      
      await updateEnhancedNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        enhanced_narrative_id: mockEnhancedNarrativeId,
        user_edited_content: 'Second edit'
      });

      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        mockEnhancedNarrativeId,
        expect.objectContaining({
          enhancement_version: 3 // Incremented from 2
        })
      );
    });

    it('should handle non-existent enhanced narrative', async () => {
      mockCtx.db.get.mockResolvedValue(null);
      
      await expect(updateEnhancedNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        enhanced_narrative_id: 'fake-narrative-id',
        user_edited_content: 'Some content'
      })).rejects.toThrow('Enhanced narrative not found');
    });
  });

  describe('validateWorkflowCompletion', () => {
    beforeEach(() => {
      // Setup complete workflow data
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnThis(),
          filter: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          first: jest.fn(),
          collect: jest.fn()
        };

        if (table === 'incident_narratives') {
          builder.first.mockResolvedValue(createTestNarratives());
        } else if (table === 'clarification_questions') {
          builder.collect.mockResolvedValue([
            { question_id: 'q1', phase: 'before_event' },
            { question_id: 'q2', phase: 'during_event' }
          ]);
        } else if (table === 'clarification_answers') {
          builder.collect.mockResolvedValue([
            { question_id: 'q1', answer_text: 'Answer 1' },
            { question_id: 'q2', answer_text: 'Answer 2' }
          ]);
        } else if (table === 'enhanced_narratives') {
          builder.first.mockResolvedValue(createTestEnhancedNarrative());
        }

        return builder;
      });
    });

    it('should validate complete workflow', async () => {
      const result = await validateWorkflowCompletion(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId
      });

      expect(result.all_complete).toBe(true);
      expect(result.checklist.metadata_complete).toBe(true);
      expect(result.checklist.narratives_complete).toBe(true);
      expect(result.checklist.enhancement_complete).toBe(true);
      expect(result.checklist.clarifications_complete).toBe(true);
      expect(result.missing_requirements).toHaveLength(0);
    });

    it('should identify incomplete workflow steps', async () => {
      // Mock incomplete incident (missing location)
      mockCtx.db.get.mockResolvedValue(createTestIncident({ location: '' }));
      
      // Mock missing narratives
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnThis(),
          filter: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
          collect: jest.fn().mockResolvedValue([])
        };
        return builder;
      });

      const result = await validateWorkflowCompletion(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId
      });

      expect(result.all_complete).toBe(false);
      expect(result.missing_requirements.length).toBeGreaterThan(0);
      expect(result.checklist.metadata_complete).toBe(false); // Missing location
      expect(result.checklist.narratives_complete).toBe(false); // No narratives
      expect(result.checklist.enhancement_complete).toBe(false); // No enhancement
    });

    it('should handle missing incident', async () => {
      mockCtx.db.get.mockResolvedValue(null);
      
      await expect(validateWorkflowCompletion(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: 'fake-incident-id'
      })).rejects.toThrow('Incident not found');
    });
  });

  describe('submitIncidentForAnalysis', () => {
    beforeEach(() => {
      // Setup enhanced narrative for submission
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(createTestEnhancedNarrative())
        };
        return builder;
      });
    });

    it('should submit complete incident successfully', async () => {
      const mockHandoffId = 'test-handoff-id';
      mockCtx.db.insert.mockImplementation((table) => {
        if (table === 'workflow_handoffs') return Promise.resolve(mockHandoffId);
        return Promise.resolve('mock-id');
      });

      const result = await submitIncidentForAnalysis(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        enhanced_narrative_id: mockEnhancedNarrativeId
      });

      expect(result.success).toBe(true);
      expect(result.handoff_id).toBe(mockHandoffId);
      expect(result.message).toBe('Incident submitted for analysis workflow');
      
      // Verify incident was updated
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        mockIncidentId,
        expect.objectContaining({
          enhanced_narrative_id: mockEnhancedNarrativeId,
          handoff_status: 'ready_for_analysis',
          capture_status: 'completed'
        })
      );
      
      // Verify handoff record was created
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        'workflow_handoffs',
        expect.objectContaining({
          incident_id: mockIncidentId,
          from_workflow: 'incident_capture',
          to_workflow: 'incident_analysis',
          team_leader_notified: false,
          handoff_accepted: false
        })
      );
    });

    it('should prevent submission without enhanced narrative', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null) // No enhanced narrative
        };
        return builder;
      });

      await expect(submitIncidentForAnalysis(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        enhanced_narrative_id: 'fake-narrative-id'
      })).rejects.toThrow('Enhanced narrative not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures', async () => {
      const { requirePermission } = require('../../../apps/convex/lib/auth');
      requirePermission.mockRejectedValueOnce(new Error('Invalid session token'));

      const result = await enhanceIncidentNarrative(mockCtx, {
        sessionToken: 'invalid-token',
        incident_id: mockIncidentId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid session token');
    });

    it('should handle AI service failures gracefully', async () => {
      mockCtx.runAction.mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await enhanceIncidentNarrative(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processing_time_ms).toBeGreaterThan(0);
    });

    it('should handle update authentication failures', async () => {
      const { requirePermission } = require('../../../apps/convex/lib/auth');
      requirePermission.mockRejectedValueOnce(new Error('Insufficient permissions'));

      await expect(updateEnhancedNarrative(mockCtx, {
        sessionToken: 'invalid-token',
        enhanced_narrative_id: mockEnhancedNarrativeId,
        user_edited_content: 'Edited content'
      })).rejects.toThrow('Insufficient permissions');
    });
  });
});