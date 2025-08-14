// @ts-nocheck
// Client-side prompt service for web application
// Uses the ai_prompts system (not ai_prompt_templates)

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export interface PromptTemplate {
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

// Simple seeding result interface
export interface SeedingResult {
  message: string;
  promptIds: string[];
}

// Hook for seeding prompt templates using the correct ai_prompts system
export function useSeedDefaultPrompts() {
  return useMutation(api.promptManager.seedPromptTemplates);
}

// Hook for getting active prompt (correct system)
export function useActivePrompt(promptName: string, subsystem?: string) {
  return useQuery(api.promptManager.getActivePrompt, {
    prompt_name: promptName,
    ...(subsystem ? { subsystem } : {})
  });
}

// Hook for getting hardcoded default templates info
export function useDefaultTemplates(sessionToken?: string) {
  return useQuery(api.promptManager.listDefaultTemplates, 
    sessionToken ? { sessionToken } : 'skip'
  );
}

// Hook for clearing all prompts (requires SAMPLE_DATA permission)
export function useClearAllTemplates() {
  return useMutation(api.promptManager.clearAllPrompts);
}

// Hook for listing all prompts from database (for admin UI)
export function useAllPrompts(sessionToken?: string, subsystem?: string, activeOnly?: boolean) {
  return useQuery(api.promptManager.listAllPrompts, 
    sessionToken ? { 
      sessionToken, 
      ...(subsystem ? { subsystem } : {}),
      ...(activeOnly !== undefined ? { activeOnly } : {})
    } : 'skip'
  );
}

// Simple service utilities for the ai_prompts system
export class PromptService {
  // Format template for preview
  static formatTemplatePreview(template: string, maxLength: number = 200): string {
    if (template.length <= maxLength) {
      return template;
    }
    return template.substring(0, maxLength) + '...';
  }

  // Check if user has system admin role
  static isSystemAdmin(userRole?: string): boolean {
    return userRole === 'system_admin';
  }
}