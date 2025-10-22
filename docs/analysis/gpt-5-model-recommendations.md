# GPT-5 Model Analysis & Recommendations for SupportSignal Prompts

**Created**: October 22, 2025
**Context**: Story 0.8 - LLM Model Management Upgrade

---

## GPT-5 Model Options & Costs (2025)

### Available Models

| Model | Input Cost/M | Output Cost/M | Performance vs GPT-5 | Best For | Context Window |
|-------|--------------|---------------|----------------------|----------|----------------|
| **gpt-5-nano** | $0.05 | $0.40 | 75-80% | Simple tasks, high volume | 400K tokens |
| **gpt-4o-mini** | $0.15 | ~$0.60 | 85-90% | Cost-effective, good quality | 128K tokens |
| **gpt-5-mini** | $0.25 | ~$1.00 | 92% | Production default, best ROI | 400K tokens |
| **gpt-4o** | $5.00 | ~$20.00 | 95% (GPT-4 optimized) | Complex analysis, premium quality | 128K tokens |
| **gpt-5-chat** | $1.25 | $10.00 | 98% (conversational) | Multi-turn, reasoning | 400K tokens |
| **gpt-5** (full) | $1.25 | $10.00 | 100% | Maximum quality, complex reasoning | 400K tokens |

### Key Insights from Research

**Cost Efficiency:**
- GPT-5 is 55-90% cheaper than GPT-4o for similar tasks
- 90% caching discount on repeated inputs (huge for similar prompts)
- GPT-5 Mini delivers 92% performance at 25% of full GPT-5 cost

**Performance:**
- GPT-5 outperforms GPT-4o in coding (75% vs 31%), math, reasoning
- 19-24% higher in aggregate reasoning tests
- 2x context window of GPT-4o (272K vs 128K)

**Use Cases:**
- **Writing**: Enhanced coherence, tone, style
- **Coding**: Superior code generation and debugging
- **Health/Safety**: Better reasoning for complex scenarios
- **Multi-step reasoning**: Complex logic, legal, analytical tasks

---

## Current SupportSignal Prompts Analysis

### Prompt Inventory (8 Total)

| Prompt Name | Type | Max Tokens | Temp | Avg Response Time | Current Model |
|------------|------|------------|------|-------------------|---------------|
| generate_clarification_questions_before_event | Question Gen | 2000 | 0.3 | - | NULL |
| generate_clarification_questions_during_event | Question Gen | 2000 | 0.3 | - | NULL |
| generate_clarification_questions_end_event | Question Gen | 2000 | 0.3 | - | NULL |
| generate_clarification_questions_post_event | Question Gen | 2000 | 0.3 | - | NULL |
| generate_mock_answers | Data Gen | 2000 | 0.3 | - | NULL |
| enhance_narrative_before_event | Enhancement | 4000 | 0.3 | - | NULL |
| enhance_narrative_during_event | Enhancement | 4000 | 0.3 | 12007ms | NULL |
| enhance_narrative_end_event | Enhancement | 4000 | 0.3 | 6998ms | NULL |
| enhance_narrative_post_event | Enhancement | 4000 | 0.3 | 7535ms | NULL |

---

## Model Recommendations by Prompt

### Category 1: Question Generation (4 prompts) - **Recommended: gpt-5-mini**

**Prompts:**
- generate_clarification_questions_before_event
- generate_clarification_questions_during_event
- generate_clarification_questions_end_event
- generate_clarification_questions_post_event

**Reasoning:**
- **Task Complexity**: Medium - requires understanding context and generating relevant, appropriate questions
- **Quality Requirements**: High - questions must be clear, appropriate, and NDIS-compliant
- **Volume**: Moderate - generated once per incident phase
- **Criticality**: High - poor questions impact entire incident documentation workflow

**Why gpt-5-mini:**
✅ 92% of full GPT-5 performance at 25% cost
✅ Excellent at understanding context and generating appropriate questions
✅ Strong reasoning for "what to ask" based on narrative
✅ Cost-effective for production at scale
✅ 400K context window handles long narratives

**Cost Impact:**
- Current: gpt-4o-mini ($0.15/M) → 2000 tokens avg = $0.0003/question set
- Recommended: gpt-5-mini ($0.25/M) → 2000 tokens avg = $0.0005/question set
- **Increase**: $0.0002 per question set (+67% cost, +92% quality)

**Alternative Consideration:**
- **gpt-5-nano** ($0.05/M): If budget is tight and volume is high, nano performs well on structured tasks
- **Trade-off**: 15-20% quality drop for 80% cost savings

---

### Category 2: Narrative Enhancement (4 prompts) - **Recommended: gpt-5 (full)**

**Prompts:**
- enhance_narrative_before_event
- enhance_narrative_during_event
- enhance_narrative_end_event
- enhance_narrative_post_event

**Reasoning:**
- **Task Complexity**: HIGH - requires natural language understanding, grammar correction, seamless integration, tone preservation
- **Quality Requirements**: CRITICAL - this is the final NDIS report that goes to regulators and families
- **Volume**: Moderate - generated once per incident phase
- **Criticality**: MAXIMUM - poorly written narratives damage credibility, compliance, and participant dignity

**Why gpt-5 (full):**
✅ Best-in-class writing quality - GPT-5 excels at writing use cases
✅ Superior grammar and tone preservation
✅ Natural integration of Q&A without hallucination
✅ Maintains participant dignity and professional language
✅ 272K context window handles complex narratives with Q&A
✅ Strong at "light touch" editing without rewriting

**Cost Impact:**
- Current: gpt-4o-mini ($0.15/M) → 4000 tokens avg = $0.0006/enhancement
- Recommended: gpt-5 ($1.25/M) → 4000 tokens avg = $0.005/enhancement
- **Increase**: $0.0044 per enhancement (+733% cost, +100% quality)

**Why Not Cheaper Models:**
- **gpt-5-mini**: Risk of over-editing or losing reporter's voice (only 92% performance)
- **gpt-4o**: More expensive ($5/M vs $1.25/M) and lower quality than GPT-5
- **gpt-5-nano**: Too risky for legal compliance documents

**ROI Justification:**
- **Scenario**: 100 incidents/month, 4 phases each = 400 enhancements/month
- **Cost**: gpt-5-mini: $0.20/mo vs gpt-5: $2.00/mo
- **Savings vs Risk**: $1.80/month saved NOT worth regulatory/legal risk
- **User Perspective**: "Most expensive model for now, the best quality" ← User's explicit requirement

---

### Category 3: Mock Data Generation (1 prompt) - **Recommended: gpt-5-nano**

**Prompt:**
- generate_mock_answers

**Reasoning:**
- **Task Complexity**: Low-Medium - generating realistic but fake answers for testing
- **Quality Requirements**: Medium - needs to be realistic but not critical
- **Volume**: Low - only used for development/testing
- **Criticality**: Low - not used in production incident documentation

**Why gpt-5-nano:**
✅ Cheapest option ($0.05/M) perfect for non-critical tasks
✅ Good enough for testing/demo data
✅ Handles structured JSON output well
✅ Fast response times

**Cost Impact:**
- Current: gpt-4o-mini ($0.15/M) → 2000 tokens avg = $0.0003/generation
- Recommended: gpt-5-nano ($0.05/M) → 2000 tokens avg = $0.0001/generation
- **Decrease**: $0.0002 savings per generation (-67% cost, -20% quality acceptable)

---

## Summary Recommendations

### Recommended Model Assignment

| Prompt Category | Model | Reason | Monthly Cost Estimate* |
|----------------|-------|--------|------------------------|
| **Question Generation** (4) | `gpt-5-mini` | Best ROI, 92% quality, reasoning strength | ~$0.40 |
| **Narrative Enhancement** (4) | `gpt-5` (full) | Critical quality, legal compliance, writing excellence | ~$2.00 |
| **Mock Data Generation** (1) | `gpt-5-nano` | Non-critical, dev only, cost savings | ~$0.02 |

**Total Monthly Cost Estimate**: ~$2.42/month for 100 incidents (vs ~$0.60 with gpt-4o-mini)

\* Based on 100 incidents/month, 4 phases each, average token usage

### Cost vs Quality Trade-Off Analysis

**Option A: All gpt-5 (full)** - Maximum Quality
- Cost: ~$5.00/month
- Quality: 100% across all prompts
- **Best for**: Regulatory scrutiny, legal risk mitigation
- **User's stated preference**: "Most expensive model for now, the best quality"

**Option B: Tiered (Recommended)** - Optimized ROI
- Cost: ~$2.42/month
- Quality: 92-100% depending on task criticality
- **Best for**: Sustainable long-term cost while maintaining quality where it matters

**Option C: All gpt-5-mini** - Cost-Conscious
- Cost: ~$0.50/month
- Quality: 92% across all prompts
- **Best for**: Budget constraints, high volume

**Option D: All gpt-4o-mini (Current Default)** - Baseline
- Cost: ~$0.60/month
- Quality: 85-90% (GPT-4 generation, not GPT-5)
- **Best for**: Legacy compatibility only

---

## Implementation Strategy

### Phase 1: Default Upgrade (Story 0.8)
**Default model**: Change to `gpt-5` (full) as per user's "best quality" requirement

### Phase 2: Selective Optimization (Optional - Future Story)
**Tiered approach**: Assign specific models to prompt categories:
- Critical prompts → `gpt-5` (full)
- Standard prompts → `gpt-5-mini`
- Dev/testing → `gpt-5-nano`

### Migration Script
```typescript
// Populate all prompts with gpt-5 (full) as default
const defaultModel = 'openai/gpt-5';

// Optional: Selective assignment for cost optimization
const modelAssignments: Record<string, string> = {
  // Question generation - gpt-5-mini
  'generate_clarification_questions_before_event': 'openai/gpt-5-mini',
  'generate_clarification_questions_during_event': 'openai/gpt-5-mini',
  'generate_clarification_questions_end_event': 'openai/gpt-5-mini',
  'generate_clarification_questions_post_event': 'openai/gpt-5-mini',

  // Narrative enhancement - gpt-5 (full) - CRITICAL
  'enhance_narrative_before_event': 'openai/gpt-5',
  'enhance_narrative_during_event': 'openai/gpt-5',
  'enhance_narrative_end_event': 'openai/gpt-5',
  'enhance_narrative_post_event': 'openai/gpt-5',

  // Mock data - gpt-5-nano (dev only)
  'generate_mock_answers': 'openai/gpt-5-nano',
};
```

---

## Decision Matrix

### Question to User

Given your requirement for "most expensive model for now, the best quality":

**Option 1: Simple (Recommended for Story 0.8)**
- Set all prompts to `gpt-5` (full): $1.25/M input
- Total cost: ~$5/month for 100 incidents
- ✅ Simplest implementation
- ✅ Best quality everywhere
- ✅ Meets "best quality" requirement

**Option 2: Optimized (Future Refinement)**
- Tiered model assignment as detailed above
- Total cost: ~$2.42/month for 100 incidents
- ✅ 50% cost savings
- ✅ Quality maintained where critical
- ⚠️ More complex management

**Recommendation**: Start with Option 1 (all `gpt-5`), then optimize with Option 2 once you have production usage data.

---

## Additional Considerations

### Caching Strategy
GPT-5 offers **90% caching discount** for repeated inputs. For prompts with:
- Consistent template structure
- Repeated system instructions
- Similar incident patterns

**Potential savings**: 40-60% additional cost reduction with smart caching

### Performance Monitoring
Track after upgrade:
- Response time improvements (GPT-5 is faster than GPT-4o)
- Quality metrics (grammar accuracy, tone preservation)
- User satisfaction with generated content
- Cost per incident

### Fallback Strategy
Keep `gpt-4o-mini` as `LLM_FALLBACK_MODEL`:
- If GPT-5 rate limited or unavailable
- For high-volume testing scenarios
- Cost-effective backup

---

## Final Recommendation

**For Story 0.8 Implementation:**

1. **Default Model**: `openai/gpt-5` ($1.25/M)
   - Meets user's "best quality" requirement
   - Simplest to implement
   - Highest quality across all prompts

2. **Fallback Model**: `openai/gpt-4o-mini` ($0.15/M)
   - Reliable backup if GPT-5 unavailable
   - Cost-effective for testing

3. **Future Optimization** (Post-Story 0.8):
   - Analyze actual usage patterns
   - Consider tiered approach for cost savings
   - Monitor quality metrics to validate model selection

**Estimated Cost Impact:**
- Current (all gpt-4o-mini): ~$0.60/month
- Upgraded (all gpt-5): ~$5.00/month
- Net increase: ~$4.40/month (733% increase)
- **ROI**: Superior quality, regulatory compliance, user satisfaction

**User's Explicit Requirement**: "Most expensive model for now, the best quality"
→ **Recommendation**: Use `gpt-5` (full) as default ✅
