// Prompt template resolution and variable substitution service
// Handles {{variable_name}} placeholders and validation

export interface VariableDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default_value?: string;
}

export interface PromptResolutionResult {
  resolvedPrompt: string;
  variablesUsed: Record<string, any>;
  errors: string[];
  processingTimeMs: number;
}

export class PromptResolver {
  // Extract variable placeholders from template
  static extractVariables(template: string): string[] {
    const variableRegex = /\{\{([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // Validate template variables against definition
  static validateTemplate(template: string, variableDefinitions: VariableDefinition[]): string[] {
    const errors: string[] = [];
    const templateVariables = this.extractVariables(template);
    const definedVariables = variableDefinitions.map(v => v.name);

    // Check for variables in template not defined in schema
    for (const templateVar of templateVariables) {
      // Handle nested variables (e.g., participant.name)
      const baseVar = templateVar.split('.')[0];
      if (!definedVariables.includes(baseVar)) {
        errors.push(`Template uses undefined variable: ${templateVar}`);
      }
    }

    // Check for required variables not used in template
    for (const varDef of variableDefinitions) {
      if (varDef.required && !templateVariables.some(tv => tv.startsWith(varDef.name))) {
        errors.push(`Required variable "${varDef.name}" not found in template`);
      }
    }

    return errors;
  }

  // Get nested property value safely
  static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  // Type conversion and validation
  static validateAndConvertValue(value: any, type: 'string' | 'number' | 'boolean', varName: string): { value: any; error?: string } {
    if (value === undefined || value === null) {
      return { value: null };
    }

    try {
      switch (type) {
        case 'string':
          return { value: String(value) };
        
        case 'number':
          const numValue = typeof value === 'number' ? value : Number(value);
          if (isNaN(numValue)) {
            return { value: null, error: `Variable "${varName}" cannot be converted to number: ${value}` };
          }
          return { value: numValue };
        
        case 'boolean':
          if (typeof value === 'boolean') {
            return { value };
          }
          const strValue = String(value).toLowerCase();
          if (['true', '1', 'yes', 'on'].includes(strValue)) {
            return { value: true };
          } else if (['false', '0', 'no', 'off'].includes(strValue)) {
            return { value: false };
          }
          return { value: null, error: `Variable "${varName}" cannot be converted to boolean: ${value}` };
        
        default:
          return { value: String(value) };
      }
    } catch (error) {
      return { value: null, error: `Error converting variable "${varName}": ${error}` };
    }
  }

  // Resolve prompt template with variables
  static resolvePrompt(
    template: string,
    variables: Record<string, any>,
    variableDefinitions: VariableDefinition[]
  ): PromptResolutionResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const variablesUsed: Record<string, any> = {};

    // Validate template against definitions
    const templateErrors = this.validateTemplate(template, variableDefinitions);
    errors.push(...templateErrors);

    // Create variable lookup with defaults
    const variableLookup: Record<string, any> = { ...variables };
    
    // Apply defaults for missing variables
    for (const varDef of variableDefinitions) {
      if (!(varDef.name in variableLookup) && varDef.default_value !== undefined) {
        const converted = this.validateAndConvertValue(varDef.default_value, varDef.type, varDef.name);
        if (converted.error) {
          errors.push(`Default value error: ${converted.error}`);
        } else {
          variableLookup[varDef.name] = converted.value;
        }
      }
    }

    // Check required variables
    for (const varDef of variableDefinitions) {
      if (varDef.required && !(varDef.name in variableLookup)) {
        errors.push(`Required variable "${varDef.name}" is missing`);
      }
    }

    // Perform variable substitution
    let resolvedPrompt = template;
    const variableRegex = /\{\{([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\}\}/g;

    resolvedPrompt = resolvedPrompt.replace(variableRegex, (match, varPath) => {
      const value = this.getNestedValue(variableLookup, varPath);
      
      if (value === undefined || value === null) {
        errors.push(`Variable "${varPath}" resolved to null/undefined`);
        return match; // Keep original placeholder if resolution fails
      }

      // Find variable definition for type validation
      const baseVar = varPath.split('.')[0];
      const varDef = variableDefinitions.find(v => v.name === baseVar);
      
      if (varDef) {
        const converted = this.validateAndConvertValue(value, varDef.type, varPath);
        if (converted.error) {
          errors.push(converted.error);
          return match;
        }
        
        variablesUsed[varPath] = converted.value;
        return String(converted.value);
      }

      // Fallback for variables without definition
      variablesUsed[varPath] = value;
      return String(value);
    });

    const processingTimeMs = Date.now() - startTime;

    return {
      resolvedPrompt,
      variablesUsed,
      errors,
      processingTimeMs
    };
  }

  // Validate prompt template syntax
  static validateTemplateSyntax(template: string): string[] {
    const errors: string[] = [];
    
    // Check for unmatched braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for invalid variable names
    const variableRegex = /\{\{([^}]*)\}\}/g;
    let match;
    
    while ((match = variableRegex.exec(template)) !== null) {
      const varName = match[1].trim();
      
      // Check for empty variables
      if (!varName) {
        errors.push('Empty variable placeholder found: {{}}');
        continue;
      }

      // Validate variable name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*$/.test(varName)) {
        errors.push(`Invalid variable name format: ${varName}`);
      }
    }

    return errors;
  }

  // Extract template metadata
  static analyzeTemplate(template: string): {
    variables: string[];
    syntaxErrors: string[];
    estimatedComplexity: number;
  } {
    const variables = this.extractVariables(template);
    const syntaxErrors = this.validateTemplateSyntax(template);
    
    // Simple complexity estimate based on template length and variable count
    const estimatedComplexity = Math.min(
      Math.ceil(template.length / 1000) + variables.length,
      10
    );

    return {
      variables,
      syntaxErrors,
      estimatedComplexity
    };
  }
}

// Common variable definitions for incident workflow
export const INCIDENT_WORKFLOW_VARIABLES: VariableDefinition[] = [
  {
    name: 'participant_name',
    description: 'NDIS participant name',
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
    name: 'event_date_time',
    description: 'Date and time of incident',
    type: 'string',
    required: true,
  },
  {
    name: 'reporter_name',
    description: 'Name of person reporting incident',
    type: 'string',
    required: true,
  },
  {
    name: 'narrative_phase',
    description: 'Phase of narrative (before_event, during_event, end_event, post_event)',
    type: 'string',
    required: false,
  },
  {
    name: 'existing_narrative',
    description: 'Current narrative content for enhancement',
    type: 'string',
    required: false,
  },
];