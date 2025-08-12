# SupportSignal: Enhance Narrative

**Source**: SupportSignal application seed template
**File**: `apps/convex/lib/prompts/default_prompts.ts`
**Category**: `narrative_enhancement`
**Purpose**: Enhance incident narrative by combining original content with clarification responses

## Template Configuration

```typescript
{
  name: "enhance_narrative",
  description: "Enhance incident narrative by combining original content with clarification responses",
  category: "narrative_enhancement" as const,
}
```

## Input Variables

- `participant_name` - NDIS participant name (required)
- `event_date_time` - Date and time of incident (required)
- `incident_location` - Location where incident occurred (optional, default: "unspecified location")
- `reporter_name` - Name of person reporting incident (required)
- `existing_narrative` - Original narrative content to be enhanced (required)
- `clarification_responses` - Additional details gathered through clarification questions (required)

## Prompt Template

```
You are an expert NDIS incident documentation specialist. Your task is to create a comprehensive, well-structured incident narrative by combining original observations with additional clarification details.

**Incident Overview:**
- **Participant**: {{participant_name}}
- **Date/Time**: {{event_date_time}}
- **Location**: {{incident_location}}
- **Reporter**: {{reporter_name}}

**Original Narrative:**
{{existing_narrative}}

**Additional Details from Clarifications:**
{{clarification_responses}}

**Your Task:**
Create an enhanced, comprehensive narrative that:
1. **Integrates** original content with clarification responses seamlessly
2. **Maintains** chronological flow and factual accuracy
3. **Preserves** the reporter's voice and observations
4. **Adds** clarified details in appropriate context
5. **Ensures** professional, respectful language throughout

**Guidelines:**
- Keep the participant's dignity and privacy central
- Use clear, professional language suitable for NDIS reporting
- Maintain factual accuracy - don't infer beyond provided information
- Structure content logically (chronological or thematic as appropriate)
- Ensure all important details from both sources are included

**Output Format:**
Provide the enhanced narrative as a single, well-structured paragraph or series of paragraphs. Do not include headers, bullets, or JSON formatting - just the enhanced narrative text.
```

## Key Differences from NDIS Original

### **Enhancement Approach**
- **Comprehensive integration**: Creates entirely new narrative combining both sources
- **NDIS Original**: Light grammar cleanup, preserves Q&A format

### **Content Transformation**
- **Seamless narrative**: Produces flowing paragraph text
- **NDIS Original**: Maintains question/answer structure

### **Professional Standards**
- **NDIS reporting focus**: Specifically designed for formal NDIS documentation
- **NDIS Original**: General report assistance

### **Integration Philosophy**
- **Holistic approach**: Creates unified narrative from multiple sources
- **NDIS Original**: Minimal editing, preserves original structure

## Strengths

- **Professional output**: Suitable for formal NDIS reporting
- **Comprehensive integration**: Seamlessly blends original and clarified content
- **Contextual placement**: Adds details in appropriate narrative locations
- **Quality assurance**: Multiple guidelines ensure consistent, respectful output

## Enhancement Guidelines

1. **Dignity-first**: Participant privacy and respect paramount
2. **Factual accuracy**: No inference beyond provided information
3. **Voice preservation**: Maintains reporter's original observations
4. **Professional language**: Appropriate for regulatory documentation
5. **Logical structure**: Chronological or thematic organization

## Output Quality

- **Single narrative format**: No headers, bullets, or formatting
- **Professional tone**: Suitable for external review
- **Complete integration**: All important details included
- **Respectful language**: Appropriate for sensitive content