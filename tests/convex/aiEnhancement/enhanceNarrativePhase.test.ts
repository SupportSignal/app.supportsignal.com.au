// @ts-nocheck
/**
 * Unit Tests for enhanceNarrativePhase Mutation Function
 * 
 * Tests the phase-specific narrative enhancement functionality including:
 * - Authentication and permissions validation
 * - Phase-specific narrative processing (before_event, during_event, end_event, post_event)
 * - Enhanced content generation and database storage
 * - Error handling for missing incidents and invalid phases
 * - Integration with AI request logging and monitoring
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Convex modules at top level before imports
const mockServer = require('../__mocks__/_generated/server');
const mockApi = require('../__mocks__/_generated/api');

const { createMockCtx } = require('../__mocks__/_generated/server');

// Mock permissions module directly
jest.mock('../../../apps/convex/permissions', () => ({
  requirePermission: jest.fn(),
  PERMISSIONS: {
    EDIT_OWN_INCIDENT_CAPTURE: 'edit_own_incident_capture',
    INCIDENTS_READ: 'incidents:read',
    INCIDENTS_WRITE: 'incidents:write'
  }
}));

// Mock Convex values
jest.mock('convex/values', () => ({
  v: {
    string: () => 'string',
    id: (table: string) => `id(${table})`,
    number: () => 'number',
    union: (...args: any[]) => `union(${args.join(', ')})`,
    literal: (value: string) => `literal(${value})`,
    optional: (type: any) => `optional(${type})`,
  },
  ConvexError: class ConvexError extends Error {},
}));

// Note: generateCorrelationId and interpolateTemplate are internal functions in the aiEnhancement.ts file
// We'll test them as part of the actual function behavior rather than mocking them

// Import the function to test
import { enhanceNarrativePhase } from '../../../apps/convex/aiEnhancement';

describe('enhanceNarrativePhase Mutation', () => {
  let mockCtx: any;
  let mockUserId: string;
  let mockSessionToken: string;
  let mockIncidentId: string;
  let mockNarrativeId: string;

  // Helper functions for creating test data
  const createTestUser = (overrides = {}) => ({
    _id: mockUserId,
    email: 'test.user@example.com',
    name: 'Test User',
    role: 'frontline_worker',
    company_id: 'test-company-id',
    ...overrides
  });

  const createTestIncident = (overrides = {}) => ({
    _id: mockIncidentId,
    reporter_name: 'Jane Smith',
    participant_name: 'John Doe',
    event_date_time: 'March 15, 2025 at 2:30 PM',
    location: 'Community Center',
    capture_status: 'draft',
    analysis_status: 'not_started',
    overall_status: 'capture_pending',
    created_by: mockUserId,
    created_at: Date.now(),
    updated_at: Date.now(),
    company_id: 'test-company-id',
    _creationTime: Date.now(),
    ...overrides
  });

  const createTestNarratives = (overrides = {}) => ({
    _id: mockNarrativeId,
    incident_id: mockIncidentId,
    before_event: 'Client was calm and engaged in group activities before the incident.',
    during_event: 'Client became visibly agitated when another participant spoke loudly during discussion.',
    end_event: 'Client left the room abruptly and was followed by staff member for support.',
    post_event: 'Client was provided with one-on-one support and returned to calm state within 15 minutes.',
    before_event_extra: null,
    during_event_extra: null,
    end_event_extra: null,
    post_event_extra: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    version: 1,
    ...overrides
  });

  const createTestClarificationAnswers = (phase: string) => [
    {
      _id: `answer_1_${phase}`,
      incident_id: mockIncidentId,
      question_text: `What specific trigger caused the reaction during ${phase}?`,
      answer_text: `During ${phase}, the participant was triggered by loud noises and sudden movements.`,
      phase: phase,
      created_at: Date.now()
    },
    {
      _id: `answer_2_${phase}`,
      incident_id: mockIncidentId,
      question_text: `How long did this ${phase} last?`,
      answer_text: `The ${phase} lasted approximately 5-10 minutes before resolution.`,
      phase: phase,
      created_at: Date.now()
    }
  ];

  const createTestPromptTemplate = () => ({
    prompt_name: 'enhance_narrative',
    subsystem: 'incidents',
    prompt_template: 'Enhance the narrative for participant {{participant_name}} at {{incident_location}} during {{narrative_phase}}. Original: {{phase_original_narrative}}. Additional details: {{phase_clarification_responses}}',
    ai_model: 'claude-3-sonnet',
    is_active: true,
    version: 1
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Generate test IDs
    mockUserId = `test-user-${Date.now()}`;
    mockSessionToken = `test-session-${Date.now()}`;
    mockIncidentId = `test-incident-${Date.now()}`;
    mockNarrativeId = `test-narrative-${Date.now()}`;

    // Create mock context
    mockCtx = createMockCtx();
    
    // Setup default mock behaviors - Mock requirePermission directly
    const { requirePermission } = require('../../../apps/convex/permissions');
    requirePermission.mockResolvedValue({ user: createTestUser() });

    // Setup database mocks with realistic data
    mockCtx.db.get.mockImplementation((id) => {
      if (id === mockIncidentId) return Promise.resolve(createTestIncident());
      if (id === mockNarrativeId) return Promise.resolve(createTestNarratives());
      return Promise.resolve(null);
    });

    // Use a simpler approach - mock the database query operations directly without complex chaining
    const createMockQueryChain = (table: string, phase: string = 'before_event') => {
      if (table === 'incident_narratives') {
        return {
          withIndex: () => ({
            first: () => Promise.resolve(createTestNarratives())
          })
        };
      } else if (table === 'clarification_answers') {
        return {
          withIndex: () => ({
            collect: () => Promise.resolve(createTestClarificationAnswers(phase))
          })
        };
      } else {
        return {
          withIndex: () => ({
            first: () => Promise.resolve(null),
            collect: () => Promise.resolve([])
          })
        };
      }
    };

    mockCtx.db.query.mockImplementation((table) => createMockQueryChain(table));

    // Mock database operations
    mockCtx.db.insert.mockImplementation((table, doc) => {
      if (table === 'ai_request_logs') return Promise.resolve(`log-${Date.now()}`);
      return Promise.resolve(`mock-${table}-id`);
    });

    mockCtx.db.patch.mockResolvedValue(undefined);

    // Mock internal queries
    mockCtx.runQuery.mockImplementation((apiFunc, args) => {
      // Mock prompt template query
      return Promise.resolve(createTestPromptTemplate());
    });

    // Mock internal mutations
    mockCtx.runMutation.mockImplementation((apiFunc, args) => {
      // Mock prompt usage update
      return Promise.resolve({ success: true });
    });
  });

  describe('Successful Enhancement Scenarios', () => {
    it('should enhance before_event phase successfully', async () => {
      // Setup phase-specific clarification answers
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(createTestClarificationAnswers('before_event'))
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      });

      expect(result.success).toBe(true);
      expect(result.phase).toBe('before_event');
      expect(result.enhanced_content).toContain('[MOCK ENHANCED - BEFORE_EVENT]');
      expect(result.original_content).toBe('Client was calm and engaged in group activities before the incident.');
      expect(result.clarification_count).toBe(2);
      expect(result.correlation_id).toMatch(/^enhance_\d+_[a-z0-9]+$/);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.ai_model_used).toBe('claude-3-sonnet');
    });

    it('should enhance during_event phase with clarifications', async () => {
      // Setup phase-specific data
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(createTestClarificationAnswers('during_event'))
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'during_event'
      });

      expect(result.success).toBe(true);
      expect(result.phase).toBe('during_event');
      expect(result.enhanced_content).toContain('[MOCK ENHANCED - DURING_EVENT]');
      expect(result.enhanced_content).toContain('loud noises and sudden movements');
      expect(result.clarification_count).toBe(2);
    });

    it('should enhance end_event phase', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(createTestClarificationAnswers('end_event'))
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'end_event'
      });

      expect(result.success).toBe(true);
      expect(result.phase).toBe('end_event');
      expect(result.enhanced_content).toContain('[MOCK ENHANCED - END_EVENT]');
    });

    it('should enhance post_event phase', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(createTestClarificationAnswers('post_event'))
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'post_event'
      });

      expect(result.success).toBe(true);
      expect(result.phase).toBe('post_event');
      expect(result.enhanced_content).toContain('[MOCK ENHANCED - POST_EVENT]');
    });
  });

  describe('Database Updates', () => {
    it('should save enhanced content to correct database field', async () => {
      // Setup test data
      const narratives = createTestNarratives();
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(narratives),
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      });

      // Verify database patch was called with correct field
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        narratives._id,
        expect.objectContaining({
          before_event_extra: expect.stringContaining('[MOCK ENHANCED - BEFORE_EVENT]'),
          enhanced_at: expect.any(Number),
          updated_at: expect.any(Number),
          version: 2 // Original version 1 + 1
        })
      );
    });

    it('should update correct field for each phase', async () => {
      const phases = [
        { phase: 'before_event', expectedField: 'before_event_extra' },
        { phase: 'during_event', expectedField: 'during_event_extra' },
        { phase: 'end_event', expectedField: 'end_event_extra' },
        { phase: 'post_event', expectedField: 'post_event_extra' }
      ];

      const narratives = createTestNarratives();
      
      for (const { phase, expectedField } of phases) {
        jest.clearAllMocks();
        
        mockCtx.db.query.mockImplementation((table) => {
          const builder = {
            withIndex: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue(narratives),
                collect: jest.fn().mockResolvedValue([])
              })
            })
          };
          return builder;
        });

        await enhanceNarrativePhase(mockCtx, {
          sessionToken: mockSessionToken,
          incident_id: mockIncidentId,
          phase: phase
        });

        expect(mockCtx.db.patch).toHaveBeenCalledWith(
          narratives._id,
          expect.objectContaining({
            [expectedField]: expect.stringContaining(`[MOCK ENHANCED - ${phase.toUpperCase()}]`)
          })
        );
      }
    });
  });

  describe('AI Request Logging', () => {
    it('should log successful enhancement request', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'during_event'
      });

      // Verify AI request log was created
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        'ai_request_logs',
        expect.objectContaining({
          correlation_id: expect.stringMatching(/^enhance_\d+_[a-z0-9]+$/),
          operation: 'enhanceNarrativePhase-during_event',
          model: 'claude-3-sonnet',
          prompt_template: 'enhance_narrative',
          input_data: expect.objectContaining({
            incident_id: mockIncidentId,
            phase: 'during_event',
            original_length: expect.any(Number),
            clarifications_count: expect.any(Number)
          }),
          processing_time_ms: expect.any(Number),
          success: true,
          error_message: undefined,
          user_id: mockUserId,
          incident_id: mockIncidentId,
          created_at: expect.any(Number)
        })
      );
    });

    it('should update prompt usage statistics', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      });

      // Verify prompt usage was updated
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(), // internal.promptManager.updatePromptUsage
        expect.objectContaining({
          prompt_name: 'enhance_narrative',
          response_time_ms: expect.any(Number),
          success: true
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failure', async () => {
      const { requirePermission } = require('../../../apps/convex/permissions');
      requirePermission.mockRejectedValueOnce(new Error('Invalid session token'));

      await expect(enhanceNarrativePhase(mockCtx, {
        sessionToken: 'invalid-token',
        incident_id: mockIncidentId,
        phase: 'before_event'
      })).rejects.toThrow('Invalid session token');
    });

    it('should handle missing incident', async () => {
      mockCtx.db.get.mockResolvedValue(null);

      await expect(enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: 'non-existent-incident',
        phase: 'before_event'
      })).rejects.toThrow('Incident not found');
    });

    it('should handle missing narratives', async () => {
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null), // No narratives
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      await expect(enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      })).rejects.toThrow('Incident narratives not found');
    });

    it('should handle empty phase narrative', async () => {
      const narrativesWithEmptyPhase = createTestNarratives({ before_event: '' });
      
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(narrativesWithEmptyPhase),
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      await expect(enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      })).rejects.toThrow('No original narrative found for phase: before_event');
    });

    it('should log failed requests', async () => {
      const { requirePermission } = require('../../../apps/convex/permissions');
      requirePermission.mockRejectedValueOnce(new Error('Permission denied'));

      try {
        await enhanceNarrativePhase(mockCtx, {
          sessionToken: 'invalid-token',
          incident_id: mockIncidentId,
          phase: 'before_event'
        });
      } catch (error) {
        // Expected to throw
      }

      // Verify error was logged
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        'ai_request_logs',
        expect.objectContaining({
          correlation_id: expect.stringMatching(/^enhance_\d+_[a-z0-9]+$/),
          operation: 'enhanceNarrativePhase-before_event',
          success: false,
          error_message: 'Permission denied'
        })
      );
    });
  });

  describe('Mock AI Service Integration', () => {
    it('should handle AI service gracefully when no prompt template', async () => {
      // Mock no prompt template found
      mockCtx.runQuery.mockResolvedValue(null);
      
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue([])
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      });

      expect(result.success).toBe(true);
      expect(result.ai_model_used).toBe('mock-service');
      expect(result.enhanced_content).toContain('[MOCK ENHANCED - BEFORE_EVENT]');
    });

    it('should include clarification responses in enhanced content', async () => {
      const clarificationAnswers = createTestClarificationAnswers('during_event');
      
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(clarificationAnswers)
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'during_event'
      });

      expect(result.enhanced_content).toContain('loud noises and sudden movements');
      expect(result.enhanced_content).toContain('5-10 minutes before resolution');
    });
  });

  describe('Phase-Specific Behavior', () => {
    it('should handle all valid phase values', async () => {
      const validPhases = ['before_event', 'during_event', 'end_event', 'post_event'];
      
      for (const phase of validPhases) {
        jest.clearAllMocks();
        
        mockCtx.db.query.mockImplementation((table) => {
          const builder = {
            withIndex: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue(createTestNarratives()),
                collect: jest.fn().mockResolvedValue([])
              })
            })
          };
          return builder;
        });

        const result = await enhanceNarrativePhase(mockCtx, {
          sessionToken: mockSessionToken,
          incident_id: mockIncidentId,
          phase: phase
        });

        expect(result.success).toBe(true);
        expect(result.phase).toBe(phase);
        expect(result.enhanced_content).toContain(`[MOCK ENHANCED - ${phase.toUpperCase()}]`);
      }
    });

    it('should filter empty clarification responses', async () => {
      const mixedClarifications = [
        ...createTestClarificationAnswers('before_event'),
        {
          _id: 'empty_answer',
          incident_id: mockIncidentId,
          question_text: 'Empty question',
          answer_text: '',
          phase: 'before_event',
          created_at: Date.now()
        }
      ];
      
      mockCtx.db.query.mockImplementation((table) => {
        const builder = {
          withIndex: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(createTestNarratives()),
              collect: jest.fn().mockResolvedValue(mixedClarifications)
            })
          })
        };
        return builder;
      });

      const result = await enhanceNarrativePhase(mockCtx, {
        sessionToken: mockSessionToken,
        incident_id: mockIncidentId,
        phase: 'before_event'
      });

      expect(result.clarification_count).toBe(3); // Total including empty one
      // But enhanced content should only include non-empty answers
      expect(result.enhanced_content).toContain('loud noises');
      expect(result.enhanced_content).not.toContain('Empty question');
    });
  });
});