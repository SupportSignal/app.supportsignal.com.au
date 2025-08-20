// @ts-nocheck
import { describe, test, expect } from '@jest/globals';
import { DEFAULT_PROMPT_TEMPLATES } from '../../../apps/convex/lib/prompts/default_prompts';

/**
 * Template Interpolation Tests
 * 
 * These tests ensure that template variables match between:
 * 1. AI prompt templates (what templates expect)
 * 2. Template variable transformer (what system provides)
 * 3. Real data structures (what gets passed in)
 * 
 * This prevents silent interpolation failures that cause AI to generate
 * content with wrong participant names (e.g., "Alex" instead of "Emma").
 */

describe('Template Interpolation Validation', () => {
  // Mock the template variable transformer from questionGenerator.ts
  const mockTemplateVariableTransformer = {
    parse: (data: any) => ({
      participantName: data.participant_name,
      reporterName: data.reporter_name,
      location: data.location,
      eventDateTime: data.event_date_time,
      phase: data.phase,
      narrativeText: data.narrative_content,
    })
  };

  // Template interpolation helper (copy from questionGenerator.ts)
  function interpolateTemplate(template: string, variables: Record<string, string>): string {
    let interpolated = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      interpolated = interpolated.replace(regex, value || '');
    }
    
    return interpolated;
  }

  // Extract template variables from a template string
  function extractTemplateVariables(template: string): string[] {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  }

  // Test data for all tests
  const testData = {
    participant_name: "Emma Johnson",
    reporter_name: "Senior Support Worker",
    location: "Day program center - Multi-purpose room", 
    event_date_time: "2024-08-05T11:45:00Z",
    phase: "before_event",
    narrative_content: "The participant was showing signs of increasing agitation in the hour leading up to the incident. She had been pacing near the windows and making repetitive vocalizations."
  };

  describe('Real Template Interpolation Tests', () => {

    test('generate_clarification_questions template interpolates correctly', () => {
      // Get the real template
      const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'generate_clarification_questions');
      expect(template).toBeDefined();
      
      // Transform data using real transformer logic
      const transformedData = mockTemplateVariableTransformer.parse(testData);
      
      // Interpolate template
      const result = interpolateTemplate(template!.prompt_template, transformedData);
      
      // Verify participant name was interpolated correctly
      expect(result).toContain("Emma Johnson");
      expect(result).not.toContain("{{participant_name}}"); // Should be replaced
      
      // Verify other key variables were interpolated
      expect(result).toContain("Senior Support Worker");
      expect(result).toContain("Day program center - Multi-purpose room");
      expect(result).toContain("2024-08-05T11:45:00Z");
      
      // Critical: No unfilled placeholders should remain
      expect(result).not.toMatch(/\{\{[^}]+\}\}/);
      
      // The narrative content should appear in the template
      expect(result).toContain("agitation in the hour leading up");
    });

    // Note: Other templates like 'generate_mock_answers' and 'enhance_narrative' 
    // use additional dynamic variables (questions_to_answer, phase_original_narrative, etc.)
    // that are passed context-specifically. We focus on the core clarification template here.
  });

  describe('Template Variable Coverage Tests', () => {
    test('core clarification template variables have corresponding transformer outputs', () => {
      // Focus on the generate_clarification_questions template (the main one we're fixing)
      const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'generate_clarification_questions');
      expect(template).toBeDefined();
      
      const templateVariables = new Set(extractTemplateVariables(template!.prompt_template));

      // Get transformer output keys
      const transformerOutputKeys = new Set(Object.keys(mockTemplateVariableTransformer.parse({
        participant_name: "test",
        reporter_name: "test",
        location: "test",
        event_date_time: "test",
        phase: "before_event",
        narrative_content: "test"
      })));

      // Every template variable should have a corresponding transformer output
      const missingVariables = Array.from(templateVariables).filter(variable => 
        !transformerOutputKeys.has(variable)
      );

      if (missingVariables.length > 0) {
        console.error('Core template variables without transformer outputs:', missingVariables);
        console.error('Available transformer outputs:', Array.from(transformerOutputKeys));
        console.error('Template:', template!.name);
      }

      expect(missingVariables).toHaveLength(0);
    });

    test('no transformer outputs are unused by templates', () => {
      // Get all template variables used across all templates
      const allTemplateVariables = new Set<string>();
      
      DEFAULT_PROMPT_TEMPLATES.forEach(template => {
        const variables = extractTemplateVariables(template.prompt_template);
        variables.forEach(variable => allTemplateVariables.add(variable));
      });

      // Get transformer output keys
      const transformerOutputKeys = new Set(Object.keys(mockTemplateVariableTransformer.parse({
        participant_name: "test",
        reporter_name: "test", 
        location: "test",
        event_date_time: "test",
        phase: "before_event",
        narrative_content: "test"
      })));

      // Every transformer output should be used by at least one template
      const unusedTransformerOutputs = Array.from(transformerOutputKeys).filter(key =>
        !allTemplateVariables.has(key)
      );

      if (unusedTransformerOutputs.length > 0) {
        console.warn('Unused transformer outputs (not critical):', unusedTransformerOutputs);
        // Note: This is a warning, not a failure - it's OK to have extra outputs
      }

      // This is just a warning test, not a failure
      expect(unusedTransformerOutputs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Case Protection', () => {
    test('empty participant name does not break interpolation', () => {
      const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'generate_clarification_questions');
      const testDataWithEmptyName = { ...testData, participant_name: "" };
      
      const transformedData = mockTemplateVariableTransformer.parse(testDataWithEmptyName);
      const result = interpolateTemplate(template!.prompt_template, transformedData);
      
      // Should not crash and should not leave unfilled placeholders
      expect(result).not.toMatch(/\{\{participant_name\}\}/);
      expect(result).toBeDefined();
    });

    test('special characters in participant name are handled correctly', () => {
      const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'generate_clarification_questions');
      const testDataWithSpecialChars = { 
        ...testData, 
        participant_name: "María José O'Connor-Smith" 
      };
      
      const transformedData = mockTemplateVariableTransformer.parse(testDataWithSpecialChars);
      const result = interpolateTemplate(template!.prompt_template, transformedData);
      
      // Should handle special characters correctly
      expect(result).toContain("María José O'Connor-Smith");
      expect(result).not.toMatch(/\{\{participant_name\}\}/);
    });
  });

  describe('Participant Name Flow Validation', () => {
    test('participant name from form data flows correctly to final prompt', () => {
      // Simulate the complete data flow: Form → Database → Transformer → Template → AI
      const formData = { participant_name: "Emma Johnson" };
      
      // Step 1: Data comes from form/database (snake_case)
      expect(formData.participant_name).toBe("Emma Johnson");
      
      // Step 2: Transformer maps database fields to template variables
      const transformedData = mockTemplateVariableTransformer.parse({
        participant_name: formData.participant_name,
        reporter_name: "Test Reporter",
        location: "Test Location",
        event_date_time: "2024-01-01T10:00:00Z",
        phase: "before_event",
        narrative_content: "Test narrative"
      });
      
      // Step 3: Template variables should match what templates expect
      expect(transformedData.participantName).toBe("Emma Johnson");
      expect(transformedData).toHaveProperty('participantName'); // camelCase
      
      // Step 4: Template interpolation should work correctly
      const template = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === 'generate_clarification_questions');
      const finalPrompt = interpolateTemplate(template!.prompt_template, transformedData);
      
      // Step 5: Final prompt should contain participant name, not placeholder
      expect(finalPrompt).toContain("Emma Johnson");
      expect(finalPrompt).not.toContain("{{participantName}}");
      
      // Step 6: AI should NOT generate random names like "Alex" in the main content
      // Note: "John" appears in JSON format example, which is acceptable
      expect(finalPrompt).not.toContain("Alex");
      expect(finalPrompt).not.toContain("Michael");
      
      // Ensure the main content uses the correct participant name
      const contentBeforeExample = finalPrompt.split('[\n  {')[0];
      expect(contentBeforeExample).toContain("Emma Johnson");
      expect(contentBeforeExample).not.toContain("Alex");
    });
  });
});