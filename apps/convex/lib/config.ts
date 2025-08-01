"use node";

/**
 * Environment configuration management for Convex backend
 * Implements AC 7: Environment-based configuration for API keys and model selection
 */

export interface LLMConfig {
  openRouterApiKey: string;
  defaultModel: string;
  fallbackModel: string;
  openAiApiKey?: string; // For embeddings
}

export interface VectorizeConfig {
  accountId?: string;
  apiToken?: string;
  databaseId?: string;
}

export interface AppConfig {
  llm: LLMConfig;
  vectorize: VectorizeConfig;
  environment: 'development' | 'production' | 'test';
}

/**
 * Get environment variable with validation
 */
function getEnvVar(key: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (required && (!value || value.trim().length === 0)) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Validate API key format (basic validation)
 */
function validateApiKey(key: string, keyName: string): void {
  if (!key || key.trim().length === 0) {
    throw new Error(`${keyName} cannot be empty`);
  }
  
  if (key.length < 10) {
    throw new Error(`${keyName} appears to be invalid (too short)`);
  }
  
  // Check for common placeholder values
  const placeholders = ['your_api_key_here', 'placeholder', 'test', 'dummy'];
  if (placeholders.some(placeholder => key.toLowerCase().includes(placeholder))) {
    throw new Error(`${keyName} appears to be a placeholder value`);
  }
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  
  // LLM Configuration
  const openRouterApiKey = getEnvVar('OPENROUTER_API_KEY', true);
  const defaultModel = getEnvVar('LLM_MODEL', false, 'anthropic/claude-3-haiku');
  const fallbackModel = getEnvVar('LLM_FALLBACK_MODEL', false, 'openai/gpt-4o-mini');
  const openAiApiKey = getEnvVar('OPENAI_API_KEY', false); // Optional for embeddings
  
  // Validate API keys
  validateApiKey(openRouterApiKey, 'OPENROUTER_API_KEY');
  if (openAiApiKey) {
    validateApiKey(openAiApiKey, 'OPENAI_API_KEY');
  }
  
  // Vectorize Configuration (optional for now)
  const vectorizeConfig: VectorizeConfig = {
    accountId: getEnvVar('CLOUDFLARE_ACCOUNT_ID', false),
    apiToken: getEnvVar('CLOUDFLARE_API_TOKEN', false),
    databaseId: getEnvVar('VECTORIZE_DATABASE_ID', false),
  };
  
  const config: AppConfig = {
    llm: {
      openRouterApiKey,
      defaultModel,
      fallbackModel,
      openAiApiKey,
    },
    vectorize: vectorizeConfig,
    environment,
  };
  
  // Log configuration (without sensitive data)
  // eslint-disable-next-line no-console
  console.log('Configuration loaded:', {
    environment,
    defaultModel,
    fallbackModel,
    hasOpenRouterKey: !!openRouterApiKey,
    hasOpenAiKey: !!openAiApiKey,
    hasVectorizeConfig: !!(vectorizeConfig.accountId && vectorizeConfig.apiToken),
  });
  
  return config;
}

/**
 * Get supported OpenRouter models with metadata
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  costPer1kTokens: number; // Approximate cost in USD
  contextWindow: number;
  recommended: boolean;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    costPer1kTokens: 0.00025,
    contextWindow: 200000,
    recommended: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    costPer1kTokens: 0.00015,
    contextWindow: 128000,
    recommended: true,
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    costPer1kTokens: 0.003,
    contextWindow: 200000,
    recommended: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    costPer1kTokens: 0.005,
    contextWindow: 128000,
    recommended: false,
  },
];

/**
 * Get model information by ID
 */
export function getModelInfo(modelId: string): ModelInfo | null {
  return SUPPORTED_MODELS.find(model => model.id === modelId) || null;
}

/**
 * Select best model for given requirements
 */
export function selectModel(
  requireHighQuality: boolean = false,
  maxCostPer1k: number = 0.001
): string {
  const availableModels = SUPPORTED_MODELS.filter(
    model => model.costPer1kTokens <= maxCostPer1k
  );
  
  if (requireHighQuality) {
    // Prefer Claude for high-quality responses
    const claude = availableModels.find(model => model.provider === 'Anthropic');
    if (claude) return claude.id;
  }
  
  // Default to most cost-effective recommended model
  const recommended = availableModels.find(model => model.recommended);
  return recommended?.id || 'anthropic/claude-3-haiku';
}

/**
 * Validate configuration at startup
 */
export function validateConfig(config: AppConfig): void {
  // Check required LLM configuration
  if (!config.llm.openRouterApiKey) {
    throw new Error('OpenRouter API key is required');
  }
  
  // Validate model IDs
  const defaultModelInfo = getModelInfo(config.llm.defaultModel);
  if (!defaultModelInfo) {
    // eslint-disable-next-line no-console
    console.warn(`Unknown default model: ${config.llm.defaultModel}`);
  }
  
  const fallbackModelInfo = getModelInfo(config.llm.fallbackModel);
  if (!fallbackModelInfo) {
    // eslint-disable-next-line no-console
    console.warn(`Unknown fallback model: ${config.llm.fallbackModel}`);
  }
  
  // Warn about missing optional configuration
  if (!config.vectorize.accountId || !config.vectorize.apiToken) {
    // eslint-disable-next-line no-console
    console.warn('Vectorize configuration incomplete - vector storage will use placeholders');
  }
  
  if (!config.llm.openAiApiKey) {
    // eslint-disable-next-line no-console
    console.warn('OpenAI API key not configured - embedding generation will be skipped');
  }
}

// Global configuration instance
let globalConfig: AppConfig | null = null;

/**
 * Get cached configuration or load from environment
 */
export function getConfig(): AppConfig {
  if (!globalConfig) {
    globalConfig = loadConfig();
    validateConfig(globalConfig);
  }
  return globalConfig;
}

/**
 * Reset configuration cache (useful for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}