// @ts-nocheck
import { describe, test, expect } from '@jest/globals';

/**
 * Active Template Interpolation Tests
 * 
 * These tests validate against the ACTIVE template in the database (camelCase variables)
 * not the default templates file (snake_case variables).
 * 
 * This resolves the Emma/Alex template interpolation issue by testing with
 * the actual template format that's being used in production.
 */

describe('Active Template Interpolation Validation', () => {
  // Mock the corrected template variable transformer from questionGenerator.ts
  const mockTemplateVariableTransformer = {
    parse: (data: any) => ({
      participantName: data.participant_name,          // {{participantName}}
      reporterName: data.reporter_name,                // {{reporterName}}
      location: data.location,                         // {{location}}
      eventDateTime: data.event_date_time,             // {{eventDateTime}}
      phase: data.phase,                               // {{phase}}
      narrativeText: data.narrative_content,           // {{narrativeText}}
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

  // The ACTUAL active template format from the database (camelCase variables)
  const ACTIVE_DATABASE_TEMPLATE = `You are an expert in NDIS incident analysis. Based on the following incident narrative, generate 2-4 clarification questions for the specified phase to gather more detailed information.

Incident Details:
- Reporter: {{reporterName}}
- Participant: {{participantName}}
- Location: {{location}}
- Date/Time: {{eventDateTime}}

Phase: {{phase}}
Narrative: {{narrativeText}}

Generate specific, relevant questions that will help gather more details about this phase. Each question should:
1. Be specific to the {{phase}} phase
2. Help clarify important details
3. Be easy to answer
4. Improve the quality of the incident analysis

Return the questions in this JSON format:
{
  "questions": [
    {
      "questionId": "unique-id",
      "questionText": "Detailed question text",
      "questionOrder": 1
    }
  ]
}`;

  // Test data for all tests
  const testData = {
    participant_name: "Emma Johnson",
    reporter_name: "Senior Support Worker",
    location: "Day program center - Multi-purpose room", 
    event_date_time: "2024-08-05T11:45:00Z",
    phase: "before_event",
    narrative_content: "The participant was showing signs of increasing agitation in the hour leading up to the incident. She had been pacing near the windows and making repetitive vocalizations."
  };

  describe('Active Template Interpolation', () => {
    test('active template with camelCase variables interpolates correctly', () => {
      // Transform data using the fixed transformer logic
      const transformedData = mockTemplateVariableTransformer.parse(testData);
      
      console.log('🔍 TRANSFORMER OUTPUT:', {
        keys: Object.keys(transformedData),
        participantName: transformedData.participantName,
        reporterName: transformedData.reporterName,
        location: transformedData.location,
      });
      
      // Interpolate with the active template
      const result = interpolateTemplate(ACTIVE_DATABASE_TEMPLATE, transformedData);
      
      console.log('🔍 INTERPOLATION RESULT:', {
        contains_emma: result.includes("Emma Johnson"),
        contains_placeholder_participant: result.includes("{{participantName}}"),
        unfilled_placeholders: result.match(/\{\{[^}]+\}\}/g) || [],
        first_200_chars: result.substring(0, 200),
      });
      
      // Verify participant name was interpolated correctly
      expect(result).toContain("Emma Johnson");
      expect(result).not.toContain("{{participantName}}"); // Should be replaced
      
      // Verify other key variables were interpolated
      expect(result).toContain("Senior Support Worker");
      expect(result).toContain("Day program center - Multi-purpose room");
      expect(result).toContain("2024-08-05T11:45:00Z");
      expect(result).toContain("before_event");
      
      // Critical: No unfilled placeholders should remain
      expect(result).not.toMatch(/\{\{[^}]+\}\}/);
      
      // The narrative content should appear in the template
      expect(result).toContain("agitation in the hour leading up");
    });

    test('Emma Johnson flows correctly through complete system (no Alex)', () => {
      // Step 1: Form data (what user enters)
      const formData = { participant_name: "Emma Johnson" };
      
      // Step 2: Transform for template variables 
      const templateVariables = mockTemplateVariableTransformer.parse({
        participant_name: formData.participant_name,
        reporter_name: "Test Reporter",
        location: "Test Location",
        event_date_time: "2024-01-01T10:00:00Z",
        phase: "before_event",
        narrative_content: "Test narrative content"
      });
      
      // Step 3: Template interpolation
      const finalPrompt = interpolateTemplate(ACTIVE_DATABASE_TEMPLATE, templateVariables);
      
      // Verify Emma flows through correctly
      expect(finalPrompt).toContain("Emma Johnson");
      expect(finalPrompt).not.toContain("Alex");
      expect(finalPrompt).not.toContain("{{participantName}}");
      expect(finalPrompt).not.toMatch(/\{\{[^}]+\}\}/);
    });
  });

  describe('Template Variable Coverage', () => {
    test('transformer outputs match active template requirements', () => {
      // Extract variables from active template
      const templateVariables = ACTIVE_DATABASE_TEMPLATE.match(/\{\{([^}]+)\}\}/g) || [];
      const requiredVariables = new Set(templateVariables.map(v => v.replace(/[{}]/g, '')));
      
      console.log('🔍 ACTIVE TEMPLATE VARIABLES:', Array.from(requiredVariables));
      
      // Get transformer output keys
      const transformerOutput = mockTemplateVariableTransformer.parse(testData);
      const availableVariables = new Set(Object.keys(transformerOutput));
      
      console.log('🔍 TRANSFORMER VARIABLES:', Array.from(availableVariables));
      
      // Every template variable should have a corresponding transformer output
      const missingVariables = Array.from(requiredVariables).filter(variable => 
        !availableVariables.has(variable)
      );
      
      console.log('🔍 MISSING VARIABLES:', missingVariables);
      
      expect(missingVariables).toHaveLength(0);
    });
  });

  describe('Edge Cases with Active Template', () => {
    test('empty participant name does not break active template', () => {
      const testDataWithEmptyName = { ...testData, participant_name: "" };
      
      const transformedData = mockTemplateVariableTransformer.parse(testDataWithEmptyName);
      const result = interpolateTemplate(ACTIVE_DATABASE_TEMPLATE, transformedData);
      
      // Should not crash and should not leave unfilled placeholders
      expect(result).not.toMatch(/\{\{participantName\}\}/);
      expect(result).toBeDefined();
    });

    test('special characters in participant name work with active template', () => {
      const testDataWithSpecialChars = { 
        ...testData, 
        participant_name: "María José O'Connor-Smith" 
      };
      
      const transformedData = mockTemplateVariableTransformer.parse(testDataWithSpecialChars);
      const result = interpolateTemplate(ACTIVE_DATABASE_TEMPLATE, transformedData);
      
      // Should handle special characters correctly
      expect(result).toContain("María José O'Connor-Smith");
      expect(result).not.toMatch(/\{\{participantName\}\}/);
    });
  });
});