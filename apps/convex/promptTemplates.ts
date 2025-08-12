import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { PromptResolver } from './lib/prompts/prompt_resolver';
import { DEFAULT_PROMPT_TEMPLATES, validateDefaultTemplates } from './lib/prompts/default_prompts';
import { requirePermission, PERMISSIONS, ROLES } from './permissions';

// Simple in-memory cache for frequently accessed templates
class TemplateCache {
  private cache: Map<string, { template: any; timestamp: number }> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return cached.template;
  }

  set(key: string, template: any) {
    this.cache.set(key, {
      template,
      timestamp: Date.now()
    });
  }

  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL_MS) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      totalCached: this.cache.size,
      validCount,
      expiredCount,
      ttlMs: this.TTL_MS
    };
  }
}

// Global cache instance
const templateCache = new TemplateCache();

// Helper function to validate system administrator access using established session pattern
async function validateSystemAdmin(ctx: any, sessionToken: string) {
  const { user } = await requirePermission(
    ctx,
    sessionToken,
    PERMISSIONS.SYSTEM_CONFIGURATION
  );

  if (user.role !== ROLES.SYSTEM_ADMIN) {
    throw new Error("System administrator privileges required.");
  }

  return user;
}

// Create new prompt template (system admin only)
export const createPromptTemplate = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("clarification_questions"),
      v.literal("narrative_enhancement"),
      v.literal("general")
    ),
    prompt_template: v.string(),
    variables: v.array(v.object({
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
      required: v.boolean(),
      default_value: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access
    const user = await validateSystemAdmin(ctx, args.sessionToken);

    // Check if template with this name already exists
    const existingTemplate = await ctx.db
      .query("ai_prompt_templates")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .unique();

    if (existingTemplate) {
      throw new Error(`Prompt template with name "${args.name}" already exists and is active`);
    }

    // Validate template variables
    const variableNames = new Set();
    for (const variable of args.variables) {
      if (variableNames.has(variable.name)) {
        throw new Error(`Duplicate variable name: ${variable.name}`);
      }
      variableNames.add(variable.name);

      // Basic validation of variable name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
        throw new Error(`Invalid variable name format: ${variable.name}. Must start with letter and contain only letters, numbers, and underscores.`);
      }
    }

    const now = Date.now();
    
    // Create new prompt template
    const templateId = await ctx.db.insert("ai_prompt_templates", {
      name: args.name,
      description: args.description,
      category: args.category,
      prompt_template: args.prompt_template,
      variables: args.variables,
      version: 1,
      is_active: true,
      created_by: user._id,
      created_at: now,
      updated_at: now,
    });

    return { templateId, message: "Prompt template created successfully" };
  }
});

// Update existing prompt template (system admin only)
export const updatePromptTemplate = mutation({
  args: {
    sessionToken: v.string(),
    template_id: v.id("ai_prompt_templates"),
    prompt_template: v.optional(v.string()),
    variables: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
      required: v.boolean(),
      default_value: v.optional(v.string()),
    }))),
    description: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access
    await validateSystemAdmin(ctx, args.sessionToken);

    // Get existing template
    const existingTemplate = await ctx.db.get(args.template_id);
    if (!existingTemplate) {
      throw new Error("Prompt template not found");
    }

    // Validate variables if provided
    if (args.variables) {
      const variableNames = new Set();
      for (const variable of args.variables) {
        if (variableNames.has(variable.name)) {
          throw new Error(`Duplicate variable name: ${variable.name}`);
        }
        variableNames.add(variable.name);

        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
          throw new Error(`Invalid variable name format: ${variable.name}`);
        }
      }
    }

    // Prepare update object
    const updates: any = {
      updated_at: Date.now(),
    };

    // Update version if content changed
    if (args.prompt_template && args.prompt_template !== existingTemplate.prompt_template) {
      updates.version = existingTemplate.version + 1;
      updates.prompt_template = args.prompt_template;
    }

    if (args.variables) {
      updates.variables = args.variables;
      // Increment version if variables changed
      if (JSON.stringify(args.variables) !== JSON.stringify(existingTemplate.variables)) {
        updates.version = (updates.version || existingTemplate.version) + 1;
      }
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    if (args.is_active !== undefined) {
      updates.is_active = args.is_active;
    }

    // Update template
    await ctx.db.patch(args.template_id, updates);

    // Invalidate cache for this template
    templateCache.invalidate(`active_template:${existingTemplate.name}`);

    return { message: "Prompt template updated successfully" };
  }
});

// Get all system prompt templates (system admin only)
export const getSystemPromptTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access
    await validateSystemAdmin(ctx, args.sessionToken);

    // Filter by category if provided
    const templates = args.category
      ? await ctx.db
          .query("ai_prompt_templates")
          .withIndex("by_category", (q) => q.eq("category", args.category as any))
          .collect()
      : await ctx.db.query("ai_prompt_templates").collect();

    // Sort by name for consistent ordering
    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }
});

// Get active prompt templates for runtime use (any authenticated user)
export const getActivePromptTemplates = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic authentication check - any authenticated user can access active templates
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    let templatesQuery = ctx.db.query("ai_prompt_templates")
      .withIndex("by_active", (q) => q.eq("is_active", true));

    const templates = await templatesQuery.collect();

    // Filter by category if provided
    const filteredTemplates = args.category 
      ? templates.filter(t => t.category === args.category)
      : templates;

    // Return minimal information for runtime use
    return filteredTemplates.map(template => ({
      _id: template._id,
      name: template.name,
      description: template.description,
      category: template.category,
      prompt_template: template.prompt_template,
      variables: template.variables,
      version: template.version,
    }));
  }
});

// Get single prompt template by ID
export const getPromptTemplate = query({
  args: {
    sessionToken: v.string(),
    template_id: v.id("ai_prompt_templates"),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access for full template details
    await validateSystemAdmin(ctx, args.sessionToken);

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Prompt template not found");
    }

    return template;
  }
});

// Delete prompt template (soft delete by setting inactive)
export const deletePromptTemplate = mutation({
  args: {
    sessionToken: v.string(),
    template_id: v.id("ai_prompt_templates"),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access
    await validateSystemAdmin(ctx, args.sessionToken);

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Prompt template not found");
    }

    // Soft delete by setting inactive
    await ctx.db.patch(args.template_id, {
      is_active: false,
      updated_at: Date.now(),
    });

    // Invalidate cache for this template
    templateCache.invalidate(`active_template:${template.name}`);

    return { message: "Prompt template deactivated successfully" };
  }
});

// Resolve prompt template with variables (any authenticated user)
export const resolvePromptTemplate = query({
  args: {
    template_name: v.string(),
    variables: v.any(), // Key-value pairs for substitution
    use_fallback: v.optional(v.boolean()), // Whether to use fallback if template not found
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Basic authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Try to get template from cache first
    const cacheKey = `active_template:${args.template_name}`;
    let template = templateCache.get(cacheKey);

    if (!template) {
      // Find active template by name
      template = await ctx.db
        .query("ai_prompt_templates")
        .withIndex("by_name", (q) => q.eq("name", args.template_name))
        .filter((q) => q.eq(q.field("is_active"), true))
        .unique();

      if (!template) {
        // Try fallback mechanism if enabled
        if (args.use_fallback) {
          const fallbackTemplate = await getFallbackTemplate(ctx, args.template_name);
          if (fallbackTemplate) {
            template = fallbackTemplate;
          }
        }

        if (!template) {
          throw new Error(`Active prompt template "${args.template_name}" not found and no fallback available`);
        }
      }

      // Cache the template for future use (if not a fallback)
      if (!template.is_fallback) {
        templateCache.set(cacheKey, template);
      }
    }

    // Resolve prompt with variables
    const resolution = PromptResolver.resolvePrompt(
      template.prompt_template,
      args.variables,
      template.variables
    );

    // Note: Usage logging would be handled by the caller (action/mutation)
    // since queries are read-only and cannot insert into the database

    return {
      templateId: template._id,
      templateName: template.name,
      category: template.category,
      resolvedPrompt: resolution.resolvedPrompt,
      variablesUsed: resolution.variablesUsed,
      errors: resolution.errors,
      processingTimeMs: resolution.processingTimeMs,
    };
  }
});

// Validate prompt template syntax and variables
export const validatePromptTemplate = query({
  args: {
    sessionToken: v.string(),
    template: v.string(),
    variables: v.array(v.object({
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
      required: v.boolean(),
      default_value: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // System admin validation
    await validateSystemAdmin(ctx, args.sessionToken);

    const analysis = PromptResolver.analyzeTemplate(args.template);
    const templateErrors = PromptResolver.validateTemplate(args.template, args.variables);

    return {
      syntaxErrors: analysis.syntaxErrors,
      templateErrors,
      extractedVariables: analysis.variables,
      estimatedComplexity: analysis.estimatedComplexity,
      isValid: analysis.syntaxErrors.length === 0 && templateErrors.length === 0,
    };
  }
});

// Seed default prompt templates (system admin only)
export const seedDefaultPrompts = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate system administrator access
    const user = await validateSystemAdmin(ctx, args.sessionToken);

    // Validate default templates first
    const validation = validateDefaultTemplates();
    if (!validation.isValid) {
      throw new Error(`Default templates validation failed: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const results: Array<{name: string; action: string; templateId?: string}> = [];

    // Process each default template
    for (const defaultTemplate of DEFAULT_PROMPT_TEMPLATES) {
      // Check if template already exists
      const existingTemplate = await ctx.db
        .query("ai_prompt_templates")
        .withIndex("by_name", (q) => q.eq("name", defaultTemplate.name))
        .filter((q) => q.eq(q.field("is_active"), true))
        .unique();

      if (existingTemplate) {
        results.push({
          name: defaultTemplate.name,
          action: "skipped - already exists"
        });
        continue;
      }

      // Create new template
      const templateId = await ctx.db.insert("ai_prompt_templates", {
        name: defaultTemplate.name,
        description: defaultTemplate.description,
        category: defaultTemplate.category,
        prompt_template: defaultTemplate.prompt_template,
        variables: defaultTemplate.variables,
        version: 1,
        is_active: true,
        created_by: user._id,
        created_at: now,
        updated_at: now,
      });

      results.push({
        name: defaultTemplate.name,
        action: "created",
        templateId: templateId
      });
    }

    // Clear cache after seeding to ensure fresh data
    if (results.some(r => r.action === "created")) {
      templateCache.invalidate(); // Clear entire cache
    }

    return {
      message: "Default prompt templates seeding completed",
      results,
      totalProcessed: DEFAULT_PROMPT_TEMPLATES.length,
      created: results.filter(r => r.action === "created").length,
      skipped: results.filter(r => r.action.includes("skipped")).length,
    };
  }
});

// List available default templates (system admin only)
export const listDefaultTemplates = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // System admin validation
    await validateSystemAdmin(ctx, args.sessionToken);

    const validation = validateDefaultTemplates();
    
    return {
      templates: DEFAULT_PROMPT_TEMPLATES.map(t => ({
        name: t.name,
        description: t.description,
        category: t.category,
        variableCount: t.variables.length,
      })),
      validation,
      totalTemplates: DEFAULT_PROMPT_TEMPLATES.length,
    };
  }
});

// Get cache statistics (system admin only)
export const getCacheStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // System admin validation
    await validateSystemAdmin(ctx, args.sessionToken);

    return templateCache.getStats();
  }
});

// Helper function to get fallback template when primary template is not found
async function getFallbackTemplate(ctx: any, templateName: string) {
  // Define fallback template mappings
  const fallbackMappings: Record<string, string> = {
    'generate_clarification_questions': 'clarification_questions_fallback',
    'enhance_narrative_content': 'narrative_enhancement_fallback',
    'analyze_contributing_conditions': 'general_analysis_fallback',
    'generate_mock_answers': 'general_mock_fallback'
  };

  const fallbackName = fallbackMappings[templateName];
  if (!fallbackName) {
    return null;
  }

  // Try to find the fallback template
  const fallbackTemplate = await ctx.db
    .query("ai_prompt_templates")
    .withIndex("by_name", (q: any) => q.eq("name", fallbackName))
    .filter((q: any) => q.eq(q.field("is_active"), true))
    .unique();

  if (fallbackTemplate) {
    // Mark as fallback for cache handling
    return {
      ...fallbackTemplate,
      is_fallback: true,
      original_name: templateName
    };
  }

  // If no named fallback found, create a basic emergency fallback
  return createEmergencyFallback(templateName);
}

// Create emergency fallback templates when all else fails
function createEmergencyFallback(templateName: string) {
  const emergencyFallbacks: Record<string, any> = {
    'generate_clarification_questions': {
      _id: 'fallback-001',
      name: 'emergency_clarification_questions',
      description: 'Emergency fallback for clarification questions',
      category: 'clarification_questions',
      prompt_template: 'Generate 2-3 clarification questions for the incident involving {{participant_name}} reported by {{reporter_name}} on {{event_date_time}} at {{incident_location}}.',
      variables: [
        { name: 'participant_name', description: 'NDIS participant name', type: 'string', required: true },
        { name: 'reporter_name', description: 'Name of person reporting', type: 'string', required: true },
        { name: 'event_date_time', description: 'Date and time of incident', type: 'string', required: true },
        { name: 'incident_location', description: 'Location of incident', type: 'string', required: false, default_value: 'unspecified location' }
      ],
      version: 1,
      is_active: true,
      is_fallback: true,
      original_name: templateName,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    'enhance_narrative_content': {
      _id: 'fallback-002',
      name: 'emergency_narrative_enhancement',
      description: 'Emergency fallback for narrative enhancement',
      category: 'narrative_enhancement',
      prompt_template: 'Enhance the following narrative for the {{phase}} phase: {{instruction}}. Additional context: {{narrative_facts}}',
      variables: [
        { name: 'phase', description: 'Incident phase', type: 'string', required: true },
        { name: 'instruction', description: 'Enhancement instruction', type: 'string', required: true },
        { name: 'narrative_facts', description: 'Additional narrative facts', type: 'string', required: false, default_value: 'No additional facts provided' }
      ],
      version: 1,
      is_active: true,
      is_fallback: true,
      original_name: templateName,
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  };

  const fallback = emergencyFallbacks[templateName];
  if (fallback) {
    return fallback;
  }

  // Ultimate fallback - generic template
  return {
    _id: 'fallback-generic',
    name: 'emergency_generic',
    description: 'Emergency generic fallback template',
    category: 'general',
    prompt_template: 'Process the following request: {{request_details}}',
    variables: [
      { name: 'request_details', description: 'Request details', type: 'string', required: true, default_value: 'No details provided' }
    ],
    version: 1,
    is_active: true,
    is_fallback: true,
    original_name: templateName,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}

// Clear template cache (system admin only)
export const clearCache = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // System admin validation
    await validateSystemAdmin(ctx, args.sessionToken);

    templateCache.invalidate();
    
    return { message: "Template cache cleared successfully" };
  }
});