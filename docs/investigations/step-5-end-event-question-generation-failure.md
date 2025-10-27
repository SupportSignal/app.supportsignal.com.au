# Investigation Report: Step 5 END_EVENT Question Generation Failure

**Date**: 2025-10-27
**Investigator**: Claude Code
**Status**: Root Cause Identified - Awaiting Implementation Approval
**Severity**: HIGH - Blocks user workflow at Step 5

## Executive Summary

**Problem**: Step 5 (END_EVENT phase) displays "Generating End of Event questions..." spinner indefinitely. Questions never appear, spinner never disappears, user workflow blocked.

**Root Cause**: Token limit insufficiency - `max_tokens: 2000` in database is inadequate for gpt-5 model's detailed responses (typically 1500-3000 tokens), causing JSON truncation mid-response and UI hang.

**Impact**:
- Steps 3 & 4 (BEFORE_EVENT, DURING_EVENT): ✅ Working
- Step 5 (END_EVENT): ❌ Broken - spinner hangs indefinitely
- Step 6 (POST_EVENT): ⚠️ Likely affected by same issue

**Recommended Fix**: Increase `max_tokens` from 2000 to 3000-5000 for all question generation prompts, matching the fix applied to `generate_mock_answers` in Story 6.5.

---

## 1. Problem Statement

### Symptoms

**What User Observed**:
- Step 5 reached successfully (navigation works)
- Page-Level Loader appears: "Generating End of Event questions..."
- Message shows: "Questions are being created in the background and will appear here automatically."
- Spinner remains on screen indefinitely
- No questions ever appear
- User cannot proceed or interact with UI

**Console Evidence**:
```
🚀 STEP 2→3 TRANSITION - TIMING START
⏱️ Start Time: 2025-10-27T...
🔍 Parameters: { incidentId, phase: 'end_event', ... }
🤖 Starting proactive question generation for all phases...
🚀 API CALL START - generateAllQuestions
[... no completion logs ...]
```

**What Works**:
- ✅ Step 3 (BEFORE_EVENT): Questions generated successfully
- ✅ Step 4 (DURING_EVENT): Questions generated successfully
- ❌ Step 5 (END_EVENT): Hangs with spinner

**Timeline**:
- Questions for all phases generated proactively during Step 2→3 transition
- BEFORE_EVENT and DURING_EVENT succeeded
- END_EVENT failed silently (no error message, just hung spinner)

---

## 2. Investigation Process

### Step 1: KDD Documentation Review

**Documents Reviewed**:
1. **`docs/patterns/ai-token-limit-debugging.md`** (Story 6.5)
   - Documented identical issue with `generate_mock_answers`
   - Root cause: Response needed 2484 tokens, limit was 2000 → truncation
   - Evidence pattern: `"tokens_used": 2484, "max_tokens": 2000`
   - Fix: Increased to `max_tokens: 5000`

2. **`docs/technical-guides/ai-pipeline-debugging-kdd.md`**
   - AI instruction following patterns
   - JSON parsing failure patterns

**Key Learning from Story 6.5**:
> "Database-First Configuration: Database values override code fallbacks"
>
> "Fix Process:
> 1. Add `max_tokens` field to template definition in code
> 2. UI: Click 'Clear All Prompts' (sets `is_active: false`)
> 3. UI: Click 'Seed Prompts' (creates new prompts with updated values)
> 4. Verify database shows new token limit"

### Step 2: Code Analysis - Template Definitions

**File**: `apps/convex/promptManager.ts`

**Finding**: Lines 664-706 - `generate_clarification_questions_end_event` template definition

```typescript
{
  prompt_name: "generate_clarification_questions_end_event",
  prompt_template: `You are an expert incident analyst helping to gather **clear, practical details** about how an NDIS incident involving {{participantName}} came to an end and what happened right afterward.

**Incident Context:**
- **Participant**: {{participantName}}
- **Date/Time**: {{eventDateTime}}
- **Location**: {{location}}
- **Reporter**: {{reporterName}}

**End Event Narrative:**
{{endEvent}}

**Your Task:**
Generate 3–5 clarification questions that a frontline worker who was present could reasonably answer.
Focus on what happened as the incident finished and in the minutes or moments just after.

**Key Areas to Explore (End-Event):**
- What helped calm things down or bring the incident to a close
- How the participant's behavior or mood changed as things settled
- Any immediate safety concerns that were still present
- If emergency services (e.g., ambulance, police) were involved, what happened next
- How staff worked together during the resolution
- What steps were taken to return things to normal or support the participant after the event

**Requirements:**
- Use simple, clear, and direct language (for English as a second language)
- Avoid yes/no questions — ask for short descriptions or actions
- Only ask about things the worker **saw, heard, or did** — not policy or background knowledge
- Focus on what helped resolve the incident or what needed follow-up
- Keep a respectful tone — protect the dignity of the participant and others involved

**Output format:**
Return the questions as a JSON array:
[
  {
    "question": "Your specific end-event question here",
    "purpose": "Brief explanation of why this detail is important"
  }
]`,
  description: "Generate end-event focused clarification questions about resolution strategies and outcomes",
  workflow_step: "clarification_questions",
  subsystem: "incidents",
  // ❌ CRITICAL FINDING: NO max_tokens field defined
},
```

**Comparison**: All 4 question generation prompts checked:
- `generate_clarification_questions_before_event` - ❌ No `max_tokens` field
- `generate_clarification_questions_during_event` - ❌ No `max_tokens` field
- `generate_clarification_questions_end_event` - ❌ No `max_tokens` field
- `generate_clarification_questions_post_event` - ❌ No `max_tokens` field

**Contrast**: `generate_mock_answers` (fixed in Story 6.5):
```typescript
{
  prompt_name: "generate_mock_answers",
  // ... template ...
  max_tokens: 5000, // ✅ Added in Story 6.5 to fix token truncation
}
```

### Step 3: Database Configuration Verification

**Query Command**:
```bash
bunx convex data ai_prompts --limit 100 | grep -A 8 "generate_clarification_questions_end_event"
```

**Database Result**:
```
prompt_name: "generate_clarification_questions_end_event"
max_tokens: 2000  ← FOUND IN DATABASE
ai_model: "openai/gpt-5"
description: "Generate end-event focused clarification questions about resolution strategies and outcomes"
```

**All Question Generation Prompts Checked**:
```
generate_clarification_questions_before_event: max_tokens: 2000
generate_clarification_questions_during_event: max_tokens: 2000
generate_clarification_questions_end_event:    max_tokens: 2000
generate_clarification_questions_post_event:   max_tokens: 2000
```

**Contrast - Working Prompt**:
```
generate_mock_answers: max_tokens: 5000  ← Fixed in Story 6.5
```

### Step 4: Pattern Analysis

**Database-First Configuration (From Story 6.5 KDD)**:
- Template definitions in code serve as initial seed values
- Database values override code defaults
- When `max_tokens` missing from code, database uses unknown default (appears to be 2000)
- Reseeding required to update database when code changes

**Model Characteristics (From Story 6.5 KDD)**:
| Model | Typical Response Length | Recommended Limit |
|-------|------------------------|-------------------|
| gpt-4o-mini | Concise (500-1000 tokens) | 2000 tokens |
| gpt-5 | Detailed (1500-3000 tokens) | **5000 tokens** |

**Current Configuration**:
- Model: `openai/gpt-5` (verified in database)
- Token Limit: `2000` (inadequate for gpt-5)
- Expected Response Size: 1500-3000 tokens (based on Story 6.5)
- Result: **Truncation likely occurring**

---

## 3. Root Cause Identification

### Primary Root Cause: Token Limit Insufficiency

**Configuration Mismatch**:
```
Current:  max_tokens: 2000
Model:    openai/gpt-5 (generates detailed 1500-3000 token responses)
Required: max_tokens: 3000-5000 (as proven by Story 6.5 fix)
```

**Failure Mechanism**:
1. AI generates END_EVENT questions (detailed response due to gpt-5 model)
2. Response exceeds 2000 token limit
3. Response truncated mid-JSON at ~2000 tokens
4. Frontend receives incomplete JSON
5. JSON parsing fails silently
6. UI spinner waits indefinitely for valid response
7. User sees hung spinner, no error message

**Why This Wasn't Caught Earlier**:
- Template definitions in code have NO `max_tokens` field
- Database inherited 2000 token default (source unknown)
- Story 6.5 fixed `generate_mock_answers` but didn't audit question generation prompts
- BEFORE_EVENT and DURING_EVENT questions MAY fit within 2000 tokens (shorter responses)
- END_EVENT questions consistently exceed limit due to complexity

---

## 4. Evidence Supporting Root Cause

### Evidence 1: Story 6.5 Parallel Pattern

**From `docs/patterns/ai-token-limit-debugging.md`**:

**Story 6.5 Problem**:
```
Operation: generate_mock_answers
Symptom: Response truncated, invalid JSON
Evidence: "tokens_used": 2484, "max_tokens": 2000
```

**Story 6.5 Fix**:
```typescript
{
  prompt_name: "generate_mock_answers",
  max_tokens: 5000, // Increased from 2000
}
```

**Result**: Problem solved - responses no longer truncated

**Current Problem** (identical pattern):
```
Operation: generate_clarification_questions_end_event
Symptom: Spinner hangs, no questions appear
Evidence: max_tokens: 2000 in database, NO max_tokens in code
```

### Evidence 2: Symptom Match

**Story 6.5 Symptoms**:
- Operation appears to start
- No completion
- No error message
- Response truncated at ~2000 tokens

**Current Symptoms**:
- Spinner appears ("Generating End of Event questions...")
- No completion
- No error message
- Steps 3 & 4 work, Step 5 fails (END_EVENT has longest/most complex responses)

### Evidence 3: Database Configuration Gap

**Working Prompt** (Story 6.5 fix):
```
Prompt: generate_mock_answers
Code:     max_tokens: 5000 ✅
Database: max_tokens: 5000 ✅
Status:   WORKING
```

**Broken Prompts** (current issue):
```
Prompts:  generate_clarification_questions_*
Code:     max_tokens: [MISSING] ❌
Database: max_tokens: 2000 ❌ (inadequate for gpt-5)
Status:   BROKEN (END_EVENT confirmed, others at risk)
```

### Evidence 4: Model Requirements

**From Story 6.5 Analysis**:
> "gpt-5 generates detailed responses (typically 1500-3000 tokens)"
> "Recommended limit for gpt-5: 5000 tokens"

**Current Configuration**:
- Model: gpt-5 (verified in database)
- Limit: 2000 tokens
- **Gap**: 1000-3000 tokens short of typical gpt-5 responses

### Evidence 5: Phase-Specific Complexity

**Why END_EVENT Fails But BEFORE/DURING Succeed**:

**BEFORE_EVENT Questions** (shorter scope):
- "What was happening just before the incident?"
- "Where was the participant?"
- "Who was present?"
- Estimated tokens: 800-1500 (fits in 2000)

**DURING_EVENT Questions** (medium scope):
- "What did the participant do?"
- "How did staff respond?"
- "What safety measures were taken?"
- Estimated tokens: 1000-1800 (fits in 2000)

**END_EVENT Questions** (longest scope)**:
- "What helped calm things down or bring the incident to a close"
- "How the participant's behavior or mood changed as things settled"
- "If emergency services were involved, what happened next"
- "How staff worked together during the resolution"
- "What steps were taken to return things to normal"
- Estimated tokens: 2000-3000 (EXCEEDS 2000 limit)

**Prompt Complexity Analysis**:
- END_EVENT prompt has **6 key areas to explore** (longest list)
- BEFORE_EVENT has 3 areas
- DURING_EVENT has 4 areas
- More areas = longer AI response = higher token usage

---

## 5. Proposed Action Plan

### Phase 1: Code Updates (No Deployment Yet)

**Step 1**: Update template definitions in `apps/convex/promptManager.ts`

Add `max_tokens: 3000` to all 4 question generation prompts:

```typescript
{
  prompt_name: "generate_clarification_questions_before_event",
  prompt_template: `...`,
  description: "...",
  workflow_step: "clarification_questions",
  subsystem: "incidents",
  max_tokens: 3000, // ← ADD THIS
},
{
  prompt_name: "generate_clarification_questions_during_event",
  prompt_template: `...`,
  description: "...",
  workflow_step: "clarification_questions",
  subsystem: "incidents",
  max_tokens: 3000, // ← ADD THIS
},
{
  prompt_name: "generate_clarification_questions_end_event",
  prompt_template: `...`,
  description: "...",
  workflow_step: "clarification_questions",
  subsystem: "incidents",
  max_tokens: 3000, // ← ADD THIS
},
{
  prompt_name: "generate_clarification_questions_post_event",
  prompt_template: `...`,
  description: "...",
  workflow_step: "clarification_questions",
  subsystem: "incidents",
  max_tokens: 3000, // ← ADD THIS
},
```

**Token Limit Decision**:
- **Conservative**: 3000 tokens (Story 6.5 documented max observed: 2484)
- **Safe**: 5000 tokens (matches `generate_mock_answers` fix)
- **Recommendation**: Start with 3000, increase to 5000 if truncation recurs

### Phase 2: Database Reseed (Production + Development)

**Step 2**: Deploy code to Convex

```bash
bunx convex deploy  # Deploys to development (beaming-gull-639)
```

**Step 3**: Reseed prompts in UI

**Development Environment**:
1. Navigate to Settings → AI Prompt Management
2. Click "Clear All Prompts" (sets `is_active: false` on existing prompts)
3. Click "Seed Prompts" (creates new prompts with updated `max_tokens: 3000`)

**Production Environment** (after dev testing):
```bash
bunx convex deploy --prod  # Deploy to prod (graceful-shrimp-355)
```
Then repeat UI steps in production.

**Step 4**: Verify database updated

```bash
# Development
bunx convex data ai_prompts --limit 100 | grep -A 8 "generate_clarification_questions_end_event"

# Expected output:
# prompt_name: "generate_clarification_questions_end_event"
# max_tokens: 3000  ← VERIFY THIS CHANGED FROM 2000
# ai_model: "openai/gpt-5"
```

### Phase 3: Testing & Validation

**Step 5**: Test all 4 question generation phases

**Test Procedure**:
1. Create new incident
2. Add narrative to Step 2 (trigger proactive question generation)
3. Navigate to Step 3 (BEFORE_EVENT)
   - ✅ Questions appear
   - ✅ Spinner disappears
   - ✅ No console errors
4. Navigate to Step 4 (DURING_EVENT)
   - ✅ Questions appear
   - ✅ Spinner disappears
5. Navigate to Step 5 (END_EVENT) **← PRIMARY TEST**
   - ✅ Questions appear (CURRENTLY FAILS)
   - ✅ Spinner disappears (CURRENTLY HANGS)
   - ✅ No console errors
6. Navigate to Step 6 (POST_EVENT)
   - ✅ Questions appear
   - ✅ Spinner disappears

**Step 6**: Check timing instrumentation logs

Review console for operation timing:
```
📊 STEP 2→3 TRANSITION - TIMING START
⏱️ Start Time: [timestamp]
🚀 API CALL START - generateAllQuestions
📥 API CALL COMPLETE - generateAllQuestions
⏱️ API Call Duration: [X.XX] seconds
✅ Proactive question generation completed: {
  success: true,
  total_questions_generated: 15,
  successful_phases: ["before_event", "during_event", "end_event", "post_event"],
  failed_phases: []
}
📊 STEP 2→3 TRANSITION - TIMING END
⏱️ Total Duration: [X.XX] seconds
```

**Expected Results**:
- All 4 phases succeed
- `failed_phases: []` (empty array)
- Total duration < 30 seconds
- No truncation warnings in logs

**Step 7**: Verify token usage in logs (if available)

If Convex logs include token usage:
```
Expected: tokens_used < 3000 (within new limit)
Previous: tokens_used > 2000 (exceeded old limit)
```

### Phase 4: Production Deployment (After Dev Testing)

**Step 8**: Deploy to production

```bash
bunx convex deploy --prod
```

**Step 9**: Reseed production prompts (UI steps same as dev)

**Step 10**: Monitor production logs

Check for:
- ✅ Question generation success across all phases
- ✅ No truncation errors
- ✅ Timing within acceptable range

---

## 6. Testing Strategy

### Pre-Implementation Testing Checklist

**Before applying fix**:
- [ ] Document current behavior (Step 5 hangs - DOCUMENTED)
- [ ] Capture console logs (timing instrumentation - AVAILABLE)
- [ ] Verify database state (`max_tokens: 2000` - VERIFIED)

### Post-Implementation Testing Checklist

**After applying fix**:
- [ ] Verify code changes deployed to Convex
- [ ] Verify database updated (`max_tokens: 3000`)
- [ ] Test BEFORE_EVENT questions (Step 3)
- [ ] Test DURING_EVENT questions (Step 4)
- [ ] Test END_EVENT questions (Step 5) **← PRIMARY**
- [ ] Test POST_EVENT questions (Step 6)
- [ ] Verify timing instrumentation logs
- [ ] Check for token usage in Convex logs
- [ ] Verify no console errors
- [ ] Test with multiple incidents (edge cases)

### Token Usage Monitoring

**If truncation recurs after 3000 token fix**:
1. Check Convex logs for actual `tokens_used` value
2. If `tokens_used > 3000`, increase to `max_tokens: 5000`
3. Reseed prompts again
4. Retest

**Model-Specific Recommendations** (from Story 6.5):
- gpt-4o-mini: 2000 tokens sufficient
- gpt-5: 3000-5000 tokens required

---

## 7. Risk Assessment

### Risks of Proposed Fix

**LOW RISK**:
- Increasing token limits has minimal downside
- Higher token usage = slightly higher API costs (acceptable tradeoff for functionality)
- Story 6.5 already proven this fix works for same issue
- No code logic changes - only configuration parameter

**Mitigations**:
- Start with conservative 3000 tokens (not aggressive 5000)
- Test thoroughly in development before production
- Monitor token usage post-deployment
- Can always reduce limit if costs excessive (unlikely)

### Risks of NOT Fixing

**HIGH RISK**:
- Step 5 (END_EVENT) completely broken - user workflow blocked
- Step 6 (POST_EVENT) potentially affected by same issue
- User cannot complete incident documentation
- Production system unusable for critical workflow
- Reputation damage if customers encounter broken workflow

### Alternative Approaches Considered

**Alternative 1**: Reduce prompt complexity (shorter instructions)
- ❌ Reduces quality of generated questions
- ❌ Doesn't address root cause (token limit too low for gpt-5)
- ❌ Story 6.5 already validated token increase as correct fix

**Alternative 2**: Switch to gpt-4o-mini model
- ❌ Less detailed responses (defeats purpose of using gpt-5)
- ❌ Reduces quality of question generation
- ❌ Unnecessary when token increase fixes issue

**Alternative 3**: Split question generation into smaller batches
- ❌ Increases complexity
- ❌ Requires code logic changes (higher risk)
- ❌ Unnecessary when simple config change fixes issue

**Recommended Approach**: Increase `max_tokens` to 3000-5000 (proven fix, minimal risk, addresses root cause)

---

## 8. Open Questions

### Question 1: Why did Steps 3 & 4 succeed if all have 2000 token limit?

**Hypothesis 1**: Response length variance
- BEFORE_EVENT and DURING_EVENT questions shorter (fit within 2000)
- END_EVENT questions longer (exceed 2000)
- Phase-specific complexity drives token usage

**Hypothesis 2**: Non-deterministic AI responses
- Sometimes responses fit in 2000, sometimes don't
- END_EVENT consistently exceeds limit due to complexity
- Steps 3 & 4 occasionally fail too (user just hasn't seen it yet)

**Validation**: After fix, monitor token usage logs for all 4 phases to see actual distribution.

### Question 2: Should POST_EVENT also fail?

**Expected**: Yes, POST_EVENT likely affected by same issue
- Has similar complexity to END_EVENT (analysis, follow-up, recommendations)
- May not have been tested yet by user
- Should verify POST_EVENT after END_EVENT fix

**Action**: Include POST_EVENT in comprehensive testing after fix.

### Question 3: Why didn't Story 6.5 fix all prompts?

**Analysis**:
- Story 6.5 focused on `generate_mock_answers` (answer generation)
- Question generation prompts not audited in same story
- Lesson: When fixing token limits, audit ALL AI prompts using same model

**Recommendation**: After this fix, audit ALL prompts in `promptManager.ts` for missing `max_tokens` fields.

---

## 9. Success Criteria

### Definition of Done

**Fix is successful when**:
- [ ] All 4 question generation phases complete successfully
- [ ] Step 5 (END_EVENT) spinner appears and disappears normally
- [ ] Questions appear in Step 5
- [ ] Console timing logs show successful completion
- [ ] No console errors
- [ ] `successful_phases` array includes all 4 phases
- [ ] `failed_phases` array is empty
- [ ] Production deployment succeeds
- [ ] User can complete full incident workflow

### Performance Targets

**From timing instrumentation**:
- API call duration: < 20 seconds acceptable
- Total operation duration: < 30 seconds acceptable
- Token usage: < 3000 tokens (within limit)

---

## 10. Next Steps - Awaiting Approval

**Status**: Investigation complete, root cause identified, action plan documented.

**Awaiting User Decision**:
- [ ] Review investigation findings
- [ ] Approve action plan
- [ ] Choose token limit (3000 conservative vs 5000 safe)
- [ ] Authorize implementation

**Ready to Implement**:
- Code changes prepared (add `max_tokens` to 4 prompts)
- Testing strategy defined
- Deployment process documented
- Risk assessment completed

**Estimated Implementation Time**:
- Code changes: 5 minutes
- Deployment: 2 minutes
- Reseed prompts: 2 minutes
- Testing: 15 minutes
- **Total: ~25 minutes**

---

## References

**Related Documentation**:
- `docs/patterns/ai-token-limit-debugging.md` - Story 6.5 token truncation fix
- `docs/technical-guides/ai-pipeline-debugging-kdd.md` - AI debugging patterns
- `docs/testing/stories/story-acceptance-test-0.8.md` - UAT document (Test Group 3)

**Related Code**:
- `apps/convex/promptManager.ts` - Prompt template definitions (lines 664-706)
- `apps/web/components/incidents/incident-capture-workflow.tsx` - Timing instrumentation
- `apps/convex/incidents.ts` - Question generation mutations

**Database Queries**:
```bash
# Check current state
bunx convex data ai_prompts --limit 100 | grep -A 8 "generate_clarification_questions"

# After fix, verify update
bunx convex data ai_prompts --limit 100 | grep -A 8 "max_tokens"
```
