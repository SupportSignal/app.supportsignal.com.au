// @ts-nocheck
/**
 * AI Service Mocking Patterns for Story 3.2 Testing
 * 
 * Provides comprehensive mocking patterns for AI-powered clarification system testing.
 * Includes realistic mock data, error scenarios, and performance simulation.
 */

import { ClarificationQuestion } from '@/types/clarification';

export interface MockAIResponse {
  success: boolean;
  questions?: any[];
  cached?: boolean;
  processing_time_ms?: number;
  correlation_id?: string;
  ai_model_used?: string;
  error?: string;
}

export interface MockAnswerResponse {
  success: boolean;
  metrics?: {
    character_count: number;
    word_count: number;
    is_complete: boolean;
  };
  error?: string;
}

/**
 * Mock question templates organized by phase for realistic testing
 */
export const MOCK_QUESTION_TEMPLATES = {
  before_event: [
    {
      template: "What was the participant's mood and behavior in the hour leading up to this incident?",
      followups: [
        "Were there any specific triggers or changes in routine?",
        "How was the participant interacting with staff and peers?",
        "Were there any signs of distress or discomfort that were observed?"
      ]
    },
    {
      template: "What activities or events occurred immediately before the incident?",
      followups: [
        "Was there a transition or change happening?",
        "Were there any environmental factors that might have contributed?",
        "What was the staffing situation at the time?"
      ]
    }
  ],
  
  during_event: [
    {
      template: "Can you describe the specific sequence of events as they unfolded?",
      followups: [
        "What was the participant's exact behavior and actions?",
        "How did staff respond initially?",
        "Were other participants or visitors involved or affected?"
      ]
    },
    {
      template: "What interventions or de-escalation techniques were attempted?",
      followups: [
        "Which techniques were effective or ineffective?",
        "How did the participant respond to different approaches?",
        "Were any safety measures or protocols activated?"
      ]
    }
  ],
  
  end_event: [
    {
      template: "How was the incident successfully de-escalated or resolved?",
      followups: [
        "What specific intervention finally worked?",
        "How long did it take for the participant to calm down?",
        "What was the participant's state when the incident ended?"
      ]
    },
    {
      template: "What factors contributed to bringing the incident to a close?",
      followups: [
        "Did the participant verbalize their feelings or needs?",
        "Were any comfort items or strategies particularly helpful?",
        "How did the environment change to support resolution?"
      ]
    }
  ],
  
  post_event: [
    {
      template: "What immediate support was provided to the participant after the incident?",
      followups: [
        "How long did recovery take?",
        "Were there any immediate follow-up actions needed?",
        "How did the participant express they were feeling?"
      ]
    },
    {
      template: "What plans were put in place to prevent similar incidents?",
      followups: [
        "Were any environmental or routine modifications needed?",
        "What information was communicated to the participant's family?",
        "Were there any referrals or additional supports arranged?"
      ]
    }
  ]
};

/**
 * Generates realistic mock questions for a given phase
 */
export function generateMockQuestions(
  phase: 'before_event' | 'during_event' | 'end_event' | 'post_event',
  narrativeContent: string,
  count: number = 3
): any[] {
  const templates = MOCK_QUESTION_TEMPLATES[phase];
  const questions: any[] = [];
  
  for (let i = 0; i < Math.min(count, templates.length + 2); i++) {
    const templateIndex = i % templates.length;
    const template = templates[templateIndex];
    
    questions.push({
      question_id: `${phase}_q${i + 1}`,
      question_text: i < templates.length 
        ? template.template 
        : template.followups[(i - templates.length) % template.followups.length],
      question_order: i + 1,
      phase,
      answered: false,
      answer_text: '',
      is_active: true,
    });
  }
  
  return questions;
}

/**
 * Mock AI service class for testing
 */
export class MockAIService {
  private cache: Map<string, any> = new Map();
  private processingDelay: number = 1000;
  private errorRate: number = 0;
  private shouldCache: boolean = true;
  
  constructor(options: {
    processingDelay?: number;
    errorRate?: number;
    shouldCache?: boolean;
  } = {}) {
    this.processingDelay = options.processingDelay ?? 1000;
    this.errorRate = options.errorRate ?? 0;
    this.shouldCache = options.shouldCache ?? true;
  }
  
  /**
   * Generate cache key for question generation
   */
  private getCacheKey(phase: string, narrativeContent: string): string {
    const contentHash = this.simpleHash(narrativeContent);
    return `${phase}_${contentHash}`;
  }
  
  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Simulate processing delay
   */
  private async simulateProcessing(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.processingDelay));
  }
  
  /**
   * Simulate random errors based on error rate
   */
  private maybeThrowError(): void {
    if (Math.random() < this.errorRate) {
      const errors = [
        'AI service temporarily unavailable',
        'Rate limit exceeded',
        'Invalid prompt template',
        'Network timeout',
        'No active prompt template found for clarification questions'
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
  }
  
  /**
   * Mock question generation
   */
  async generateClarificationQuestions(params: {
    phase: 'before_event' | 'during_event' | 'end_event' | 'post_event';
    narrative_content: string;
    incident_id: string;
  }): Promise<MockAIResponse> {
    const startTime = Date.now();
    
    this.maybeThrowError();
    
    const cacheKey = this.getCacheKey(params.phase, params.narrative_content);
    
    // Check cache
    if (this.shouldCache && this.cache.has(cacheKey)) {
      await this.simulateProcessing(); // Minimal delay for cache hit
      const cached = this.cache.get(cacheKey);
      return {
        ...cached,
        cached: true,
        processing_time_ms: Date.now() - startTime,
        correlation_id: `clarify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }
    
    await this.simulateProcessing();
    
    const questions = generateMockQuestions(params.phase, params.narrative_content);
    
    const response: MockAIResponse = {
      success: true,
      questions,
      cached: false,
      processing_time_ms: Date.now() - startTime,
      correlation_id: `clarify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ai_model_used: 'claude-3-haiku-20240307',
    };
    
    // Store in cache
    if (this.shouldCache) {
      this.cache.set(cacheKey, {
        success: response.success,
        questions: response.questions,
        ai_model_used: response.ai_model_used,
      });
    }
    
    return response;
  }
  
  /**
   * Mock answer submission
   */
  async submitAnswer(params: {
    question_id: string;
    answer_text: string;
  }): Promise<MockAnswerResponse> {
    this.maybeThrowError();
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Quick submission
    
    const wordCount = params.answer_text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      success: true,
      metrics: {
        character_count: params.answer_text.length,
        word_count: wordCount,
        is_complete: params.answer_text.length > 10,
      },
    };
  }
  
  /**
   * Mock answer generation for testing/demo purposes
   */
  async generateMockAnswers(params: {
    phase: 'before_event' | 'during_event' | 'end_event' | 'post_event';
    questions: any[];
  }): Promise<{ success: boolean; answers_generated: number }> {
    this.maybeThrowError();
    
    await this.simulateProcessing();
    
    const mockAnswers = {
      before_event: [
        "The participant was calm and engaged in morning activities. They completed their routine with minimal support and seemed in good spirits during breakfast.",
        "There were no warning signs observed. The participant was communicating clearly and had expressed excitement about the planned activities.",
        "The environment was normal with standard staffing levels. No unusual factors were present in the lead-up to the incident."
      ],
      during_event: [
        "The participant became agitated when asked to transition to a new activity. They raised their voice and refused to move, then pushed away from staff.",
        "Staff used calm verbal de-escalation and offered choices. They maintained safe distance while providing reassurance and offered comfort items.",
        "Other participants moved away from the area. Staff redirected them to maintain safety while continuing to focus on the distressed participant."
      ],
      end_event: [
        "The incident resolved when the participant accepted their comfort item and was able to communicate their feelings more clearly.",
        "A familiar staff member's calm presence and the quiet environment helped. The participant apologized and agreed to modified activities.",
        "It took approximately 10 minutes for the participant to fully regulate. They accepted water and moved to a calmer space willingly."
      ],
      post_event: [
        "The participant received 1:1 support for 30 minutes in a quiet area. They engaged in modified activities and regained composure completely.",
        "A sensory assessment was planned and family was notified. Future activities will include more transition warnings and sensory considerations.",
        "The participant rejoined group activities for lunch without issues. Documentation was completed and shared with the care team."
      ]
    };
    
    return {
      success: true,
      answers_generated: Math.min(params.questions.length, mockAnswers[params.phase].length),
    };
  }
  
  /**
   * Reset cache for testing
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Configure mock behavior for testing scenarios
   */
  configure(options: {
    processingDelay?: number;
    errorRate?: number;
    shouldCache?: boolean;
  }): void {
    if (options.processingDelay !== undefined) {
      this.processingDelay = options.processingDelay;
    }
    if (options.errorRate !== undefined) {
      this.errorRate = options.errorRate;
    }
    if (options.shouldCache !== undefined) {
      this.shouldCache = options.shouldCache;
    }
  }
  
  /**
   * Get cache statistics for testing
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Pre-configured mock service instances for common testing scenarios
 */
export const MockScenarios = {
  // Fast, reliable service for unit tests
  fast: () => new MockAIService({
    processingDelay: 50,
    errorRate: 0,
    shouldCache: true,
  }),
  
  // Realistic service for integration tests
  realistic: () => new MockAIService({
    processingDelay: 1500,
    errorRate: 0.02, // 2% error rate
    shouldCache: true,
  }),
  
  // Slow service for performance testing
  slow: () => new MockAIService({
    processingDelay: 5000,
    errorRate: 0,
    shouldCache: true,
  }),
  
  // Unreliable service for error handling tests
  unreliable: () => new MockAIService({
    processingDelay: 1000,
    errorRate: 0.3, // 30% error rate
    shouldCache: true,
  }),
  
  // Service without caching for cache testing
  noCache: () => new MockAIService({
    processingDelay: 1000,
    errorRate: 0,
    shouldCache: false,
  }),
};

/**
 * Utility function to create mock data for different test scenarios
 */
export function createMockTestData(scenario: 'minimal' | 'complete' | 'large' = 'complete') {
  const narratives = {
    minimal: {
      before_event: 'Brief before event description.',
      during_event: 'Brief during event description.',
      end_event: 'Brief end event description.',
      post_event: 'Brief post event description.',
    },
    
    complete: {
      before_event: `
        The participant had a good morning, completing their personal care routine independently. 
        They enjoyed breakfast and were looking forward to the planned craft activity. 
        Staff noted positive mood and clear communication.
      `.trim(),
      
      during_event: `
        The participant became upset during transition to craft room, raising their voice and refusing to move. 
        When staff offered encouragement, they pushed away and knocked over a chair. 
        They sat on the floor crying and expressed feeling overwhelmed.
      `.trim(),
      
      end_event: `
        A familiar staff member provided calm support while offering the participant's comfort item. 
        After 10 minutes, crying subsided and participant communicated feelings more clearly. 
        They accepted water and agreed to move to a quieter area.
      `.trim(),
      
      post_event: `
        Participant received 1:1 support for 30 minutes and engaged in modified craft activity. 
        They rejoined the group for lunch without issues. Family was notified and plan adjustments made.
      `.trim(),
    },
    
    large: {
      before_event: `
        The participant had an excellent start to their day, demonstrating independence in their morning routine. 
        They woke up naturally at their preferred time and engaged positively with staff during personal care support. 
        Throughout the morning hygiene routine, they followed each step independently with minimal verbal prompting. 
        Their mood appeared bright and they were chatting with staff about their plans for the day.
        
        During breakfast in the dining area, the participant sat with their usual peer group and actively participated 
        in conversation. They ate well, finishing most of their meal and expressing satisfaction with the food choices. 
        Staff observed positive social interactions, with the participant sharing jokes and asking questions about 
        other participants' weekend plans. Their communication was clear and appropriate for the social setting.
        
        After breakfast, the participant spent time in the common area engaging with various activities. 
        They read part of a magazine, watched some television, and had a brief conversation with a visiting family member 
        of another participant. Throughout this time, staff noted their relaxed body language and appropriate responses 
        to environmental changes such as other participants moving through the space.
      `.trim(),
      
      during_event: `
        [Large during event narrative would continue with extensive detail...]
      `.trim(),
      
      end_event: `
        [Large end event narrative would continue with extensive detail...]
      `.trim(),
      
      post_event: `
        [Large post event narrative would continue with extensive detail...]
      `.trim(),
    },
  };
  
  return narratives[scenario];
}

/**
 * Mock HTTP fetch responses for API testing
 */
export function createMockFetchResponses() {
  return {
    success: (data: any) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    }),
    
    error: (status: number, message: string) => Promise.resolve({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
    }),
    
    timeout: () => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 100)
    ),
  };
}