// TypeScript interfaces for prompt management system (ai_prompts table)

import { Id } from '../../convex/_generated/dataModel';

// Core prompt interfaces (using ai_prompts table)
export interface AIPrompt {
  _id: Id<"ai_prompts">;
  prompt_name: string;
  prompt_version: string;
  prompt_template: string;
  description?: string;
  workflow_step?: string;
  subsystem?: string;
  ai_model?: string;
  is_active?: boolean;
  created_at: number;
}

// Simple interfaces for seeding functionality

// Simple template info for seeding interface
export interface DefaultTemplate {
  name: string;
  description: string;
  subsystem?: string;
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
  promptIds: string[];
}

export interface ClearResult {
  message: string;
  deletedCount: number;
  deletedTemplates: string[];
}

export interface ResetAndSeedResult {
  message: string;
  clearedCount: number;
  clearedTemplates: string[];
  seededCount: number;
  promptIds: string[];
}

// Template categories for filtering and organization
export const TEMPLATE_CATEGORIES = [
  'incidents',
  'general',
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

// Simple category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  'incidents': 'Incident Management',
  'general': 'General',
};

// Legacy interface name for backward compatibility with existing components
export interface AIPromptTemplate extends AIPrompt {
  // Add computed fields that the old system had
  name: string;
  category: TemplateCategory;
  variables: Array<{
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    default_value?: string;
  }>;
  version: number;
  updated_at: number;
  max_tokens?: number; // Available from AIPrompt but needs explicit declaration
  temperature?: number; // Available from AIPrompt but needs explicit declaration
}