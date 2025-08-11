/**
 * Centralized Incident Sample Data
 * 
 * Contains all sample data logic for incident scenarios, separated from UI components
 * Supports participant name interpolation and dynamic date generation
 */

import type { SampleDataOption } from '@/components/ui/sample-data-button';

// Helper function to generate a date within the past 3 days
const getRecentDate = (daysAgo: number, hour: number, minute: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:MM"
};

// Helper function to interpolate participant name in narrative text
const interpolateParticipantName = (text: string, participantFirstName: string): string => {
  // Replace hardcoded names with the participant's first name
  const hardcodedNames = ['Emma', 'Michael', 'Sarah', 'James', 'Rachel'];
  let interpolatedText = text;
  
  hardcodedNames.forEach(name => {
    const nameRegex = new RegExp(`\\b${name}\\b`, 'g');
    interpolatedText = interpolatedText.replace(nameRegex, participantFirstName);
  });
  
  return interpolatedText;
};

// Base incident scenario definitions
const baseIncidentScenarios = [
  {
    type: "medication_error",
    severity: "medium" as const,
    tags: ["medication", "administration", "oversight", "monitoring"],
    description: "Medication administration error with monitoring protocol",
    icon: "💊",
    narratives: {
      before_event: "Emma was scheduled to receive her afternoon medications at 2:30 PM as per her medication chart. The support worker arrived at 2:25 PM and began preparing medications. Emma was in the living room watching television and appeared in good spirits. She had eaten lunch at 12:30 PM and had no complaints of pain or discomfort. Her morning medications had been administered correctly at 8:00 AM with no issues.",
      during_event: "At 2:30 PM, the support worker administered what they believed to be Emma's prescribed Paracetamol 500mg. However, upon checking the medication chart immediately after administration, they realized they had given Emma two tablets instead of the prescribed one tablet. Emma had already swallowed both tablets before the error was noticed. The worker immediately checked Emma for any immediate reactions and found none.",
      end_event: "The medication error was identified within 2 minutes of administration. Emma showed no immediate adverse reactions - her vital signs appeared normal, she was alert and responsive, and complained of no symptoms. The support worker immediately contacted the on-call nurse at 2:32 PM to report the incident and seek medical advice.",
      post_event: "The on-call nurse advised monitoring Emma for the next 4 hours for any signs of overdose symptoms. Emma's doctor was contacted and advised that the additional 500mg of Paracetamol was not life-threatening but required monitoring. Emma remained stable throughout the monitoring period. Incident was reported to management at 3:00 PM. A review of medication procedures has been scheduled to prevent similar errors."
    },
    defaultParticipant: "Emma Johnson",
    defaultReporter: "Staff Member",
    defaultLocation: "Participant's residence - Kitchen area"
  },
  {
    type: "injury",
    severity: "high" as const,
    tags: ["fall", "head_injury", "transfer", "wheelchair", "hospital"],
    description: "Participant fall with head injury requiring hospital assessment",
    icon: "🩹", 
    narratives: {
      before_event: "Michael was attending his weekly social group activity at the community center. He had arrived at 3:00 PM in his wheelchair, transported by community transport. Michael was in good spirits and excited about the craft activity planned for the session. His wheelchair had been checked that morning and was functioning normally. The activity hall floor was clean and dry.",
      during_event: "At approximately 4:45 PM, Michael attempted to transfer from his wheelchair to a regular chair to participate in the craft activity. Despite staff assistance and following the transfer procedure, Michael lost his balance during the transfer. He fell backward and hit his head on the corner of a nearby table. Staff immediately attended to Michael, who was conscious but complained of head pain.",
      end_event: "Michael was immediately assessed by the first aid qualified staff member. He remained conscious and alert but had a visible bump on the back of his head and complained of headache. Michael was kept still while emergency services were called at 4:50 PM. His wheelchair was checked and found to be functioning normally - the fall appeared to be related to the transfer process.",
      post_event: "Ambulance arrived at 5:10 PM. Michael was transported to the hospital for assessment and CT scan. The scan showed no serious injury, but he was advised to rest and monitor for concussion symptoms. Michael's family and support coordinator were notified. A review of transfer procedures and equipment has been initiated. Michael returned home that evening with instructions for 24-hour observation."
    },
    defaultParticipant: "Michael Chen",
    defaultReporter: "Support Coordinator", 
    defaultLocation: "Community center - Main activity hall"
  },
  {
    type: "behavioral",
    severity: "medium" as const,
    tags: ["verbal_aggression", "de-escalation", "sleep_issues", "behavior_support"],
    description: "Verbal aggression incident with de-escalation response",
    icon: "😤",
    narratives: {
      before_event: "Sarah arrived at the day program at 9:00 AM as usual. She seemed slightly agitated during the morning greeting but participated in the breakfast routine. Sarah mentioned she had difficulty sleeping the previous night and was feeling tired. The morning activity was a group discussion about weekend plans, which Sarah initially engaged with positively.",
      during_event: "During the group discussion at 10:15 AM, Sarah became increasingly agitated when another participant disagreed with her weekend suggestion. Sarah raised her voice and began using inappropriate language directed at the other participant and staff. When a staff member attempted to de-escalate the situation, Sarah became more aggressive, shouting and making threatening gestures but did not make physical contact.",
      end_event: "Staff implemented the de-escalation protocol, removing other participants from the immediate area and speaking calmly to Sarah. After approximately 10 minutes, Sarah began to calm down. She was offered the opportunity to take a break in a quiet space, which she accepted. Sarah expressed remorse about her behavior and explained she was frustrated about her sleep issues.",
      post_event: "Sarah spent 30 minutes in the quiet room with a support worker, using breathing techniques to calm down. She was then able to rejoin the group for the next activity. A behavior support meeting was scheduled for the following week to review Sarah's support strategies. Sarah's sleep issues were noted for discussion with her healthcare team."
    },
    defaultParticipant: "Sarah Williams",
    defaultReporter: "Team Leader",
    defaultLocation: "Day program center - Group room 2"
  },
  {
    type: "environmental",
    severity: "medium" as const,
    tags: ["water_damage", "maintenance", "relocation", "routine_disruption"],
    description: "Water pipe burst causing accommodation disruption",
    icon: "🚰",
    narratives: {
      before_event: "James was getting ready for his morning routine in his supported accommodation unit. The overnight support worker had completed the shift handover and noted everything was normal. James had slept well and was looking forward to attending his job placement that morning. The bathroom had been cleaned the previous evening and all fixtures were working normally.",
      during_event: "At 7:30 AM, a pipe burst in the bathroom wall while James was getting ready. Water began flowing rapidly from behind the toilet, flooding the bathroom floor and beginning to spread into the bedroom area. James immediately called for help from the support worker, who arrived within 1 minute and saw the extent of the water damage.",
      end_event: "The support worker immediately turned off the water supply at the main valve and called maintenance services. James was moved to the living area to ensure his safety while the water was contained. The water had flooded the bathroom completely and damaged some personal items in the bedroom. No injuries occurred, but James was distressed about his routine being disrupted.",
      post_event: "Emergency maintenance arrived within 45 minutes and repaired the burst pipe. Professional cleaning services were arranged to address the water damage. James was relocated to a temporary unit for 24 hours while repairs were completed. Insurance was notified and a claim was processed. James's routine was maintained as much as possible in the temporary accommodation."
    },
    defaultParticipant: "James Brown",
    defaultReporter: "Facility Manager",
    defaultLocation: "Supported accommodation - Unit 3B bathroom"
  },
  {
    type: "medical_emergency", 
    severity: "high" as const,
    tags: ["seizure", "epilepsy", "medication", "monitoring", "medical_protocol"],
    description: "Seizure incident with established medical protocols",
    icon: "🚨",
    narratives: {
      before_event: "Rachel was having dinner at home with her support worker present. She had eaten well and was in good spirits, discussing plans for the weekend. Rachel has a history of epilepsy but her seizures have been well-controlled with medication for the past 6 months. She had taken her evening medication as prescribed at 6:00 PM and showed no signs of illness or distress.",
      during_event: "At 7:20 PM, while watching television, Rachel suddenly experienced a tonic-clonic seizure. The support worker immediately implemented the seizure management protocol, ensuring Rachel's safety by clearing the area and placing her in the recovery position. The seizure lasted approximately 3 minutes. The support worker timed the seizure and observed Rachel's breathing and responsiveness throughout.",
      end_event: "The seizure ended at 7:23 PM. Rachel remained unconscious for 2 minutes post-seizure, which is typical for her seizure pattern. She gradually regained consciousness and was confused but responsive. The support worker continued to monitor her vital signs and provided reassurance. Rachel complained of feeling tired and had a mild headache, both normal post-seizure symptoms for her.",
      post_event: "The support worker contacted Rachel's on-call doctor at 7:30 PM to report the seizure. As this was Rachel's first seizure in 6 months, the doctor advised monitoring but no immediate hospital visit was required. Rachel's seizure log was updated and her neurologist was notified the following day. Rachel rested for the evening and reported feeling normal by the next morning."
    },
    defaultParticipant: "Rachel Davis",
    defaultReporter: "Support Worker",
    defaultLocation: "Participant's home - Living room"
  }
];

/**
 * Generate incident scenarios formatted for SampleDataButton component
 * Supports participant name interpolation in both labels and narrative content
 */
export function getIncidentScenarios(participantFirstName?: string): SampleDataOption[] {
  return baseIncidentScenarios.map((scenario, index) => ({
    id: scenario.type,
    label: participantFirstName ? participantFirstName : scenario.defaultParticipant.split(' ')[0],
    description: scenario.description,
    tags: scenario.tags,
    severity: scenario.severity,
    icon: scenario.icon,
    data: {
      participant_name: participantFirstName ? 
        `${participantFirstName} ${scenario.defaultParticipant.split(' ')[1]}` : 
        scenario.defaultParticipant,
      reporter_name: scenario.defaultReporter,
      event_date_time: getRecentDate(index, 14 + index * 2, 30), // Spread times across scenarios
      location: scenario.defaultLocation,
      narratives: participantFirstName ? {
        before_event: interpolateParticipantName(scenario.narratives.before_event, participantFirstName),
        during_event: interpolateParticipantName(scenario.narratives.during_event, participantFirstName),
        end_event: interpolateParticipantName(scenario.narratives.end_event, participantFirstName),
        post_event: interpolateParticipantName(scenario.narratives.post_event, participantFirstName)
      } : scenario.narratives
    }
  }));
}

// Export utilities for reuse
export { 
  getRecentDate, 
  interpolateParticipantName,
  baseIncidentScenarios
};