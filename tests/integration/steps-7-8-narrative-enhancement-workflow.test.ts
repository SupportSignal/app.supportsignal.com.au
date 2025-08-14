// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConvexTestingHelper } from '../convex/test-helpers/convex-testing-helper';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Integration Tests for Story 3.3: Steps 7-8 Narrative Enhancement Workflow
 * 
 * Tests the complete workflow from AI enhancement generation through
 * final submission for analysis, covering the two-step review process
 * (Enhanced Review → Consolidated Report → Submit).
 */

// Mock the AI enhancement functions
const mockAiEnhancement = {
  enhanceIncidentNarrative: jest.fn(),
  getEnhancedNarrative: jest.fn(),
  updateEnhancedNarrative: jest.fn(),
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
    boolean: () => 'boolean',
    union: (...types: any[]) => `union(${types.join('|')})`,
    literal: (value: any) => `literal(${value})`,
    object: (obj: any) => `object(${JSON.stringify(obj)})`,
    any: () => 'any',
  },
  ConvexError: class ConvexError extends Error {},
}));

describe('Steps 7-8 Narrative Enhancement Workflow Integration', () => {
  let testHelper: ConvexTestingHelper;
  let mockCtx: any;
  let mockUser: any;
  let completeIncidentData: any;

  beforeEach(() => {
    testHelper = new ConvexTestingHelper();
    
    mockUser = {
      _id: 'user_123' as Id<'users'>,
      name: 'Test User',
      email: 'test@example.com',
      role: 'frontline_worker',
    };

    // Complete incident data that passes all validation checks
    completeIncidentData = {
      incident: {
        _id: 'incident_123' as Id<'incidents'>,
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Community Center',
        event_date_time: 'March 15, 2025 at 2:30 PM',
        capture_status: 'in_progress',
        enhanced_narrative_id: undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      narratives: {
        _id: 'narratives_123' as Id<'incident_narratives'>,
        incident_id: 'incident_123' as Id<'incidents'>,
        before_event: 'Client was calm and engaged in group activities.',
        during_event: 'Client became agitated when another participant raised their voice.',
        end_event: 'Client left the room and was followed by support staff.',
        post_event: 'Client was provided with one-on-one support and gradually calmed down.',
      },
      clarificationAnswers: [
        {
          _id: 'answer_1' as Id<'clarification_answers'>,
          incident_id: 'incident_123' as Id<'incidents'>,
          question_text: 'What specific trigger caused the client\'s agitation?',
          answer_text: 'Another participant raised their voice during group discussion.',
          phase: 'during_event',
        },
        {
          _id: 'answer_2' as Id<'clarification_answers'>,
          incident_id: 'incident_123' as Id<'incidents'>,
          question_text: 'How long did the one-on-one support session last?',
          answer_text: 'Approximately 15 minutes until the client was completely calm.',
          phase: 'post_event',
        },
        {
          _id: 'answer_3' as Id<'clarification_answers'>,
          incident_id: 'incident_123' as Id<'incidents'>,
          question_text: 'Were there any warning signs before the incident?',
          answer_text: 'The client seemed slightly restless but was still participating.',
          phase: 'before_event',
        },
      ],
    };

    mockCtx = testHelper.createMockContext();
    
    // Mock permission check to return user
    require('@/convex/permissions').requirePermission.mockResolvedValue({ user: mockUser });
    
    // Setup comprehensive database mocks
    setupDatabaseMocks();
  });

  function setupDatabaseMocks() {
    // Mock database operations for complete incident data
    mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
      if (fn.toString().includes('incidents.getById')) {
        return Promise.resolve(completeIncidentData.incident);
      }
      if (fn.toString().includes('narratives.getByIncidentId')) {
        return Promise.resolve(completeIncidentData.narratives);
      }
      if (fn.toString().includes('clarificationAnswers.listByIncident')) {
        return Promise.resolve(completeIncidentData.clarificationAnswers);
      }
      if (fn.toString().includes('promptManager.getActivePrompt')) {
        return Promise.resolve({
          prompt_name: 'enhance_narrative',
          prompt_template: 'Enhance the narrative for {{participant_name}} at {{location}}.',
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
    mockCtx.db.get.mockImplementation((id: string) => {
      if (id === 'enhanced_123') {
        return Promise.resolve({
          _id: 'enhanced_123',
          incident_id: 'incident_123',
          enhanced_content: generateExpectedEnhancedContent(),
          enhancement_version: 1,
          user_edited: false,
        });
      }
      return Promise.resolve(null);
    });
    
    // Mock database queries for validation
    mockCtx.db.query.mockReturnValue({
      withIndex: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          first: jest.fn().mockImplementation((table: string) => {
            if (table === 'incident_narratives') {
              return Promise.resolve(completeIncidentData.narratives);
            }
            if (table === 'enhanced_narratives') {
              return Promise.resolve({
                _id: 'enhanced_123',
                incident_id: 'incident_123',
                enhanced_content: generateExpectedEnhancedContent(),
                enhancement_version: 1,
                user_edited: false,
              });
            }
            return Promise.resolve(null);
          }),
          collect: jest.fn().mockResolvedValue(completeIncidentData.clarificationAnswers),
          order: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({
              _id: 'enhanced_123',
              enhanced_content: generateExpectedEnhancedContent(),
            }),
          }),
        }),
      }),
    });
  }

  function generateExpectedEnhancedContent() {
    return '**BEFORE EVENT**: Client was calm and engaged in group activities.\n\n' +
           '**DURING EVENT**: Client became agitated when another participant raised their voice.\n\n' +
           '**END EVENT**: Client left the room and was followed by support staff.\n\n' +
           '**POST EVENT**: Client was provided with one-on-one support and gradually calmed down.\n\n' +
           '**ADDITIONAL CLARIFICATIONS**\n\n' +
           '**Q: Were there any warning signs before the incident?**\n' +
           'A: The client seemed slightly restless but was still participating.\n\n' +
           '**Q: What specific trigger caused the client\'s agitation?**\n' +
           'A: Another participant raised their voice during group discussion.\n\n' +
           '**Q: How long did the one-on-one support session last?**\n' +
           'A: Approximately 15 minutes until the client was completely calm.';
  }

  describe('Step 7: Enhanced Review Process', () => {
    it('should automatically generate AI enhancement when none exists', async () => {
      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      expect(result.success).toBe(true);
      expect(result.enhanced_narrative_id).toBe('enhanced_123');
      expect(result.enhanced_content).toContain('BEFORE EVENT');
      expect(result.enhanced_content).toContain('DURING EVENT');
      expect(result.enhanced_content).toContain('ADDITIONAL CLARIFICATIONS');
      expect(result.enhanced_content).toContain('Another participant raised their voice');
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.quality_score).toBeGreaterThan(0);
    });

    it('should validate enhanced content combines original narratives with clarifications', async () => {
      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await enhanceIncidentNarrative.handler(mockCtx, args);

      // Verify original content is preserved with grammar fixes
      expect(result.enhanced_content).toContain('Client was calm and engaged in group activities.');
      expect(result.enhanced_content).toContain('Client became agitated when another participant raised their voice.');
      expect(result.enhanced_content).toContain('Client left the room and was followed by support staff.');
      expect(result.enhanced_content).toContain('Client was provided with one-on-one support and gradually calmed down.');

      // Verify clarification responses are included
      expect(result.enhanced_content).toContain('What specific trigger caused the client\'s agitation?');
      expect(result.enhanced_content).toContain('Another participant raised their voice during group discussion.');
      expect(result.enhanced_content).toContain('How long did the one-on-one support session last?');
      expect(result.enhanced_content).toContain('Approximately 15 minutes until the client was completely calm.');
      expect(result.enhanced_content).toContain('Were there any warning signs before the incident?');
      expect(result.enhanced_content).toContain('The client seemed slightly restless but was still participating.');
    });

    it('should allow user to edit enhanced narrative content', async () => {
      const { updateEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
        user_edited_content: 'User-edited enhanced narrative with additional context and improvements.',
      };

      const result = await updateEnhancedNarrative.handler(mockCtx, args);

      expect(result.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenCalledWith('enhanced_123', {
        enhanced_content: 'User-edited enhanced narrative with additional context and improvements.',
        user_edited: true,
        user_edits: 'User-edited enhanced narrative with additional context and improvements.',
        enhancement_version: 2,
        updated_at: expect.any(Number),
      });
    });

    it('should retrieve enhanced narrative for review', async () => {
      const { getEnhancedNarrative } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await getEnhancedNarrative.handler(mockCtx, args);

      expect(result).toEqual({
        _id: 'enhanced_123',
        enhanced_content: generateExpectedEnhancedContent(),
      });
    });
  });

  describe('Step 8: Workflow Completion Validation', () => {
    it('should validate complete workflow meets all requirements', async () => {
      const { validateWorkflowCompletion } = require('@/convex/aiEnhancement');
      
      const args = {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      };

      const result = await validateWorkflowCompletion.handler(mockCtx, args);

      expect(result.allComplete).toBe(true);
      expect(result.checklist).toEqual({
        metadata_complete: true,
        narratives_complete: true,
        clarifications_complete: true,
        enhancement_complete: true, // Will be true once enhanced narrative exists
        validation_passed: true,
      });
      expect(result.missing_requirements).toHaveLength(0);
    });

    it('should identify missing requirements in incomplete workflow', async () => {
      // Mock incomplete incident data
      const incompleteIncident = {
        ...completeIncidentData.incident,
        participant_name: '', // Missing required field
        location: undefined, // Missing required field
      };

      const incompleteNarratives = {
        ...completeIncidentData.narratives,
        before_event: '', // Missing required content
        during_event: '', // Missing required content
      };

      mockCtx.db.get.mockResolvedValue(incompleteIncident);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(incompleteNarratives),
            collect: jest.fn().mockResolvedValue([]), // No clarification answers
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
      expect(result.missing_requirements).toContain('metadata_complete');
      expect(result.missing_requirements).toContain('narratives_complete');
      expect(result.missing_requirements).toContain('clarifications_complete');
    });
  });

  describe('Final Submission Process', () => {
    beforeEach(() => {
      // Mock complete validation for submission tests
      mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
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
        return Promise.resolve(completeIncidentData.incident);
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

      // Verify incident was updated with completion information
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

      // Verify workflow handoff notification was created
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

    it('should reject submission when workflow is incomplete', async () => {
      // Mock incomplete validation
      mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
        if (fn.toString().includes('validateWorkflowCompletion')) {
          return Promise.resolve({
            allComplete: false,
            missing_requirements: ['enhancement_complete', 'narratives_complete'],
          });
        }
        return Promise.resolve(completeIncidentData.incident);
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

  describe('End-to-End Workflow Integration', () => {
    it('should complete full Steps 7-8 workflow from enhancement to submission', async () => {
      const { 
        enhanceIncidentNarrative, 
        updateEnhancedNarrative,
        validateWorkflowCompletion,
        submitIncidentForAnalysis 
      } = require('@/convex/aiEnhancement');

      // Step 7a: Generate AI enhancement
      const enhancementResult = await enhanceIncidentNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      expect(enhancementResult.success).toBe(true);
      expect(enhancementResult.enhanced_narrative_id).toBeDefined();

      // Step 7b: User reviews and edits enhancement
      const editResult = await updateEnhancedNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        enhanced_narrative_id: enhancementResult.enhanced_narrative_id,
        user_edited_content: enhancementResult.enhanced_content + '\n\nUser added additional context.',
      });

      expect(editResult.success).toBe(true);

      // Step 8a: Validate workflow completion
      const validationResult = await validateWorkflowCompletion.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      expect(validationResult.allComplete).toBe(true);

      // Step 8b: Submit for analysis
      const submissionResult = await submitIncidentForAnalysis.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: enhancementResult.enhanced_narrative_id,
      });

      expect(submissionResult.success).toBe(true);
      expect(submissionResult.handoff_id).toBeDefined();

      // Verify complete workflow state
      expect(mockCtx.db.patch).toHaveBeenCalledWith('incident_123', 
        expect.objectContaining({
          capture_status: 'completed',
          handoff_status: 'ready_for_analysis',
          workflow_completed_at: expect.any(Number),
        })
      );
    });

    it('should handle workflow with multiple enhancement iterations', async () => {
      const { 
        enhanceIncidentNarrative, 
        updateEnhancedNarrative 
      } = require('@/convex/aiEnhancement');

      // Initial enhancement
      const initialResult = await enhanceIncidentNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      expect(initialResult.success).toBe(true);

      // First user edit
      await updateEnhancedNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        enhanced_narrative_id: initialResult.enhanced_narrative_id,
        user_edited_content: 'First revision of the enhanced content.',
      });

      // Mock updated version for second edit
      mockCtx.db.get.mockResolvedValue({
        _id: 'enhanced_123',
        enhanced_content: 'First revision of the enhanced content.',
        enhancement_version: 2,
        user_edited: true,
      });

      // Second user edit
      const secondEditResult = await updateEnhancedNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        enhanced_narrative_id: initialResult.enhanced_narrative_id,
        user_edited_content: 'Second revision with additional improvements.',
      });

      expect(secondEditResult.success).toBe(true);
      expect(mockCtx.db.patch).toHaveBeenLastCalledWith('enhanced_123', 
        expect.objectContaining({
          enhanced_content: 'Second revision with additional improvements.',
          enhancement_version: 3, // Should increment from 2
          user_edited: true,
        })
      );
    });

    it('should maintain audit trail throughout workflow', async () => {
      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');

      await enhanceIncidentNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      // Verify AI request logging
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          correlation_id: expect.stringMatching(/^enhance_\d+_[a-z0-9]+$/),
          operation: 'enhanceIncidentNarrative',
          model: expect.any(String),
          input_data: expect.any(Object),
          output_data: expect.any(Object),
          processing_time_ms: expect.any(Number),
          success: true,
          user_id: 'user_123',
          incident_id: 'incident_123',
        })
      );

      // Verify prompt usage tracking
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          prompt_name: 'enhance_narrative',
          response_time_ms: expect.any(Number),
          success: true,
        })
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock AI service failure scenario
      mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
        if (fn.toString().includes('promptManager.getActivePrompt')) {
          throw new Error('AI service temporarily unavailable');
        }
        return Promise.resolve(completeIncidentData.incident);
      });

      const { enhanceIncidentNarrative } = require('@/convex/aiEnhancement');
      
      const result = await enhanceIncidentNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      // Should fallback to mock enhancement and still succeed
      expect(result.success).toBe(true);
      expect(result.enhanced_content).toContain('BEFORE EVENT');
      expect(result.ai_model_used).toBe('mock-service');
    });

    it('should prevent submission of incomplete workflows', async () => {
      const { submitIncidentForAnalysis } = require('@/convex/aiEnhancement');

      // Mock validation failure
      mockCtx.runQuery.mockImplementation((fn: any, args: any) => {
        if (fn.toString().includes('validateWorkflowCompletion')) {
          return Promise.resolve({
            allComplete: false,
            missing_requirements: ['enhancement_complete'],
          });
        }
        return Promise.resolve(completeIncidentData.incident);
      });
      
      await expect(submitIncidentForAnalysis.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
      })).rejects.toThrow('Workflow incomplete. Missing: enhancement_complete');
    });

    it('should handle database errors during submission', async () => {
      mockCtx.db.patch.mockRejectedValue(new Error('Database connection failed'));

      const { submitIncidentForAnalysis } = require('@/convex/aiEnhancement');
      
      await expect(submitIncidentForAnalysis.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
      })).rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should preserve original content throughout enhancement process', async () => {
      const { enhanceIncidentNarrative, getEnhancedNarrative } = require('@/convex/aiEnhancement');

      // Generate enhancement
      await enhanceIncidentNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      // Retrieve and verify original content preservation
      const enhanced = await getEnhancedNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
      });

      expect(enhanced.enhanced_content).toContain('Client was calm and engaged in group activities');
      expect(enhanced.enhanced_content).toContain('Client became agitated when another participant raised their voice');
      expect(enhanced.enhanced_content).toContain('Client left the room and was followed by support staff');
      expect(enhanced.enhanced_content).toContain('Client was provided with one-on-one support and gradually calmed down');
    });

    it('should maintain version history for enhanced narratives', async () => {
      const { updateEnhancedNarrative } = require('@/convex/aiEnhancement');

      // First edit
      await updateEnhancedNarrative.handler(mockCtx, {
        sessionToken: 'valid_token',
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
        user_edited_content: 'First edit version',
      });

      expect(mockCtx.db.patch).toHaveBeenCalledWith('enhanced_123', 
        expect.objectContaining({
          enhancement_version: 2,
          user_edited: true,
          user_edits: 'First edit version',
        })
      );
    });

    it('should ensure workflow handoff data consistency', async () => {
      const { submitIncidentForAnalysis } = require('@/convex/aiEnhancement');

      await submitIncidentForAnalysis.handler(mockCtx, {
        sessionToken: 'valid_token',
        incident_id: 'incident_123' as Id<'incidents'>,
        enhanced_narrative_id: 'enhanced_123' as Id<'enhanced_narratives'>,
      });

      // Verify handoff data includes all necessary information
      expect(mockCtx.db.insert).toHaveBeenCalledWith('workflow_handoffs', 
        expect.objectContaining({
          incident_id: 'incident_123',
          from_workflow: 'incident_capture',
          to_workflow: 'incident_analysis',
          handoff_data: expect.objectContaining({
            enhanced_narrative_id: 'enhanced_123',
            submitted_by: 'user_123',
            completion_checklist: expect.objectContaining({
              metadata_complete: true,
              narratives_complete: true,
              clarifications_complete: true,
              enhancement_complete: true,
              validation_passed: true,
            }),
          }),
        })
      );
    });
  });
});