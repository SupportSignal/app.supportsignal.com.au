# SupportSignal: Generate Clarification Questions

**Source**: SupportSignal application seed template
**File**: `apps/convex/lib/prompts/default_prompts.ts`
**Category**: `clarification_questions`
**Purpose**: Generate clarification questions based on incident narrative to gather additional details

## Template Configuration

```typescript
{
  name: "generate_clarification_questions",
  description: "Generate clarification questions based on incident narrative to gather additional details",
  category: "clarification_questions" as const,
}
```

## Input Variables

- `participant_name` - NDIS participant name (required)
- `reporter_name` - Name of person reporting incident (required)
- `event_date_time` - Date and time of incident (required)
- `incident_location` - Location where incident occurred (optional, default: "unspecified location")
- `narrative_phase` - Phase of narrative being clarified (required)
- `existing_narrative` - Current narrative content for the phase (required)

## Prompt Template

```
You are an expert incident analyst helping to gather additional details about an NDIS incident involving {{participant_name}}.

**Incident Context:**
- **Participant**: {{participant_name}}
- **Date/Time**: {{event_date_time}}
- **Location**: {{incident_location}}
- **Reporter**: {{reporter_name}}

**Current Narrative ({{narrative_phase}} phase):**
{{existing_narrative}}

**Your Task:**
Generate 3-5 specific, focused clarification questions that would help gather additional important details about this incident. Focus on:
- Missing factual details that would improve understanding
- Context that could help prevent similar incidents
- Specific circumstances that aren't clear from the current narrative

**Requirements:**
- Questions should be clear and specific
- Avoid yes/no questions when possible
- Focus on actionable details
- Consider NDIS reporting requirements
- Be sensitive to the participant's needs and dignity

Generate questions as a JSON array with this format:
[
  {
    "question": "Your specific question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]
```

## Key Differences from NDIS Original

### **Scope**
- **Single-phase approach**: Works with one narrative phase at a time
- **NDIS Original**: Multi-phase workflow with 4 phases processed simultaneously

### **Output Format**
- **JSON array with purpose**: Each question includes explanation
- **NDIS Original**: Simple array grouped by phase

### **Question Count**
- **3-5 questions**: More focused set
- **NDIS Original**: 2-4 questions per phase (8-16 total)

### **Variable Structure**
- **Phase-specific**: Single narrative phase input
- **NDIS Original**: All phases provided at once

## Strengths

- **Focused questioning**: Targeted to specific narrative phase
- **Purpose explanation**: Questions include rationale
- **NDIS compliance**: Considers reporting requirements
- **Dignity-centered**: Emphasizes participant respect

## Potential Improvements

- **Multi-phase capability**: Could handle full incident workflow
- **Dynamic question count**: Adjust based on narrative complexity
- **Context integration**: Cross-reference with other incident phases