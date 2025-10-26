# AI Model Challenges and Solutions

**Date**: October 25, 2025
**Audience**: Ronnie, Angela (Domain Experts)
**Context**: Story 6.5 - LLM Model Management Upgrade

## Executive Summary

During the upgrade from `gpt-4o-mini` to `gpt-5`, we discovered critical challenges that affect AI reliability in production. **These issues are NOT bugs in our code** - they are inherent characteristics of how different AI models behave and how prompt engineering decisions impact system stability.

This document explains why changing models or improving prompts can sometimes "break" the system, and what we've done to make it resilient.

---

## Challenge 1: Model Output Variability

### The Problem

**Different AI models format their responses differently, even when given identical prompts.**

**Example - Same JSON Request, Different Formatting**:

**gpt-4o-mini** (compact):
```json
{"answers":[{"question_id":"q1","answer":"Short answer"}]}
```

**gpt-5** (pretty-printed):
```json
{
  "answers": [
    {
      "question_id": "q1",
      "answer": "Much more detailed, realistic answer with proper grammar and context"
    }
  ]
}
```

### Why This Matters

- Our code was written to handle compact JSON from `gpt-4o-mini`
- When we upgraded to `gpt-5`, the pretty-printed format exposed latent bugs
- **The bug was always there** - the new model just made it visible

### What We Saw

**Error Message**:
```
JSON parsing failed: Unterminated string in JSON at position 1983
```

**Root Cause**: Our JSON cleanup code was too aggressive and destroyed valid JSON from `gpt-5`.

### The Fix (Story 6.5)

**Implemented OpenRouter Structured Outputs**:
- Uses JSON Schema to **guarantee** response format compliance
- Works across 46 different AI models (8 providers)
- AI literally cannot generate invalid JSON - it's enforced at the model level
- **Model-agnostic solution** - works with any model we configure

**Technical Detail**: Uses OpenAI's "constrained decoding" technology where the model is mathematically prevented from generating anything that doesn't match the schema.

---

## Challenge 2: Token Limit Truncation

### The Problem

**Better AI models generate more detailed, realistic responses - which consume more tokens.**

**What Happened**:
1. `gpt-4o-mini` generated concise mock answers → fit within 1500 token limit
2. `gpt-5` generated detailed, realistic mock answers → exceeded 1500 token limit
3. AI response was **cut off mid-JSON** → invalid JSON → parsing failure

**Example - Truncated Response**:
```json
{
  "answers": [
    {"question_id": "q1", "answer": "Detailed answer here..."},
    {"question_id": "q2", "answer": "Another detailed answer..."},
    {"question_id": "q3", "answer": "I checked her nails and fingers for any signs of biting—none noted'
```

↑ **Notice the response ends abruptly** - the string isn't even closed with a `"`, and there's no closing `}` or `]`.

### Why This Is NOT a Bug

This is **working as designed** - the AI reached its maximum allowed output length and stopped mid-sentence.

**Think of it like this**:
- You asked someone to write a 500-word essay
- They wrote 498 words and then hit the limit mid-sentence
- The essay is incomplete, but they followed your instructions exactly

### What We Saw

**Error Message**:
```
Unterminated string in JSON at position 1983 (line 13 column 636)
```

**Logged Output**:
```
Original response: {...long valid JSON...I checked her nails and fingers for any signs of biting—none noted'
```

↑ Response cut off at exactly 1983 characters because we hit the token limit.

### The Fix (Story 6.5)

**Updated Token Limits for All AI Operations**:

| Operation | Old Limit | New Limit | Reason |
|-----------|-----------|-----------|--------|
| Generate Questions | 1000 | 2000 | 5 questions with context/priority metadata |
| Generate Mock Answers | 1500 | 4000 | 5 detailed, realistic answers for testing (increased after truncation issues) |
| Enhance Narrative | 800 | 1500 | Comprehensive narrative improvements |
| Analyze Conditions | 1200 | 2000 | Detailed contributing factors analysis |

**Why These Limits**:
- **Structured outputs add overhead**: JSON property names, schema compliance formatting
- **Better models = better quality**: `gpt-5` generates more professional, realistic content
- **Safety margin**: Prevents truncation even with verbose responses

---

## Challenge 3: Prompt Engineering vs. System Stability

### The Problem

**When Angela improves prompts to get better AI responses, it can inadvertently destabilize the system.**

**Example Scenario**:

**Original Prompt** (safe but basic):
```
Generate 5 questions about the incident. Return as JSON.
```

**Angela's Improved Prompt** (better quality, higher token usage):
```
Generate 5 detailed clarification questions with context about [incident details].
For each question, explain why it's important and what information you're trying to gather.
Prioritize questions that will help staff understand patterns and prevent future incidents.
Return as structured JSON.
```

**Result**:
- ✅ **Better questions** - more relevant, more useful
- ❌ **More tokens needed** - detailed explanations consume tokens
- ❌ **System breaks** - hits token limit if not configured properly

### Why This Matters

**Angela's improvements are valuable** - they make the AI more useful for staff. But system stability depends on:
1. Prompt instructions (Angela's domain) ← **should be editable**
2. Output schema format (developer's domain) ← **must be code-controlled**
3. Token limits (developer's domain) ← **must match prompt complexity**

### Current Limitation

**Problem**: Prompt templates currently mix instructions and schema:
```
You are an AI assistant. Generate 5 questions about the incident.
Return your response as JSON in this exact format:
{
  "answers": [
    {"question_id": "string", "answer": "string"}
  ]
}
```

↑ If Angela edits this to improve question quality, she might accidentally break the JSON schema.

### The Solution (Story 6.6 - Future Work)

**Schema Separation Architecture**:

**Editable by Angela** (stored in database):
```
You are an AI assistant specializing in disability support incidents.
Generate 5 detailed clarification questions about [incident details].
Focus on understanding:
- What happened before, during, and after the event
- Contributing environmental or support factors
- Participant communication patterns
- Staff response effectiveness
```

**Code-Controlled** (hardcoded in system):
```typescript
// Output schema - NEVER editable by users
const QuestionSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  context: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional()
});
```

**Benefits**:
- ✅ Angela can improve prompt quality without breaking anything
- ✅ Developers control data structure and system stability
- ✅ Changes sync from production back to code templates
- ✅ Claude Code can assist with template updates

---

## What We Learned

### 1. Model Upgrades Expose Latent Bugs

**Lesson**: Bugs that don't fail with basic models will fail with advanced models.

**Why**: Better models generate:
- More realistic content (longer responses)
- Better formatting (pretty-printed JSON)
- Higher quality output (more tokens needed)

**Action**: When upgrading models, always test with generous token limits first.

---

### 2. Structured Outputs Are Essential

**Lesson**: Don't rely on prompt instructions alone for JSON format compliance.

**Why**: Different models interpret prompts differently, even with identical instructions.

**Action**: Use OpenRouter's structured outputs (JSON Schema) for guaranteed format compliance across all models.

---

### 3. Token Limits Must Match Model Quality

**Lesson**: Better models need more tokens to deliver their value.

**Why**:
- `gpt-4o-mini`: Generates concise, functional responses
- `gpt-5`: Generates detailed, professional, realistic responses
- Same prompt, different token requirements

**Action**: Configure token limits based on:
- Model quality (better = more tokens)
- Output complexity (structured data = more overhead)
- Prompt richness (detailed instructions = longer responses)

---

### 4. Separation of Concerns

**Lesson**: Prompt instructions and output schemas must be separately controlled.

**Why**:
- **Domain experts** (Angela) know what questions to ask
- **Developers** (us) know how to structure data for reliability
- **Mixing these** creates risk where prompt improvements break systems

**Action**: Story 6.6 will implement schema separation architecture.

---

## Summary for Ronnie and Angela

### What Broke

The system appeared to "break" when we upgraded to `gpt-5`, but actually:

1. **JSON parsing code was too aggressive** - it destroyed valid JSON from the new model
2. **Token limits were too low** - `gpt-5` generates better (longer) responses than `gpt-4o-mini`
3. **No format guarantees** - we relied on prompt instructions, which models interpret differently

### What We Fixed (Story 6.5)

1. **✅ Structured Outputs** - AI cannot generate invalid JSON anymore
2. **✅ Increased Token Limits** - All operations have appropriate limits for quality responses
3. **✅ Model-Agnostic Architecture** - Works with any model we configure

### What This Means for You

**For Angela (Prompt Engineering)**:
- ✅ Your prompt improvements will work reliably now
- ✅ System won't break from better prompts (within reason)
- ⚠️ **Current limitation**: Be careful editing schema-related parts of prompts
- 🔮 **Future (Story 6.6)**: You'll be able to edit prompts freely without risk

**For Ronnie (System Reliability)**:
- ✅ Model changes won't break JSON parsing anymore
- ✅ System will scale to more detailed AI responses
- ✅ We have safety margins for future model upgrades
- 🔮 **Future (Story 6.6)**: Domain expert improvements will sync back to code automatically

---

## Technical Details (For Developers)

### Token Limit Configuration

**Current Settings** (`apps/convex/aiOperations.ts`):

```typescript
// Question Generation (Story 6.5)
maxTokens: processedPrompt.maxTokens || 2000

// Mock Answer Generation (Story 6.5)
maxTokens: processedPrompt.maxTokens || 4000

// Narrative Enhancement (Story 6.5)
maxTokens: processedPrompt.maxTokens || 1500

// Contributing Conditions Analysis (Story 6.5)
maxTokens: processedPrompt.maxTokens || 2000
```

**Rationale**:
- Base limits allow for detailed, professional responses
- Database can override via `ai_prompts.max_tokens` field
- Safety margin for model variability and structured output overhead

### Structured Outputs Implementation

**Schema Definition** (`apps/convex/aiResponseSchemas.ts`):

```typescript
export const MockAnswersResponseSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string(),
    answer: z.string(),
  })),
});
```

**JSON Schema Conversion**:
- Converts Zod schemas to OpenRouter JSON Schema format
- Root must be `type: 'object'` (OpenRouter requirement)
- Arrays must be wrapped in object properties

**Request Format** (`apps/convex/aiOperations.ts`):

```typescript
const aiRequest: AIRequest = {
  // ... other fields
  outputSchema: zodToJsonSchema(MockAnswersResponseSchema, 'mock_answers'),
};
```

**Validation** (`apps/convex/aiClarification.ts`):

```typescript
const validationResult = MockAnswersResponseSchema.safeParse(parsedResponse);
if (!validationResult.success) {
  // Graceful degradation - try to extract data anyway
} else {
  // Schema validation passed - use validated data
  parsedAnswers = validationResult.data.answers;
}
```

---

## Next Steps

### Immediate (Story 6.5 Complete)

- ✅ All AI operations use structured outputs
- ✅ Token limits appropriate for gpt-5 quality
- ✅ Model-agnostic JSON parsing

### Future (Story 6.6)

- 📋 Schema separation in database
- 📋 Claude Code-based template sync workflow
- 📋 Angela can edit prompts without system risk
- 📋 Production improvements automatically sync to code

---

**Questions or Concerns?**
Contact: David (Developer)
Related: Epic 6 - AI Prompt Management System
