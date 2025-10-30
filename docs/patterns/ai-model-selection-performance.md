# AI Model Selection for Performance Optimization

**Pattern Category**: Performance Optimization
**Status**: Established
**Last Updated**: 2025-10-29
**Source**: Story 0.8 UAT - Performance optimization based on user feedback

---

## Overview

AI model selection significantly impacts operation speed and user experience. This pattern documents how to choose appropriate AI models based on performance requirements, balancing speed, quality, and cost.

## Performance Impact

### Model Speed Comparison (OpenRouter)

Based on real-world testing with SupportSignal prompts:

| Model | Relative Speed | Use Case | Typical Duration |
|-------|----------------|----------|------------------|
| `openai/gpt-4o-mini` | **4x faster** | Mock data, testing, fast operations | 6-8 seconds |
| `openai/gpt-5-mini` | 2x faster | General purpose, balanced | 12-15 seconds |
| `openai/gpt-5` | 1x (baseline) | High quality, complex reasoning | 25-30 seconds |

### Speed vs Quality Trade-offs

**GPT-4o Mini** (Fastest):
- ✅ Excellent for: Mock answers, test data, simple generation
- ✅ Quality: Sufficient for development and testing
- ✅ Cost: Lowest cost per token
- ⚠️ Limitations: May oversimplify complex reasoning

**GPT-5 Mini** (Balanced):
- ✅ Excellent for: Production features with moderate complexity
- ✅ Quality: Good balance of speed and accuracy
- ✅ Cost: Moderate cost per token
- ⚠️ Limitations: Slower than GPT-4o Mini

**GPT-5** (Highest Quality):
- ✅ Excellent for: Complex analysis, critical operations
- ✅ Quality: Best reasoning and nuanced output
- ⚠️ Limitations: 4x slower than GPT-4o Mini, highest cost

## Decision Matrix

### Choose GPT-4o Mini When:
- Operation is user-facing with <10s expected duration requirement
- Quality threshold is "good enough" not "perfect"
- Cost optimization is a priority
- Development/testing environment
- Mock data generation

**Examples**:
- `generate_mock_answers` - Fill Q&A button for testing
- `enhance_narrative_*` - Quick narrative improvements
- Test data seeding operations

### Choose GPT-5 Mini When:
- Production feature with moderate complexity
- Balance of speed and quality needed
- Budget allows for moderate cost
- 10-20s operation duration acceptable

**Examples**:
- Standard question generation
- Content summarization
- Basic analysis operations

### Choose GPT-5 When:
- Complex reasoning required
- Critical business logic
- Quality is more important than speed
- >20s operation duration acceptable
- User expectations already set for long wait

**Examples**:
- Contributing conditions analysis (Story 6.4)
- Complex diagnostic reasoning
- High-stakes content generation

## Implementation Pattern

### Database-Driven Model Selection

Store AI model selection in `ai_prompts` table for easy updates:

```typescript
// ai_prompts table schema
{
  prompt_name: string;
  ai_model: string;  // e.g., "openai/gpt-4o-mini"
  max_tokens: number;
  temperature: number;
  // ... other config
}
```

### Runtime Model Switching

Update models via mutation without code changes:

```typescript
// updatePromptModel.ts
export default mutation({
  args: { promptName: v.string(), newModel: v.string() },
  handler: async (ctx, { promptName, newModel }) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", promptName))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (prompt) {
      await ctx.db.patch(prompt._id, { ai_model: newModel });
    }
  },
});
```

### Execution

```bash
# Optimize for speed (development/testing)
bunx convex run updatePromptModel '{"promptName": "generate_mock_answers", "newModel": "openai/gpt-4o-mini"}'

# Optimize for quality (production)
bunx convex run updatePromptModel '{"promptName": "analyze_contributing_conditions", "newModel": "openai/gpt-5"}'
```

## Performance Optimization Workflow

### When Users Report "Takes Too Long"

1. **Measure Current Performance**:
   - Check actual operation duration
   - Identify which AI prompt is running

2. **Evaluate Quality Requirements**:
   - Is this production or development use?
   - What's the minimum acceptable quality?
   - Can we trade quality for speed?

3. **Select Appropriate Model**:
   - Use decision matrix above
   - Test with faster model
   - Verify quality is acceptable

4. **Update and Deploy**:
   - Update model in database
   - No code changes needed
   - Immediate effect on next execution

5. **Document Changes**:
   - Record model change in story/SAT
   - Document performance improvement
   - Note quality trade-off if any

### Example: Story 0.8 Optimization

**User Feedback**: "Fill Q&A takes too long"

**Investigation**:
- Current model: `openai/gpt-5`
- Typical duration: 25 seconds
- Use case: Mock answer generation for testing
- Quality requirement: "Good enough" for test data

**Solution**:
- Changed to: `openai/gpt-4o-mini`
- New duration: ~6 seconds (4x faster)
- Quality: Sufficient for testing purposes

**Deployment**:
```bash
bunx convex run updateMockAnswersModel
```

**Result**: User satisfaction improved, testing efficiency increased

## Monitoring and Iteration

### Track Performance Metrics

Store performance data in `ai_prompts` table:

```typescript
{
  prompt_name: string;
  ai_model: string;
  average_response_time: number;  // Track actual performance
  usage_count: number;            // Frequency of use
  success_rate: number;           // Quality indicator
}
```

### Iterative Optimization

1. **Monitor** average_response_time
2. **Identify** slow operations (>15s) with high usage_count
3. **Evaluate** if faster model is viable
4. **Test** quality with faster model
5. **Deploy** if quality acceptable
6. **Measure** improvement

## Cost Optimization

### Model Cost Comparison

Approximate cost per 1M tokens (input + output):

| Model | Cost per 1M tokens | Relative Cost |
|-------|-------------------|---------------|
| `openai/gpt-4o-mini` | $0.30 | 1x (baseline) |
| `openai/gpt-5-mini` | $1.00 | 3.3x |
| `openai/gpt-5` | $3.00 | 10x |

### Cost-Performance Balance

For high-volume operations, model selection can significantly impact costs:

**Example**: 10,000 operations/month, 500 tokens average

| Model | Duration | Cost |
|-------|----------|------|
| GPT-4o Mini | 60,000s (16.7h) | $1.50 |
| GPT-5 Mini | 120,000s (33.3h) | $5.00 |
| GPT-5 | 240,000s (66.7h) | $15.00 |

**Strategy**: Use fastest model that meets quality requirements.

## Testing Strategy

### A/B Testing Models

When uncertain about quality trade-offs:

1. Generate test dataset with both models
2. Compare quality scores
3. Measure speed difference
4. Calculate cost difference
5. Make data-driven decision

### Quality Validation

Before deploying faster model to production:

1. **Generate 10+ samples** with new model
2. **Compare with baseline** (current model output)
3. **Verify acceptance** (quality threshold met)
4. **Document trade-offs** if any

## Related Patterns

- [Loading State Patterns](./loading-states.md) - Communicate expected duration to users
- [Adaptive Token Management](../examples/adaptive-token-management.md) - Optimize token usage
- [Performance Instrumentation](./performance-instrumentation.md) - Measure actual performance

## Examples

### Example 1: Mock Answer Generation (Story 0.8)

**Before**:
- Model: `openai/gpt-5`
- Duration: 25 seconds
- User feedback: "Takes too long"

**After**:
- Model: `openai/gpt-4o-mini`
- Duration: 6 seconds (4x faster)
- Quality: Sufficient for testing
- User feedback: "Good"

### Example 2: Bulk Model Update

Update all testing/mock prompts to fastest model:

```typescript
// updateAllModelsToMini.ts
export default mutation({
  handler: async (ctx) => {
    const prompts = await ctx.db
      .query("ai_prompts")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    for (const prompt of prompts) {
      if (
        prompt.ai_model === "openai/gpt-5" ||
        prompt.ai_model === "openai/gpt-5-mini"
      ) {
        await ctx.db.patch(prompt._id, {
          ai_model: "openai/gpt-4o-mini",
        });
      }
    }
  },
});
```

**Result**: 7 prompts updated, expected 2-4x speedup across all operations.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-29 | 1.0 | Initial pattern documentation from Story 0.8 performance optimization | James (Dev Agent) |
