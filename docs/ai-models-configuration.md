# AI Models Configuration

## Summary: Model Availability & Routing

Last Updated: 2025-10-25
Test Results: All models tested and verified working

## Available Models

### ✅ FULLY TESTED & WORKING

| Model ID | Provider | Name | Status | Direct/Router | Notes |
|----------|----------|------|--------|---------------|-------|
| `openai/gpt-5` | OpenAI | GPT-5 | ✅ Working | **Via OpenRouter** | Requires min 16 tokens |
| `openai/gpt-4o` | OpenAI | GPT-4o | ✅ Working | **Via OpenRouter** | Fast, multimodal |
| `openai/gpt-4o-mini` | OpenAI | GPT-4o Mini | ✅ Working | **Via OpenRouter** | Cost-effective, default fallback |
| `anthropic/claude-3.5-sonnet` | Anthropic | Claude 3.5 Sonnet | ✅ Working | **Via OpenRouter** | Excellent for writing/analysis |
| `anthropic/claude-3-haiku` | Anthropic | Claude 3 Haiku | ✅ Working | **Via OpenRouter** | Fast and efficient |

## Routing Architecture

**ALL MODELS USE OPENROUTER** - We do NOT connect directly to OpenAI or Anthropic.

### Provider Priority

```
Priority 1: OpenRouter (Primary)
  ├─ Handles ALL OpenAI models
  ├─ Handles ALL Anthropic models
  └─ Single API key, unified billing

Priority 2: Anthropic Direct (Fallback - NOT CONFIGURED)
  └─ No API key configured
  └─ Would only be used if OpenRouter fails
```

### Fallback Chain

When a model fails, the system automatically falls back:

```
Requested Model → Fallback Model (gpt-4o-mini)
```

Example flow for GPT-5:
```
1. Try openai/gpt-5 via OpenRouter
2. If fails → Try openai/gpt-4o-mini via OpenRouter
3. Return result (success or failure)
```

## API Keys Configuration

### Currently Configured

```bash
OPENROUTER_API_KEY=sk-or-v1-*** (✅ ACTIVE)
OPENAI_API_KEY=sk-proj-*** (❌ NOT USED - kept for reference)
ANTHROPIC_API_KEY (❌ NOT CONFIGURED)
```

### Why OpenRouter?

**Advantages:**
- ✅ Single API key for multiple providers (OpenAI + Anthropic + others)
- ✅ Unified billing and usage tracking
- ✅ Automatic failover between providers
- ✅ Cost optimization (routes to cheapest available provider)
- ✅ No need to manage multiple API keys

**Trade-offs:**
- ⚠️ Slight latency overhead (routing layer)
- ⚠️ Dependent on OpenRouter availability
- ⚠️ Model naming must match OpenRouter's conventions

## Model Configuration Files

### Frontend: ModelSelector Component
**Location:** `apps/web/components/admin/model-selector.tsx`

```typescript
export const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    recommended: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
  },
];
```

### Backend: AI Provider Configuration
**Location:** `apps/convex/aiMultiProvider.ts` (lines 244-263)

```typescript
// OpenRouter provider (primary)
models: [
  // OpenAI models
  'openai/gpt-5', 'openai/gpt-4o', 'openai/gpt-4o-mini',
  // Anthropic models
  'anthropic/claude-3-haiku', 'anthropic/claude-3.5-haiku',
  'anthropic/claude-3.5-sonnet', 'anthropic/claude-sonnet-4',
]
```

### Environment Defaults
**Location:** `~/.env-configs/app.supportsignal.com.au.env`

```
LLM_MODEL=openai/gpt-5             # Default for new prompts
LLM_FALLBACK_MODEL=openai/gpt-4o-mini  # When primary fails
```

## Testing Methodology

### Test Execution

```bash
bunx convex run testModels:testAllModels
```

### Test Results (Latest Run)

| Model | Available | Response Time | Tokens | Notes |
|-------|-----------|---------------|--------|-------|
| openai/gpt-5 | ✅ | 491ms | 22 | Fell back on first try (min tokens issue), then succeeded |
| openai/gpt-4o | ✅ | 557ms | 22 | Direct success |
| openai/gpt-4o-mini | ✅ | 412ms | 22 | Direct success |
| anthropic/claude-3.5-sonnet | ✅ | 873ms | 26 | Direct success (after config fix) |
| anthropic/claude-3-haiku | ✅ | 534ms | 26 | Direct success |

**Summary:** 5/5 models working (100% availability)

## Model Selection Recommendations

### Production Workload
- **Default:** `openai/gpt-5` (highest quality)
- **Fallback:** `openai/gpt-4o-mini` (cost-effective, reliable)

### Development/Testing
- **Quick Tests:** `openai/gpt-4o-mini` (fast, cheap)
- **Quality Checks:** `openai/gpt-4o` (balanced)

### Specific Use Cases
- **Writing/Analysis:** `anthropic/claude-3.5-sonnet`
- **Simple Tasks:** `anthropic/claude-3-haiku`
- **Complex Reasoning:** `openai/gpt-5`

## Monitoring & Observability

### Logs Include
- Provider used (always OpenRouter currently)
- Fallback status (primary vs fallback model)
- Processing time
- Token usage
- Cost calculation

### Example Log Output
```
✅ Request successful with provider: OpenRouter, model: openai/gpt-4o
{
  correlationId: 'ai-1761392506551-i5g9chizj',
  usedFallback: false,
  processingTimeMs: 557
}
```

## Migration Notes

### From GPT-4o-mini to GPT-5

**Completed Migration:**
- ✅ Updated environment defaults
- ✅ Migrated all 54 prompts in dev
- ✅ Migrated all 54 prompts in prod
- ✅ Updated fallback logic
- ✅ Verified all models work

**Impact:**
- Higher quality responses (GPT-5 > GPT-4o-mini)
- Higher cost (offset by better results)
- Automatic fallback maintains reliability

## Future Model Additions

### To Add a New Model

1. **Verify OpenRouter Support:**
   ```bash
   curl -s "https://openrouter.ai/api/v1/models" -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.data[] | select(.id | contains("model-name"))'
   ```

2. **Update Provider Config:**
   - Add to `models` array in `apps/convex/aiMultiProvider.ts`

3. **Update UI:**
   - Add to `AVAILABLE_MODELS` in `apps/web/components/admin/model-selector.tsx`

4. **Test:**
   ```bash
   bunx convex run testModels:testModel '{"model": "provider/model-name"}'
   ```

5. **Deploy:**
   ```bash
   bunx convex codegen
   bun run typecheck
   bunx convex deploy
   ```

## Troubleshooting

### Model Not Found Error
- Check OpenRouter supports the exact model ID
- Verify model ID is in `aiMultiProvider.ts` config
- Run `bunx convex codegen` to regenerate types

### API Key Issues
- OpenRouter key is the ONLY key needed
- Direct provider keys (OpenAI, Anthropic) are optional fallbacks
- Check `.env` or Convex environment variables

### Fallback Behavior
- ALL models fallback to `gpt-4o-mini` on failure
- This ensures prompts always get a response
- Check logs for `usedFallback: true` to identify issues

## Contact & Support

**OpenRouter Dashboard:** https://openrouter.ai/
**Model Pricing:** https://openrouter.ai/models
**API Docs:** https://openrouter.ai/docs
