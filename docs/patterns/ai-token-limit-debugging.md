# AI Token Limit Debugging Pattern

**Context**: Story 6.5 - Debugging mock answer generation truncation issues

## Problem Statement

AI-generated JSON responses were being truncated mid-string, causing JSON parsing failures:

```
Error: Unterminated string in JSON at position 365
Original response: '{"answers":[{"question_id":"end_event_q1","answer":"I kept my voice low and even...'
```

## Root Cause Analysis Process

### Step 1: Identify Truncation (Not Parsing Error)

**Wrong Assumption**: "The AI is generating invalid JSON"
**Reality**: The AI is generating valid JSON, but it's being cut off

**Evidence**:
- Response starts correctly: `{"answers":[...`
- Response ends abruptly mid-sentence: `"...at Sarah's eye level, about an arm's length away. I said, "I can hear you're really wanting ice cream right now. We're going to keep you safe, and we can make a plan together." I offered clear choices: "Would you like to sit on the blue beanbag or the`
- No closing quotes, braces, or brackets

### Step 2: Check Token Usage vs Limits

**Metadata from successful request:**
```json
{
  "tokens_used": 2484,
  "processing_time_ms": 29992,
  "ai_model": "openai/gpt-5"
}
```

**Database configuration:**
```sql
SELECT max_tokens FROM ai_prompts WHERE prompt_name = 'generate_mock_answers';
-- Result: 2000
```

**Problem**: Response needed 2484 tokens, but limit was 2000 → truncated at ~2000 tokens.

### Step 3: Understand Database vs Code Priority

**Code fallback** (`aiOperations.ts:740`):
```typescript
maxTokens: processedPrompt.maxTokens || 5000
```

**This fallback is NEVER used if database has a value!**

If `processedPrompt.maxTokens = 2000` from database, the `|| 5000` is ignored.

### Step 4: Fix at Source (Template Definition)

**Wrong approach**: Change code fallback values
**Right approach**: Update template definition

**File**: `apps/convex/promptManager.ts` (lines 539-575)

```typescript
{
  prompt_name: "generate_mock_answers",
  // ... template content ...
  max_tokens: 5000, // ← Add this field to template definition
  workflow_step: "sample_data_generation",
  subsystem: "incidents",
}
```

### Step 5: Reseed Database

After updating template:
1. UI: Click "Clear All Prompts" (sets `is_active: false`)
2. UI: Click "Seed Prompts" (creates new prompts with updated values)
3. Verify: Check database shows 5000 tokens

## Key Debugging Commands

```bash
# Check what's in database (not what's in code)
bunx convex data ai_prompts | grep -A 3 "generate_mock_answers"

# Check actual token usage from AI responses
# Look in Convex logs for "tokens_used" field

# Verify which template definition is being used
grep -n "const DEFAULT_PROMPTS" apps/convex/promptManager.ts
```

## Pattern: Database-First Configuration

**Principle**: In this architecture, database values take precedence over code defaults.

**Workflow**:
1. Code defines **template defaults**
2. Seeding loads templates **into database**
3. Runtime uses **database values** (code fallbacks only for null/undefined)
4. Changes require **reseed operation** to take effect

**Implication**: Can't just change code and expect it to work - must reseed database.

## Lessons Learned

### 1. Token Limits Must Match Model Quality

| Model | Typical Response Length | Recommended Limit |
|-------|------------------------|-------------------|
| gpt-4o-mini | Concise (500-1000 tokens) | 2000 tokens |
| gpt-5 | Detailed (1500-3000 tokens) | 5000 tokens |

Better models generate more detailed, realistic responses → need higher token limits.

### 2. Structured Outputs Add Overhead

JSON schema formatting adds ~10-20% token overhead:
- Property names: `"question_id"`, `"answer"`
- Structure: `{"answers": [...]}`
- Formatting: Pretty-printing, indentation

Account for this when setting token limits.

### 3. Debugging Checklist

When AI responses fail:

- [ ] Check if response is truncated (look at raw content, not just error)
- [ ] Check token usage vs configured limits (metadata logs)
- [ ] Check database configuration (not just code defaults)
- [ ] Understand which config file is actually being used
- [ ] Fix template definition at source
- [ ] Reseed database to apply changes
- [ ] Verify database now has correct values

### 4. Prevention

**Add template validation**:
- Lint check: All prompt templates must have `max_tokens` defined
- Warning: If model is gpt-5, ensure `max_tokens >= 3000`
- Test: Automated check that database matches code templates after seed

## Related Documentation

- [AI Model Challenges and Solutions](../lessons-learned/ai-model-challenges-and-solutions.md) - User-facing explanation
- [Prompt Template Structure](../architecture/prompt-template-structure.md) - Template format reference
- Story 6.5 - LLM Model Management Upgrade

## When to Use This Pattern

**Symptoms**:
- JSON parsing errors: "Unterminated string"
- Responses that end abruptly mid-sentence
- Logs showing token usage near the configured limit
- Works sometimes, fails other times (based on response length)

**Quick diagnostic**:
```bash
# If you see this in logs:
"tokens_used": 2484, "max_tokens": 2000  # ← Problem!
```

**Solution**: Increase token limit in template definition and reseed.
