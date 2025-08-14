// @ts-nocheck
import { jest } from '@jest/globals';

/**
 * Comprehensive AI Service Mocks for Story 3.3 Testing
 * 
 * Provides configurable mock responses for AI enhancement features
 * with realistic scenarios, error simulation, and performance tracking.
 */

export interface AIEnhancementRequest {
  original_narratives: {
    before_event: string;
    during_event: string;
    end_event: string;
    post_event: string;
  };
  clarification_responses: Array<{
    question_text: string;
    answer_text: string;
    phase: string;
  }>;
}

export interface AIEnhancementResponse {
  enhanced_content: string;
  quality_score?: number;
  processing_time_ms?: number;
  tokens_used?: number;
  cost_estimate?: number;
}

export class AIEnhancementServiceMock {
  private config = {
    error_rate: 0, // 0-1, probability of errors
    processing_delay_ms: 2000, // Simulated processing time
    quality_score_range: [0.8, 0.95], // Min/max quality scores
    enable_caching: true,
    cache_hit_rate: 0.3, // 30% cache hits
  };

  private cache = new Map<string, AIEnhancementResponse>();
  private requestHistory: Array<{
    request: AIEnhancementRequest;
    response: AIEnhancementResponse;
    timestamp: number;
    success: boolean;
    error?: string;
  }> = [];

  /**
   * Configure mock behavior
   */
  configure(options: Partial<typeof this.config>) {
    this.config = { ...this.config, ...options };
  }

  /**
   * Reset mock state
   */
  reset() {
    this.cache.clear();
    this.requestHistory = [];
    this.config = {
      error_rate: 0,
      processing_delay_ms: 2000,
      quality_score_range: [0.8, 0.95],
      enable_caching: true,
      cache_hit_rate: 0.3,
    };
  }

  /**
   * Generate enhanced narrative from request
   */
  async enhanceNarrative(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.config.processing_delay_ms));

    // Check for configured errors
    if (Math.random() < this.config.error_rate) {
      const error = 'AI service temporarily unavailable';
      this.requestHistory.push({
        request,
        response: {} as AIEnhancementResponse,
        timestamp: Date.now(),
        success: false,
        error,
      });
      throw new Error(error);
    }

    // Check cache if enabled
    const cacheKey = this.generateCacheKey(request);
    if (this.config.enable_caching && Math.random() < this.config.cache_hit_rate) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        this.requestHistory.push({
          request,
          response: { ...cachedResponse, processing_time_ms: Date.now() - startTime },
          timestamp: Date.now(),
          success: true,
        });
        return { ...cachedResponse, processing_time_ms: Date.now() - startTime };
      }
    }

    // Generate enhanced content
    const response = this.generateEnhancedContent(request);
    response.processing_time_ms = Date.now() - startTime;

    // Cache the response
    if (this.config.enable_caching) {
      this.cache.set(cacheKey, response);
    }

    // Record request
    this.requestHistory.push({
      request,
      response,
      timestamp: Date.now(),
      success: true,
    });

    return response;
  }

  /**
   * Generate realistic enhanced content
   */
  private generateEnhancedContent(request: AIEnhancementRequest): AIEnhancementResponse {
    const { original_narratives, clarification_responses } = request;
    
    // Apply grammar fixes and formatting to original narratives
    const enhancedNarratives = Object.entries(original_narratives)
      .map(([phase, content]) => {
        if (!content || !content.trim()) return '';
        
        // Basic grammar fixes
        let enhanced = content.trim();
        enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
        if (!/[.!?]$/.test(enhanced)) {
          enhanced += '.';
        }
        
        // Add markdown-style formatting
        const phaseTitle = phase.replace('_', ' ').toUpperCase();
        return `**${phaseTitle}**: ${enhanced}`;
      })
      .filter(content => content.length > 0)
      .join('\n\n');

    // Process clarification responses
    const qaContent = clarification_responses
      .filter(qa => qa.answer_text && qa.answer_text.trim().length > 0)
      .map(qa => {
        let answer = qa.answer_text.trim();
        answer = answer.charAt(0).toUpperCase() + answer.slice(1);
        if (!/[.!?]$/.test(answer)) {
          answer += '.';
        }
        return `**Q: ${qa.question_text}**\nA: ${answer}`;
      })
      .join('\n\n');

    // Combine content
    let enhanced_content = enhancedNarratives;
    if (qaContent.length > 0) {
      enhanced_content += '\n\n**ADDITIONAL CLARIFICATIONS**\n\n' + qaContent;
    }

    // Generate quality score
    const [minScore, maxScore] = this.config.quality_score_range;
    const quality_score = minScore + Math.random() * (maxScore - minScore);

    // Estimate tokens and cost (realistic simulation)
    const tokens_used = Math.floor(enhanced_content.length / 4 * (0.8 + Math.random() * 0.4));
    const cost_estimate = tokens_used * 0.00002; // $0.02 per 1K tokens

    return {
      enhanced_content,
      quality_score: Math.round(quality_score * 100) / 100,
      tokens_used,
      cost_estimate: Math.round(cost_estimate * 10000) / 10000,
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIEnhancementRequest): string {
    return Buffer.from(JSON.stringify(request)).toString('base64');
  }

  /**
   * Get request statistics
   */
  getStats() {
    const total = this.requestHistory.length;
    const successful = this.requestHistory.filter(r => r.success).length;
    const failed = total - successful;
    const avgProcessingTime = this.requestHistory
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.response.processing_time_ms || 0), 0) / successful || 0;

    return {
      total_requests: total,
      successful_requests: successful,
      failed_requests: failed,
      success_rate: total > 0 ? successful / total : 0,
      average_processing_time_ms: Math.round(avgProcessingTime),
      cache_hits: this.cache.size,
    };
  }

  /**
   * Get request history for debugging
   */
  getRequestHistory() {
    return [...this.requestHistory];
  }

  /**
   * Simulate specific scenarios
   */
  simulateScenario(scenario: 'high_load' | 'service_degradation' | 'cache_warming' | 'perfect_conditions') {
    switch (scenario) {
      case 'high_load':
        this.configure({
          processing_delay_ms: 8000,
          error_rate: 0.1,
          quality_score_range: [0.7, 0.9],
        });
        break;
      
      case 'service_degradation':
        this.configure({
          processing_delay_ms: 15000,
          error_rate: 0.3,
          quality_score_range: [0.6, 0.8],
        });
        break;
      
      case 'cache_warming':
        this.configure({
          cache_hit_rate: 0.8,
          processing_delay_ms: 500,
          error_rate: 0,
        });
        break;
      
      case 'perfect_conditions':
        this.configure({
          processing_delay_ms: 1000,
          error_rate: 0,
          quality_score_range: [0.9, 0.98],
          cache_hit_rate: 0.5,
        });
        break;
    }
  }
}

/**
 * Sample test data for consistent testing
 */
export const SampleTestData = {
  completeIncident: {
    original_narratives: {
      before_event: 'Client was calm and engaged in group activities',
      during_event: 'Client became agitated when another participant raised their voice',
      end_event: 'Client left the room and was followed by support staff',
      post_event: 'Client was provided with one-on-one support and gradually calmed down',
    },
    clarification_responses: [
      {
        question_text: 'What specific trigger caused the client\'s agitation?',
        answer_text: 'Another participant raised their voice during group discussion',
        phase: 'during_event',
      },
      {
        question_text: 'How long did the one-on-one support session last?',
        answer_text: 'Approximately 15 minutes until the client was completely calm',
        phase: 'post_event',
      },
      {
        question_text: 'Were there any warning signs before the incident?',
        answer_text: 'The client seemed slightly restless but was still participating',
        phase: 'before_event',
      },
    ],
  },
  
  partialIncident: {
    original_narratives: {
      before_event: 'client was calm',
      during_event: 'client became upset',
      end_event: '',
      post_event: 'support provided',
    },
    clarification_responses: [
      {
        question_text: 'What happened?',
        answer_text: 'loud noise',
        phase: 'during_event',
      },
    ],
  },
  
  emptyIncident: {
    original_narratives: {
      before_event: '',
      during_event: '',
      end_event: '',
      post_event: '',
    },
    clarification_responses: [],
  },
  
  longContentIncident: {
    original_narratives: {
      before_event: 'A'.repeat(500) + ' incident before event narrative',
      during_event: 'B'.repeat(750) + ' incident during event narrative',
      end_event: 'C'.repeat(300) + ' incident end event narrative',
      post_event: 'D'.repeat(400) + ' incident post event narrative',
    },
    clarification_responses: Array.from({ length: 10 }, (_, i) => ({
      question_text: `Question ${i + 1} about the incident with detailed context?`,
      answer_text: `Answer ${i + 1} ` + 'X'.repeat(200) + ' with extensive details',
      phase: ['before_event', 'during_event', 'end_event', 'post_event'][i % 4],
    })),
  },
};

/**
 * Expected enhancement outputs for test validation
 */
export const ExpectedOutputs = {
  completeIncident: {
    shouldContain: [
      '**BEFORE EVENT**: Client was calm and engaged in group activities.',
      '**DURING EVENT**: Client became agitated when another participant raised their voice.',
      '**END EVENT**: Client left the room and was followed by support staff.',
      '**POST EVENT**: Client was provided with one-on-one support and gradually calmed down.',
      '**ADDITIONAL CLARIFICATIONS**',
      '**Q: What specific trigger caused the client\'s agitation?**',
      'A: Another participant raised their voice during group discussion.',
      '**Q: How long did the one-on-one support session last?**',
      'A: Approximately 15 minutes until the client was completely calm.',
      '**Q: Were there any warning signs before the incident?**',
      'A: The client seemed slightly restless but was still participating.',
    ],
    qualityScoreRange: [0.8, 0.95],
    minTokens: 100,
    maxTokens: 500,
  },
  
  partialIncident: {
    shouldContain: [
      '**BEFORE EVENT**: Client was calm.',
      '**DURING EVENT**: Client became upset.',
      '**POST EVENT**: Support provided.',
      '**ADDITIONAL CLARIFICATIONS**',
      '**Q: What happened?**',
      'A: Loud noise.',
    ],
    shouldNotContain: [
      '**END EVENT**', // Empty content should be filtered
    ],
    qualityScoreRange: [0.6, 0.85],
  },
  
  emptyIncident: {
    shouldContain: [
      'No content available for enhancement',
    ],
    qualityScoreRange: [0.1, 0.3],
  },
};

/**
 * Create Jest mocks for testing
 */
export function createAIMocks() {
  const aiService = new AIEnhancementServiceMock();
  
  return {
    // Mock the enhance function
    enhanceIncidentNarrative: jest.fn().mockImplementation(async (request: AIEnhancementRequest) => {
      return await aiService.enhanceNarrative(request);
    }),
    
    // Mock Convex mutations and queries
    useMutation: jest.fn().mockReturnValue(
      jest.fn().mockImplementation(async (args: any) => {
        if (args.enhanced_narrative_id && args.user_edited_content) {
          return { success: true }; // updateEnhancedNarrative
        }
        if (args.incident_id && args.enhanced_narrative_id) {
          return { success: true, handoff_id: 'test_handoff_123' }; // submitIncidentForAnalysis
        }
        return { success: false };
      })
    ),
    
    useQuery: jest.fn().mockImplementation((queryName: string) => {
      if (queryName.includes('getEnhancedNarrative')) {
        return {
          _id: 'test_enhanced_123',
          enhanced_content: ExpectedOutputs.completeIncident.shouldContain.join('\n\n'),
          enhancement_version: 1,
          user_edited: false,
          quality_score: 0.92,
          processing_time_ms: 2500,
        };
      }
      if (queryName.includes('validateWorkflowCompletion')) {
        return {
          allComplete: true,
          checklist: {
            metadata_complete: true,
            narratives_complete: true,
            clarifications_complete: true,
            enhancement_complete: true,
            validation_passed: true,
          },
          missing_requirements: [],
        };
      }
      return null;
    }),
    
    // Service instance for configuration
    aiService,
    
    // Test data
    SampleTestData,
    ExpectedOutputs,
  };
}

/**
 * Test utilities for AI enhancement scenarios
 */
export class AIEnhancementTestUtils {
  static async runEnhancementScenario(
    service: AIEnhancementServiceMock,
    scenario: keyof typeof SampleTestData,
    expectedOutput: keyof typeof ExpectedOutputs
  ) {
    const request = SampleTestData[scenario];
    const expected = ExpectedOutputs[expectedOutput];
    
    const response = await service.enhanceNarrative(request);
    
    // Validate structure
    expect(response.enhanced_content).toBeDefined();
    expect(response.quality_score).toBeGreaterThanOrEqual(expected.qualityScoreRange[0]);
    expect(response.quality_score).toBeLessThanOrEqual(expected.qualityScoreRange[1]);
    
    // Validate content
    if (expected.shouldContain) {
      expected.shouldContain.forEach(text => {
        expect(response.enhanced_content).toContain(text);
      });
    }
    
    if (expected.shouldNotContain) {
      expected.shouldNotContain.forEach(text => {
        expect(response.enhanced_content).not.toContain(text);
      });
    }
    
    // Validate tokens if specified
    if (expected.minTokens) {
      expect(response.tokens_used).toBeGreaterThanOrEqual(expected.minTokens);
    }
    if (expected.maxTokens) {
      expect(response.tokens_used).toBeLessThanOrEqual(expected.maxTokens);
    }
    
    return response;
  }
  
  static validateEnhancementQuality(
    response: AIEnhancementResponse,
    originalRequest: AIEnhancementRequest
  ) {
    // Check grammar fixes were applied
    const sentences = response.enhanced_content.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        // Should start with capital letter
        expect(sentence.trim().charAt(0)).toMatch(/[A-Z]/);
      }
    });
    
    // Check original content is preserved
    Object.values(originalRequest.original_narratives).forEach(narrative => {
      if (narrative.trim()) {
        const baseContent = narrative.trim().toLowerCase();
        expect(response.enhanced_content.toLowerCase()).toContain(baseContent);
      }
    });
    
    // Check clarifications are included
    originalRequest.clarification_responses.forEach(qa => {
      if (qa.answer_text.trim()) {
        expect(response.enhanced_content).toContain(qa.question_text);
        expect(response.enhanced_content).toContain(qa.answer_text);
      }
    });
  }
  
  static createPerformanceTestSuite(service: AIEnhancementServiceMock) {
    return {
      async testConcurrency(requestCount: number = 10) {
        const requests = Array.from({ length: requestCount }, () => 
          SampleTestData.completeIncident
        );
        
        const startTime = Date.now();
        const responses = await Promise.all(
          requests.map(req => service.enhanceNarrative(req))
        );
        const totalTime = Date.now() - startTime;
        
        return {
          requestCount,
          totalTime,
          averageTime: totalTime / requestCount,
          allSuccessful: responses.every(r => r.enhanced_content?.length > 0),
          stats: service.getStats(),
        };
      },
      
      async testErrorRecovery(errorRate: number = 0.5) {
        service.configure({ error_rate: errorRate });
        
        const attempts = 20;
        let successes = 0;
        let failures = 0;
        
        for (let i = 0; i < attempts; i++) {
          try {
            await service.enhanceNarrative(SampleTestData.completeIncident);
            successes++;
          } catch (error) {
            failures++;
          }
        }
        
        return {
          attempts,
          successes,
          failures,
          actualErrorRate: failures / attempts,
          expectedErrorRate: errorRate,
        };
      },
    };
  }
}