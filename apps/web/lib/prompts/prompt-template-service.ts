// @ts-nocheck
// Client-side prompt template service for web application
// Integrates with Convex prompt management backend

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export interface PromptTemplate {
  _id: Id<"ai_prompt_templates">;
  name: string;
  description: string;
  category: 'clarification_questions' | 'narrative_enhancement' | 'general';
  prompt_template: string;
  variables: PromptVariable[];
  version: number;
  is_active: boolean;
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

export interface PromptResolution {
  templateId: Id<"ai_prompt_templates">;
  templateName: string;
  category: string;
  resolvedPrompt: string;
  variablesUsed: Record<string, any>;
  errors: string[];
  processingTimeMs: number;
}

export interface CreatePromptTemplateArgs {
  name: string;
  description: string;
  category: 'clarification_questions' | 'narrative_enhancement' | 'general';
  prompt_template: string;
  variables: PromptVariable[];
}

export interface UpdatePromptTemplateArgs {
  template_id: Id<"ai_prompt_templates">;
  prompt_template?: string;
  variables?: PromptVariable[];
  description?: string;
  is_active?: boolean;
}

// Hook for system admin to get all prompt templates
export function useSystemPromptTemplates(sessionToken?: string, category?: string) {
  return useQuery(api.promptTemplates.getSystemPromptTemplates, 
    sessionToken ? { 
      sessionToken, 
      ...(category ? { category } : {})
    } : 'skip'
  );
}

// Hook for getting active templates (any authenticated user)
export function useActivePromptTemplates(category?: string) {
  return useQuery(api.promptTemplates.getActivePromptTemplates, 
    category ? { category } : {}
  );
}

// Hook for getting single template (system admin only)
export function usePromptTemplate(sessionToken: string, templateId: Id<"ai_prompt_templates">) {
  return useQuery(api.promptTemplates.getPromptTemplate, { sessionToken, template_id: templateId });
}

// Hook for resolving prompt with variables (any authenticated user)
export function useResolvePrompt(templateName: string, variables: Record<string, any>) {
  return useQuery(api.promptTemplates.resolvePromptTemplate, {
    template_name: templateName,
    variables
  });
}

// Hook for template validation (system admin only)
export function useValidateTemplate(sessionToken: string, template: string, variables: PromptVariable[]) {
  return useQuery(api.promptTemplates.validatePromptTemplate, {
    sessionToken,
    template,
    variables
  });
}

// Hook for listing default templates (system admin only)
export function useDefaultTemplates(sessionToken?: string) {
  return useQuery(api.promptTemplates.listDefaultTemplates, 
    sessionToken ? { sessionToken } : 'skip'
  );
}

// Mutation hooks for template management (system admin only)
export function useCreatePromptTemplate() {
  return useMutation(api.promptTemplates.createPromptTemplate);
}

export function useUpdatePromptTemplate() {
  return useMutation(api.promptTemplates.updatePromptTemplate);
}

export function useDeletePromptTemplate() {
  return useMutation(api.promptTemplates.deletePromptTemplate);
}

export function useSeedDefaultPrompts() {
  return useMutation(api.promptTemplates.seedDefaultPrompts);
}

// Utility class for prompt template operations
export class PromptTemplateService {
  // Validate variable name format
  static validateVariableName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }

  // Extract variables from template text
  static extractVariables(template: string): string[] {
    const regex = /\{\{([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // Validate template syntax (client-side quick check)
  static validateTemplateSyntax(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for unmatched braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for empty variables
    if (template.includes('{{}}')) {
      errors.push('Empty variable placeholders found');
    }

    // Basic variable name validation
    const variableRegex = /\{\{([^}]*)\}\}/g;
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const varName = match[1].trim();
      if (varName && !/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*$/.test(varName)) {
        errors.push(`Invalid variable name format: ${varName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate sample variables for testing
  static generateSampleVariables(variables: PromptVariable[]): Record<string, any> {
    const sampleVars: Record<string, any> = {};

    for (const variable of variables) {
      if (variable.default_value !== undefined) {
        sampleVars[variable.name] = variable.default_value;
      } else {
        switch (variable.type) {
          case 'string':
            sampleVars[variable.name] = `sample_${variable.name}`;
            break;
          case 'number':
            sampleVars[variable.name] = 42;
            break;
          case 'boolean':
            sampleVars[variable.name] = true;
            break;
          default:
            sampleVars[variable.name] = 'sample_value';
        }
      }
    }

    return sampleVars;
  }

  // Format template for preview
  static formatTemplatePreview(template: string, maxLength: number = 200): string {
    if (template.length <= maxLength) {
      return template;
    }

    return template.substring(0, maxLength) + '...';
  }

  // Check if user has system admin role (from user context)
  static isSystemAdmin(userRole?: string): boolean {
    return userRole === 'system_admin';
  }

  // Get template category display name
  static getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'clarification_questions':
        return 'Clarification Questions';
      case 'narrative_enhancement':
        return 'Narrative Enhancement';
      case 'general':
        return 'General';
      default:
        return category;
    }
  }

  // Get variable type display name
  static getVariableTypeDisplayName(type: string): string {
    switch (type) {
      case 'string':
        return 'Text';
      case 'number':
        return 'Number';
      case 'boolean':
        return 'True/False';
      default:
        return type;
    }
  }
}

// Error types for better error handling
export class PromptTemplateError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION_ERROR' | 'RESOLUTION_ERROR' | 'ACCESS_DENIED' | 'NOT_FOUND',
    public details?: any
  ) {
    super(message);
    this.name = 'PromptTemplateError';
  }
}

// Constants for common template configurations
export const TEMPLATE_CATEGORIES = [
  { value: 'clarification_questions', label: 'Clarification Questions' },
  { value: 'narrative_enhancement', label: 'Narrative Enhancement' },
  { value: 'general', label: 'General' },
] as const;

export const VARIABLE_TYPES = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'True/False' },
] as const;

// Common variable definitions for incident workflow
export const COMMON_INCIDENT_VARIABLES: PromptVariable[] = [
  {
    name: 'participant_name',
    description: 'NDIS participant name',
    type: 'string',
    required: true,
  },
  {
    name: 'event_date_time',
    description: 'Date and time of incident',
    type: 'string',
    required: true,
  },
  {
    name: 'incident_location',
    description: 'Location where incident occurred',
    type: 'string',
    required: false,
    default_value: 'unspecified location'
  },
  {
    name: 'reporter_name',
    description: 'Name of person reporting incident',
    type: 'string',
    required: true,
  },
];