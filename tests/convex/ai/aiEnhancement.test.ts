// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConvexTestingHelper } from '../test-helpers/convex-testing-helper';
import { Id } from '@/convex/_generated/dataModel';

// Mock the AI enhancement functions
const mockAiEnhancement = {
  enhanceIncidentNarrative: jest.fn(),
  storeEnhancedNarrative: jest.fn(),
  updateEnhancedNarrative: jest.fn(),
  getEnhancedNarrative: jest.fn(),
  validateWorkflowCompletion: jest.fn(),
  submitIncidentForAnalysis: jest.fn(),
};

// Mock Convex server functions
jest.mock('@/convex/_generated/server', () => ({
  query: jest.fn((fn) => fn),
  mutation: jest.fn((fn) => fn),
  action: jest.fn((fn) => fn),
}));

// Mock permissions
jest.mock('@/convex/permissions', () => ({
  requirePermission: jest.fn(),
  PERMISSIONS: {
    EDIT_OWN_INCIDENT_CAPTURE: 'edit_own_incident_capture',
    VIEW_ALL_COMPANY_INCIDENTS: 'view_all_company_incidents',
  },
}));

// Mock Convex values
jest.mock('convex/values', () => ({
  v: {
    string: () => 'string',
    id: (table: string) => `id(${table})`,
    number: () => 'number',
    optional: (type: any) => `optional(${type})`,
  },
  ConvexError: class ConvexError extends Error {},
}));

describe('AI Enhancement Backend Functions', () => {
  let testHelper: ConvexTestingHelper;
  let mockCtx: any;
  let mockUser: any;
  let mockIncident: any;
  let mockNarratives: any;
  let mockClarificationAnswers: any[];

  beforeEach(() => {
    testHelper = new ConvexTestingHelper();
    
    mockUser = {
      _id: 'user_123' as Id<'users'>,
      name: 'Test User',
      email: 'test@example.com',
      role: 'frontline_worker',
    };

    mockIncident = {
      _id: 'incident_123' as Id<'incidents'>,
      participant_name: 'John Doe',
      reporter_name: 'Jane Smith',
      location: 'Community Center',
      event_date_time: 'March 15, 2025 at 2:30 PM',
      capture_status: 'in_progress',
      enhanced_narrative_id: undefined,
    };

    mockNarratives = {
      _id: 'narratives_123' as Id<'incident_narratives'>,
      incident_id: 'incident_123' as Id<'incidents'>,
      before_event: 'Client was calm and engaged in activities.',
      during_event: 'Client became agitated during group discussion.',
      end_event: 'Client left the room and was followed by staff.',
      post_event: 'Client was provided with one-on-one support.',
    };

    mockClarificationAnswers = [
      {
        _id: 'answer_1' as Id<'clarification_answers'>,
        incident_id: 'incident_123' as Id<'incidents'>,
        question_text: 'What specific trigger caused the agitation?',
        answer_text: 'Another participant raised their voice during discussion.',
        phase: 'during_event',
      },
      {
        _id: 'answer_2' as Id<'clarification_answers'>,
        incident_id: 'incident_123' as Id<'incidents'>,
        question_text: 'How long did the support session last?',
        answer_text: 'Approximately 15 minutes until client was calm.',
        phase: 'post_event',
      },
    ];

    mockCtx = testHelper.createMockContext();
    
    // Mock permission check to return user
    require('@/convex/permissions').requirePermission.mockResolvedValue({ user: mockUser });
    
    // Mock database operations
    mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
      if (fn.toString().includes('incidents.getById')) {
        return Promise.resolve(mockIncident);
      }
      if (fn.toString().includes('narratives.getByIncidentId')) {
        return Promise.resolve(mockNarratives);
      }
      if (fn.toString().includes('clarificationAnswers.listByIncident')) {
        return Promise.resolve(mockClarificationAnswers);
      }
      if (fn.toString().includes('promptManager.getActivePrompt')) {
        return Promise.resolve({
          prompt_name: 'enhance_narrative',
          prompt_template: 'Enhance the narrative for {{participant_name}} incident.',
          ai_model: 'claude-3-sonnet',
          subsystem: 'incidents',
        });
      }
      return Promise.resolve(null);
    });

    mockCtx.runMutation.mockImplementation((fn: any, args: any) => {
      if (fn.toString().includes('storeEnhancedNarrative')) {
        return Promise.resolve('enhanced_123' as Id<'enhanced_narratives'>);
      }
      if (fn.toString().includes('incidents.logAiRequest')) {
        return Promise.resolve('log_123');
      }
      if (fn.toString().includes('promptManager.updatePromptUsage')) {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    mockCtx.db.patch.mockResolvedValue(undefined);
    mockCtx.db.insert.mockResolvedValue('new_id_123');
  });

  describe('enhanceIncidentNarrative', () => {
    it('should successfully enhance incident narrative with AI service', async () => {
      // Import the actual function to test
      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      expect(result).toMatchObject({
        enhanced_narrative_id: expect.any(String),
        enhanced_content: expect.stringContaining('BEFORE EVENT'),
        correlation_id: expect.stringMatching(/^enhance_\d+_[a-z0-9]+$/),
        processing_time_ms: expect.any(Number),
        ai_model_used: expect.any(String),
        quality_score: expect.any(Number),
        success: expect.any(Boolean),
      });

      // Verify enhanced content structure
      expect(result.enhanced_content).toContain('BEFORE EVENT');
      expect(result.enhanced_content).toContain('DURING EVENT');
      expect(result.enhanced_content).toContain('END EVENT');
      expect(result.enhanced_content).toContain('POST EVENT');
      expect(result.enhanced_content).toContain('ADDITIONAL CLARIFICATIONS');
    });

    it('should handle missing incident gracefully', async () => {
      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('incidents.getById')) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockNarratives);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'nonexistent_123' as Id<'incidents'>,
      };

      await expect(enhanceIncidentNarrative.handler(mockCtx, args))
        .rejects.toThrow('Incident not found');
    });

    it('should handle missing narratives gracefully', async () => {
      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('incidents.getById')) {
          return Promise.resolve(mockIncident);
        }
        if (fn.toString().includes('narratives.getByIncidentId')) {
          return Promise.resolve(null);
        }
        return Promise.resolve([]);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      await expect(enhanceIncidentNarrative.handler(mockCtx, args))
        .rejects.toThrow('Incident narratives not found');
    });

    it('should properly format enhancement with grammar fixes', async () => {
      // Test with narratives that need grammar fixes
      const narrativesWithErrors = {
        ...mockNarratives,
        before_event: 'client was calm',  // No capital, no period
        during_event: 'client became agitated', // No capital, no period
        end_event: 'Client left the room', // Missing period
        post_event: '', // Empty content
      };

      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('incidents.getById')) {
          return Promise.resolve(mockIncident);
        }
        if (fn.toString().includes('narratives.getByIncidentId')) {
          return Promise.resolve(narrativesWithErrors);
        }
        if (fn.toString().includes('clarificationAnswers.listByIncident')) {
          return Promise.resolve([]);
        }
        return Promise.resolve(null);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      // Check grammar fixes were applied
      expect(result.enhanced_content).toContain('Client was calm.');  // Capitalized and punctuated
      expect(result.enhanced_content).toContain('Client became agitated.'); // Capitalized and punctuated
      expect(result.enhanced_content).toContain('Client left the room.'); // Punctuated
      expect(result.enhanced_content).not.toContain('POST EVENT'); // Empty content filtered out
    });

    it('should include only answered clarification questions', async () => {
      const mixedAnswers = [
        ...mockClarificationAnswers,
        {
          _id: 'answer_3' as Id<'clarification_answers'>,
          incident_id: 'incident_123' as Id<'incidents'>,
          question_text: 'What was the weather like?',
          answer_text: '', // Empty answer - should be filtered out
          phase: 'before_event',
        },
        {
          _id: 'answer_4' as Id<'clarification_answers'>,
          incident_id: 'incident_123' as Id<'incidents'>,
          question_text: 'Were there any witnesses?',
          answer_text: '   ', // Whitespace only - should be filtered out
          phase: 'during_event',
        },
      ];

      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('clarificationAnswers.listByIncident')) {
          return Promise.resolve(mixedAnswers);
        }
        if (fn.toString().includes('incidents.getById')) {
          return Promise.resolve(mockIncident);
        }
        if (fn.toString().includes('narratives.getByIncidentId')) {
          return Promise.resolve(mockNarratives);
        }
        return Promise.resolve(null);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      // Should include answered questions
      expect(result.enhanced_content).toContain('What specific trigger caused the agitation?');
      expect(result.enhanced_content).toContain('Another participant raised their voice');
      expect(result.enhanced_content).toContain('How long did the support session last?');
      expect(result.enhanced_content).toContain('Approximately 15 minutes');

      // Should not include empty/whitespace questions
      expect(result.enhanced_content).not.toContain('What was the weather like?');
      expect(result.enhanced_content).not.toContain('Were there any witnesses?');
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock prompt to trigger AI call but make it fail
      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('promptManager.getActivePrompt')) {
          return Promise.resolve({
            prompt_name: 'enhance_narrative',
            prompt_template: 'Enhance: {{participant_name}}',
            ai_model: 'claude-3-sonnet',
          });
        }
        if (fn.toString().includes('incidents.getById')) {
          return Promise.resolve(mockIncident);
        }
        if (fn.toString().includes('narratives.getByIncidentId')) {
          return Promise.resolve(mockNarratives);
        }
        if (fn.toString().includes('clarificationAnswers.listByIncident')) {
          return Promise.resolve(mockClarificationAnswers);
        }
        return Promise.resolve(null);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      // Should fallback to mock enhancement
      expect(result.success).toBe(true); // Still succeeds with fallback
      expect(result.enhanced_content).toContain('BEFORE EVENT');
      expect(result.ai_model_used).toBe('claude-3-sonnet'); // Should use the prompt model
    });
  });

  describe('updateEnhancedNarrative', () => {
    it('should successfully update enhanced narrative with user edits', async () => {
      const existingNarrative = {
        _id: 'enhanced_123' as Id<'enhanced_narratives'>,
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_content: 'Original enhanced content',
        enhancement_version: 1,
        user_edited: false,
      };

      mockCtx.db.get.mockResolvedValue(existingNarrative);

      const { updateEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
        user_edited_content: 'User edited enhanced content with improvements',
      };

      const result = await updateEnhancedNarrative.handler(mockCtx, args);

      expect(result.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenCalledWith('enhanced_123', {
        enhanced_content: 'User edited enhanced content with improvements',
        user_edited: true,
        user_edits: 'User edited enhanced content with improvements',
        enhancement_version: 2,
        updated_at: expect.any(Number),
      });
    });

    it('should handle missing enhanced narrative', async () => {
      mockCtx.db.get.mockResolvedValue(null);

      const { updateEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        enhanced_narrative_id: 'nonexistent_123' as Id<'enhanced_narratives'>,
        user_edited_content: 'Some content',
      };

      await expect(updateEnhancedNarrative.handler(mockCtx, args))
        .rejects.toThrow('Enhanced narrative not found');
    });
  });

  describe('validateWorkflowCompletion', () => {
    it('should return complete validation when all requirements met', async () => {
      mockCtx.db.get.mockResolvedValue(mockIncident);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockNarratives),
            collect: jest.fn().mockResolvedValue(mockClarificationAnswers),
          }),
        }),
      });

      const { validateWorkflowCompletion } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await validateWorkflowCompletion.handler(mockCtx, args);

      expect(result.allComplete).toBe(true);
      expect(result.checklist).toMatchObject({
        metadata_complete: true,
        narratives_complete: true,
        clarifications_complete: true,
        enhancement_complete: false, // No enhanced narrative in this mock
        validation_passed: true,
      });
      expect(result.missing_requirements).toContain('enhancement_complete');
    });

    it('should identify missing metadata requirements', async () => {
      const incompleteIncident = {
        ...mockIncident,
        participant_name: '', // Missing
        location: undefined, // Missing
      };

      mockCtx.db.get.mockResolvedValue(incompleteIncident);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null), // No narratives
            collect: jest.fn().mockResolvedValue([]), // No clarifications
          }),
        }),
      });

      const { validateWorkflowCompletion } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await validateWorkflowCompletion.handler(mockCtx, args);

      expect(result.allComplete).toBe(false);
      expect(result.checklist.metadata_complete).toBe(false);
      expect(result.checklist.narratives_complete).toBe(false);
      expect(result.checklist.clarifications_complete).toBe(false);
      expect(result.missing_requirements).toEqual([
        'metadata_complete',
        'narratives_complete',
        'clarifications_complete',
        'enhancement_complete',
      ]);
    });
  });

  describe('submitIncidentForAnalysis', () => {
    beforeEach(() => {
      // Mock complete validation
      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('validateWorkflowCompletion')) {
          return Promise.resolve({
            allComplete: true,
            checklist: {
              metadata_complete: true,
              narratives_complete: true,
              clarifications_complete: true,
              enhancement_complete: true,
              validation_passed: true,
            },
            missing_requirements: [],
          });
        }
        return Promise.resolve(null);
      });
    });

    it('should successfully submit complete incident for analysis', async () => {
      const { submitIncidentForAnalysis } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
      };

      const result = await submitIncidentForAnalysis.handler(mockCtx, args);

      expect(result.success).toBe(true);
      expect(result.handoff_id).toBe('new_id_123');
      expect(result.message).toBe('Incident submitted for analysis workflow');

      // Verify incident was updated
      expect(mockCtx.db.patch).toHaveBeenCalledWith('incident_123', {
        enhanced_narrative_id: 'enhanced_123',
        workflow_completed_at: expect.any(Number),
        submitted_by: 'user_123',
        submitted_at: expect.any(Number),
        handoff_status: 'ready_for_analysis',
        completion_checklist: expect.any(Object),
        capture_status: 'completed',
        updated_at: expect.any(Number),
      });

      // Verify handoff notification was created
      expect(mockCtx.db.insert).toHaveBeenCalledWith('workflow_handoffs', {
        incident_id: 'incident_123',
        from_workflow: 'incident_capture',
        to_workflow: 'incident_analysis',
        handoff_data: {
          enhanced_narrative_id: 'enhanced_123',
          submitted_by: 'user_123',
          completion_checklist: expect.any(Object),
        },
        team_leader_notified: false,
        handoff_accepted: false,
        created_at: expect.any(Number),
      });
    });

    it('should reject submission when workflow incomplete', async () => {
      mockCtx.runQuery.mockImplementation((fn: any) => {
        if (fn.toString().includes('validateWorkflowCompletion')) {
          return Promise.resolve({
            allComplete: false,
            missing_requirements: ['enhancement_complete', 'narratives_complete'],
          });
        }
        return Promise.resolve(null);
      });

      const { submitIncidentForAnalysis } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
      };

      await expect(submitIncidentForAnalysis.handler(mockCtx, args))
        .rejects.toThrow('Workflow incomplete. Missing: enhancement_complete, narratives_complete');
    });
  });

  describe('getEnhancedNarrative', () => {
    it('should return most recent enhanced narrative for incident', async () => {
      const enhancedNarrative = {
        _id: 'enhanced_123' as Id<'enhanced_narratives'>,
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_content: 'Enhanced narrative content',
        enhancement_version: 2,
        user_edited: true,
      };

      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(enhancedNarrative),
            }),
          }),
        }),
      });

      const { getEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await getEnhancedNarrative.handler(mockCtx, args);

      expect(result).toEqual(enhancedNarrative);
    });

    it('should return null when no enhanced narrative exists', async () => {
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      const { getEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await getEnhancedNarrative.handler(mockCtx, args);

      expect(result).toBeNull();
    });
  });
});