# NDIS Original: Enhance Narrative Content

**Source**: Original NDIS application from `/Users/davidcruwys/dev/ad/appydave/appydave-app-a-day/001-ndis-incident-report/`

**Endpoint**: `/enhance-narrative-content`
**Trigger**: After each clarification step (Steps 3-6)
**Purpose**: Consolidate original narrative with clarification answers

## Input Variables (N8N JavaScript format)

- `phase` - Current phase (beforeEvent, duringEvent, endEvent, postEvent)
- `answers` - Array of {question, answer} objects
- `instruction` - Phase-specific enhancement instructions

## Prompt Template (N8N JavaScript)

```javascript
const phase = $json.phase || "Unknown Phase";
const instruction = $json.instruction || "No instruction provided.";
const answers = Array.isArray($json.answers) ? $json.answers : [];

const narrativeFacts = answers
  .filter(item =>
    item.question && item.question.trim() !== "" &&
    item.answer   && item.answer.trim()   !== ""
  )
  .map(item => `Q: ${item.question.trim()}\nA: ${item.answer.trim()}`);

const prompt = `
You are a report-writing assistant.

For the "${phase}" phase of an incident, you have the following answered clarification questions.

For each one:
- Keep the original question.
- Respond with the answer on the next line.
- Lightly clean up the grammar of the answer, but keep the original tone and phrasing.
- Do not summarize or rewrite the response.
- Do not include unanswered questions.

Details:
${narrativeFacts.join('\n\n')}

Instruction:
${instruction}
`.trim();
```

## Key Features

- **Phase-specific processing**: Works with individual incident phases
- **Light grammar cleanup**: Preserves original tone and phrasing
- **Question/answer format**: Maintains Q&A structure
- **Filtering logic**: Excludes empty/unanswered questions
- **JavaScript preprocessing**: Uses N8N JavaScript for data manipulation
- **Minimal enhancement**: Does not rewrite or summarize content

## Enhancement Philosophy

- **Preserve authenticity**: Keep original voice and observations
- **Light touch editing**: Grammar cleanup only, no content changes  
- **Maintain structure**: Q&A format preserved in output
- **No interpretation**: Does not add context or inference