// @ts-nocheck
import { jest } from '@jest/globals';

/**
 * Helper class for setting up Convex testing environment
 * Provides consistent mocking patterns for Convex database operations
 */
export class ConvexTestingHelper {
  /**
   * Create a mock Convex context for testing
   */
  createMockContext() {
    return {
      db: {
        get: jest.fn(),
        query: jest.fn(),
        insert: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
      },
      runQuery: jest.fn(),
      runMutation: jest.fn(),
      runAction: jest.fn(),
    };
  }

  /**
   * Create mock query builder for database operations
   */
  createMockQueryBuilder(mockData: any[] = []) {
    return {
      withIndex: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockData[0] || null),
          collect: jest.fn().mockResolvedValue(mockData),
          order: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockData[0] || null),
            collect: jest.fn().mockResolvedValue(mockData),
          }),
        }),
      }),
    };
  }

  /**
   * Setup common mock data for incident testing
   */
  setupIncidentMocks() {
    return {
      incident: {
        _id: 'incident_123',
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Community Center',
        event_date_time: 'March 15, 2025 at 2:30 PM',
        capture_status: 'in_progress',
        enhanced_narrative_id: undefined,
      },
      narratives: {
        _id: 'narratives_123',
        incident_id: 'incident_123',
        before_event: 'Client was calm and engaged in activities.',
        during_event: 'Client became agitated during group discussion.',
        end_event: 'Client left the room and was followed by staff.',
        post_event: 'Client was provided with one-on-one support.',
      },
      clarificationAnswers: [
        {
          _id: 'answer_1',
          incident_id: 'incident_123',
          question_text: 'What specific trigger caused the agitation?',
          answer_text: 'Another participant raised their voice during discussion.',
          phase: 'during_event',
        },
        {
          _id: 'answer_2',
          incident_id: 'incident_123',
          question_text: 'How long did the support session last?',
          answer_text: 'Approximately 15 minutes until client was calm.',
          phase: 'post_event',
        },
      ],
      user: {
        _id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'frontline_worker',
        sessionToken: 'valid_session_token',
      },
    };
  }

  /**
   * Setup mock AI responses for testing enhancement
   */
  setupAiMocks() {
    return {
      enhancementResponse: {
        enhanced_content: '**BEFORE EVENT**: Client was calm and engaged in activities.\n\n**DURING EVENT**: Client became agitated during group discussion.\n\n**ADDITIONAL CLARIFICATIONS**\n\n**Q: What specific trigger caused the agitation?**\nA: Another participant raised their voice during discussion.',
        quality_score: 0.85,
      },
      promptTemplate: {
        prompt_name: 'enhance_narrative',
        prompt_template: 'Enhance the narrative for {{participant_name}} incident at {{location}}.',
        ai_model: 'claude-3-sonnet',
        subsystem: 'incidents',
      },
    };
  }

  /**
   * Reset all mocks to clean state
   */
  resetMocks() {
    jest.clearAllMocks();
  }
}