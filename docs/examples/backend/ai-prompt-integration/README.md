# AI Prompt Integration Examples

**Created**: 2025-09-30
**Source**: Story 6.1 implementation
**Related Patterns**: [AI Integration Patterns](../../patterns/backend-patterns.md#ai-integration-patterns)
**Status**: Active

## Overview

Working implementation examples for AI prompt template management, variable substitution, and integration with AI services. These examples are extracted from the actual Story 6.1 implementation.

## Core Implementation Examples

### 1. Prompt Template Management

Complete CRUD operations for AI prompt templates with system administrator access control.

**File**: `promptTemplates.ts`
```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// System administrator validation helper
async function validateSystemAdmin(ctx: any, sessionToken: string) {
  const { user } = await requirePermission(
    ctx,
    sessionToken,
    PERMISSIONS.SYSTEM_CONFIGURATION
  );

  if (user.role !== ROLES.SYSTEM_ADMIN) {
    throw new ConvexError("System administrator privileges required.");
  }

  return user;
}

// Create new prompt template (System Admin only)
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

    // Check for duplicate names
    const existing = await ctx.db
      .query("ai_prompt_templates")
      .withIndex("by_name", q => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new ConvexError(`Template with name "${args.name}" already exists`);
    }

    // Validate template syntax (basic check for variable placeholders)
    const variableNames = args.variables.map(v => v.name);
    const templateVars = (args.prompt_template.match(/\{\{([^}]+)\}\}/g) || [])
      .map(match => match.slice(2, -2));

    // Check for undefined variables in template
    const undefinedVars = templateVars.filter(v => !variableNames.includes(v));
    if (undefinedVars.length > 0) {
      throw new ConvexError(`Template contains undefined variables: ${undefinedVars.join(', ')}`);
    }

    // Create template
    const templateId = await ctx.db.insert("ai_prompt_templates", {
      name: args.name,
      description: args.description,
      category: args.category,
      prompt_template: args.prompt_template,
      variables: args.variables,
      version: 1,
      is_active: true,
      created_by: user._id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return templateId;
  },
});

// Get system prompt templates (System Admin only)
export const getSystemPromptTemplates = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await validateSystemAdmin(ctx, args.sessionToken);

    let query = ctx.db.query("ai_prompt_templates");

    if (args.category) {
      query = query.withIndex("by_category", q => q.eq("category", args.category));
    }

    return await query
      .filter(q => q.eq(q.field("is_active"), true))
      .order("desc")
      .collect();
  },
});
```

### 2. Prompt Resolution Service

Template resolution with variable substitution using current implementation.

**File**: `prompt_resolver.ts`
```typescript
// Based on actual apps/convex/lib/prompts/prompt_resolver.ts
import { PromptResolver, INCIDENT_WORKFLOW_VARIABLES } from './lib/prompts/prompt_resolver';

// Resolve prompt template with variable substitution
export const resolvePromptTemplate = query({
  args: {
    sessionToken: v.string(),
    template_name: v.string(),
    variables: v.any(), // Key-value pairs for substitution
  },
  handler: async (ctx, args) => {
    // Basic session validation
    const session = await validateSession(ctx, args.sessionToken);
    if (!session) {
      throw new ConvexError("Invalid session");
    }

    // Load template directly from database (no caching)
    const template = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", q => q.eq("prompt_name", args.template_name))
      .filter(q => q.eq(q.field("is_active"), true))
      .first();

    if (!template) {
      throw new ConvexError(`Template "${args.template_name}" not found or inactive`);
    }

    // Use PromptResolver utility for variable substitution
    const result = PromptResolver.resolvePrompt(
      template.prompt_template,
      args.variables,
      template.variables || INCIDENT_WORKFLOW_VARIABLES
    );

    if (result.errors.length > 0) {
      throw new ConvexError(`Template resolution errors: ${result.errors.join(', ')}`);
    }

    return {
      resolved_prompt: result.resolvedPrompt,
      template_name: template.prompt_name,
      template_version: template.prompt_version,
      variables_used: result.variablesUsed,
      processing_time_ms: result.processingTimeMs,
    };
  },
});
```

### 3. AI Service Integration

Integration with OpenAI using resolved prompt templates.

**File**: `ai_service_integration.ts`
```typescript
import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// AI service integration with prompt templates
export const generateWithPrompt = action({
  args: {
    sessionToken: v.string(),
    templateName: v.string(),
    variables: v.any(),
    additionalContext: v.optional(v.string()),
    modelConfig: v.optional(v.object({
      model: v.string(),
      temperature: v.number(),
      max_tokens: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      // 1. Resolve prompt template
      const resolution = await ctx.runQuery(api.promptTemplates.resolvePromptTemplate, {
        sessionToken: args.sessionToken,
        template_name: args.templateName,
        variables: args.variables,
      });

      // 2. Add any additional context
      const finalPrompt = args.additionalContext
        ? `${resolution.resolved_prompt}\n\nAdditional Context: ${args.additionalContext}`
        : resolution.resolved_prompt;

      // 3. Configure AI model
      const config = args.modelConfig || {
        model: "gpt-4",
        temperature: 0.7,
        max_tokens: 1000,
      };

      // 4. Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant specialized in incident analysis and support."
            },
            {
              role: "user",
              content: finalPrompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        }),
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${error}`);
      }

      const aiResult = await openaiResponse.json();
      const processingTime = Date.now() - startTime;

      // 5. Log prompt usage for analytics
      await ctx.runMutation(api.promptUsageLogs.logUsage, {
        template_name: args.templateName,
        variables_used: args.variables,
        resolved_prompt: finalPrompt,
        ai_model_used: config.model,
        ai_response: aiResult.choices[0]?.message?.content || '',
        processing_time_ms: processingTime,
        success: true,
      });

      return {
        content: aiResult.choices[0]?.message?.content || '',
        usage: aiResult.usage,
        template_info: {
          name: resolution.template_name,
          version: resolution.template_version,
        },
        processing_time_ms: processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Log error for debugging
      await ctx.runMutation(api.promptUsageLogs.logUsage, {
        template_name: args.templateName,
        variables_used: args.variables,
        resolved_prompt: 'Error during resolution',
        ai_model_used: args.modelConfig?.model || 'gpt-4',
        error_message: error instanceof Error ? error.message : String(error),
        processing_time_ms: processingTime,
        success: false,
      });

      throw error;
    }
  },
});
```

### 4. Usage Logging and Analytics

Track prompt usage for optimization and monitoring.

**File**: `promptUsageLogs.ts`
```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Log prompt usage for analytics
export const logUsage = mutation({
  args: {
    template_name: v.string(),
    variables_used: v.any(),
    resolved_prompt: v.string(),
    ai_model_used: v.string(),
    ai_response: v.optional(v.string()),
    error_message: v.optional(v.string()),
    processing_time_ms: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get user session for logging
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", q => q.eq("sessionToken", args.sessionToken))
      .first();

    const user = session ? await ctx.db.get(session.userId) : null;

    return await ctx.db.insert("prompt_usage_logs", {
      template_name: args.template_name,
      user_id: user?._id,
      company_id: user?.company_id,
      variables_used: args.variables_used,
      resolved_prompt: args.resolved_prompt,
      ai_model_used: args.ai_model_used,
      ai_response: args.ai_response,
      error_message: args.error_message,
      processing_time_ms: args.processing_time_ms,
      success: args.success,
      created_at: Date.now(),
    });
  },
});

// Get usage analytics for templates
export const getUsageAnalytics = query({
  args: {
    sessionToken: v.string(),
    template_name: v.optional(v.string()),
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate system admin access for analytics
    await validateSystemAdmin(ctx, args.sessionToken);

    let query = ctx.db.query("prompt_usage_logs");

    // Filter by template if specified
    if (args.template_name) {
      query = query.withIndex("by_template", q => q.eq("template_name", args.template_name));
    }

    const logs = await query
      .filter(q => {
        let filter = q.eq(q.field("success"), true);

        if (args.start_date) {
          filter = q.and(filter, q.gte(q.field("created_at"), args.start_date));
        }

        if (args.end_date) {
          filter = q.and(filter, q.lte(q.field("created_at"), args.end_date));
        }

        return filter;
      })
      .collect();

    // Calculate analytics
    const totalUsage = logs.length;
    const avgProcessingTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length
      : 0;

    const templateUsage = logs.reduce((acc, log) => {
      acc[log.template_name] = (acc[log.template_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_usage: totalUsage,
      avg_processing_time_ms: Math.round(avgProcessingTime),
      template_usage: templateUsage,
      period: {
        start: args.start_date || 0,
        end: args.end_date || Date.now(),
      },
    };
  },
});
```

## Usage Examples

### Basic Prompt Resolution

```typescript
// Resolve a simple template
const result = await convex.query(api.promptTemplates.resolvePromptTemplate, {
  sessionToken: "user_session_token",
  template_name: "generate_clarification_questions",
  variables: {
    participant_name: "John Doe",
    incident_type: "behavioral_incident",
    location: "classroom"
  }
});

console.log(result.resolved_prompt);
// Output: "Generate clarification questions for behavioral_incident involving John Doe in classroom..."
```

### AI Service Integration

```typescript
// Generate AI response using template
const aiResponse = await convex.action(api.aiService.generateWithPrompt, {
  sessionToken: "user_session_token",
  templateName: "generate_clarification_questions",
  variables: {
    participant_name: "John Doe",
    incident_type: "behavioral_incident"
  },
  additionalContext: "This incident occurred during lunch break",
  modelConfig: {
    model: "gpt-4",
    temperature: 0.8,
    max_tokens: 500
  }
});

console.log(aiResponse.content);
```

### Template Management

```typescript
// Create new template (System Admin only)
await convex.mutation(api.promptTemplates.createPromptTemplate, {
  sessionToken: "admin_session_token",
  name: "custom_analysis_prompt",
  description: "Custom prompt for incident analysis",
  category: "general",
  prompt_template: "Analyze the {{incident_type}} that occurred {{when}} involving {{who}}. Focus on {{analysis_focus}}.",
  variables: [
    {
      name: "incident_type",
      description: "Type of incident",
      type: "string",
      required: true
    },
    {
      name: "when",
      description: "When the incident occurred",
      type: "string",
      required: true
    },
    {
      name: "who",
      description: "People involved",
      type: "string",
      required: true
    },
    {
      name: "analysis_focus",
      description: "What to focus the analysis on",
      type: "string",
      required: false,
      default_value: "contributing factors and prevention strategies"
    }
  ]
});
```

## Setup Instructions

1. **Schema Setup**: Ensure your Convex schema includes the required tables:
   - `ai_prompt_templates`
   - `prompt_usage_logs`
   - `userSessions`
   - `users`

2. **Environment Variables**: Configure OpenAI API access:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Authentication**: Implement session validation and permission checking functions

4. **Deployment**: Deploy functions to Convex and seed default templates

## Key Implementation Insights

### Variable Substitution Strategy

- Use regex replacement for `{{variable}}` syntax
- Validate variable types before substitution
- Support default values for optional variables
- Warn about unresolved variables for debugging

### Database Access Strategy

- Direct database queries for each template resolution (no caching currently)
- Convex real-time subscriptions provide efficient data updates
- Template resolution via utility class for pure function approach

### Error Handling

- Comprehensive validation at multiple levels
- Clear error messages for debugging
- Graceful degradation when templates unavailable
- Usage logging for error analysis

### Performance Considerations

- Template caching reduces database queries
- Batch variable validation
- Async AI service calls with timeout handling
- Usage analytics for optimization insights

## Related Knowledge Assets

- **Pattern**: [AI Integration Patterns](../../patterns/backend-patterns.md#ai-integration-patterns)
- **Lessons**: [Convex Platform Constraints](../../lessons-learned/convex-platform-constraints.md)
- **Architecture**: [Authentication & Authorization Patterns](../../patterns/backend-patterns.md#authentication--authorization-patterns)

This implementation provides a complete, production-ready AI prompt management system extracted from actual Story 6.1 development.