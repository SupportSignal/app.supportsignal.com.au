// @ts-nocheck
/**
 * Test Setup for Incident Capture Workflow Tests
 * 
 * This setup file provides utilities and fixtures specifically for testing
 * the incident capture workflow and AI clarification systems.
 */

import { ConvexTestingHelper } from 'convex-test';
import { Id } from '@convex/_generated/dataModel';

// Test fixtures for incident workflow testing
export const testFixtures = {
  // Sample user data for different roles
  users: {
    frontlineWorker: {
      email: 'frontline@test.com',
      name: 'Test Frontline Worker',
      role: 'frontline_worker' as const,
      company_id: 'test-company' as Id<'companies'>,
      profile_image_url: null,
    },
    teamLead: {
      email: 'teamlead@test.com', 
      name: 'Test Team Lead',
      role: 'team_lead' as const,
      company_id: 'test-company' as Id<'companies'>,
      profile_image_url: null,
    },
  },

  // Sample incident data
  incidents: {
    basic: {
      participant_name: 'Test Participant',
      reporter_name: 'Test Reporter',
      event_date_time: '2024-01-15T10:30:00Z',
      location: 'Test Location - Main Hall',
      severity: 'medium' as const,
    },
    urgent: {
      participant_name: 'Urgent Test Participant',
      reporter_name: 'Urgent Test Reporter',
      event_date_time: new Date().toISOString(),
      location: 'Emergency Location - Crisis Room',
      severity: 'high' as const,
    },
  },

  // Sample narrative data
  narratives: {
    complete: {
      before_event: 'Comprehensive before event narrative describing the circumstances leading up to the incident. This includes environmental factors, participant mood, and any triggers that may have been present. The situation had been building over several hours with increasing agitation.',
      during_event: 'Detailed during event narrative explaining exactly what happened during the incident. This covers actions taken, responses observed, and the sequence of events as they unfolded. Staff intervention was required and multiple de-escalation techniques were attempted.',
      end_event: 'Thorough end event narrative describing how the incident was resolved and what factors contributed to bringing it to a close. This includes interventions that worked and participant responses. The situation was resolved through calm communication and removing triggers.',
      post_event: 'Complete post event narrative covering the immediate aftermath, support provided, and any follow-up actions taken. This includes monitoring of participant wellbeing and plan adjustments. Additional support strategies were implemented.',
    },
    partial: {
      before_event: 'Basic before event description.',
      during_event: 'Basic during event description.',
      end_event: '',
      post_event: '',
    },
  },

  // AI prompt templates
  prompts: {
    clarificationQuestions: {
      prompt_name: 'generate_clarification_questions',
      prompt_version: 'v1.0.0',
      prompt_template: `You are analyzing an incident narrative to generate clarification questions.

Context:
- Participant: {{participant_name}}
- Reporter: {{reporter_name}}
- Location: {{location}}
- Event Date: {{event_date_time}}

Current Phase: {{phase}}
Narrative Content: {{narrative_content}}

Generate 2-4 specific, open-ended clarification questions for the "{{phase}}" phase that would help gather additional details about:
- Environmental factors and conditions
- People involved and their actions
- Timeline and sequence of events
- Communication and responses
- Safety measures and interventions

Guidelines:
- Questions should be supportive and non-judgmental
- Focus on gathering facts, not assigning blame
- Use clear, simple language appropriate for post-incident stress
- Each question should elicit specific, actionable information
- Avoid leading questions

Return response as JSON:
{
  "questions": [
    {
      "question_id": "{{phase}}_q1",
      "question_text": "Specific question here?",
      "question_order": 1
    },
    {
      "question_id": "{{phase}}_q2", 
      "question_text": "Another specific question?",
      "question_order": 2
    }
  ]
}`,
      description: 'Generate phase-specific clarification questions for incident narratives',
      workflow_step: 'clarification_questions',
      subsystem: 'incidents',
      ai_model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.3,
      is_active: true,
    },
  },
};

// Helper functions for test setup
export const testHelpers = {
  /**
   * Create a user and return user ID and session token
   */
  async createUserWithSession(t: any, userData: any = testFixtures.users.frontlineWorker) {
    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        ...userData,
        _creationTime: Date.now(),
      });
    });

    const sessionToken = await t.run(async (ctx: any) => {
      const sessionId = await ctx.db.insert('sessions', {
        user_id: userId,
        session_token: `test-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });

    return { userId, sessionToken };
  },

  /**
   * Seed AI prompt templates required for testing
   */
  async seedPromptTemplates(t: any) {
    await t.run(async (ctx: any) => {
      await ctx.db.insert('ai_prompts', {
        ...testFixtures.prompts.clarificationQuestions,
        created_at: Date.now(),
      });
    });
  },

  /**
   * Create a complete incident with narrative for testing
   */
  async createCompleteIncident(t: any, sessionToken: string, options: {
    incidentData?: any;
    narrativeData?: any;
  } = {}) {
    const { api } = await import('@convex/_generated/api');
    
    const incidentData = options.incidentData || testFixtures.incidents.basic;
    const narrativeData = options.narrativeData || testFixtures.narratives.complete;

    // Create incident
    const incidentId = await t.mutation(api.incidents.createIncident, {
      sessionToken,
      ...incidentData,
      capture_status: 'draft',
    });

    // Add narrative
    await t.mutation(api.incidents.createIncidentNarrative, {
      sessionToken,
      incident_id: incidentId,
      ...narrativeData,
    });

    return incidentId;
  },

  /**
   * Clear all AI prompts (to reproduce the "No active prompt template found" error)
   */
  async clearPromptTemplates(t: any) {
    await t.run(async (ctx: any) => {
      const prompts = await ctx.db.query('ai_prompts').collect();
      for (const prompt of prompts) {
        await ctx.db.delete(prompt._id);
      }
    });
  },

  /**
   * Generate questions for all phases of an incident
   */
  async generateAllPhaseQuestions(t: any, sessionToken: string, incidentId: any, narrativeData: any) {
    const { api } = await import('@convex/_generated/api');
    const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
    
    const results = [];
    
    for (const phase of phases) {
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase,
        narrative_content: narrativeData[phase],
      });
      
      results.push({ phase, result });
    }
    
    return results;
  },

  /**
   * Submit answers to clarification questions
   */
  async submitTestAnswers(t: any, sessionToken: string, incidentId: any, questions: any[], phase: string) {
    const { api } = await import('@convex/_generated/api');
    
    const answers = [];
    
    for (let i = 0; i < Math.min(2, questions.length); i++) {
      const question = questions[i];
      const answerText = `Test answer for ${phase} question ${i + 1}: This is a detailed response providing specific information about the ${phase} phase of the incident.`;
      
      const result = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: question.question_id,
        answer_text: answerText,
        phase: phase as any,
      });
      
      answers.push({ question_id: question.question_id, result });
    }
    
    return answers;
  },

  /**
   * Assert workflow state transitions
   */
  async assertWorkflowState(t: any, sessionToken: string, incidentId: any, expectedState: {
    capture_status?: string;
    hasNarrative?: boolean;
    hasQuestions?: boolean;
  }) {
    const { api } = await import('@convex/_generated/api');
    
    const incident = await t.query(api.incidents.getDraftIncident, {
      sessionToken,
      incidentId,
    });
    
    if (expectedState.capture_status) {
      expect(incident.capture_status).toBe(expectedState.capture_status);
    }
    
    if (expectedState.hasNarrative !== undefined) {
      if (expectedState.hasNarrative) {
        expect(incident.narrative).toBeTruthy();
      } else {
        expect(incident.narrative).toBeFalsy();
      }
    }
    
    if (expectedState.hasQuestions) {
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });
      
      expect(allQuestions.length).toBeGreaterThan(0);
    }
  },
};

// Export convenience function for common test setup
export async function setupWorkflowTest(t: any, options: {
  userRole?: 'frontline_worker' | 'team_lead' | 'company_admin' | 'system_admin';
  seedPrompts?: boolean;
  createIncident?: boolean;
  addNarrative?: boolean;
} = {}) {
  const userData = options.userRole ? 
    { ...testFixtures.users.frontlineWorker, role: options.userRole } :
    testFixtures.users.frontlineWorker;
    
  const { userId, sessionToken } = await testHelpers.createUserWithSession(t, userData);
  
  if (options.seedPrompts !== false) {
    await testHelpers.seedPromptTemplates(t);
  }
  
  let incidentId = null;
  
  if (options.createIncident) {
    incidentId = await testHelpers.createCompleteIncident(t, sessionToken, {
      narrativeData: options.addNarrative ? testFixtures.narratives.complete : undefined,
    });
  }
  
  return {
    userId,
    sessionToken,
    incidentId,
  };
}
