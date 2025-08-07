// @ts-nocheck
/**
 * Test fixtures for AI service testing
 * Provides mock data for AI responses and test scenarios
 */

import { AIRequest, AIResponse } from '@/ai-service';
import { ProviderConfig } from '@/ai-multi-provider';

// Test correlation IDs for consistent testing
export const TEST_CORRELATION_IDS = {
  CLARIFICATION: 'ai-test-clarification-123456789',
  ENHANCE_NARRATIVE: 'ai-test-enhance-234567890',
  ANALYZE_CONDITIONS: 'ai-test-analyze-345678901',
  MOCK_ANSWERS: 'ai-test-mock-456789012',
};

// Mock incident data matching n8n workflow specifications
export const MOCK_INCIDENT_DATA = {
  participant_name: 'John Smith',
  reporter_name: 'Sarah Wilson',
  location: 'Community Day Program - Main Hall',
  event_datetime: '2024-01-15T14:30:00Z',
  incident_id: 'test-incident-id' as any,
  user_id: 'test-user-id' as any,
  before_event: 'Participant was participating in group activities and appeared calm.',
  during_event: 'An altercation occurred between participants during the scheduled activity.',
  end_of_event: 'Staff intervened and separated the participants. Situation was de-escalated.',
  post_event_support: 'Both participants received individual support and debriefing.',
  before_event_extra: 'Staff noted participant had missed morning medication.',
  during_event_extra: 'Other participants became agitated by the noise.',
  end_of_event_extra: 'Security was called but not required.',
  post_event_support_extra: 'Incident was documented and families notified.',
};

// Mock clarification answers
export const MOCK_CLARIFICATION_ANSWERS = [
  {
    question: 'What specific activity was taking place when the incident began?',
    answer: 'The participants were engaged in a group art therapy session, working on collaborative paintings.',
  },
  {
    question: 'Were there any warning signs before the altercation started?',
    answer: 'John appeared increasingly agitated and was having difficulty following instructions.',
  },
  {
    question: 'How long did the altercation last?',
    answer: 'The incident lasted approximately 3-4 minutes before staff intervention.',
  },
];

// Mock AI request templates
export const MOCK_AI_REQUESTS: Record<string, Partial<AIRequest>> = {
  CLARIFICATION: {
    correlationId: TEST_CORRELATION_IDS.CLARIFICATION,
    model: 'openai/gpt-4.1-nano',
    temperature: 0.7,
    maxTokens: 1000,
    metadata: {
      operation: 'generateClarificationQuestions',
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
    },
  },
  ENHANCE_NARRATIVE: {
    correlationId: TEST_CORRELATION_IDS.ENHANCE_NARRATIVE,
    model: 'openai/gpt-4.1-nano',
    temperature: 0.3,
    maxTokens: 800,
    metadata: {
      operation: 'enhanceNarrativeContent',
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
      phase: 'during_event',
      answers_count: 3,
    },
  },
  ANALYZE_CONDITIONS: {
    correlationId: TEST_CORRELATION_IDS.ANALYZE_CONDITIONS,
    model: 'openai/gpt-4.1-nano',
    temperature: 0.5,
    maxTokens: 1200,
    metadata: {
      operation: 'analyzeContributingConditions',
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
    },
  },
  MOCK_ANSWERS: {
    correlationId: TEST_CORRELATION_IDS.MOCK_ANSWERS,
    model: 'openai/gpt-4.1-nano',
    temperature: 0.8,
    maxTokens: 1000,
    metadata: {
      operation: 'generateMockAnswers',
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
      phase: 'during_event',
    },
  },
};

// Mock successful AI responses
export const MOCK_AI_RESPONSES: Record<string, AIResponse> = {
  CLARIFICATION_SUCCESS: {
    correlationId: TEST_CORRELATION_IDS.CLARIFICATION,
    content: JSON.stringify({
      before_event: [
        'What was the participant\'s mood like in the hour leading up to the incident?',
        'Were there any changes to the participant\'s routine that day?',
      ],
      during_event: [
        'What specific actions did the participant take during the altercation?',
        'How did other participants react to the situation?',
      ],
      end_of_event: [
        'What de-escalation techniques were used?',
        'How long did it take for the situation to be resolved?',
      ],
      post_event_support: [
        'What immediate support was provided to the participant?',
        'Were any follow-up actions planned?',
      ],
    }),
    model: 'openai/gpt-4.1-nano',
    tokensUsed: 245,
    processingTimeMs: 1250,
    cost: 0.00049,
    success: true,
  },
  ENHANCE_NARRATIVE_SUCCESS: {
    correlationId: TEST_CORRELATION_IDS.ENHANCE_NARRATIVE,
    content: `Q: What specific activity was taking place when the incident began?
A: The participants were engaged in a group art therapy session, working on collaborative paintings.

Q: Were there any warning signs before the altercation started?
A: John appeared increasingly agitated and was having difficulty following instructions.

Q: How long did the altercation last?
A: The incident lasted approximately 3-4 minutes before staff intervention.`,
    model: 'openai/gpt-4.1-nano',
    tokensUsed: 156,
    processingTimeMs: 890,
    cost: 0.000312,
    success: true,
  },
  ANALYZE_CONDITIONS_SUCCESS: {
    correlationId: TEST_CORRELATION_IDS.ANALYZE_CONDITIONS,
    content: `**Immediate Contributing Conditions**

### Missed Morning Medication
- Participant had missed their morning medication which may have affected emotional regulation
- This was noted by staff prior to the incident occurring

### Environmental Stressors
- Group activity environment with multiple participants created stimulation
- Noise from the altercation caused additional agitation among other participants

### Communication Challenges
- Participant was having difficulty following instructions during the art therapy session
- This may have contributed to increasing frustration levels`,
    model: 'openai/gpt-4.1-nano',
    tokensUsed: 278,
    processingTimeMs: 1450,
    cost: 0.000556,
    success: true,
  },
  MOCK_ANSWERS_SUCCESS: {
    correlationId: TEST_CORRELATION_IDS.MOCK_ANSWERS,
    content: JSON.stringify({
      answers: [
        {
          question_id: 'q1',
          question: 'What specific activity was taking place when the incident began?',
          answer: 'The participants were engaged in a group art therapy session, working on collaborative paintings using watercolors and brushes.',
        },
        {
          question_id: 'q2', 
          question: 'Were there any warning signs before the altercation started?',
          answer: 'Yes, John appeared increasingly agitated over the past 15 minutes. He was fidgeting with his materials and seemed frustrated when his painting wasn\'t turning out as expected.',
        },
      ],
    }),
    model: 'openai/gpt-4.1-nano',
    tokensUsed: 189,
    processingTimeMs: 1100,
    cost: 0.000378,
    success: true,
  },
  API_ERROR: {
    correlationId: 'test-error-correlation',
    content: '',
    model: 'openai/gpt-4.1-nano',
    processingTimeMs: 500,
    success: false,
    error: 'OpenRouter API error: 401 - Invalid API key',
  },
  NETWORK_ERROR: {
    correlationId: 'test-network-error',
    content: '',
    model: 'openai/gpt-4.1-nano',
    processingTimeMs: 3000,
    success: false,
    error: 'Network error: fetch failed',
  },
  INVALID_JSON: {
    correlationId: TEST_CORRELATION_IDS.CLARIFICATION,
    content: 'This is not valid JSON and should cause parsing errors',
    model: 'openai/gpt-4.1-nano',
    tokensUsed: 45,
    processingTimeMs: 750,
    cost: 0.00009,
    success: true,
  },
};

// Mock provider configurations
export const MOCK_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  OPENROUTER: {
    name: 'OpenRouter',
    apiKey: 'test-openrouter-key',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-4.1-nano', 'openai/gpt-4', 'openai/gpt-4o-mini'],
    priority: 1,
    enabled: true,
  },
  ANTHROPIC: {
    name: 'Anthropic',
    apiKey: 'test-anthropic-key',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    priority: 2,
    enabled: true,
  },
  DISABLED: {
    name: 'DisabledProvider',
    apiKey: 'test-disabled-key',
    baseUrl: 'https://disabled.example.com/v1',
    models: ['disabled-model'],
    priority: 3,
    enabled: false,
  },
};

// Mock processed prompt templates
export const MOCK_PROCESSED_PROMPTS = {
  CLARIFICATION: {
    name: 'generate_clarification_questions',
    version: 'v1.0.0',
    processedTemplate: `You are preparing clarification questions for a previously submitted narrative report.
The incident involved ${MOCK_INCIDENT_DATA.participant_name}, and was reported by ${MOCK_INCIDENT_DATA.reporter_name}.
The original event occurred on ${MOCK_INCIDENT_DATA.event_datetime} at ${MOCK_INCIDENT_DATA.location}.

<before_event>${MOCK_INCIDENT_DATA.before_event}</before_event>
<during_event>${MOCK_INCIDENT_DATA.during_event}</during_event>
<end_of_event>${MOCK_INCIDENT_DATA.end_of_event}</end_of_event>
<post_event_support>${MOCK_INCIDENT_DATA.post_event_support}</post_event_support>

Output your response as valid JSON...`,
    originalTemplate: 'Template with {{ participant_name }} variables...',
    substitutions: {
      participant_name: MOCK_INCIDENT_DATA.participant_name,
      reporter_name: MOCK_INCIDENT_DATA.reporter_name,
    },
    model: 'openai/gpt-4.1-nano',
    maxTokens: 1000,
    temperature: 0.7,
  },
};

// Mock rate limiting scenarios
export const RATE_LIMIT_SCENARIOS = {
  UNDER_LIMIT: {
    windowMs: 60000,
    maxRequests: 10,
    currentRequests: 5,
    expectedAllowed: true,
    expectedRemaining: 5,
  },
  AT_LIMIT: {
    windowMs: 60000,
    maxRequests: 10,
    currentRequests: 10,
    expectedAllowed: false,
    expectedRemaining: 0,
  },
  OVER_LIMIT: {
    windowMs: 60000,
    maxRequests: 10,
    currentRequests: 15,
    expectedAllowed: false,
    expectedRemaining: 0,
  },
};

// Mock cost tracking scenarios  
export const COST_TRACKING_SCENARIOS = {
  UNDER_BUDGET: {
    dailyLimit: 100,
    currentCost: 25.50,
    newRequestCost: 0.75,
    expectedWithinLimit: true,
    expectedRemaining: 73.75,
  },
  NEAR_BUDGET: {
    dailyLimit: 100,
    currentCost: 99.25,
    newRequestCost: 0.50,
    expectedWithinLimit: true,
    expectedRemaining: 0.25,
  },
  OVER_BUDGET: {
    dailyLimit: 100,
    currentCost: 100.50,
    newRequestCost: 0.25,
    expectedWithinLimit: false,
    expectedRemaining: -0.75,
  },
};

// Mock circuit breaker scenarios
export const CIRCUIT_BREAKER_SCENARIOS = {
  CLOSED_HEALTHY: {
    failureThreshold: 5,
    successThreshold: 3,
    currentFailures: 2,
    currentSuccesses: 0,
    state: 'CLOSED',
    canExecute: true,
  },
  OPEN_FAILING: {
    failureThreshold: 5,
    successThreshold: 3,
    currentFailures: 5,
    currentSuccesses: 0,
    state: 'OPEN',
    canExecute: false,
  },
  HALF_OPEN_TESTING: {
    failureThreshold: 5,
    successThreshold: 3,
    currentFailures: 5,
    currentSuccesses: 1,
    state: 'HALF_OPEN',
    canExecute: true,
  },
};

// Helper function to create mock fetch responses
export function createMockFetchResponse(data: any, status: number = 200, statusText: string = 'OK') {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  }) as Promise<Response>;
}

// Helper function to create mock Convex context
export function createMockConvexContext(overrides: any = {}) {
  return {
    runQuery: jest.fn(),
    runMutation: jest.fn(),
    db: {
      query: jest.fn(),
      get: jest.fn(),
      insert: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
    ...overrides,
  };
}

// Helper function to set up mock AI provider responses
export function setupMockAIProvider(responses: Record<string, any>) {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  return {
    mockSuccessfulResponse: (responseData: any) => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse({
        choices: [{ message: { content: responseData } }],
        usage: { total_tokens: 150 },
      }));
    },
    mockErrorResponse: (status: number, errorMessage: string) => {
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(errorMessage, status, 'Error'));
    },
    mockNetworkError: (errorMessage: string = 'Network error') => {
      mockFetch.mockRejectedValueOnce(new Error(errorMessage));
    },
  };
}