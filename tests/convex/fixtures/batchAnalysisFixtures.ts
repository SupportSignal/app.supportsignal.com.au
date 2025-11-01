/**
 * Story 11.1: Batch Analysis Test Fixtures
 *
 * Reusable test data for batch analysis testing
 */

export const dataSourceFixtures = {
  incident: {
    name: 'Test Incident Analysis',
    description: 'Analyze safety incidents',
    entity_type: 'incident' as const,
    config: {
      filter: { status: 'active', severity: ['medium', 'high'] },
      batchSize: 10,
      parallelism: 3,
    },
  },
  narrative: {
    name: 'Test Narrative Analysis',
    description: 'Enhance narrative quality',
    entity_type: 'narrative' as const,
    config: {
      filter: { has_timeline: true },
      batchSize: 5,
    },
  },
  moment: {
    name: 'Test Moment Analysis',
    description: 'Identify critical moments',
    entity_type: 'moment' as const,
    config: {
      filter: { significance: 'high' },
      batchSize: 20,
    },
  },
};

export const analysisPromptFixtures = {
  predicate: {
    prompt_name: 'Safety Critical Check',
    prompt_template: 'Is this incident safety-critical? Incident: {{incident_description}}',
    workflow_step: 'safety_check',
    execution_mode: 'batch_analysis' as const,
    prompt_type: 'predicate' as const,
    output_format: {
      type: 'object',
      properties: {
        is_safety_critical: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: { type: 'string' },
      },
      required: ['is_safety_critical', 'confidence'],
    },
    display_order: 1,
  },
  classification: {
    prompt_name: 'Severity Classification',
    prompt_template: 'Classify the severity of this incident: {{incident_description}}',
    workflow_step: 'severity_classification',
    execution_mode: 'batch_analysis' as const,
    prompt_type: 'classification' as const,
    output_format: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        category: {
          type: 'string',
          enum: ['equipment', 'procedural', 'environmental', 'human_factor'],
        },
        rationale: { type: 'string' },
      },
      required: ['severity', 'category'],
    },
    display_order: 2,
  },
  observation: {
    prompt_name: 'Key Observations',
    prompt_template: 'Identify 3-5 key observations from this incident: {{incident_description}}',
    workflow_step: 'observations',
    execution_mode: 'batch_analysis' as const,
    prompt_type: 'observation' as const,
    output_format: {
      type: 'object',
      properties: {
        observations: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 5,
        },
        patterns: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['observations'],
    },
    display_order: 3,
  },
  generation: {
    prompt_name: 'Follow-up Questions',
    prompt_template: 'Generate 5 clarifying questions for this incident: {{incident_description}}',
    workflow_step: 'question_generation',
    execution_mode: 'batch_analysis' as const,
    prompt_type: 'generation' as const,
    output_format: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              purpose: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['question', 'purpose'],
          },
          minItems: 5,
          maxItems: 5,
        },
      },
      required: ['questions'],
    },
    display_order: 4,
  },
};

export const singleModePromptFixtures = {
  enhancement: {
    prompt_name: 'Narrative Enhancement',
    prompt_template: 'Enhance this narrative for clarity: {{narrative_text}}',
    workflow_step: 'narrative_enhancement',
    execution_mode: 'single' as const,
    prompt_type: 'generation' as const,
    ai_model: 'gpt-4o',
    max_tokens: 4000,
    temperature: 0.7,
  },
  questionGeneration: {
    prompt_name: 'Clarification Questions',
    prompt_template: 'Generate clarifying questions for: {{context}}',
    workflow_step: 'incident_clarification',
    execution_mode: 'single' as const,
    prompt_type: 'generation' as const,
    ai_model: 'gpt-4o-mini',
    max_tokens: 2000,
    temperature: 0.3,
  },
};

export const executionResultFixtures = {
  predicate: {
    output: {
      is_safety_critical: true,
      confidence: 0.92,
      reasoning: 'Incident involves potential harm to personnel and equipment failure.',
    },
    tokens_used: 245,
    processing_time_ms: 1250,
    status: 'success' as const,
  },
  classification: {
    output: {
      severity: 'high',
      category: 'equipment',
      rationale: 'Critical equipment malfunction requiring immediate attention.',
    },
    tokens_used: 189,
    processing_time_ms: 980,
    status: 'success' as const,
  },
  observation: {
    output: {
      observations: [
        'Equipment showed warning signs 24h before failure',
        'Standard maintenance protocol was not followed',
        'Similar incident occurred 6 months ago',
        'No backup system was available',
        'Response time exceeded safety guidelines',
      ],
      patterns: ['maintenance_lapse', 'recurring_issue'],
    },
    tokens_used: 312,
    processing_time_ms: 1580,
    status: 'success' as const,
  },
  error: {
    output: null,
    tokens_used: 0,
    processing_time_ms: 0,
    status: 'error' as const,
    error_message: 'Rate limit exceeded - retry after 60s',
  },
};

export const analysisExecutionFixtures = {
  pending: {
    entity_id: 'incident_123',
    status: 'pending' as const,
    started_at: Date.now(),
    prompt_count: 4,
    correlation_id: 'exec_test_001',
  },
  running: {
    entity_id: 'incident_456',
    status: 'running' as const,
    started_at: Date.now() - 5000, // Started 5s ago
    prompt_count: 4,
    correlation_id: 'exec_test_002',
  },
  completed: {
    entity_id: 'incident_789',
    status: 'completed' as const,
    started_at: Date.now() - 60000, // Started 1min ago
    completed_at: Date.now() - 5000, // Completed 5s ago
    prompt_count: 4,
    correlation_id: 'exec_test_003',
  },
  failed: {
    entity_id: 'incident_999',
    status: 'failed' as const,
    started_at: Date.now() - 30000,
    completed_at: Date.now(),
    prompt_count: 4,
    correlation_id: 'exec_test_004',
  },
};

/**
 * Helper function to create minimal valid data source config
 */
export function createMinimalDataSource(entity_type: 'incident' | 'narrative' | 'moment') {
  return {
    name: `Minimal ${entity_type}`,
    entity_type,
    config: {},
  };
}

/**
 * Helper function to create minimal valid analysis prompt
 */
export function createMinimalAnalysisPrompt(prompt_type: 'generation' | 'predicate' | 'classification' | 'observation') {
  return {
    prompt_name: `Minimal ${prompt_type}`,
    prompt_template: 'Test template',
    workflow_step: 'test',
    execution_mode: 'batch_analysis' as const,
    prompt_type,
  };
}

/**
 * Sample incident data for testing templates
 */
export const sampleIncidentData = {
  incident_description: 'Worker slipped on wet floor in warehouse sector B, no injuries reported but could have been serious.',
  incident_id: 'INC-2025-001',
  severity: 'medium',
  location: 'Warehouse B',
  timestamp: '2025-11-01T10:30:00Z',
};

/**
 * Sample narrative data for testing templates
 */
export const sampleNarrativeData = {
  narrative_text: 'The incident occurred during routine morning inspection when the worker noticed a leak from the overhead sprinkler system. Water had pooled on the floor without warning signage.',
  has_timeline: true,
  word_count: 32,
};

/**
 * Sample moment data for testing templates
 */
export const sampleMomentData = {
  moment_description: 'Worker realized floor was slippery only after beginning to slip',
  significance: 'high',
  timestamp_offset_ms: 5000,
};
