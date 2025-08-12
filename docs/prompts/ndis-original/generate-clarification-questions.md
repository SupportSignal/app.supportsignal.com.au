# NDIS Original: Generate Clarification Questions

**Source**: Original NDIS application from `/Users/davidcruwys/dev/ad/appydave/appydave-app-a-day/001-ndis-incident-report/`

**Endpoint**: `/generate-clarification-questions`
**Trigger**: After Step 2 (Narrative Input)
**Purpose**: Generate phase-specific follow-up questions

## Input Variables

- `participant_name` - Participant's name from metadata
- `reporter_name` - Reporter's name from metadata  
- `event_datetime` - When incident occurred
- `location` - Where incident occurred
- `before_event` - Before event narrative text
- `during_event` - During event narrative text
- `end_of_event` - End event narrative text
- `post_event_support` - Post-event narrative text

## Prompt Template

```
You are preparing clarification questions for a previously submitted narrative report.
The incident involved {{ $json.participant_name }}, and was reported by {{ $json.reporter_name }}.
The original event occurred on {{ $json.event_datetime }} at {{ $json.location }}.

Your task is to generate open-ended follow-up questions that help clarify or expand on the original report, broken into four structured sections:

<before_event>
{{ $json.before_event }}
</before_event>

<during_event>
{{ $json.during_event }}
</during_event>

<end_of_event>
{{ $json.end_of_event }}
</end_of_event>

<post_event_support>
{{ $json.post_event_support }}
</post_event_support>

Output your response as valid JSON using the following structure:

{
  "before_event": ["Question 1", "Question 2"],
  "during_event": ["Question 1", "Question 2"],
  "end_of_event": ["Question 1", "Question 2"], 
  "post_event_support": ["Question 1", "Question 2"]
}

Guidelines:
- Provide 2-4 open-ended questions per section
- Focus on clarifying actions, reactions, timing, environment, witnesses
- Use supportive language that encourages reflection
- Handle sensitive content appropriately and respectfully
- Return only JSON output, no extra commentary
```

## Key Features

- **Multi-phase approach**: Generates questions for all 4 incident phases
- **Contextual awareness**: Uses participant name, reporter, location, datetime
- **Structured JSON output**: Organized by phase for step-by-step workflow
- **Open-ended questions**: Encourages detailed responses
- **Sensitive content handling**: Appropriate for NDIS incidents