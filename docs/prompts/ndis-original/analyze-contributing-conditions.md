# NDIS Original: Analyze Contributing Conditions

**Source**: Original NDIS application from `/Users/davidcruwys/dev/ad/appydave/appydave-app-a-day/001-ndis-incident-report/`

**Endpoint**: `/analyze-contributing-conditions`  
**Trigger**: Epic 5 Analysis workflow (future enhancement)
**Purpose**: Analyze completed incidents for patterns and contributing factors

## Input Variables

- `reporter_name` - Staff member who reported
- `participant_name` - Individual involved in incident
- `event_datetime` - When incident occurred
- `location` - Where incident took place
- `before_event` + `before_event_extra` - Original + enhanced before narratives
- `during_event` + `during_event_extra` - Original + enhanced during narratives  
- `end_of_event` + `end_of_event_extra` - Original + enhanced end narratives
- `post_event_support` + `post_event_support_extra` - Original + enhanced post-event narratives

## Prompt Template (N8N JavaScript)

```javascript
const prompt = `You are reviewing a narrative report from ${reporterName} about an incident involving ${participantName} on ${eventDateTime} at ${location}.

Incident Inputs

What was happening in the lead-up to the incident?
before_event:
<before_event>${beforeEvent}</before_event>
<before_event_extra>${beforeEventExtra}</before_event_extra>

What occurred during the incident itself?
during_event:
<during_event>${duringEvent}</during_event>
<during_event_extra>${duringEventExtra}</during_event_extra>

How did the incident conclude?
end_of_event:
<end_of_event>${endOfEvent}</end_of_event>
<end_of_event_extra>${endOfEventExtra}</end_of_event_extra>

What support or care was provided in the two hours after the event?
post_event_support:
<post_event_support>${postEventSupport}</post_event_support>
<post_event_support_extra>${postEventSupportExtra}</post_event_support_extra>

Your task
Identify and summarise the immediate contributing conditions — any meaningful patterns, responses, support gaps, or participant behaviours that contributed to the occurrence or escalation of this specific incident.

Response Format:
\`\`\`
**Immediate Contributing Conditions**

### [Condition Name 1]
- [Specific supporting detail from the report]
- [Another relevant observation]

### [Condition Name 2]  
- [Specific supporting detail]
\`\`\`

Only include items clearly supported by the data.
Focus on immediate relevance to this incident.`;
```

## Key Features

- **Comprehensive analysis**: Uses both original and enhanced narratives
- **Pattern recognition**: Identifies meaningful contributing factors
- **Evidence-based**: Only includes conditions supported by data
- **Structured output**: Organized by condition with supporting details
- **Professional format**: Markdown formatting for readability
- **Incident-specific focus**: Avoids generic or unsupported conclusions

## Analysis Scope

- **Immediate conditions**: Factors directly related to this specific incident
- **Support gaps**: Missing or inadequate support that may have contributed
- **Participant behaviors**: Actions or responses that influenced the incident
- **Environmental factors**: Physical or contextual elements that contributed
- **Response patterns**: How staff and systems responded during the incident

## Use Cases

- **Quality improvement**: Identify systemic issues for organizational learning
- **Risk assessment**: Understand factors that increase incident likelihood
- **Training needs**: Identify areas where staff need additional support
- **Policy development**: Evidence-based policy and procedure updates
- **Regulatory reporting**: Professional analysis for compliance requirements