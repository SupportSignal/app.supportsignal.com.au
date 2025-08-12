// TypeScript interfaces for prompt template management system

import { Id } from '../../convex/_generated/dataModel';

// Core prompt template interfaces
export interface AIPromptTemplate {
  _id: Id<"ai_prompt_templates">;
  name: string;
  description: string;
  category: 'clarification_questions' | 'narrative_enhancement' | 'general';
  prompt_template: string;
  variables: PromptVariable[];
  version: number;
  is_active: boolean;
  created_by: Id<"users">;
  created_at: number;
  updated_at: number;
}

export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default_value?: string;
}

// Prompt resolution interfaces
export interface PromptResolution {
  templateId: Id<"ai_prompt_templates">;
  templateName: string;
  category: string;
  resolvedPrompt: string;
  variablesUsed: Record<string, any>;
  errors: string[];
  processingTimeMs: number;
}

export interface PromptValidation {
  syntaxErrors: string[];
  templateErrors: string[];
  extractedVariables: string[];
  estimatedComplexity: number;
  isValid: boolean;
}

// Usage logging interfaces
export interface PromptUsageLog {
  _id: Id<"prompt_usage_logs">;
  prompt_template_id: Id<"ai_prompt_templates">;
  user_id?: Id<"users">;
  company_id: Id<"companies">;
  usage_context: string;
  variables_used: Record<string, any>;
  resolved_prompt: string;
  ai_model_used?: string;
  error_message?: string;
  processing_time_ms: number;
  created_at: number;
}

// Form interfaces for admin UI
export interface CreatePromptTemplateForm {
  name: string;
  description: string;
  category: 'clarification_questions' | 'narrative_enhancement' | 'general';
  prompt_template: string;
  variables: PromptVariable[];
}

export interface UpdatePromptTemplateForm {
  template_id: Id<"ai_prompt_templates">;
  prompt_template?: string;
  variables?: PromptVariable[];
  description?: string;
  is_active?: boolean;
}

export interface VariableFormData {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default_value: string;
}

// Default template interfaces
export interface DefaultTemplate {
  name: string;
  description: string;
  category: 'clarification_questions' | 'narrative_enhancement' | 'general';
  variableCount: number;
}

export interface DefaultTemplatesInfo {
  templates: DefaultTemplate[];
  validation: {
    isValid: boolean;
    errors: string[];
  };
  totalTemplates: number;
}

export interface SeedingResult {
  message: string;
  results: Array<{
    name: string;
    action: string;
    templateId?: string;
  }>;
  totalProcessed: number;
  created: number;
  skipped: number;
}

// UI state interfaces
export interface PromptTemplateListState {
  templates: AIPromptTemplate[];
  loading: boolean;
  error?: string;
  selectedTemplate?: AIPromptTemplate;
  filterCategory?: string;
  searchTerm?: string;
}

export interface PromptTemplateFormState {
  isEditing: boolean;
  template?: AIPromptTemplate;
  formData: CreatePromptTemplateForm;
  validation?: PromptValidation;
  preview?: PromptResolution;
  loading: boolean;
  errors: string[];
}

export interface VariableEditorState {
  variables: PromptVariable[];
  editingIndex?: number;
  newVariable?: VariableFormData;
  errors: Record<string, string>;
}

// Constants as types
export type TemplateCategory = 'clarification_questions' | 'narrative_enhancement' | 'general';
export type VariableType = 'string' | 'number' | 'boolean';

export const TEMPLATE_CATEGORIES = [
  'clarification_questions',
  'narrative_enhancement', 
  'general'
] as const;

export const VARIABLE_TYPES = [
  'string',
  'number', 
  'boolean'
] as const;

// Template category display mapping
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'clarification_questions': 'Clarification Questions',
  'narrative_enhancement': 'Narrative Enhancement',
  'general': 'General'
};

// Variable type display mapping
export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  'string': 'Text',
  'number': 'Number',
  'boolean': 'True/False'
};

// Error handling types
export type PromptTemplateErrorCode = 
  | 'VALIDATION_ERROR'
  | 'RESOLUTION_ERROR' 
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'DUPLICATE_NAME'
  | 'INVALID_VARIABLES';

export interface PromptTemplateError {
  code: PromptTemplateErrorCode;
  message: string;
  details?: any;
}

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: PromptTemplateError;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Export utility type for template selection
export type TemplateSelector = {
  value: Id<"ai_prompt_templates">;
  label: string;
  category: TemplateCategory;
  description?: string;
};