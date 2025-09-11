// @ts-nocheck
import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Contextual Variable Extraction for Prompt Testing
 * 
 * Extracts all unique variables from the current incident workflow context
 * to populate the prompt testing interface with real data
 */

export interface ContextualVariable {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date';
  source: 'incident' | 'narrative' | 'answers' | 'computed';
  matchesTemplate: boolean; // Green indicator for template placeholders
  description?: string;
}

export interface VariableExtractionResult {
  variables: ContextualVariable[];
  templatePlaceholders: string[];
  matchedCount: number;
  totalVariables: number;
}

/**
 * Extract all available variables from incident workflow context
 */
export const extractContextualVariables = query({
  args: {
    sessionToken: v.string(),
    incidentId: v.optional(v.id("incidents")),
    promptName: v.optional(v.string()),
    currentStep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate user authentication
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    }) as any;

    if (!user) {
      throw new Error("Authentication required");
    }

    let variables: ContextualVariable[] = [];
    let templatePlaceholders: string[] = [];

    // Get prompt template if specified to extract placeholders
    if (args.promptName) {
      try {
        const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
          prompt_name: args.promptName,
          subsystem: "incidents",
        });
        
        if (prompt) {
          // Extract {{placeholder}} patterns
          const matches = prompt.prompt_template.match(/\{\{([^}]+)\}\}/g) || [];
          templatePlaceholders = matches.map((match: string) => match.replace(/[{}]/g, ''));
        }
      } catch (error) {
        console.warn("Could not load prompt template for placeholder extraction:", error);
      }
    }

    // Extract variables from incident if available
    if (args.incidentId) {
      try {
        const incident = await ctx.runQuery(internal.incidents.getIncidentById, {
          sessionToken: args.sessionToken,
          incident_id: args.incidentId,
        });

        if (incident) {
          // Core incident data
          variables.push(
            {
              key: 'participantName',
              value: incident.participant_name,
              type: 'string',
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('participantName'),
              description: 'Name of the participant involved in the incident'
            },
            {
              key: 'reporterName', 
              value: incident.reporter_name,
              type: 'string',
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('reporterName'),
              description: 'Name of the person reporting the incident'
            },
            {
              key: 'location',
              value: incident.location,
              type: 'string', 
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('location'),
              description: 'Location where the incident occurred'
            },
            {
              key: 'eventDateTime',
              value: incident.event_date_time,
              type: 'date',
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('eventDateTime'),
              description: 'Date and time when the incident occurred'
            },
            {
              key: 'incidentType',
              value: incident.incident_type,
              type: 'string',
              source: 'incident', 
              matchesTemplate: templatePlaceholders.includes('incidentType'),
              description: 'Type/category of the incident'
            },
            {
              key: 'severity',
              value: incident.severity,
              type: 'string',
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('severity'),
              description: 'Severity level of the incident'
            },
            {
              key: 'status',
              value: incident.status,
              type: 'string',
              source: 'incident',
              matchesTemplate: templatePlaceholders.includes('status'),
              description: 'Current status of the incident'
            }
          );

          // Add computed variables
          const incidentDate = new Date(incident.event_date_time);
          variables.push(
            {
              key: 'eventDate',
              value: incidentDate.toLocaleDateString(),
              type: 'string',
              source: 'computed',
              matchesTemplate: templatePlaceholders.includes('eventDate'),
              description: 'Formatted date of the incident'
            },
            {
              key: 'eventTime',
              value: incidentDate.toLocaleTimeString(),
              type: 'string',
              source: 'computed',
              matchesTemplate: templatePlaceholders.includes('eventTime'),
              description: 'Formatted time of the incident'
            }
          );
        }

        // Extract narrative data
        try {
          const narrative = await ctx.runQuery(internal.narratives.getByIncident, {
            sessionToken: args.sessionToken,
            incident_id: args.incidentId,
          });

          if (narrative) {
            const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
            
            phases.forEach(phase => {
              const content = narrative[phase];
              if (content) {
                variables.push({
                  key: `${phase}Narrative`,
                  value: content,
                  type: 'string',
                  source: 'narrative',
                  matchesTemplate: templatePlaceholders.includes(`${phase}Narrative`),
                  description: `Narrative content for ${phase.replace('_', ' ')} phase`
                });
              }
            });

            // Add general narrative content
            const currentPhase = getCurrentPhaseFromStep(args.currentStep || 1);
            if (currentPhase && narrative[currentPhase]) {
              variables.push({
                key: 'narrativeContent',
                value: narrative[currentPhase],
                type: 'string',
                source: 'narrative', 
                matchesTemplate: templatePlaceholders.includes('narrativeContent'),
                description: `Current phase narrative content (${currentPhase})`
              });
            }
          }
        } catch (error) {
          console.warn("Could not load narrative data:", error);
        }

        // Extract clarification answers
        try {
          const answers = await ctx.runQuery(internal.aiClarification.getClarificationAnswers, {
            sessionToken: args.sessionToken,
            incident_id: args.incidentId,
          });

          if (answers && answers.length > 0) {
            // Add answer count and sample
            variables.push(
              {
                key: 'totalAnswers',
                value: answers.length,
                type: 'number',
                source: 'answers',
                matchesTemplate: templatePlaceholders.includes('totalAnswers'),
                description: 'Total number of clarification questions answered'
              },
              {
                key: 'completedAnswers',
                value: answers.filter((a: any) => a.is_complete).length,
                type: 'number',
                source: 'answers',
                matchesTemplate: templatePlaceholders.includes('completedAnswers'),
                description: 'Number of completed clarification answers'
              }
            );

            // Add recent answer as example
            const recentAnswer = answers[answers.length - 1];
            if (recentAnswer) {
              variables.push({
                key: 'recentAnswer',
                value: recentAnswer.answer_text,
                type: 'string',
                source: 'answers',
                matchesTemplate: templatePlaceholders.includes('recentAnswer'),
                description: 'Most recent clarification answer provided'
              });
            }
          }
        } catch (error) {
          console.warn("Could not load clarification answers:", error);
        }

      } catch (error) {
        console.warn("Could not load incident data:", error);
      }
    }

    // Add standard system variables always available
    const now = new Date();
    const systemVariables: ContextualVariable[] = [
      {
        key: 'currentDate',
        value: now.toLocaleDateString(),
        type: 'string',
        source: 'computed',
        matchesTemplate: templatePlaceholders.includes('currentDate'),
        description: 'Current date'
      },
      {
        key: 'currentTime',
        value: now.toLocaleTimeString(),
        type: 'string', 
        source: 'computed',
        matchesTemplate: templatePlaceholders.includes('currentTime'),
        description: 'Current time'
      },
      {
        key: 'currentStep',
        value: args.currentStep || 1,
        type: 'number',
        source: 'computed',
        matchesTemplate: templatePlaceholders.includes('currentStep'),
        description: 'Current workflow step'
      },
      {
        key: 'userName',
        value: user.name || 'Unknown User',
        type: 'string',
        source: 'computed',
        matchesTemplate: templatePlaceholders.includes('userName'),
        description: 'Name of the current user'
      },
      {
        key: 'userEmail',
        value: user.email || 'unknown@example.com',
        type: 'string',
        source: 'computed', 
        matchesTemplate: templatePlaceholders.includes('userEmail'),
        description: 'Email of the current user'
      },
    ];

    variables.push(...systemVariables);

    // Calculate statistics
    const matchedCount = variables.filter(v => v.matchesTemplate).length;
    const totalVariables = variables.length;

    return {
      variables,
      templatePlaceholders,
      matchedCount,
      totalVariables,
    };
  },
});

/**
 * Helper function to determine current narrative phase from workflow step
 */
function getCurrentPhaseFromStep(step: number): 'before_event' | 'during_event' | 'end_event' | 'post_event' | null {
  switch (step) {
    case 3: return 'before_event';
    case 4: return 'during_event'; 
    case 5: return 'end_event';
    case 6: return 'post_event';
    default: return null;
  }
}

/**
 * Get suggested variables based on common prompt patterns
 */
export const getSuggestedVariables = query({
  args: {
    sessionToken: v.string(),
    promptCategory: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ContextualVariable[]> => {
    // Validate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new Error("Authentication required");
    }

    // Return commonly used variables for different prompt categories
    const commonVariables: ContextualVariable[] = [
      {
        key: 'supportWorker',
        value: 'Sarah Johnson',
        type: 'string',
        source: 'computed',
        matchesTemplate: false,
        description: 'Name of the support worker involved'
      },
      {
        key: 'timeOfDay',
        value: 'afternoon',
        type: 'string',
        source: 'computed', 
        matchesTemplate: false,
        description: 'Time of day when incident occurred'
      },
      {
        key: 'witnesses',
        value: 'John Doe, Mary Smith',
        type: 'string',
        source: 'computed',
        matchesTemplate: false,
        description: 'Names of witnesses present'
      },
      {
        key: 'interventionsAttempted',
        value: 'verbal de-escalation, environmental modification',
        type: 'string',
        source: 'computed',
        matchesTemplate: false,
        description: 'Interventions that were attempted'
      },
      {
        key: 'participantMood',
        value: 'agitated',
        type: 'string',
        source: 'computed',
        matchesTemplate: false,
        description: 'Observed mood of the participant'
      },
    ];

    return commonVariables;
  },
});