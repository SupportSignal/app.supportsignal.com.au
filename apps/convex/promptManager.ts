import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requirePermission, PERMISSIONS } from "./permissions";
import { ConvexError } from "convex/values";
import { getConfig } from "./lib/config";

// Process template with variable substitution (moved from aiPromptTemplates.ts)
export function processTemplate(template: string, variables: Record<string, any>): {
  processedTemplate: string;
  substitutions: Record<string, string>;
} {
  const substitutions: Record<string, string> = {};
  
  // Replace {{ variable }} patterns with actual values
  const processedTemplate = template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    if (variables.hasOwnProperty(trimmedName)) {
      const value = String(variables[trimmedName] || '');
      substitutions[trimmedName] = value;
      return value;
    } else {
      // Keep placeholder if variable not provided
      substitutions[trimmedName] = match;
      return match;
    }
  });

  return {
    processedTemplate,
    substitutions,
  };
}

// Get active prompt template by name
export const getActivePrompt = query({
  args: {
    prompt_name: v.string(),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, { prompt_name, subsystem }) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", prompt_name))
      .filter((q) =>
        q.and(
          q.eq(q.field("is_active"), true),
          subsystem ? q.eq(q.field("subsystem"), subsystem) : true
        )
      )
      .order("desc")
      .first();

    return prompt;
  },
});

// Get processed prompt with variable substitution (replaces aiPromptTemplates.getProcessedPrompt)
export const getProcessedPrompt = query({
  args: {
    prompt_name: v.string(),
    variables: v.any(),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.prompt_name))
      .filter((q) =>
        q.and(
          q.eq(q.field("is_active"), true),
          args.subsystem ? q.eq(q.field("subsystem"), args.subsystem) : true
        )
      )
      .order("desc")
      .first();

    if (!prompt) {
      throw new ConvexError(`Prompt not found: ${args.prompt_name}`);
    }

    const { processedTemplate, substitutions } = processTemplate(
      prompt.prompt_template,
      args.variables
    );

    // Get model from environment configuration (environment-first architecture)
    const config = getConfig();
    const modelToUse = config.llm.defaultModel;

    // Log model selection for transparency
    console.log("🔧 PROMPT MANAGER MODEL SELECTION", {
      prompt_name: prompt.prompt_name,
      database_model: prompt.ai_model,
      environment_model: modelToUse,
      using: "environment_configuration",
    });

    return {
      name: prompt.prompt_name,
      version: prompt.prompt_version,
      processedTemplate,
      originalTemplate: prompt.prompt_template,
      substitutions,
      model: modelToUse, // ✅ Use environment configuration instead of database
      maxTokens: prompt.max_tokens,
      temperature: prompt.temperature,
    };
  },
});

// Seed default prompt templates using hardcoded templates
export const seedPromptTemplates = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Use proper session token authentication
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA, // Seeding requires sample_data permission
      { errorMessage: 'Sample data permission required to seed prompt templates' }
    );

    const promptIds: string[] = [];
    const now = Date.now();

    // Check each default template and create if it doesn't exist
    for (const defaultPrompt of DEFAULT_PROMPTS) {
      const existingPrompt = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name", (q) => 
          q.eq("prompt_name", defaultPrompt.prompt_name)
        )
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      if (!existingPrompt) {
        // Create new prompt from default template
        const promptId = await ctx.db.insert("ai_prompts", {
          ...defaultPrompt,
          created_at: now,
        });
        promptIds.push(promptId);
      }
    }

    if (promptIds.length === 0) {
      return { 
        message: "All prompt templates already exist",
        promptIds: []
      };
    }

    return { 
      message: `Successfully seeded ${promptIds.length} prompt templates`,
      promptIds
    };
  },
});

// Update prompt usage statistics
export const updatePromptUsage = mutation({
  args: {
    prompt_name: v.string(),
    response_time_ms: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, { prompt_name, response_time_ms, success }) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", prompt_name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!prompt) return null;

    const currentUsage = prompt.usage_count || 0;
    const currentAverage = prompt.average_response_time || 0;
    const currentSuccessRate = prompt.success_rate || 1;

    // Calculate new running averages
    const newUsageCount = currentUsage + 1;
    const newAverageResponseTime = 
      (currentAverage * currentUsage + response_time_ms) / newUsageCount;
    
    const successCount = Math.round(currentSuccessRate * currentUsage) + (success ? 1 : 0);
    const newSuccessRate = successCount / newUsageCount;

    await ctx.db.patch(prompt._id, {
      usage_count: newUsageCount,
      average_response_time: newAverageResponseTime,
      success_rate: newSuccessRate,
    });

    return { updated: true };
  },
});

// Hardcoded default templates for seeding
const DEFAULT_PROMPTS = [
  {
    prompt_name: "generate_clarification_questions",
    prompt_version: "v1.0.0",
    prompt_template: `You are an expert incident analyst helping to gather additional details about an NDIS incident involving {{participantName}}.

**Incident Context:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**Current Narrative ({{phase}} phase):**
{{narrativeText}}

**Your Task:**
Generate 3-5 specific, focused clarification questions that would help gather additional important details about this incident. Focus on:
- Missing factual details that would improve understanding
- Context that could help prevent similar incidents
- Specific circumstances that aren't clear from the current narrative

**Requirements:**
- Questions should be clear and specific
- Avoid yes/no questions when possible
- Focus on actionable details
- Consider NDIS reporting requirements
- Be sensitive to the participant's needs and dignity

Generate questions as a JSON array with this format:
[
  {
    "question": "Your specific question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]`,
    description: "Generate clarification questions based on incident narrative to gather additional details",
    workflow_step: "clarification_questions",
    subsystem: "incidents",
    ai_model: "openai/gpt-5-nano",
    max_tokens: 1000,
    temperature: 0.3,
    is_active: true,
  },
  {
    prompt_name: "enhance_narrative",
    prompt_version: "v1.0.0", 
    prompt_template: `You are an expert NDIS incident documentation specialist. 

**Phase:** {{phase}}

**Instruction:** {{instruction}}

**Narrative Facts:**
{{narrative_facts}}

**Your Task:**
Follow the specific instruction provided to enhance or modify the narrative content based on the narrative facts for the specified phase.

**Output Format:**
Provide only the enhanced narrative text as requested in the instruction. Do not include headers, bullets, or JSON formatting - just the narrative content.`,
    description: "Enhance incident narrative by combining original content with clarification responses",
    workflow_step: "narrative_enhancement",
    subsystem: "incidents",
    ai_model: "openai/gpt-5-nano",
    max_tokens: 2000,
    temperature: 0.1,
    is_active: true,
  },
  {
    prompt_name: "generate_mock_answers",
    prompt_version: "v1.0.0",
    prompt_template: `You are generating realistic mock answers for clarification questions about an NDIS incident report.

The incident involved {{participant_name}}, and was reported by {{reporter_name}}.
The event occurred at {{location}}.

You are generating answers specifically for the {{phase}} phase of the incident.

<phase_narrative>
{{phase_narrative}}
</phase_narrative>

Based on the narrative context above, provide realistic and detailed answers to the following clarification questions. The answers should:
- Be consistent with the narrative provided
- Sound like they come from someone who witnessed the incident
- Include specific details that would be helpful for incident documentation
- Be professional but conversational in tone
- Vary in length (some brief, some more detailed)

Questions to answer:
{{questions}}

Return a JSON array of answer objects (no markdown formatting):
[
  {
    "question_id": "question-id-here",
    "answer": "Detailed realistic answer here"
  }
]`,
    description: "Generate realistic mock answers for clarification questions about an NDIS incident report",
    workflow_step: "sample_data_generation",
    subsystem: "incidents",
    ai_model: "openai/gpt-5-nano",
    max_tokens: 2000,
    temperature: 0.7,
    is_active: true,
  }
];

// List default templates (for seeding interface)
export const listDefaultTemplates = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Use proper session token authentication like other functions
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
      { errorMessage: 'Authentication required to view default templates' }
    );

    return {
      templates: DEFAULT_PROMPTS.map(t => ({
        name: t.prompt_name,
        description: t.description,
        subsystem: t.subsystem,
      })),
      validation: {
        isValid: true,
        errors: []
      },
      totalTemplates: DEFAULT_PROMPTS.length,
    };
  }
});

// List all prompts from database (for admin UI)
export const listAllPrompts = query({
  args: {
    sessionToken: v.string(),
    subsystem: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Use proper session token authentication like other functions
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
      { errorMessage: 'Authentication required to view prompt templates' }
    );

    // Get all prompts, filtering by subsystem if provided
    let prompts;
    if (args.subsystem) {
      prompts = await ctx.db
        .query("ai_prompts")
        .withIndex("by_subsystem", (q) => q.eq("subsystem", args.subsystem))
        .collect();
    } else {
      prompts = await ctx.db
        .query("ai_prompts")
        .collect();
    }

    // Filter by active status if specified
    if (args.activeOnly !== false) { // Default to true
      prompts = prompts.filter(prompt => prompt.is_active !== false);
    }

    // Sort by creation date (newest first)
    prompts.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    return prompts;
  },
});

// Clear all prompts (sample_data permission required)
export const clearAllPrompts = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate sample_data permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA
    );

    // Get all active prompts
    const allPrompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();

    const deleteCount = allPrompts.length;
    const deletedTemplates: string[] = [];

    // Soft delete all prompts by setting them inactive
    for (const prompt of allPrompts) {
      await ctx.db.patch(prompt._id, {
        is_active: false,
        replaced_at: Date.now(),
      });
      deletedTemplates.push(prompt.prompt_name);
    }

    return {
      message: `Successfully cleared ${deleteCount} prompt templates`,
      deletedCount: deleteCount,
      deletedTemplates,
    };
  }
});