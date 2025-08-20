// Default prompt templates for incident workflow (Stories 3.2 and 3.3)

export const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: "generate_clarification_questions",
    description: "Generate clarification questions based on incident narrative to gather additional details",
    category: "clarification_questions" as const,
    prompt_template: `You are an expert incident analyst helping to gather additional details about an NDIS incident involving {{participant_name}}.

**Incident Context:**
- **Participant**: {{participant_name}}
- **Date/Time**: {{event_date_time}}
- **Location**: {{incident_location}}
- **Reporter**: {{reporter_name}}

**Current Narrative ({{narrative_phase}} phase):**
{{existing_narrative}}

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
    variables: [
      {
        name: "participant_name",
        description: "NDIS participant name",
        type: "string" as const,
        required: true,
      },
      {
        name: "event_date_time",
        description: "Date and time of incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "incident_location",
        description: "Location where incident occurred",
        type: "string" as const,
        required: false,
        default_value: "unspecified location"
      },
      {
        name: "reporter_name",
        description: "Name of person reporting incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "narrative_phase",
        description: "Phase of narrative being clarified",
        type: "string" as const,
        required: true,
      },
      {
        name: "existing_narrative",
        description: "Current narrative content for the phase",
        type: "string" as const,
        required: true,
      }
    ]
  },
  {
    name: "enhance_narrative",
    description: "Enhance incident narrative by combining original content with clarification responses",
    category: "narrative_enhancement" as const,
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create enhanced narrative sections by naturally integrating original observations with clarification responses.

**Incident Overview:**
- **Participant**: {{participant_name}}
- **Date/Time**: {{event_date_time}}
- **Location**: {{incident_location}}
- **Reporter**: {{reporter_name}}

**Original Narrative ({{narrative_phase}} phase):**
{{phase_original_narrative}}

**Clarification Responses ({{narrative_phase}} phase):**
{{phase_clarification_responses}}

**Your Task:**
Create an enhanced narrative for the {{narrative_phase}} phase that:

1. **Preserves Original Meaning**: Keep the reporter's original observations and tone intact
2. **Light Grammar Improvements**: Fix only basic grammar, spelling, and sentence structure issues
3. **Natural Integration**: Weave clarification responses seamlessly into the narrative flow
4. **Maintains Authenticity**: Should read as if the reporter wrote it correctly the first time
5. **No Hallucinations**: Use only information provided - do not add assumptions or interpretations

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

**Output Format:**
Provide only the enhanced narrative text for the {{narrative_phase}} phase. Do not include headers, bullets, or explanations - just the improved narrative that combines original content with clarifications naturally.`,
    variables: [
      {
        name: "participant_name",
        description: "NDIS participant name",
        type: "string" as const,
        required: true,
      },
      {
        name: "event_date_time",
        description: "Date and time of incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "incident_location",
        description: "Location where incident occurred",
        type: "string" as const,
        required: false,
        default_value: "unspecified location"
      },
      {
        name: "reporter_name",
        description: "Name of person reporting incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "narrative_phase",
        description: "Phase of the narrative being enhanced (before_event, during_event, end_event, post_event)",
        type: "string" as const,
        required: true,
      },
      {
        name: "phase_original_narrative",
        description: "Original narrative content for this specific phase",
        type: "string" as const,
        required: true,
      },
      {
        name: "phase_clarification_responses",
        description: "Clarification responses specific to this phase only",
        type: "string" as const,
        required: true,
      }
    ]
  },
  {
    name: "generate_mock_answers",
    description: "Generate realistic mock answers for clarification questions about an NDIS incident report",
    category: "sample_data" as const,
    prompt_template: `You are generating realistic mock answers for clarification questions about an NDIS incident report.

**Incident Context:**
- **Participant**: {{participant_name}}
- **Reporter**: {{reporter_name}}
- **Location**: {{incident_location}}
- **Date/Time**: {{event_date_time}}

**Phase**: {{narrative_phase}} phase of the incident

**Original Narrative for Context:**
{{existing_narrative}}

**Clarification Questions to Answer:**
{{questions_to_answer}}

**Your Task:**
Generate realistic, detailed answers to the clarification questions provided. The answers should:

1. **Be consistent** with the narrative and incident context
2. **Sound authentic** like they come from someone who witnessed the incident  
3. **Include specific details** that would be helpful for incident documentation
4. **Use professional but conversational tone** appropriate for NDIS reporting
5. **Vary in length** - some brief, some more detailed as appropriate
6. **Respect participant dignity** and use person-first language

**Output Format:**
Return only a JSON array (no markdown formatting):
[
  {
    "question_id": "question-id-here",
    "answer": "Detailed, realistic answer here"
  }
]

Ensure all answers are factual, helpful, and maintain the professional standards expected in NDIS incident reporting.`,
    variables: [
      {
        name: "participant_name",
        description: "NDIS participant name",
        type: "string" as const,
        required: true,
      },
      {
        name: "reporter_name", 
        description: "Name of person reporting incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "incident_location",
        description: "Location where incident occurred",
        type: "string" as const,
        required: false,
        default_value: "unspecified location"
      },
      {
        name: "event_date_time",
        description: "Date and time of incident",
        type: "string" as const,
        required: true,
      },
      {
        name: "narrative_phase",
        description: "Phase of narrative (before_event, during_event, end_event, post_event)",
        type: "string" as const,
        required: true,
      },
      {
        name: "existing_narrative",
        description: "Original narrative content for context",
        type: "string" as const,
        required: true,
      },
      {
        name: "questions_to_answer",
        description: "JSON array or text list of clarification questions to answer",
        type: "string" as const,
        required: true,
      }
    ]
  },
  {
    name: "system_test_template",
    description: "Simple template for testing prompt management system functionality",
    category: "general" as const,
    prompt_template: `This is a test template for the prompt management system.

**User**: {{user_name}}
**Test Parameter**: {{test_value}}
**Optional Setting**: {{optional_param}}

This template is used to verify that the prompt management system can:
- Substitute required variables correctly
- Handle optional variables with defaults
- Process different variable types

Current test value is: {{test_value}}
User {{user_name}} is testing the system.
{{optional_param}}`,
    variables: [
      {
        name: "user_name",
        description: "Name of the user running the test",
        type: "string" as const,
        required: true,
      },
      {
        name: "test_value",
        description: "Test value for system validation",
        type: "number" as const,
        required: true,
      },
      {
        name: "optional_param",
        description: "Optional parameter with default",
        type: "string" as const,
        required: false,
        default_value: "Default test message"
      }
    ]
  }
];

// Get template by name for seeding
export function getDefaultTemplate(name: string) {
  return DEFAULT_PROMPT_TEMPLATES.find(template => template.name === name);
}

// Validate all default templates
export function validateDefaultTemplates(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const template of DEFAULT_PROMPT_TEMPLATES) {
    // Check for required fields
    if (!template.name || !template.description || !template.prompt_template) {
      errors.push(`Template "${template.name || 'unnamed'}" missing required fields`);
      continue;
    }

    // Check variable definitions
    if (!Array.isArray(template.variables)) {
      errors.push(`Template "${template.name}" has invalid variables array`);
      continue;
    }

    // Validate each variable
    for (const variable of template.variables) {
      if (!variable.name || !variable.description || !variable.type) {
        errors.push(`Template "${template.name}" has invalid variable definition`);
      }

      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable.name)) {
        errors.push(`Template "${template.name}" has invalid variable name: ${variable.name}`);
      }
    }

    // Basic template syntax check
    const braceCount = (template.prompt_template.match(/\{\{/g) || []).length;
    const closeBraceCount = (template.prompt_template.match(/\}\}/g) || []).length;
    if (braceCount !== closeBraceCount) {
      errors.push(`Template "${template.name}" has unmatched braces`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}