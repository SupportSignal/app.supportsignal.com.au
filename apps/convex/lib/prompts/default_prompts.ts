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
    prompt_template: `You are an expert NDIS incident documentation specialist. Your task is to create a comprehensive, well-structured incident narrative by combining original observations with additional clarification details.

**Incident Overview:**
- **Participant**: {{participant_name}}
- **Date/Time**: {{event_date_time}}
- **Location**: {{incident_location}}
- **Reporter**: {{reporter_name}}

**Original Narrative:**
{{existing_narrative}}

**Additional Details from Clarifications:**
{{clarification_responses}}

**Your Task:**
Create an enhanced, comprehensive narrative that:
1. **Integrates** original content with clarification responses seamlessly
2. **Maintains** chronological flow and factual accuracy
3. **Preserves** the reporter's voice and observations
4. **Adds** clarified details in appropriate context
5. **Ensures** professional, respectful language throughout

**Guidelines:**
- Keep the participant's dignity and privacy central
- Use clear, professional language suitable for NDIS reporting
- Maintain factual accuracy - don't infer beyond provided information
- Structure content logically (chronological or thematic as appropriate)
- Ensure all important details from both sources are included

**Output Format:**
Provide the enhanced narrative as a single, well-structured paragraph or series of paragraphs. Do not include headers, bullets, or JSON formatting - just the enhanced narrative text.`,
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
        name: "existing_narrative",
        description: "Original narrative content to be enhanced",
        type: "string" as const,
        required: true,
      },
      {
        name: "clarification_responses",
        description: "Additional details gathered through clarification questions",
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