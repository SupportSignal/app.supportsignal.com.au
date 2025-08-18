import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Fill Narrative Button Participant Name Interpolation
 * 
 * Purpose: Debug and verify that the "Fill Narrative" button correctly interpolates 
 * participant names from Step 1 into sample narratives in Step 2.
 * 
 * Issue Context: The button should replace "The participant" with the actual 
 * participant name, but it's showing "The participant" instead of the real name.
 * 
 * Test Flow:
 * 1. Navigate to incident creation workflow
 * 2. Fill Step 1 with participant name (e.g. "John Smith")
 * 3. Navigate to Step 2 
 * 4. Click "Fill Narrative" button
 * 5. Verify narratives contain "John" instead of "The participant"
 * 6. Capture console logs to analyze debug output
 */

test.describe('Fill Narrative Button - Participant Name Interpolation', () => {
  let consoleLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      // Log debug messages during test run
      if (text.includes('🔍 DEBUG')) {
        console.log('CONSOLE DEBUG:', text);
      }
    });
  });

  test('should interpolate participant name in sample narratives', async ({ page }) => {
    // Step 1: Navigate to incident creation workflow
    await page.goto('/new-incident');
    
    // Wait for the workflow to load
    await expect(page.locator('h1')).toContainText('Incident Capture Workflow');
    
    // Verify we're on Step 1 (Metadata Collection)
    await expect(page.locator('[data-testid="current-step"]')).toContainText('1');
    
    // Step 2: Fill in participant information
    const participantName = 'John Smith';
    
    // Look for the participant name field - try multiple selectors
    const participantField = page.locator('input[name="participant_name"]')
      .or(page.locator('input[placeholder*="participant"]'))
      .or(page.locator('label:has-text("Participant") + input'))
      .or(page.locator('label:has-text("Name") + input'))
      .first();
    
    await participantField.fill(participantName);
    
    // Fill other required fields to proceed to Step 2
    // Location field
    const locationField = page.locator('input[name="location"]')
      .or(page.locator('input[placeholder*="location"]'))
      .or(page.locator('label:has-text("Location") + input'))
      .first();
    
    await locationField.fill('Test Location - Community Center');
    
    // Date/time field 
    const dateField = page.locator('input[type="datetime-local"]')
      .or(page.locator('input[name*="date"]'))
      .or(page.locator('input[name*="time"]'))
      .first();
    
    await dateField.fill('2025-08-18T14:30');
    
    // Step 3: Navigate to Step 2 (Narrative Collection)
    const nextButton = page.locator('button:has-text("Next")')
      .or(page.locator('button:has-text("Continue")')
      .or(page.locator('button[type="submit"]')))
      .first();
    
    await nextButton.click();
    
    // Wait for Step 2 to load
    await expect(page.locator('[data-testid="current-step"]')).toContainText('2');
    await expect(page.locator('h2')).toContainText('Narrative Collection');
    
    // Step 4: Verify Developer Tools Bar is visible and click "Fill Narrative"
    const fillNarrativeButton = page.locator('button:has-text("Fill Narrative")');
    await expect(fillNarrativeButton).toBeVisible();
    
    // Click the Fill Narrative button
    await fillNarrativeButton.click();
    
    // Step 5: Wait for narratives to be populated and verify interpolation
    await page.waitForTimeout(1000); // Give time for the form to populate
    
    // Check that narrative fields contain content
    const beforeEventField = page.locator('textarea[name="before_event"]')
      .or(page.locator('textarea:has([placeholder*="before"])')
      .or(page.locator('[data-testid="before-event-textarea"]')))
      .first();
    
    const duringEventField = page.locator('textarea[name="during_event"]')
      .or(page.locator('textarea:has([placeholder*="during"])')
      .or(page.locator('[data-testid="during-event-textarea"]')))
      .first();
    
    await expect(beforeEventField).not.toHaveValue('');
    await expect(duringEventField).not.toHaveValue('');
    
    // Get the narrative content
    const beforeEventContent = await beforeEventField.inputValue();
    const duringEventContent = await duringEventField.inputValue();
    
    // Step 6: Verify participant name interpolation
    console.log('=== NARRATIVE CONTENT ANALYSIS ===');
    console.log('Before Event Content (first 100 chars):', beforeEventContent.substring(0, 100));
    console.log('During Event Content (first 100 chars):', duringEventContent.substring(0, 100));
    
    // Check if participant name was interpolated correctly
    const hasCorrectInterpolation = beforeEventContent.includes('John') || duringEventContent.includes('John');
    const hasIncorrectPlaceholder = beforeEventContent.includes('The participant') || duringEventContent.includes('The participant');
    
    console.log('Has correct interpolation (contains "John"):', hasCorrectInterpolation);
    console.log('Has incorrect placeholder (contains "The participant"):', hasIncorrectPlaceholder);
    
    // Step 7: Analyze console logs for debugging information
    console.log('=== CONSOLE LOG ANALYSIS ===');
    const debugLogs = consoleLogs.filter(log => log.includes('🔍 DEBUG'));
    
    console.log('Found debug logs:', debugLogs.length);
    debugLogs.forEach((log, index) => {
      console.log(`DEBUG ${index + 1}:`, log);
    });
    
    // Look for specific debug information
    const incidentDataLog = debugLogs.find(log => log.includes('incidentData:'));
    const participantNameLog = debugLogs.find(log => log.includes('participantName:'));
    const participantFirstNameLog = debugLogs.find(log => log.includes('participantFirstName:'));
    
    console.log('Incident Data Log:', incidentDataLog);
    console.log('Participant Name Log:', participantNameLog);  
    console.log('Participant First Name Log:', participantFirstNameLog);
    
    // Step 8: Assertions for test validation
    
    // The main assertion - this should pass once the bug is fixed
    if (hasCorrectInterpolation) {
      expect(hasCorrectInterpolation).toBe(true);
      console.log('✅ SUCCESS: Participant name interpolation is working correctly');
    } else {
      console.log('❌ ISSUE: Participant name interpolation is not working');
      console.log('Expected: Narratives should contain "John"');
      console.log('Actual: Narratives still contain "The participant"');
      
      // For debugging purposes, let's see what we got instead
      expect.soft(hasIncorrectPlaceholder).toBe(false);
      
      // Make the test fail with useful information
      throw new Error(`
Participant name interpolation failed:
- Expected narratives to contain "John" 
- Found "The participant" instead
- Check console logs above for debugging information
- Participant field was filled with: "${participantName}"
- Before event content: ${beforeEventContent.substring(0, 200)}...
- During event content: ${duringEventContent.substring(0, 200)}...
      `);
    }
    
    // Additional validation that the fill narrative functionality worked
    expect(beforeEventContent.length).toBeGreaterThan(50);
    expect(duringEventContent.length).toBeGreaterThan(50);
    
    // Verify debug logs were captured
    expect(debugLogs.length).toBeGreaterThan(0);
    
    console.log('=== TEST COMPLETED ===');
  });

  test('should capture detailed debug information about data flow', async ({ page }) => {
    // This test focuses specifically on capturing debug information
    await page.goto('/new-incident');
    
    // Fill minimal required data to get to Step 2
    await page.locator('input[name="participant_name"]').first().fill('Jane Doe');
    await page.locator('input[name="location"]').first().fill('Test Location');
    await page.locator('input[type="datetime-local"]').first().fill('2025-08-18T10:00');
    
    // Navigate to Step 2
    await page.locator('button:has-text("Next")').first().click();
    await expect(page.locator('[data-testid="current-step"]')).toContainText('2');
    
    // Click Fill Narrative and capture the exact debug flow
    await page.locator('button:has-text("Fill Narrative")').click();
    
    // Wait for the event to process
    await page.waitForTimeout(2000);
    
    // Analyze the debug flow
    const getSampleNarrativeLogs = consoleLogs.filter(log => log.includes('getSampleNarrative'));
    const incidentDataLogs = consoleLogs.filter(log => log.includes('incidentData:'));
    const interpolationLogs = consoleLogs.filter(log => log.includes('interpolation'));
    
    console.log('=== DEBUG FLOW ANALYSIS ===');
    console.log('getSampleNarrative calls:', getSampleNarrativeLogs.length);
    console.log('incidentData logs:', incidentDataLogs.length);
    console.log('interpolation logs:', interpolationLogs.length);
    
    // Detailed log analysis for debugging
    consoleLogs.forEach((log, index) => {
      if (log.includes('🔍 DEBUG')) {
        console.log(`[${index}] ${log}`);
      }
    });
    
    // This test is primarily for debugging, so we just verify logs were captured
    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(getSampleNarrativeLogs.length).toBeGreaterThan(0);
  });

  test.afterEach(async ({ page }) => {
    // Clean up and log final state
    console.log('=== FINAL STATE ===');
    console.log('Total console logs captured:', consoleLogs.length);
    console.log('Debug logs captured:', consoleLogs.filter(log => log.includes('🔍 DEBUG')).length);
  });
});