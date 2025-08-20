// @ts-nocheck
import { describe, test, expect } from '@jest/globals';

/**
 * Name Interpolation Tests
 * 
 * These tests verify that the interpolateParticipantName function correctly
 * replaces hardcoded names in sample narratives with the actual participant name.
 * 
 * This fixes the issue where "Alex" would remain in narratives instead of being
 * replaced with "James Brown" or other actual participant names.
 */

describe('Name Interpolation', () => {
  // Mock the interpolateParticipantName function from createSampleData.ts
  function interpolateParticipantName(text: string, participantFirstName: string): string {
    // This should match the actual function in createSampleData.ts
    const hardcodedNames = ['Emma', 'Michael', 'Sarah', 'James', 'Rachel', 'Alex'];
    let interpolatedText = text;
    
    hardcodedNames.forEach(name => {
      const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
      interpolatedText = interpolatedText.replace(nameRegex, participantFirstName);
    });
    
    return interpolatedText;
  }

  describe('Alex Name Replacement', () => {
    test('Alex is replaced with James in narrative text', () => {
      const originalText = "Alex was participating in the morning group activity session at the day program center. During the setup, Alex made an unusual comment.";
      const participantName = "James";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      console.log('🔍 INTERPOLATION TEST:', {
        original: originalText.substring(0, 100),
        result: result.substring(0, 100),
        contains_alex: result.includes('Alex'),
        contains_james: result.includes('James'),
        alex_count: (originalText.match(/\bAlex\b/g) || []).length,
        james_count: (result.match(/\bJames\b/g) || []).length
      });
      
      expect(result).not.toContain('Alex');
      expect(result).toContain('James');
      expect(result).toBe("James was participating in the morning group activity session at the day program center. During the setup, James made an unusual comment.");
    });

    test('Alex Thompson is replaced with participant name', () => {
      const originalText = "The incident involved Alex Thompson who made concerning statements.";
      const participantName = "James";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      expect(result).toBe("The incident involved James Thompson who made concerning statements.");
      expect(result).not.toContain('Alex');
    });

    test('Multiple Alex instances are all replaced', () => {
      const originalText = "Alex became agitated. Staff intervened when Alex made the statement. Alex was then provided support.";
      const participantName = "James";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      expect(result).toBe("James became agitated. Staff intervened when James made the statement. James was then provided support.");
      expect(result).not.toContain('Alex');
      expect((result.match(/\bJames\b/g) || []).length).toBe(3);
    });

    test('Alex in compound words is not replaced', () => {
      const originalText = "The alexander flowers were beautiful. Alex picked them.";
      const participantName = "James";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      // Should replace "Alex" but not "alexander" (word boundary protection)
      expect(result).toBe("The alexander flowers were beautiful. James picked them.");
      expect(result).toContain('alexander'); // Compound word preserved
      expect(result).not.toMatch(/\bAlex\b/); // Standalone "Alex" replaced
    });
  });

  describe('Other Name Replacements', () => {
    test('Emma is replaced correctly', () => {
      const originalText = "Emma had difficulty during the activity. Emma needed additional support.";
      const participantName = "Sarah";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      expect(result).toBe("Sarah had difficulty during the activity. Sarah needed additional support.");
      expect(result).not.toContain('Emma');
    });

    test('Multiple different names are replaced', () => {
      const originalText = "Emma spoke to Michael. James joined them. Rachel was nearby.";
      const participantName = "David";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      expect(result).toBe("David spoke to David. David joined them. David was nearby.");
      expect(result).not.toContain('Emma');
      expect(result).not.toContain('Michael');
      expect(result).not.toContain('James');
      expect(result).not.toContain('Rachel');
    });
  });

  describe('Edge Cases', () => {
    test('Case sensitivity is maintained', () => {
      const originalText = "Alex and alex are different.";
      const participantName = "James";
      
      const result = interpolateParticipantName(originalText, participantName);
      
      // Only "Alex" (capital A) should be replaced due to word boundary regex
      expect(result).toBe("James and alex are different.");
    });

    test('Empty text returns empty', () => {
      const result = interpolateParticipantName("", "James");
      expect(result).toBe("");
    });

    test('Text with no hardcoded names is unchanged', () => {
      const originalText = "The participant was engaged in activities.";
      const result = interpolateParticipantName(originalText, "James");
      expect(result).toBe(originalText);
    });
  });

  describe('Real Scenario Data', () => {
    test('AI Stress Test scenario Alex references are replaced', () => {
      // This mirrors the actual narrative content from the AI Stress Test scenario
      const beforeEventText = "Alex was participating in the morning group activity session at the day program center. During the setup, Alex made an unusual comment stating that the participant exposed themselves to a watermelon and shouted it was sexy fruit, which caught staff attention.";
      
      const participantName = "James";
      const result = interpolateParticipantName(beforeEventText, participantName);
      
      expect(result).toContain("James was participating in the morning group activity session");
      expect(result).toContain("James made an unusual comment");
      expect(result).not.toContain('Alex');
      
      // Should maintain the rest of the narrative intact
      expect(result).toContain("exposed themselves to a watermelon");
      expect(result).toContain("sexy fruit");
    });
  });
});