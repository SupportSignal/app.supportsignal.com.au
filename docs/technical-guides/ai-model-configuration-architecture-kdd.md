# AI Model Configuration Architecture KDD

## Discovery Context

**Date**: August 19, 2025  
**Context**: AI model configuration confusion during LLM implementation  
**Trigger**: User question "Why do we even have hardcoded models anywhere in the system when we have a configuration?"  
**Discovery Mode**: Architecture investigation and debugging session  

## Problem Statement

During AI system implementation, discovered a fundamental architectural issue where AI models were hardcoded in database prompts instead of using environment-driven configuration, causing confusion about model selection precedence.

## Key Discovery

### Root Cause Analysis

**Symptom**: System appeared to use hardcoded models despite having configuration-based architecture
**Root Cause**: `questionGenerator.ts` was using `prompt.ai_model` from database instead of `getConfig().llm.defaultModel` from environment
**Impact**: Configuration changes weren't reflected in actual AI service calls

### Architecture Revelation

The system has **dual model storage patterns**:

1. **Database Storage**: Historical/template models in AI prompt records (`ai_model` field)  
2. **Environment Configuration**: Active runtime models via environment variables (`LLM_MODEL`, `LLM_FALLBACK_MODEL`)  

**Critical Discovery**: The intended architecture is **environment-first** with database serving as historical context only.

## Technical Analysis

### Code Flow Discovery

**Primary Fix**: `apps/convex/lib/ai/questionGenerator.ts:47-52`  

**Before (Incorrect)**:
```typescript
// Using database model (hardcoded in prompts)
const aiRequest: AIRequest = {
  correlationId,
  model: prompt.ai_model, // ❌ Database value
  // ...
};
```

**After (Fixed)**:
```typescript
// Using environment configuration
import { getConfig } from "../config";

const config = getConfig();
const modelToUse = config.llm.defaultModel; // ✅ Environment value

console.log("🔧 MODEL SELECTION", {
  database_model: prompt.ai_model,
  environment_model: modelToUse,
  using: "environment_configuration",
  correlationId,
});

const aiRequest: AIRequest = {
  correlationId,
  model: modelToUse, // ✅ Environment configuration
  // ...
};
```

### Secondary Fix: PromptManager Database Fallback

**File**: `apps/convex/promptManager.ts:92`

**Before (Conflicting)**:
```typescript
// This was overriding the questionGenerator fix
return {
  // ...
  model: prompt.ai_model || 'openai/gpt-4.1-nano', // ❌ Database fallback
  // ...
};
```

**After (Consistent)**:
```typescript
// Get model from environment configuration (environment-first architecture)
const config = getConfig();
const modelToUse = config.llm.defaultModel;

// Log model selection for transparency
console.log("🔧 PROMPT MANAGER MODEL SELECTION", {
  prompt_name: prompt.prompt_name,
  database_model: prompt.ai_model,
  environment_model: modelToUse,
  using: "environment_configuration",
});

return {
  // ...
  model: modelToUse, // ✅ Use environment configuration instead of database
  // ...
};
```

**Critical Discovery**: The Q&A system was broken because `promptManager.ts` had a database fallback that overrode the `questionGenerator.ts` environment configuration fix.

### Environment Configuration Chain

**Source**: `/Users/davidcruwys/.env-configs/app.supportsignal.com.au.env`  
**Sync Script**: `scripts/sync-env.js`  
**Target**: Convex deployment environment variables  
**Config Loading**: `apps/convex/lib/config.ts`  

**Configuration Flow**:
```
.env-configs/*.env 
→ sync-env.js 
→ Convex Environment 
→ config.ts 
→ questionGenerator.ts
```

## Environment Synchronization Discovery

### Current Configuration
```bash
# Successfully synced to Convex deployment
LLM_MODEL=openai/gpt-5
LLM_FALLBACK_MODEL=openai/gpt-4o-mini
```

### Sync Process
```bash
# Sync command that propagates configuration
scripts/sync-env.js
# Result: Environment variables updated in Convex deployment
```

## OpenRouter API Integration Lessons

### Model Compatibility Discovery

**GPT-5 Requirements**:
- Full model name: `openai/gpt-5` 
- Requires OpenAI API key integration in OpenRouter settings for full access
- Alternative: `openai/gpt-5-nano` (doesn't require additional keys)

**Error Pattern**:
```
OpenRouter 403: "OpenAI is requiring a key to access this model, which you can add in https://openrouter.ai/settings/integrations - you can also switch to gpt-5-chat or gpt-5-mini"
```

**Resolution**: Switched to `openai/gpt-5-nano` for immediate testing compatibility

## Architecture Decision Record

### Configuration Precedence Rule

**ESTABLISHED PATTERN**: Environment configuration ALWAYS takes precedence over database values

**Implementation Pattern**:
```typescript
// ✅ Correct pattern for all AI service integrations
const config = getConfig();
const modelToUse = config.llm.defaultModel;

// Log for transparency (development/debugging)
console.log("🔧 MODEL SELECTION", {
  database_model: prompt.ai_model,
  environment_model: modelToUse,
  using: "environment_configuration"
});
```

### Database Model Field Usage

**Purpose**: Historical reference and template metadata only  
**Usage**: Display in UI, audit trails, template management  
**Never Use For**: Active AI service calls  

## Development Experience Improvements

### Debugging Enhancement
Added comprehensive logging to show model selection process:
```typescript
console.log("🔧 MODEL SELECTION", {
  database_model: prompt.ai_model,
  environment_model: modelToUse,  
  using: "environment_configuration",
  correlationId,
});
```

### Configuration Validation
Successfully validated environment sync process shows configuration changes propagate correctly to runtime.

## Recommendations

### Immediate Actions
1. ✅ **COMPLETED**: Fix questionGenerator.ts to use environment configuration
2. ✅ **COMPLETED**: Add model selection logging for transparency  
3. 🔄 **PENDING**: Create LLM testing interface on `/dev/` page to validate configuration

### Long-term Architecture
1. **Environment-First Pattern**: All AI integrations must use `getConfig().llm.defaultModel`
2. **Database Field Usage**: Treat `ai_model` fields as metadata/historical only
3. **Configuration Transparency**: Always log model selection in development
4. **Testing Interface**: Provide UI to test and validate current model configuration

## Testing Validation

### Successful Test Results
```bash
# Environment sync successful
LLM_MODEL=openai/gpt-5 → openai/gpt-5-nano (compatibility)
LLM_FALLBACK_MODEL=openai/gpt-4o-mini

# Test Results
✅ Configuration loading: SUCCESS
✅ Model selection logging: Shows environment > database precedence  
✅ AI service integration: Functional with environment models
✅ Question generation: Working with stress test validation
```

## Impact Assessment

### Before Fix
- ❌ Configuration changes ignored
- ❌ Hardcoded models from database templates  
- ❌ No visibility into model selection process
- ❌ User confusion about configuration vs database values

### After Fix  
- ✅ Environment configuration drives model selection
- ✅ Database models serve as historical reference only
- ✅ Clear logging shows model selection process
- ✅ Configuration changes immediately effective

## Related Documentation

- **Environment Setup**: `docs/technical-guides/dual-deployment-and-environment-variable-troubleshooting-kdd.md`
- **Configuration Management**: `scripts/sync-env.js` documentation  
- **AI Integration Patterns**: `apps/convex/lib/config.ts` model definitions
- **Testing Infrastructure**: Development UI components for validation

## Knowledge Preservation

**Key Insight**: When users question "hardcoded" behavior in configuration-driven systems, investigate the **data flow chain** from configuration source to runtime usage. The issue is often in **intermediate steps** not respecting configuration precedence.

**Architecture Principle**: Database should store **historical/template data**, while environment configuration should drive **runtime behavior**.