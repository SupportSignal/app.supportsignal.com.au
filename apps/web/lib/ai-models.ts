/**
 * Story 11.0: AI Model Cost Configuration
 *
 * Centralized model costs and metadata for cost estimation.
 * Costs are per 1M tokens (input/output combined estimate).
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  recommended: boolean;
  costPer1MTokens: number; // USD per 1M tokens (blended input/output)
  avgTokensPerPrompt: number; // Typical prompt size
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Highest quality, best for complex reasoning',
    recommended: true,
    costPer1MTokens: 15.0, // $15 per 1M tokens (estimate)
    avgTokensPerPrompt: 1000,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'High quality, multimodal capabilities',
    recommended: false,
    costPer1MTokens: 5.0, // $5 per 1M tokens
    avgTokensPerPrompt: 1000,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and cost-effective, good for simple tasks',
    recommended: false,
    costPer1MTokens: 0.15, // $0.15 per 1M tokens
    avgTokensPerPrompt: 800,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Excellent for writing and analysis',
    recommended: false,
    costPer1MTokens: 3.0, // $3 per 1M tokens
    avgTokensPerPrompt: 1000,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for straightforward tasks',
    recommended: false,
    costPer1MTokens: 0.25, // $0.25 per 1M tokens
    avgTokensPerPrompt: 800,
  },
];

/**
 * Calculate estimated cost per prompt execution
 */
export function calculatePromptCost(modelId: string, estimatedTokens?: number): number {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) return 0;

  const tokens = estimatedTokens ?? model.avgTokensPerPrompt;
  return (tokens / 1_000_000) * model.costPer1MTokens;
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Get model by ID
 */
export function getModel(modelId: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}
