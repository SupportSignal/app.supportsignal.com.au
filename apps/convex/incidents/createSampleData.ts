// @ts-nocheck
import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Comprehensive NDIS Incident Scenario Sample Data
 * Creates realistic incident scenarios with complete narrative data across all phases
 * Requires SAMPLE_DATA permission (system_admin only)
 */

// Helper function to interpolate participant name in narrative text
function interpolateParticipantName(text: string, participantFirstName: string): string {
  // Replace hardcoded names with the participant's first name
  const hardcodedNames = ['Emma', 'Michael', 'Sarah', 'James', 'Rachel'];
  let interpolatedText = text;
  
  hardcodedNames.forEach(name => {
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    interpolatedText = interpolatedText.replace(nameRegex, participantFirstName);
  });
  
  return interpolatedText;
}

// Sample incident scenarios with complete narrative data
const incidentScenarios = [
  {
    // Scenario 1: Medication Administration Error
    participant_name: "Emma Johnson",
    reporter_name: "Staff Member",
    event_date_time: "2024-08-10T14:30:00Z",
    location: "Participant's residence - Kitchen area",
    narrative: {
      before_event: "Emma was scheduled to receive her afternoon medications at 2:30 PM as per her medication chart. The support worker arrived at 2:25 PM and began preparing medications. Emma was in the living room watching television and appeared in good spirits. She had eaten lunch at 12:30 PM and had no complaints of pain or discomfort. Her morning medications had been administered correctly at 8:00 AM with no issues.",
      during_event: "At 2:30 PM, the support worker administered what they believed to be Emma's prescribed Paracetamol 500mg. However, upon checking the medication chart immediately after administration, they realized they had given Emma two tablets instead of the prescribed one tablet. Emma had already swallowed both tablets before the error was noticed. The worker immediately checked Emma for any immediate reactions and found none.",
      end_event: "The medication error was identified within 2 minutes of administration. Emma showed no immediate adverse reactions - her vital signs appeared normal, she was alert and responsive, and complained of no symptoms. The support worker immediately contacted the on-call nurse at 2:32 PM to report the incident and seek medical advice.",
      post_event: "The on-call nurse advised monitoring Emma for the next 4 hours for any signs of overdose symptoms. Emma's doctor was contacted and advised that the additional 500mg of Paracetamol was not life-threatening but required monitoring. Emma remained stable throughout the monitoring period. Incident was reported to management at 3:00 PM. A review of medication procedures has been scheduled to prevent similar errors."
    },
    scenario_type: "medication_error",
    severity: "medium",
    tags: ["medication", "administration", "oversight", "monitoring"]
  },
  {
    // Scenario 2: Participant Fall with Injury
    participant_name: "Michael Chen",
    reporter_name: "Support Coordinator",
    event_date_time: "2024-08-09T16:45:00Z",
    location: "Community center - Main activity hall",
    narrative: {
      before_event: "Michael was attending his weekly social group activity at the community center. He had arrived at 3:00 PM in his wheelchair, transported by community transport. Michael was in good spirits and excited about the craft activity planned for the session. His wheelchair had been checked that morning and was functioning normally. The activity hall floor was clean and dry.",
      during_event: "At approximately 4:45 PM, Michael attempted to transfer from his wheelchair to a regular chair to participate in the craft activity. Despite staff assistance and following the transfer procedure, Michael lost his balance during the transfer. He fell backward and hit his head on the corner of a nearby table. Staff immediately attended to Michael, who was conscious but complained of head pain.",
      end_event: "Michael was immediately assessed by the first aid qualified staff member. He remained conscious and alert but had a visible bump on the back of his head and complained of headache. Michael was kept still while emergency services were called at 4:50 PM. His wheelchair was checked and found to be functioning normally - the fall appeared to be related to the transfer process.",
      post_event: "Ambulance arrived at 5:10 PM. Michael was transported to the hospital for assessment and CT scan. The scan showed no serious injury, but he was advised to rest and monitor for concussion symptoms. Michael's family and support coordinator were notified. A review of transfer procedures and equipment has been initiated. Michael returned home that evening with instructions for 24-hour observation."
    },
    scenario_type: "injury",
    severity: "high",
    tags: ["fall", "head_injury", "transfer", "wheelchair", "hospital"]
  },
  {
    // Scenario 3: Behavioral Incident - Verbal Aggression
    participant_name: "Sarah Williams",
    reporter_name: "Team Leader",
    event_date_time: "2024-08-08T10:15:00Z",
    location: "Day program center - Group room 2",
    narrative: {
      before_event: "Sarah arrived at the day program at 9:00 AM as usual. She seemed slightly agitated during the morning greeting but participated in the breakfast routine. Sarah mentioned she had difficulty sleeping the previous night and was feeling tired. The morning activity was a group discussion about weekend plans, which Sarah initially engaged with positively.",
      during_event: "During the group discussion at 10:15 AM, Sarah became increasingly agitated when another participant disagreed with her weekend suggestion. Sarah raised her voice and began using inappropriate language directed at the other participant and staff. When a staff member attempted to de-escalate the situation, Sarah became more aggressive, shouting and making threatening gestures but did not make physical contact.",
      end_event: "Staff implemented the de-escalation protocol, removing other participants from the immediate area and speaking calmly to Sarah. After approximately 10 minutes, Sarah began to calm down. She was offered the opportunity to take a break in a quiet space, which she accepted. Sarah expressed remorse about her behavior and explained she was frustrated about her sleep issues.",
      post_event: "Sarah spent 30 minutes in the quiet room with a support worker, using breathing techniques to calm down. She was then able to rejoin the group for the next activity. A behavior support meeting was scheduled for the following week to review Sarah's support strategies. Sarah's sleep issues were noted for discussion with her healthcare team."
    },
    scenario_type: "behavioral",
    severity: "medium",
    tags: ["verbal_aggression", "de-escalation", "sleep_issues", "behavior_support"]
  },
  {
    // Scenario 4: Environmental Hazard - Water Damage
    participant_name: "James Brown",
    reporter_name: "Facility Manager",
    event_date_time: "2024-08-07T07:30:00Z",
    location: "Supported accommodation - Unit 3B bathroom",
    narrative: {
      before_event: "James was getting ready for his morning routine in his supported accommodation unit. The overnight support worker had completed the shift handover and noted everything was normal. James had slept well and was looking forward to attending his job placement that morning. The bathroom had been cleaned the previous evening and all fixtures were working normally.",
      during_event: "At 7:30 AM, a pipe burst in the bathroom wall while James was getting ready. Water began flowing rapidly from behind the toilet, flooding the bathroom floor and beginning to spread into the bedroom area. James immediately called for help from the support worker, who arrived within 1 minute and saw the extent of the water damage.",
      end_event: "The support worker immediately turned off the water supply at the main valve and called maintenance services. James was moved to the living area to ensure his safety while the water was contained. The water had flooded the bathroom completely and damaged some personal items in the bedroom. No injuries occurred, but James was distressed about his routine being disrupted.",
      post_event: "Emergency maintenance arrived within 45 minutes and repaired the burst pipe. Professional cleaning services were arranged to address the water damage. James was relocated to a temporary unit for 24 hours while repairs were completed. Insurance was notified and a claim was processed. James's routine was maintained as much as possible in the temporary accommodation."
    },
    scenario_type: "environmental",
    severity: "medium",
    tags: ["water_damage", "maintenance", "relocation", "routine_disruption"]
  },
  {
    // Scenario 5: Medical Emergency - Seizure
    participant_name: "Rachel Davis",
    reporter_name: "Support Worker",
    event_date_time: "2024-08-06T19:20:00Z",
    location: "Participant's home - Living room",
    narrative: {
      before_event: "Rachel was having dinner at home with her support worker present. She had eaten well and was in good spirits, discussing plans for the weekend. Rachel has a history of epilepsy but her seizures have been well-controlled with medication for the past 6 months. She had taken her evening medication as prescribed at 6:00 PM and showed no signs of illness or distress.",
      during_event: "At 7:20 PM, while watching television, Rachel suddenly experienced a tonic-clonic seizure. The support worker immediately implemented the seizure management protocol, ensuring Rachel's safety by clearing the area and placing her in the recovery position. The seizure lasted approximately 3 minutes. The support worker timed the seizure and observed Rachel's breathing and responsiveness throughout.",
      end_event: "The seizure ended at 7:23 PM. Rachel remained unconscious for 2 minutes post-seizure, which is typical for her seizure pattern. She gradually regained consciousness and was confused but responsive. The support worker continued to monitor her vital signs and provided reassurance. Rachel complained of feeling tired and had a mild headache, both normal post-seizure symptoms for her.",
      post_event: "The support worker contacted Rachel's on-call doctor at 7:30 PM to report the seizure. As this was Rachel's first seizure in 6 months, the doctor advised monitoring but no immediate hospital visit was required. Rachel's seizure log was updated and her neurologist was notified the following day. Rachel rested for the evening and reported feeling normal by the next morning."
    },
    scenario_type: "medical_emergency",
    severity: "high",
    tags: ["seizure", "epilepsy", "medication", "monitoring", "medical_protocol"]
  }
];

/**
 * Create sample incident scenarios for testing and demonstration
 */
export const createSampleIncidentScenarios = mutation({
  args: {
    sessionToken: v.string(),
    scenarioType: v.optional(v.string()), // If provided, create only that type
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to create sample incidents');
      }

      const now = Date.now();

      // Filter scenarios if a specific type is requested
      const scenariosToCreate = args.scenarioType
        ? incidentScenarios.filter(s => s.scenario_type === args.scenarioType)
        : incidentScenarios;

      if (scenariosToCreate.length === 0) {
        throw new ConvexError(`No scenarios found for type: ${args.scenarioType}`);
      }

      // Check if any sample incidents already exist
      const existingIncidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .collect();

      // Check for duplicate scenarios (by participant name and event date)
      const duplicateCheck = existingIncidents.filter(incident =>
        scenariosToCreate.some(scenario =>
          incident.participant_name === scenario.participant_name &&
          incident.event_date_time === scenario.event_date_time
        )
      );

      if (duplicateCheck.length > 0) {
        return {
          success: false,
          message: 'Some sample incident scenarios already exist',
          existingCount: duplicateCheck.length,
          correlationId,
        };
      }

      // Create sample incidents
      const createdIncidents = [];
      for (const scenarioData of scenariosToCreate) {
        // Create the base incident
        const incidentId = await ctx.db.insert("incidents", {
          company_id: user.company_id,
          participant_name: scenarioData.participant_name,
          reporter_name: scenarioData.reporter_name,
          event_date_time: scenarioData.event_date_time,
          location: scenarioData.location,
          overall_status: "capture_pending",
          capture_status: "draft",
          analysis_status: "not_started",
          narrative_enhanced: false,
          questions_generated: false,
          analysis_generated: false,
          created_at: now,
          created_by: user._id,
          updated_at: now,
          updated_by: user._id,
        });

        // Create the narrative data
        const narrativeId = await ctx.db.insert("incident_narratives", {
          incident_id: incidentId,
          before_event: scenarioData.narrative.before_event,
          during_event: scenarioData.narrative.during_event,
          end_event: scenarioData.narrative.end_event,
          post_event: scenarioData.narrative.post_event,
          narrative_hash: `sample_${scenarioData.scenario_type}_${Date.now()}`,
          created_at: now,
          updated_at: now,
          version: 1, // Initial version for new narrative
        });

        createdIncidents.push({
          incidentId,
          narrativeId,
          scenarioType: scenarioData.scenario_type,
          participant: scenarioData.participant_name,
        });
      }

      console.log('🎬 SAMPLE INCIDENT SCENARIOS CREATED', {
        companyId: user.company_id,
        createdBy: user._id,
        scenarioCount: createdIncidents.length,
        scenarioTypes: [...new Set(scenariosToCreate.map(s => s.scenario_type))],
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Successfully created ${createdIncidents.length} incident scenario(s)`,
        scenarios: createdIncidents,
        correlationId,
      };
    } catch (error) {
      console.error('Error creating sample incident scenarios:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create sample incidents: ${(error as Error).message}`);
    }
  },
});

/**
 * Fill current incident with sample data based on scenario type
 */
export const fillIncidentWithSampleData = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.id("incidents"),
    scenarioType: v.union(
      v.literal("medication_error"),
      v.literal("injury"),
      v.literal("behavioral"),
      v.literal("environmental"),
      v.literal("medical_emergency")
    ),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required' }
      );

      // Get the incident
      const incident = await ctx.db.get(args.incidentId);
      if (!incident) {
        throw new ConvexError('Incident not found');
      }

      // Verify company access
      if (incident.company_id !== user.company_id) {
        throw new ConvexError('Access denied to incident');
      }

      // Find the requested scenario
      const scenario = incidentScenarios.find(s => s.scenario_type === args.scenarioType);
      if (!scenario) {
        throw new ConvexError(`Scenario type not found: ${args.scenarioType}`);
      }

      const now = Date.now();

      // Get existing participant name from the form and extract first name for interpolation
      const existingParticipantName = incident.participant_name || '';
      const participantFirstName = existingParticipantName.split(' ')[0] || 'Participant';

      // Update the incident with scenario data but PRESERVE the participant name from form
      await ctx.db.patch(args.incidentId, {
        // DON'T overwrite participant_name - keep what user entered in form
        reporter_name: scenario.reporter_name,
        event_date_time: scenario.event_date_time,
        location: scenario.location,
        updated_at: now,
        updated_by: user._id,
      });

      // Interpolate participant name into all narrative content
      const interpolatedNarratives = {
        before_event: interpolateParticipantName(scenario.narrative.before_event, participantFirstName),
        during_event: interpolateParticipantName(scenario.narrative.during_event, participantFirstName),
        end_event: interpolateParticipantName(scenario.narrative.end_event, participantFirstName),
        post_event: interpolateParticipantName(scenario.narrative.post_event, participantFirstName),
      };

      // Check if narrative already exists
      const existingNarrative = await ctx.db
        .query("incident_narratives")
        .withIndex("by_incident", (q) => q.eq("incident_id", args.incidentId))
        .first();

      if (existingNarrative) {
        // Update existing narrative with interpolated content
        await ctx.db.patch(existingNarrative._id, {
          before_event: interpolatedNarratives.before_event,
          during_event: interpolatedNarratives.during_event,
          end_event: interpolatedNarratives.end_event,
          post_event: interpolatedNarratives.post_event,
          narrative_hash: `sample_fill_${args.scenarioType}_${Date.now()}`,
          updated_at: now,
        });
      } else {
        // Create new narrative with interpolated content
        await ctx.db.insert("incident_narratives", {
          incident_id: args.incidentId,
          before_event: interpolatedNarratives.before_event,
          during_event: interpolatedNarratives.during_event,
          end_event: interpolatedNarratives.end_event,
          post_event: interpolatedNarratives.post_event,
          narrative_hash: `sample_fill_${args.scenarioType}_${Date.now()}`,
          created_at: now,
          updated_at: now,
          version: 1, // Initial version for new narrative
        });
      }

      console.log('📝 INCIDENT FILLED WITH SAMPLE DATA', {
        incidentId: args.incidentId,
        scenarioType: args.scenarioType,
        participantName: existingParticipantName,
        participantFirstName: participantFirstName,
        interpolationApplied: participantFirstName !== 'Participant',
        filledBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Incident filled with ${args.scenarioType} scenario data`,
        scenarioType: args.scenarioType,
        correlationId,
      };
    } catch (error) {
      console.error('Error filling incident with sample data:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to fill incident with sample data: ${(error as Error).message}`);
    }
  },
});

/**
 * Generate random form data for incident metadata
 * Cross-cutting sample data capability for any form that needs random incident data
 */
export const generateRandomIncidentMetadata = mutation({
  args: {
    sessionToken: v.string(),
    excludeFields: v.optional(v.array(v.string())), // Fields to exclude from generation
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to generate sample data');
      }

      // Predefined locations for random selection
      const sampleLocations = [
        "Community center - Main activity hall",
        "Participant's residence - Living room", 
        "Day program center - Group room 2",
        "Supported accommodation - Unit 3B",
        "Respite care facility - Recreation area",
        "Support office - Meeting room",
        "Local park - Playground area",
        "Shopping center - Food court",
        "Medical center - Waiting area",
        "Transport vehicle - Community bus"
      ];

      // Generate random date within last 5 days during business hours
      const generateRandomDate = (): string => {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 5); // 0-4 days ago
        const hoursAgo = Math.floor(Math.random() * 12) + 8; // 8-19 (8am to 7pm)
        const minutesAgo = Math.floor(Math.random() * 60);
        
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(hoursAgo, minutesAgo, 0, 0);
        
        return date.toISOString().slice(0, 16); // Format for datetime-local input
      };

      // Get random participant from company - must have real participants for proper data integrity
      const participants = await ctx.db
        .query("participants")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (participants.length === 0) {
        throw new ConvexError('No participants available for sample data generation. Please create sample participants first by going to the Participants page and clicking the "🧪 Sample Data" button, then return here to try again.');
      }

      // Use real participant data for proper incident assignment
      const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
      const participantName = `${randomParticipant.first_name} ${randomParticipant.last_name}`;
      const participantId = randomParticipant._id;
      const randomLocation = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
      const randomDate = generateRandomDate();

      // Build result excluding requested fields
      const excludeFields = args.excludeFields || [];
      const result: any = {};

      if (!excludeFields.includes('participant_id') && participantId) {
        result.participant_id = participantId;
      }
      if (!excludeFields.includes('participant_name')) {
        result.participant_name = participantName;
      }
      if (!excludeFields.includes('location')) {
        result.location = randomLocation;
      }
      if (!excludeFields.includes('event_date_time')) {
        result.event_date_time = randomDate;
      }

      console.log('🎲 RANDOM FORM DATA GENERATED', {
        companyId: user.company_id,
        generatedBy: user._id,
        participantSelected: participantName,
        hasRealParticipants: participants.length > 0,
        location: randomLocation,
        date: randomDate,
        excludedFields: excludeFields,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: result,
        metadata: {
          participant: {
            id: participantId,
            name: participantName,
            ndis_number: participantId ? participants.find(p => p._id === participantId)?.ndis_number : 'N/A (Sample)',
          },
          location: randomLocation,
          date: randomDate,
          generatedAt: new Date().toISOString(),
          hasRealParticipants: participants.length > 0,
        },
        correlationId,
      };
    } catch (error) {
      console.error('Error generating random incident metadata:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to generate random form data: ${(error as Error).message}`);
    }
  },
});

/**
 * Get available scenario types
 */
export const getAvailableScenarioTypes = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user has sample data permission
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA,
      { errorMessage: 'Sample data access required' }
    );

    const scenarioTypes = incidentScenarios.map(scenario => ({
      type: scenario.scenario_type,
      participant: scenario.participant_name,
      severity: scenario.severity,
      tags: scenario.tags,
      description: getScenarioDescription(scenario.scenario_type),
    }));

    return {
      success: true,
      scenarios: scenarioTypes,
      correlationId,
    };
  },
});

/**
 * Create a new incident with sample data (for new incident creation)
 */
export const createIncidentWithSampleData = mutation({
  args: {
    sessionToken: v.string(),
    scenarioType: v.union(
      v.literal("medication_error"),
      v.literal("injury"),
      v.literal("behavioral"),
      v.literal("environmental"),
      v.literal("medical_emergency")
    ),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to create sample incidents');
      }

      // Find the requested scenario
      const scenario = incidentScenarios.find(s => s.scenario_type === args.scenarioType);
      if (!scenario) {
        throw new ConvexError(`Scenario type not found: ${args.scenarioType}`);
      }

      const now = Date.now();

      // Create the base incident
      const incidentId = await ctx.db.insert("incidents", {
        company_id: user.company_id,
        participant_name: scenario.participant_name,
        reporter_name: scenario.reporter_name,
        event_date_time: scenario.event_date_time,
        location: scenario.location,
        overall_status: "capture_pending",
        capture_status: "draft",
        analysis_status: "not_started",
        narrative_enhanced: false,
        questions_generated: false,
        analysis_generated: false,
        created_at: now,
        created_by: user._id,
        updated_at: now,
        updated_by: user._id,
      });

      // Create the narrative data
      const narrativeId = await ctx.db.insert("incident_narratives", {
        incident_id: incidentId,
        before_event: scenario.narrative.before_event,
        during_event: scenario.narrative.during_event,
        end_event: scenario.narrative.end_event,
        post_event: scenario.narrative.post_event,
        version: 1, // Initial version for new narrative,
        narrative_hash: `sample_create_${args.scenarioType}_${Date.now()}`,
        created_at: now,
        updated_at: now,
      });

      console.log('🎬 NEW INCIDENT CREATED WITH SAMPLE DATA', {
        incidentId,
        narrativeId,
        scenarioType: args.scenarioType,
        participant: scenario.participant_name,
        companyId: user.company_id,
        createdBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `New incident created with ${args.scenarioType} scenario data`,
        incidentId,
        scenarioType: args.scenarioType,
        scenarioData: {
          participant_name: scenario.participant_name,
          reporter_name: scenario.reporter_name,
          event_date_time: scenario.event_date_time,
          location: scenario.location,
          narratives: scenario.narrative,
        },
        correlationId,
      };
    } catch (error) {
      console.error('Error creating incident with sample data:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create incident with sample data: ${(error as Error).message}`);
    }
  },
});

// Helper function to get scenario descriptions
function getScenarioDescription(scenarioType: string): string {
  const descriptions = {
    medication_error: "Medication administration error with monitoring protocol",
    injury: "Participant fall with head injury requiring hospital assessment",
    behavioral: "Verbal aggression incident with de-escalation response",
    environmental: "Water pipe burst causing accommodation disruption",
    medical_emergency: "Seizure incident with established medical protocols",
  };
  return descriptions[scenarioType as keyof typeof descriptions] || "Unknown scenario type";
}