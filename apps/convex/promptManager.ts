import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requirePermission, PERMISSIONS, hasDeveloperAccess } from "./permissions";
import { ConvexError } from "convex/values";
import { getConfig } from "./lib/config";

// Enhanced template processing with validation (Story 6.3: Developer Prompt Testing)
export function processTemplateWithValidation(
  template: string, 
  variables: Record<string, any>
): {
  processedTemplate: string;
  substitutions: Record<string, string>;
  missingPlaceholders: string[];
  unusedVariables: string[];
} {
  const substitutions: Record<string, string> = {};
  
  // Sanitize template: normalize whitespace in placeholders and fix malformed ones
  const sanitizedTemplate = template
    .replace(/\{\{\s*([^}]*?)\s*\}\}/g, (match, content) => {
      // Remove newlines and normalize whitespace in placeholder content
      const cleanContent = content.replace(/\s+/g, ' ').trim();
      return `{{${cleanContent}}}`;
    });
  
  // Extract all {{placeholder}} patterns from sanitized template
  const placeholderMatches = sanitizedTemplate.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
  const placeholderNames = placeholderMatches.map(match => 
    match.replace(/[{}]/g, '').trim()
  );
  
  // Find missing and unused variables
  const missingPlaceholders = placeholderNames.filter(name => !(name in variables));
  const unusedVariables = Object.keys(variables).filter(name => 
    !placeholderNames.includes(name)
  );
  
  // Replace {{ variable }} patterns with actual values using sanitized template
  const processedTemplate = sanitizedTemplate.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variableName) => {
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
    missingPlaceholders,
    unusedVariables,
  };
}

// Legacy function for backward compatibility
export function processTemplate(template: string, variables: Record<string, any>): {
  processedTemplate: string;
  substitutions: Record<string, string>;
} {
  const result = processTemplateWithValidation(template, variables);
  return {
    processedTemplate: result.processedTemplate,
    substitutions: result.substitutions,
  };
}

// Convex query wrapper for enhanced template processing
export const processTemplateWithValidationQuery = query({
  args: {
    template: v.string(),
    variables: v.any(),
  },
  handler: async (ctx, args) => {
    return processTemplateWithValidation(args.template, args.variables);
  },
});

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

    // Get model: database-first, fallback to environment configuration
    const config = getConfig();
    const modelToUse = prompt.ai_model || config.llm.defaultModel;

    // Log model selection for transparency
    console.log("🔧 PROMPT MANAGER MODEL SELECTION", {
      prompt_name: prompt.prompt_name,
      database_model: prompt.ai_model,
      environment_model: config.llm.defaultModel,
      selected_model: modelToUse,
      using: prompt.ai_model ? "database_override" : "environment_default",
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
        // Create new prompt from default template with sensible defaults
        const config = getConfig();
        const promptId = await ctx.db.insert("ai_prompts", {
          ...defaultPrompt,
          prompt_version: (defaultPrompt as any).prompt_version || "v1.0.0",
          ai_model: (defaultPrompt as any).ai_model || config.llm.defaultModel, // Use system configuration default
          max_tokens: (defaultPrompt as any).max_tokens || 2000,
          temperature: (defaultPrompt as any).temperature || 0.3,
          is_active: (defaultPrompt as any).is_active !== false, // Default to true unless explicitly false
          usage_count: 0,
          created_at: now,
          created_by: user._id,
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

// Internal version for automated seeding (no auth required)
export const seedPromptTemplatesInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
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
        // Create new prompt from default template with sensible defaults
        const config = getConfig();
        const promptId = await ctx.db.insert("ai_prompts", {
          ...defaultPrompt,
          prompt_version: (defaultPrompt as any).prompt_version || "v1.0.0",
          ai_model: (defaultPrompt as any).ai_model || config.llm.defaultModel, // Use system configuration default
          max_tokens: (defaultPrompt as any).max_tokens || 2000,
          temperature: (defaultPrompt as any).temperature || 0.3,
          is_active: (defaultPrompt as any).is_active !== false,
          usage_count: 0,
          created_at: now,
          created_by: undefined, // System-created prompt (optional field)
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
  // Story 6.4: Removed generic enhance_narrative - replaced by 4 phase-specific prompts
  {
    prompt_name: "enhance_narrative_before_event",
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create an enhanced before-event narrative by naturally integrating original observations with clarification responses.

**Incident Overview:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**Before Event Narrative (Original):**
{{beforeEvent}}

**Clarification Responses (Before Event):**
{{beforeEventQA}}

**Your Task:**
Create an enhanced narrative for the before-event phase that:

1. **Preserves Original Meaning**: Keep the reporter's original observations and tone intact
2. **Light Grammar Improvements**: Fix only basic grammar, spelling, and sentence structure issues
3. **Natural Integration**: Weave clarification responses seamlessly into the narrative flow
4. **Maintains Authenticity**: Should read as if the reporter wrote it correctly the first time
5. **No Hallucinations**: Use only information provided - do not add assumptions or interpretations

**Before-Event Specific Focus:**
When integrating clarification details, emphasize:
- Environmental setup (noise, lighting, number of people, activity context)
- Participant's mood, energy level, and body language in the lead-up
- Changes to normal routine (meals, transport, schedule, medication, staff changes)
- Interactions with staff or peers before the incident
- Early warning signs, stressors, or triggers noticed beforehand

**Enhancement Guidelines:**
- **Grammar Only**: Focus on fixing grammar, not rewriting content
- **Voice Preservation**: Maintain the reporter's original tone and perspective
- **Natural Flow**: Integrate Q&A responses as natural narrative elements
- **Factual Accuracy**: Only use provided information, no inferences
- **Professional Language**: Ensure appropriate language for NDIS reporting
- **Participant Dignity**: Keep participant respect and privacy central

**Integration Approach:**
- Start with the original narrative as the foundation
- Add clarification details where they naturally fit chronologically
- Fix grammar and sentence structure while preserving meaning
- Ensure the result flows as a unified, well-written narrative
- Focus on context that helps understand what led to the incident

**Output Format:**
Provide only the enhanced before-event narrative text. Do not include headers, bullets, or explanations - just the improved narrative that combines original content with clarifications naturally.`,
    description: "Enhance before-event narrative - focus on environmental setup and participant state",
    workflow_step: "narrative_consolidation",
    subsystem: "incidents",
    max_tokens: 4000,
  },
  {
    prompt_name: "enhance_narrative_during_event",
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create an enhanced during-event narrative by naturally integrating original observations with clarification responses.

**Incident Overview:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**During Event Narrative (Original):**
{{duringEvent}}

**Clarification Responses (During Event):**
{{duringEventQA}}

**Your Task:**
Create an enhanced narrative for the during-event phase that:

1. **Preserves Original Meaning**: Keep the reporter's original observations and tone intact
2. **Light Grammar Improvements**: Fix only basic grammar, spelling, and sentence structure issues
3. **Natural Integration**: Weave clarification responses seamlessly into the narrative flow
4. **Maintains Authenticity**: Should read as if the reporter wrote it correctly the first time
5. **No Hallucinations**: Use only information provided - do not add assumptions or interpretations

**During-Event Specific Focus:**
When integrating clarification details, emphasize:
- What actions staff took to keep people safe
- How the participant responded to interventions (what helped, what didn't)
- Physical interventions or tools used
- Changes made to the space (moving people, blocking exits, removing objects)
- How staff communicated with the participant and each other
- Timing and sequence - what happened first, next, last
- Observable actions and responses during the incident

**Enhancement Guidelines:**
- **Grammar Only**: Focus on fixing grammar, not rewriting content
- **Voice Preservation**: Maintain the reporter's original tone and perspective
- **Natural Flow**: Integrate Q&A responses as natural narrative elements
- **Factual Accuracy**: Only use provided information, no inferences
- **Professional Language**: Ensure appropriate language for NDIS reporting
- **Participant Dignity**: Keep participant respect and privacy central

**Integration Approach:**
- Start with the original narrative as the foundation
- Add clarification details where they naturally fit chronologically
- Fix grammar and sentence structure while preserving meaning
- Ensure the result flows as a unified, well-written narrative
- Maintain clear focus on what was seen, heard, or done during the incident

**Output Format:**
Provide only the enhanced during-event narrative text. Do not include headers, bullets, or explanations - just the improved narrative that combines original content with clarifications naturally.`,
    description: "Enhance during-event narrative - focus on actions, interventions, and safety measures",
    workflow_step: "narrative_consolidation",
    subsystem: "incidents",
    max_tokens: 4000,
  },
  {
    prompt_name: "enhance_narrative_end_event",
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create an enhanced end-event narrative by naturally integrating original observations with clarification responses.

**Incident Overview:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**End Event Narrative (Original):**
{{endEvent}}

**Clarification Responses (End Event):**
{{endEventQA}}

**Your Task:**
Create an enhanced narrative for the end-event phase that:

1. **Preserves Original Meaning**: Keep the reporter's original observations and tone intact
2. **Light Grammar Improvements**: Fix only basic grammar, spelling, and sentence structure issues
3. **Natural Integration**: Weave clarification responses seamlessly into the narrative flow
4. **Maintains Authenticity**: Should read as if the reporter wrote it correctly the first time
5. **No Hallucinations**: Use only information provided - do not add assumptions or interpretations

**End-Event Specific Focus:**
When integrating clarification details, emphasize:
- What helped calm things down or bring the incident to a close
- How the participant's behavior or mood changed as things settled
- Any immediate safety concerns that were still present
- Emergency services involvement (ambulance, police) and what happened next
- How staff worked together during the resolution
- Steps taken to return things to normal or support the participant after the event
- De-escalation techniques that were effective

**Enhancement Guidelines:**
- **Grammar Only**: Focus on fixing grammar, not rewriting content
- **Voice Preservation**: Maintain the reporter's original tone and perspective
- **Natural Flow**: Integrate Q&A responses as natural narrative elements
- **Factual Accuracy**: Only use provided information, no inferences
- **Professional Language**: Ensure appropriate language for NDIS reporting
- **Participant Dignity**: Keep participant respect and privacy central

**Integration Approach:**
- Start with the original narrative as the foundation
- Add clarification details where they naturally fit chronologically
- Fix grammar and sentence structure while preserving meaning
- Ensure the result flows as a unified, well-written narrative
- Focus on what helped resolve the incident and immediate aftermath

**Output Format:**
Provide only the enhanced end-event narrative text. Do not include headers, bullets, or explanations - just the improved narrative that combines original content with clarifications naturally.`,
    description: "Enhance end-event narrative - focus on resolution, de-escalation, and immediate outcomes",
    workflow_step: "narrative_consolidation",
    subsystem: "incidents",
    max_tokens: 4000,
  },
  {
    prompt_name: "enhance_narrative_post_event",
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create an enhanced post-event narrative by naturally integrating original observations with clarification responses.

**Incident Overview:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**Post Event Narrative (Original):**
{{postEvent}}

**Clarification Responses (Post Event):**
{{postEventQA}}

**Your Task:**
Create an enhanced narrative for the post-event phase that:

1. **Preserves Original Meaning**: Keep the reporter's original observations and tone intact
2. **Light Grammar Improvements**: Fix only basic grammar, spelling, and sentence structure issues
3. **Natural Integration**: Weave clarification responses seamlessly into the narrative flow
4. **Maintains Authenticity**: Should read as if the reporter wrote it correctly the first time
5. **No Hallucinations**: Use only information provided - do not add assumptions or interpretations

**Post-Event Specific Focus:**
When integrating clarification details, emphasize:
- Whether the participant was safe, calm, and supervised in the hours following
- Medical or emotional support that was offered
- Family, guardians, or team members who were notified
- Incident forms, handovers, or internal alerts that were completed
- Return to normal or safe activities
- Support provided to others (peers or staff) afterward
- Lessons learned and follow-up actions planned

**Enhancement Guidelines:**
- **Grammar Only**: Focus on fixing grammar, not rewriting content
- **Voice Preservation**: Maintain the reporter's original tone and perspective
- **Natural Flow**: Integrate Q&A responses as natural narrative elements
- **Factual Accuracy**: Only use provided information, no inferences
- **Professional Language**: Ensure appropriate language for NDIS reporting
- **Participant Dignity**: Keep participant respect and privacy central

**Integration Approach:**
- Start with the original narrative as the foundation
- Add clarification details where they naturally fit chronologically
- Fix grammar and sentence structure while preserving meaning
- Ensure the result flows as a unified, well-written narrative
- Focus on post-incident care, notifications, and follow-up

**Output Format:**
Provide only the enhanced post-event narrative text. Do not include headers, bullets, or explanations - just the improved narrative that combines original content with clarifications naturally.`,
    description: "Enhance post-event narrative - focus on follow-up care, support modifications, and lessons learned",
    workflow_step: "narrative_consolidation",
    subsystem: "incidents",
    max_tokens: 4000,
  },
  {
    prompt_name: "generate_mock_answers",
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

**Output Format:**
Return a JSON object with an "answers" array (no markdown formatting):
{
  "answers": [
    {
      "question_id": "question-id-here",
      "answer": "Detailed, realistic answer here"
    }
  ]
}`,
    description: "Generate realistic mock answers for clarification questions about an NDIS incident report",
    workflow_step: "sample_data_generation",
    subsystem: "incidents",
    max_tokens: 5000, // Increased to prevent truncation with gpt-5 detailed responses
  },
  {
    prompt_name: "generate_clarification_questions_before_event",
    prompt_template: `You are an expert incident analyst helping to gather **clear and practical details** about what was happening BEFORE an NDIS incident involving {{participantName}}.  

**Incident Context:**  
- **Participant**: {{participantName}}  
- **Date/Time**: {{eventDateTime}}  
- **Location**: {{location}}  
- **Reporter**: {{reporterName}}  

**Before Event Narrative:**  
{{beforeEvent}}  

**Your Task:**  
Generate 3–5 clarification questions that a frontline worker who was present could reasonably answer.  
Focus only on **direct observations** and **simple, useful details** that may have happened before the incident.  

**Key Areas to Explore (Before-Event):**  
- How the participant looked, acted, or felt in the lead-up (mood, energy, body language)  
- Any changes to normal routine (meals, transport, schedule, medication, staff changes)  
- The setup of the environment (noise, lighting, number of people, activity props)  
- Interactions with staff or peers before the incident  
- Any small signs, stressors, or triggers noticed beforehand  

**Requirements:**  
- Keep questions plain, short, and easy to understand (suitable for English as a second language)  
- Avoid yes/no questions — ask for descriptions instead  
- Stick to things the worker could directly see, hear, or do (not management, training, or history they wouldn't know)  
- Questions should help identify early warning signs or conditions that may have contributed to the incident  
- Be respectful and sensitive to the participant's dignity  

**Output format:**  
Return the questions as a JSON array:  
[
  {
    "question": "Your specific before-event question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]`,
    description: "Generate before-event focused clarification questions about antecedents and environmental factors",
    workflow_step: "clarification_questions",
    subsystem: "incidents",
  },
  {
    prompt_name: "generate_clarification_questions_during_event",
    prompt_template: `You are an expert incident analyst helping to gather **clear, practical details** about what happened DURING an NDIS incident involving {{participantName}}.  

**Incident Context:**  
- **Participant**: {{participantName}}  
- **Date/Time**: {{eventDateTime}}  
- **Location**: {{location}}  
- **Reporter**: {{reporterName}}  

**During Event Narrative:**  
{{duringEvent}}  

**Your Task:**  
Generate 3–5 clarification questions that a frontline worker who was present could reasonably answer.  
Focus only on **what was seen, heard, or done** during the time the incident was happening.  

**Key Areas to Explore (During-Event):**  
- What actions staff took to keep people safe  
- How the participant responded to those actions (what helped, what didn't)  
- Any physical interventions or tools used  
- Any changes made to the space (moving people, blocking exits, removing objects)  
- How staff communicated with the participant and each other  
- Timing — what happened first, next, last  

**Requirements:**  
- Use plain, short, and easy-to-read language (for English as a second language)  
- Avoid yes/no questions — ask for clear, descriptive responses  
- Keep questions focused on **observable actions and responses**  
- Do not ask about policy, training, or background knowledge outside the staff member's direct role  
- Be respectful of the participant's dignity — focus on safety, care, and what was tried  

**Output format:**  
Return the questions as a JSON array:  
[
  {
    "question": "Your specific during-event question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]`,
    description: "Generate during-event focused clarification questions about interventions and safety measures",
    workflow_step: "clarification_questions",
    subsystem: "incidents",
  },
  {
    prompt_name: "generate_clarification_questions_end_event",
    prompt_template: `You are an expert incident analyst helping to gather **clear, practical details** about how an NDIS incident involving {{participantName}} came to an end and what happened right afterward.  

**Incident Context:**  
- **Participant**: {{participantName}}  
- **Date/Time**: {{eventDateTime}}  
- **Location**: {{location}}  
- **Reporter**: {{reporterName}}  

**End Event Narrative:**  
{{endEvent}}  

**Your Task:**  
Generate 3–5 clarification questions that a frontline worker who was present could reasonably answer.  
Focus on what happened as the incident finished and in the minutes or moments just after.  

**Key Areas to Explore (End-Event):**  
- What helped calm things down or bring the incident to a close  
- How the participant's behavior or mood changed as things settled  
- Any immediate safety concerns that were still present  
- If emergency services (e.g., ambulance, police) were involved, what happened next  
- How staff worked together during the resolution  
- What steps were taken to return things to normal or support the participant after the event  

**Requirements:**  
- Use simple, clear, and direct language (for English as a second language)  
- Avoid yes/no questions — ask for short descriptions or actions  
- Only ask about things the worker **saw, heard, or did** — not policy or background knowledge  
- Focus on what helped resolve the incident or what needed follow-up  
- Keep a respectful tone — protect the dignity of the participant and others involved  

**Output format:**  
Return the questions as a JSON array:  
[
  {
    "question": "Your specific end-event question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]`,
    description: "Generate end-event focused clarification questions about resolution strategies and outcomes",
    workflow_step: "clarification_questions",
    subsystem: "incidents",
  },
  {
    prompt_name: "generate_clarification_questions_post_event",
    prompt_template: `You are an expert incident analyst helping to gather **clear and practical details** about what happened in the **first few hours after** an NDIS incident involving {{participantName}}.  

This is about checking that the participant is **safe**, has been **offered the right support**, and that **key people were notified**.  

**Incident Context:**  
- **Participant**: {{participantName}}  
- **Date/Time**: {{eventDateTime}}  
- **Location**: {{location}}  
- **Reporter**: {{reporterName}}  

**Post-Event Narrative:**  
{{postEvent}}  

**Your Task:**  
Generate 3–5 clarification questions based on what may have occurred in the **4 hours after the incident**.  
Your goal is to confirm:
- The participant was no longer in danger or distress  
- They were offered appropriate care or emotional support  
- The right people (e.g. family, supervisor, emergency services) were contacted  
- Relevant notes or handovers were done (if required)

**Who can answer:**  
These questions should be answerable by **either the frontline worker or the team leader**, depending on who was involved.

**Key Areas to Explore (Post-Event):**  
- Was the participant safe, calm, and supervised?  
- Was medical or emotional support offered?  
- Were family, guardians, or other team members notified?  
- Were incident forms, handovers, or internal alerts completed?  
- Did the participant return to a normal or safe activity?  
- Were others (e.g. peers or staff) also supported afterward?

**Requirements:**  
- Use clear, simple language  
- Avoid yes/no questions — ask for short descriptions or facts  
- Stay within what someone on shift would reasonably know or do  
- Be respectful and uphold the participant's dignity  

**Output format:**  
Return the questions as a JSON array:  
[
  {
    "question": "Your specific post-event question here",
    "purpose": "Brief explanation of why this follow-up detail is important"
  }
]`,
    description: "Generate post-event focused clarification questions about follow-up care and lessons learned",
    workflow_step: "clarification_questions",
    subsystem: "incidents",
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

// Deactivate a specific prompt by name (sample_data permission required)
export const deactivatePrompt = mutation({
  args: {
    sessionToken: v.string(),
    promptName: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate sample_data permission
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA,
      { errorMessage: 'Sample data permission required to deactivate prompt templates' }
    );

    // Find the prompt by name
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!prompt) {
      return {
        success: false,
        message: `No active prompt found with name: ${args.promptName}`,
        correlationId,
      };
    }

    // Deactivate the prompt
    await ctx.db.patch(prompt._id, {
      is_active: false,
    });

    return {
      success: true,
      message: `Successfully deactivated prompt: ${args.promptName}`,
      promptId: prompt._id,
      correlationId,
    };
  },
});

// Reset and seed prompts in one operation (sample_data permission required)
export const resetAndSeedPrompts = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate sample_data permission
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA,
      { errorMessage: 'Sample data permission required to reset and seed prompt templates' }
    );

    // Step 1: Clear existing prompts
    const allPrompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();

    const clearedCount = allPrompts.length;
    const clearedTemplates: string[] = [];

    // Soft delete all prompts by setting them inactive
    for (const prompt of allPrompts) {
      await ctx.db.patch(prompt._id, {
        is_active: false,
        replaced_at: Date.now(),
      });
      clearedTemplates.push(prompt.prompt_name);
    }

    // Step 2: Seed new prompts
    const promptIds: string[] = [];
    const now = Date.now();
    const config = getConfig();

    // Seed each default template
    for (const defaultPrompt of DEFAULT_PROMPTS) {
      const promptId = await ctx.db.insert("ai_prompts", {
        ...defaultPrompt,
        prompt_version: (defaultPrompt as any).prompt_version || "v1.0.0",
        ai_model: (defaultPrompt as any).ai_model || config.llm.defaultModel, // Use system configuration default
        max_tokens: (defaultPrompt as any).max_tokens || 2000,
        temperature: (defaultPrompt as any).temperature || 0.3,
        is_active: (defaultPrompt as any).is_active !== false,
        usage_count: 0,
        created_at: now,
        created_by: user._id,
      });
      promptIds.push(promptId);
    }

    return {
      message: `Successfully reset and seeded ${promptIds.length} prompt templates`,
      clearedCount,
      clearedTemplates,
      seededCount: promptIds.length,
      promptIds,
    };
  },
});

// Direct template editing mutation for production prompts
export const updatePromptTemplate = mutation({
  args: {
    sessionToken: v.string(),
    prompt_name: v.string(),
    new_template: v.string(),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user with developer permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA, // Developer feature requires sample_data permission
      { errorMessage: 'Developer permissions required to edit prompt templates' }
    );

    // Find the active prompt to update
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
      throw new ConvexError(`Active prompt not found: ${args.prompt_name}`);
    }

    // Update the prompt template directly
    await ctx.db.patch(prompt._id, {
      prompt_template: args.new_template,
    });

    console.log("📝 PROMPT TEMPLATE UPDATED", {
      prompt_name: args.prompt_name,
      prompt_id: prompt._id,
      template_length: args.new_template.length,
      updated_by: user._id,
    });

    return {
      success: true,
      prompt_id: prompt._id,
      prompt_name: args.prompt_name,
      updated_template_length: args.new_template.length,
    };
  },
});

// Update AI model for a prompt (Story 6.5: Model Management)
export const updatePromptModel = mutation({
  args: {
    sessionToken: v.string(),
    prompt_name: v.string(),
    ai_model: v.string(),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user with developer permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA, // Developer feature requires sample_data permission
      { errorMessage: 'Developer permissions required to update prompt models' }
    );

    // Find the active prompt to update
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
      throw new ConvexError(`Active prompt not found: ${args.prompt_name}`);
    }

    // Update the AI model
    await ctx.db.patch(prompt._id, {
      ai_model: args.ai_model,
    });

    console.log("🤖 PROMPT MODEL UPDATED", {
      prompt_name: args.prompt_name,
      prompt_id: prompt._id,
      old_model: prompt.ai_model,
      new_model: args.ai_model,
      updated_by: user._id,
    });

    return {
      success: true,
      prompt_id: prompt._id,
      prompt_name: args.prompt_name,
      old_model: prompt.ai_model,
      new_model: args.ai_model,
    };
  },
});

// Bulk update AI models for multiple prompts (Story 6.5: Phase 5)
export const bulkUpdatePromptModels = mutation({
  args: {
    sessionToken: v.string(),
    prompt_ids: v.array(v.id("ai_prompts")),
    ai_model: v.string(),
  },
  handler: async (ctx, args) => {
    // Authenticate user with developer permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA,
      { errorMessage: 'Developer permissions required to bulk update prompt models' }
    );

    const results = {
      success: true,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log("🔄 BULK MODEL UPDATE STARTED", {
      count: args.prompt_ids.length,
      target_model: args.ai_model,
      updated_by: user._id,
    });

    // Update each prompt
    for (const promptId of args.prompt_ids) {
      try {
        const prompt = await ctx.db.get(promptId);

        if (!prompt) {
          results.failed++;
          results.errors.push(`Prompt not found: ${promptId}`);
          continue;
        }

        if (!prompt.is_active) {
          results.failed++;
          results.errors.push(`Prompt inactive: ${prompt.prompt_name}`);
          continue;
        }

        await ctx.db.patch(promptId, {
          ai_model: args.ai_model,
        });

        results.updated++;
        console.log("✅ Updated:", prompt.prompt_name);
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Failed to update ${promptId}: ${errorMsg}`);
        console.error("❌ Update failed:", promptId, errorMsg);
      }
    }

    console.log("🔄 BULK MODEL UPDATE COMPLETE", {
      updated: results.updated,
      failed: results.failed,
      target_model: args.ai_model,
    });

    return results;
  },
});

/**
 * Update prompt token limit with adaptive token management
 * Story 6.9 - Phase 3: Self-Healing Database Updates
 *
 * Used by retryWithAdaptiveTokens when AI responses are truncated.
 * Automatically adjusts max_tokens upward to prevent future truncation.
 */
export const updatePromptTokenLimit = mutation({
  args: {
    prompt_name: v.string(),
    new_max_tokens: v.number(),
    baseline_max_tokens: v.optional(v.number()),
    adjustment_reason: v.string(),
    correlation_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlation_id || `token-update-${Date.now()}`;

    console.log("🔧 UPDATING PROMPT TOKEN LIMIT", {
      prompt_name: args.prompt_name,
      new_max_tokens: args.new_max_tokens,
      baseline_max_tokens: args.baseline_max_tokens,
      adjustment_reason: args.adjustment_reason,
      correlationId,
    });

    // Find the active prompt to update
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.prompt_name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("desc")
      .first();

    if (!prompt) {
      const errorMsg = `Active prompt not found: ${args.prompt_name}`;
      console.error("❌ PROMPT NOT FOUND", {
        prompt_name: args.prompt_name,
        correlationId,
      });
      throw new ConvexError(errorMsg);
    }

    // Prepare update object
    const updateData: any = {
      max_tokens: args.new_max_tokens,
      adjusted_at: Date.now(),
      adjustment_reason: args.adjustment_reason,
    };

    // Set baseline_max_tokens if not already set OR if explicitly provided
    if (args.baseline_max_tokens !== undefined) {
      updateData.baseline_max_tokens = args.baseline_max_tokens;
    } else if (!prompt.baseline_max_tokens) {
      // Backfill baseline with current max_tokens if not set
      updateData.baseline_max_tokens = prompt.max_tokens || args.new_max_tokens;
    }

    // Update the prompt
    await ctx.db.patch(prompt._id, updateData);

    console.log("✅ PROMPT TOKEN LIMIT UPDATED", {
      prompt_name: args.prompt_name,
      prompt_id: prompt._id,
      old_max_tokens: prompt.max_tokens,
      new_max_tokens: args.new_max_tokens,
      baseline_max_tokens: updateData.baseline_max_tokens,
      adjustment_reason: args.adjustment_reason,
      correlationId,
    });

    return {
      success: true,
      prompt_id: prompt._id,
      prompt_name: args.prompt_name,
      old_max_tokens: prompt.max_tokens,
      new_max_tokens: args.new_max_tokens,
      baseline_max_tokens: updateData.baseline_max_tokens || prompt.baseline_max_tokens, // Return existing if not updated
      adjusted_at: updateData.adjusted_at,
      adjustment_reason: args.adjustment_reason,
      correlationId,
    };
  },
});

/**
 * Reset prompt token limit to baseline - Story 6.9 - Task 8
 * Reverts max_tokens back to baseline_max_tokens and clears adjustment metadata
 */
export const resetPromptToBaseline = mutation({
  args: {
    sessionToken: v.string(),
    prompt_name: v.string(),
    correlation_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlation_id || `token-reset-${Date.now()}`;

    // Authenticate user
    const sessionToken = args.sessionToken;
    // @ts-ignore - Type inference issue with internal.auth.verifySession
    const user: any = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken,
    });

    if (!user) {
      throw new ConvexError("Authentication required");
    }

    // Find the active prompt
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.prompt_name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("desc")
      .first();

    if (!prompt) {
      throw new ConvexError(`Active prompt not found: ${args.prompt_name}`);
    }

    // Check if baseline exists
    if (!prompt.baseline_max_tokens) {
      throw new ConvexError(`Prompt has no baseline_max_tokens set: ${args.prompt_name}`);
    }

    // Check if already at baseline
    if (prompt.max_tokens === prompt.baseline_max_tokens) {
      console.log("⚠️ PROMPT ALREADY AT BASELINE", {
        prompt_name: args.prompt_name,
        baseline_max_tokens: prompt.baseline_max_tokens,
        correlationId,
      });

      return {
        success: true,
        prompt_id: prompt._id,
        prompt_name: args.prompt_name,
        old_max_tokens: prompt.max_tokens,
        new_max_tokens: prompt.baseline_max_tokens,
        baseline_max_tokens: prompt.baseline_max_tokens,
        message: "Prompt already at baseline",
        correlationId,
      };
    }

    const oldMaxTokens = prompt.max_tokens;

    // Reset to baseline
    await ctx.db.patch(prompt._id, {
      max_tokens: prompt.baseline_max_tokens,
      adjusted_at: undefined, // Clear adjustment timestamp
      adjustment_reason: undefined, // Clear adjustment reason
    });

    console.log("✅ PROMPT RESET TO BASELINE", {
      prompt_name: args.prompt_name,
      prompt_id: prompt._id,
      old_max_tokens: oldMaxTokens,
      baseline_max_tokens: prompt.baseline_max_tokens,
      reset_by: user.email,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      prompt_id: prompt._id,
      prompt_name: args.prompt_name,
      old_max_tokens: oldMaxTokens,
      new_max_tokens: prompt.baseline_max_tokens,
      baseline_max_tokens: prompt.baseline_max_tokens,
      reset_by: user.email,
      correlationId,
    };
  },
});

/**
 * Story 6.9 - Task 8b: Acknowledge Prompt Token Adjustment
 *
 * Allows admins to acknowledge/approve automatic token limit adjustments.
 * This marks the adjustment as reviewed without changing the token limit.
 * Once acknowledged, the prompt no longer appears in the alert widget.
 *
 * @param sessionToken - User session token for authentication
 * @param prompt_name - Name of the prompt to acknowledge
 * @param correlation_id - Optional correlation ID for tracking
 * @returns Acknowledgment details including timestamp and admin info
 */
export const acknowledgePromptAdjustment = mutation({
  args: {
    sessionToken: v.string(),
    prompt_name: v.string(),
    correlation_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlation_id || `token-acknowledge-${Date.now()}`;

    console.log("🔔 ACKNOWLEDGE PROMPT ADJUSTMENT REQUEST", {
      prompt_name: args.prompt_name,
      correlationId,
    });

    // Verify authentication
    const sessionToken = args.sessionToken;
    // @ts-ignore - Type inference issue with internal.auth.verifySession
    const user: any = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken,
    });

    if (!user) {
      console.log("❌ ACKNOWLEDGE FAILED - Authentication required");
      throw new ConvexError("Authentication required");
    }

    // Developer access required
    if (!hasDeveloperAccess(user)) {
      console.log("❌ ACKNOWLEDGE FAILED - Developer access required", {
        user_email: user.email,
        user_role: user.role,
      });
      throw new ConvexError("Developer access required to acknowledge prompt adjustments");
    }

    // Find the prompt
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.prompt_name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("desc")
      .first();

    if (!prompt) {
      console.log("❌ ACKNOWLEDGE FAILED - Prompt not found", {
        prompt_name: args.prompt_name,
      });
      throw new ConvexError(`Active prompt not found: ${args.prompt_name}`);
    }

    // Verify prompt has been adjusted
    if (!prompt.adjusted_at) {
      console.log("⚠️ ACKNOWLEDGE WARNING - Prompt has no adjustments to acknowledge", {
        prompt_name: args.prompt_name,
      });
      return {
        success: true,
        message: "Prompt has no adjustments to acknowledge",
        prompt_name: args.prompt_name,
        correlationId,
      };
    }

    // Check if already acknowledged
    if (prompt.acknowledged_at) {
      console.log("ℹ️ ACKNOWLEDGE INFO - Prompt already acknowledged", {
        prompt_name: args.prompt_name,
        acknowledged_at: prompt.acknowledged_at,
        acknowledged_by: prompt.acknowledged_by,
      });
      return {
        success: true,
        message: "Prompt adjustment already acknowledged",
        prompt_name: args.prompt_name,
        acknowledged_at: prompt.acknowledged_at,
        acknowledged_by: prompt.acknowledged_by,
        correlationId,
      };
    }

    // Acknowledge the adjustment
    const now = Date.now();
    await ctx.db.patch(prompt._id, {
      acknowledged_at: now,
      acknowledged_by: user._id,
    });

    console.log("✅ PROMPT ADJUSTMENT ACKNOWLEDGED", {
      prompt_name: args.prompt_name,
      baseline_max_tokens: prompt.baseline_max_tokens,
      current_max_tokens: prompt.max_tokens,
      difference: (prompt.max_tokens || 0) - (prompt.baseline_max_tokens || 0),
      adjusted_at: prompt.adjusted_at,
      adjustment_reason: prompt.adjustment_reason,
      acknowledged_at: now,
      acknowledged_by: user.email,
      correlationId,
    });

    return {
      success: true,
      message: "Prompt adjustment acknowledged successfully",
      prompt_name: args.prompt_name,
      baseline_max_tokens: prompt.baseline_max_tokens,
      current_max_tokens: prompt.max_tokens,
      difference: (prompt.max_tokens || 0) - (prompt.baseline_max_tokens || 0),
      adjusted_at: prompt.adjusted_at,
      adjustment_reason: prompt.adjustment_reason,
      acknowledged_at: now,
      acknowledged_by: user.email,
      correlationId,
    };
  },
});

// Developer scope system removed - direct production prompt editing now supported

/**
 * Story 11.1: Analysis Prompt Functions
 */

/**
 * Task 9: List prompts filtered by data source
 */
export const listPromptsByDataSource = query({
  args: {
    dataSourceId: v.id("data_source_profiles"),
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_data_source", (q) => q.eq("data_source_id", args.dataSourceId))
      .collect();

    // Include prompt group information
    const promptsWithGroups = await Promise.all(
      prompts.map(async (prompt) => {
        if (prompt.group_id) {
          const group = await ctx.db.get(prompt.group_id);
          return {
            ...prompt,
            group_name: group?.group_name,
            group_display_order: group?.display_order,
          };
        }
        return {
          ...prompt,
          group_name: undefined,
          group_display_order: undefined,
        };
      })
    );

    // Order by display_order (nulls last)
    return promptsWithGroups.sort((a, b) => {
      const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  },
});

/**
 * Task 10: Get prompts grouped by group_id
 */
export const getPromptsByGroup = query({
  args: {
    execution_mode: v.optional(v.union(
      v.literal("single"),
      v.literal("batch_analysis")
    )),
  },
  handler: async (ctx, args) => {
    // Get all prompts (filtered by execution_mode if provided)
    const prompts = args.execution_mode
      ? await ctx.db
          .query("ai_prompts")
          .withIndex("by_execution_mode", (q) =>
            q.eq("execution_mode", args.execution_mode)
          )
          .collect()
      : await ctx.db.query("ai_prompts").collect();

    // Get all groups
    const groups = await ctx.db
      .query("prompt_groups")
      .collect();

    // Create group map
    const groupMap = new Map(groups.map(g => [g._id, g]));

    // Group prompts by group_id
    const grouped = new Map<string, any>();
    const ungrouped: any[] = [];

    for (const prompt of prompts) {
      if (prompt.group_id) {
        const group = groupMap.get(prompt.group_id);
        if (group) {
          const groupId = group._id;
          if (!grouped.has(groupId)) {
            grouped.set(groupId, {
              group: group,
              prompts: [],
            });
          }
          grouped.get(groupId)!.prompts.push(prompt);
        } else {
          ungrouped.push(prompt);
        }
      } else {
        ungrouped.push(prompt);
      }
    }

    // Sort groups by display_order
    const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
      const orderA = a.group.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.group.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    // Sort prompts within each group by display_order
    sortedGroups.forEach(group => {
      group.prompts.sort((a: any, b: any) => {
        const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    });

    // Sort ungrouped prompts
    ungrouped.sort((a, b) => {
      const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    return {
      groups: sortedGroups,
      ungrouped,
    };
  },
});

/**
 * Internal helper functions for migrations
 * These functions bypass authentication for system-level operations
 */

/**
 * List all prompts (for migration purposes)
 */
export const _internal_listAllPrompts = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ai_prompts").collect();
  },
});

/**
 * Update prompt (for migration purposes)
 */
export const _internal_updatePrompt = internalMutation({
  args: {
    promptId: v.id("ai_prompts"),
    execution_mode: v.optional(v.union(
      v.literal("single"),
      v.literal("batch_analysis")
    )),
    prompt_type: v.optional(v.union(
      v.literal("generation"),
      v.literal("predicate"),
      v.literal("classification"),
      v.literal("observation")
    )),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.execution_mode !== undefined) updates.execution_mode = args.execution_mode;
    if (args.prompt_type !== undefined) updates.prompt_type = args.prompt_type;

    await ctx.db.patch(args.promptId, updates);
    return { success: true };
  },
});