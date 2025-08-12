# NDIS Original: Generate Mock Answers

**Source**: Original NDIS application from `/Users/davidcruwys/dev/ad/appydave/appydave-app-a-day/001-ndis-incident-report/`

**Endpoint**: `/generate-mock-answers`
**Trigger**: Test data generation (development feature)
**Purpose**: Create realistic test answers for clarification questions

## Input Variables

- `participant_name` - From incident metadata
- `reporter_name` - From incident metadata
- `location` - From incident metadata
- `phase` - Current phase being tested
- `phase_narrative` - Original narrative for context
- `questions` - Array of question objects to answer

## Prompt Template

```
You are generating realistic mock answers for clarification questions about an NDIS incident report.

The incident involved {{ $json.participant_name }}, and was reported by {{ $json.reporter_name }}.
The event occurred at {{ $json.location }}.

You are generating answers specifically for the {{ $json.phase }} phase of the incident.

<phase_narrative>
{{ $json.phase_narrative }}
</phase_narrative>

Based on the narrative context above, provide realistic and detailed answers to the following clarification questions. The answers should:
- Be consistent with the narrative provided
- Sound like they come from someone who witnessed the incident
- Include specific details that would be helpful for incident documentation
- Be professional but conversational in tone
- Vary in length (some brief, some more detailed)

Questions to answer:
{{ $json.questions }}

Output as JSON:
{
  "answers": [
    {
      "question_id": "question-id-here",
      "question": "The original question text",
      "answer": "Detailed realistic answer here"
    }
  ]
}
```

## Key Features

- **Realistic test data**: Creates believable incident responses
- **Context-aware**: Uses narrative and metadata for consistency
- **Variable length responses**: Mix of brief and detailed answers
- **Professional tone**: Appropriate for NDIS reporting context
- **Structured JSON output**: Matches system data format
- **Development tool**: Enables testing without manual data entry

## Use Cases

- **Development testing**: Rapid population of test scenarios
- **UI demonstration**: Realistic data for stakeholder reviews
- **System validation**: Consistent test data across development team
- **Training data**: Examples for staff training on incident reporting