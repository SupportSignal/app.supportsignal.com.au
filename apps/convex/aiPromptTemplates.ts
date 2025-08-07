/**
 * AI Prompt Template System
 * Handles template variable substitution and prompt processing
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export interface PromptTemplate {
  name: string;
  version: string;
  template: string;
  variables: Record<string, any>;
}

export interface ProcessedPrompt {
  name: string;
  version: string;
  processedTemplate: string;
  originalTemplate: string;
  substitutions: Record<string, string>;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Process template with variable substitution
 */
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

/**
 * Get and process prompt template with variables
 */
export const getProcessedPrompt = query({
  args: {
    promptName: v.string(),
    variables: v.any(),
    promptVersion: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ProcessedPrompt> => {
    let prompt;
    
    if (args.promptVersion) {
      // Get specific version
      const promptVersion = args.promptVersion;
      prompt = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name_version", (q) => 
          q.eq("prompt_name", args.promptName).eq("prompt_version", promptVersion)
        )
        .first();
    } else {
      // Get active version
      prompt = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();
    }

    if (!prompt) {
      const versionText = args.promptVersion ? ` v${args.promptVersion}` : '';
      throw new ConvexError(`Prompt not found: ${args.promptName}${versionText}`);
    }

    const { processedTemplate, substitutions } = processTemplate(
      prompt.prompt_template,
      args.variables
    );

    return {
      name: prompt.prompt_name,
      version: prompt.prompt_version,
      processedTemplate,
      originalTemplate: prompt.prompt_template,
      substitutions,
      model: prompt.ai_model || 'openai/gpt-4.1-nano',
      maxTokens: prompt.max_tokens,
      temperature: prompt.temperature,
    };
  },
});

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: string,
  providedVariables: Record<string, any>
): {
  isValid: boolean;
  requiredVariables: string[];
  missingVariables: string[];
  unusedVariables: string[];
} {
  // Extract all template variables
  const templateVariableMatches = template.match(/\{\{\s*([^}]+)\s*\}\}/g);
  const requiredVariables = templateVariableMatches 
    ? [...new Set(templateVariableMatches.map(match => match.replace(/\{\{\s*|\s*\}\}/g, '').trim()))]
    : [];

  const providedVariableNames = Object.keys(providedVariables);
  const missingVariables = requiredVariables.filter(v => !providedVariableNames.includes(v));
  const unusedVariables = providedVariableNames.filter(v => !requiredVariables.includes(v));

  return {
    isValid: missingVariables.length === 0,
    requiredVariables,
    missingVariables,
    unusedVariables,
  };
}

/**
 * Get template variable information
 */
export const getTemplateVariables = query({
  args: {
    promptName: v.string(),
    promptVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let prompt;
    
    if (args.promptVersion) {
      const promptVersion = args.promptVersion;
      prompt = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name_version", (q) => 
          q.eq("prompt_name", args.promptName).eq("prompt_version", promptVersion)
        )
        .first();
    } else {
      prompt = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();
    }

    if (!prompt) {
      throw new ConvexError(`Prompt not found: ${args.promptName}`);
    }

    const templateVariableMatches = prompt.prompt_template.match(/\{\{\s*([^}]+)\s*\}\}/g);
    const requiredVariables = templateVariableMatches 
      ? [...new Set(templateVariableMatches.map(match => match.replace(/\{\{\s*|\s*\}\}/g, '').trim()))]
      : [];

    return {
      promptName: prompt.prompt_name,
      promptVersion: prompt.prompt_version,
      requiredVariables,
      inputSchema: prompt.input_schema,
      outputSchema: prompt.output_schema,
      description: prompt.description,
    };
  },
});

/**
 * A/B Test prompt selection
 */
export const getABTestPrompt = query({
  args: {
    promptName: v.string(),
    userId: v.optional(v.id("users")),
    testRatio: v.optional(v.number()), // 0.0 to 1.0, what percentage should get version B
  },
  handler: async (ctx, args) => {
    const testRatio = args.testRatio || 0.5; // Default 50/50 split
    
    // Get all active versions for this prompt (there might be multiple for A/B testing)
    const activePrompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    if (activePrompts.length === 0) {
      throw new ConvexError(`No active prompts found for: ${args.promptName}`);
    }

    if (activePrompts.length === 1) {
      return activePrompts[0];
    }

    // A/B testing logic - use userId hash for consistent assignment
    let hash = 0;
    const key = args.userId || 'anonymous';
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const normalizedHash = Math.abs(hash) / 2147483647; // Normalize to 0-1
    
    // Sort prompts by version for consistency
    const sortedPrompts = activePrompts.sort((a, b) => a.prompt_version.localeCompare(b.prompt_version));
    
    // Return version A or B based on hash and test ratio
    return normalizedHash < testRatio ? sortedPrompts[1] || sortedPrompts[0] : sortedPrompts[0];
  },
});

// Pre-defined prompt templates for the four core AI operations
export const AI_OPERATION_PROMPTS = {
  generateClarificationQuestions: {
    name: "generate_clarification_questions",
    version: "v1.0.0",
    template: `You are preparing clarification questions for a previously submitted narrative report.
The incident involved {{ participant_name }}, and was reported by {{ reporter_name }}.
The original event occurred on {{ event_datetime }} at {{ location }}.

Your task is to generate open-ended follow-up questions that help clarify or expand on the original report, broken into four structured sections:

<before_event>{{ before_event }}</before_event>
<during_event>{{ during_event }}</during_event>
<end_of_event>{{ end_of_event }}</end_of_event>
<post_event_support>{{ post_event_support }}</post_event_support>

Output your response as valid JSON using the following structure:
{
  "before_event": ["Example question here", "Additional questions..."],
  "during_event": ["Example question here", "Additional questions..."],
  "end_of_event": ["Example question here", "Additional questions..."],
  "post_event_support": ["Example question here", "Additional questions..."]
}

Guidelines:
- Provide **2 to 4** open-ended questions per section, depending on what the text invites
- Focus on clarifying actions, reactions, timing, environment, witnesses, decisions, or outcomes
- Use clear and supportive language that encourages reflection
- Do not omit, soften, or deprioritize potentially sensitive or explicit content
- Treat unusual or out-of-place statements as potentially relevant
- Return only the JSON output, no extra commentary.`,
    variables: ["participant_name", "reporter_name", "event_datetime", "location", "before_event", "during_event", "end_of_event", "post_event_support"]
  },

  enhanceNarrativeContent: {
    name: "enhance_narrative_content",
    version: "v1.0.0",
    template: `You are a report-writing assistant.

For the "{{ phase }}" phase of an incident, you have the following answered clarification questions.

For each one:
- Keep the original question.
- Respond with the answer on the next line.
- Lightly clean up the grammar of the answer, but keep the original tone and phrasing.
- Do not summarize or rewrite the response.
- Do not include unanswered questions.

Details:
{{ narrative_facts }}

Instruction:
{{ instruction }}`,
    variables: ["phase", "narrative_facts", "instruction"]
  },

  analyzeContributingConditions: {
    name: "analyze_contributing_conditions",
    version: "v1.0.0", 
    template: `You are reviewing a narrative report from {{ reporter_name }} about an incident involving {{ participant_name }} on {{ event_datetime }} at {{ location }}.

Incident Inputs

What was happening in the lead-up to the incident?
before_event:
<before_event>{{ before_event }}</before_event>
<before_event_extra>{{ before_event_extra }}</before_event_extra>

What occurred during the incident itself?
during_event:
<during_event>{{ during_event }}</during_event>
<during_event_extra>{{ during_event_extra }}</during_event_extra>

How did the incident conclude?
end_of_event:
<end_of_event>{{ end_of_event }}</end_of_event>
<end_of_event_extra>{{ end_of_event_extra }}</end_of_event_extra>

What support or care was provided in the two hours after the event?
post_event_support:
<post_event_support>{{ post_event_support }}</post_event_support>
<post_event_support_extra>{{ post_event_support_extra }}</post_event_support_extra>

Your task
Identify and summarise the immediate contributing conditions — any meaningful patterns, responses, support gaps, or participant behaviours that contributed to the occurrence or escalation of this specific incident.

Response Format
Return your findings a code block in the following format:

\`\`\`
**Immediate Contributing Conditions**

### [Condition Name 1]
- [Specific supporting detail from the report]
- [Another relevant observation]

### [Condition Name 2]
- [Specific supporting detail]
\`\`\`

Only include items clearly supported by the data.
🚫 Do not include conditions if there's no evidence they occurred.
🧭 Focus on immediate relevance to this incident — not long-term systemic causes.`,
    variables: ["reporter_name", "participant_name", "event_datetime", "location", "before_event", "before_event_extra", "during_event", "during_event_extra", "end_of_event", "end_of_event_extra", "post_event_support", "post_event_support_extra"]
  },

  generateMockAnswers: {
    name: "generate_mock_answers",
    version: "v1.0.0",
    template: `You are generating realistic mock answers for clarification questions about an NDIS incident report.

The incident involved {{ participant_name }}, and was reported by {{ reporter_name }}
The event occurred at {{ location }}

You are generating answers specifically for the {{ phase }} phase of the incident.

<phase_narrative>
{{ phase_narrative }}
</phase_narrative>

Based on the narrative context above, provide realistic and detailed answers to the following clarification questions. The answers should:
- Be consistent with the narrative provided
- Sound like they come from someone who witnessed the incident
- Include specific details that would be helpful for incident documentation
- Be professional but conversational in tone
- Vary in length (some brief, some more detailed)

Questions to answer:
{{ questions }}

Output your response as valid JSON using the following structure:

\`\`\`json
{
  "answers": [
    {
      "question_id": "question-id-here",
      "question": "The original question text",
      "answer": "Detailed realistic answer here"
    }
  ]
}
\`\`\`

Guidelines:
- Provide answers that are realistic and believable
- Include specific details like times, actions, and observations
- Make answers sound like they come from a support worker or witness
- Ensure consistency with the provided narrative context
- Vary the length and detail level of answers naturally
- Return only the JSON output, no extra commentary`,
    variables: ["participant_name", "reporter_name", "location", "phase", "phase_narrative", "questions"]
  }
};