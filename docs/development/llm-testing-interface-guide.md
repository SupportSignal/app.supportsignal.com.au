# LLM Testing Interface Guide

## Overview

The LLM Testing Interface is a development tool integrated into the `/dev/` page (`http://localhost:3200/dev/`) that provides real-time validation of AI model configuration and communication.

## Purpose

Based on the AI Model Configuration Architecture discovery (see [AI Model Configuration Architecture KDD](../technical-guides/ai-model-configuration-architecture-kdd.md)), this interface addresses the need for:

1. **Configuration Validation**: Verify which AI model is currently active
2. **Communication Testing**: Test LLM connectivity and response times  
3. **Environment Transparency**: Show environment vs database model sources
4. **Developer Debugging**: Quick validation during AI system development

## Location & Access

**URL**: `http://localhost:3200/dev/`  
**Authentication**: Requires user login  
**Permissions**: Available to all authenticated developers  

The interface is embedded within the existing Development Center page alongside:
- Tech Stack information
- Environment Variables Debug
- Version Debug information

## Features

### 1. Current Model Display
Shows the active AI model configuration:
```
🤖 Current LLM Model: openai/gpt-5-nano
📋 Fallback Model: openai/gpt-4o-mini
🔧 Source: Environment Configuration
```

### 2. Configuration Source Transparency
Displays model selection precedence:
- **Environment Configuration**: `LLM_MODEL`, `LLM_FALLBACK_MODEL` 
- **Database Templates**: Historical/template values
- **Active Selection**: Which source is being used

### 3. Communication Test Button
**"Test LLM Communication"** button that:
- Sends a simple test prompt to the configured AI model
- Measures response time
- Displays success/error status
- Shows actual model used in the response

### 4. Response Metrics
Test results display:
```
✅ LLM Communication: SUCCESS
⏱️ Response Time: 1.2s
🎯 Model Used: openai/gpt-5-nano
📝 Test Response: [First few words of AI response...]
```

### 5. Error Diagnostics
For failed tests, shows:
- OpenRouter API status
- Authentication issues
- Model availability problems
- Network connectivity errors

## Technical Implementation

### Component Structure
```
/dev/ page (apps/web/app/dev/page.tsx)
├── Existing development cards
└── LLM Testing Card
    ├── Model Configuration Display
    ├── Test Communication Button
    ├── Response Metrics Display
    └── Error/Success Feedback
```

### Integration Pattern
Follows existing `/dev/` page patterns:
- Card-based layout using ShadCN UI components
- Consistent with other debugging tools
- Real-time status updates
- Error handling with user feedback

### API Integration
Uses the same configuration chain as production:
```
getConfig() → config.llm.defaultModel → AI Service Test
```

This ensures testing uses the **exact same model selection logic** as the production AI services.

## Development Workflow Integration

### During AI Development
1. **Before Implementation**: Check current model configuration
2. **During Testing**: Validate AI communication is working  
3. **After Changes**: Confirm environment sync propagated correctly
4. **Debugging**: Use detailed error messages to diagnose issues

### Configuration Changes Workflow
1. Update environment configuration files
2. Run `scripts/sync-env.js` to sync to Convex
3. Use LLM Testing Interface to validate changes took effect
4. Test actual AI features (question generation, etc.)

## Error Patterns & Solutions

### Common Issues

**Model Not Found**
```
❌ Model 'openai/gpt-5' not available
💡 Suggestion: Check OpenRouter model availability or switch to openai/gpt-5-nano
```

**Authentication Failure**
```
❌ OpenRouter API authentication failed
💡 Suggestion: Verify OPENROUTER_API_KEY in environment configuration
```

**Environment Sync Issues**
```
❌ Configuration shows old model values
💡 Suggestion: Run scripts/sync-env.js to sync latest environment variables
```

### Troubleshooting Workflow
1. **Check Interface**: Does it show expected model configuration?
2. **Test Communication**: Does the test button work?
3. **Check Environment**: Are environment variables synced?
4. **Validate Production**: Does actual AI functionality work?

## Related Documentation

- **[AI Model Configuration Architecture KDD](../technical-guides/ai-model-configuration-architecture-kdd.md)** - Background on model configuration discovery
- **[Environment Variable Configuration](../technical-guides/dual-deployment-and-environment-variable-troubleshooting-kdd.md)** - Environment sync process
- **[Development Center](../development/dev-page-overview.md)** - Overall `/dev/` page documentation

## Future Enhancements

### Planned Features
1. **Model Performance Comparison**: Test response times across different models
2. **Prompt Testing**: Test custom prompts with different models
3. **Cost Estimation**: Show estimated costs for different model choices
4. **Configuration History**: Show recent model configuration changes

### Integration Opportunities
- Link to AI Prompt management in `/admin/ai-prompts`
- Integration with debug logging system
- Connection to incident AI question generation testing

## Knowledge Preservation

**Key Insight**: The LLM Testing Interface serves as the **bridge** between environment configuration and production AI behavior, providing immediate feedback on configuration changes and serving as the first debugging step for AI-related issues.

**Architecture Principle**: Development tools should use the **same code paths** as production systems to ensure testing accuracy and eliminate configuration drift.