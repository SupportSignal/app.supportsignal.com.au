# LLM API Setup Guide

## Overview

This guide provides step-by-step instructions for configuring Large Language Model (LLM) APIs to power the AI features in your application. The template supports OpenAI and OpenRouter APIs, with OpenRouter recommended for cost-effective access to multiple models.

## Supported LLM Providers

| Provider | Best For | Cost | Models Available |
|----------|----------|------|------------------|
| **OpenRouter** | Development & Production | Lower cost, flexible | GPT-4o, Claude 3.5, Llama 3, Mistral, and many more |  
| **OpenAI** | Direct integration | Higher cost | GPT-4o, GPT-4o-mini, GPT-3.5-turbo |

**Recommendation**: Use OpenRouter for development and production due to cost efficiency and model variety.

## OpenRouter Setup (Recommended)

### 1. Create OpenRouter Account

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Click **"Sign Up"** and create an account
3. Verify your email address
4. Complete account setup

### 2. Add Credits to Account  

1. Navigate to **"Credits"** in your dashboard
2. Click **"Add Credits"**
3. Add minimum $5-10 for development/testing
4. Choose payment method and complete purchase

### 3. Generate API Key

1. Go to **"Keys"** section in your dashboard
2. Click **"Create Key"**
3. Give it a descriptive name: `Your-App-Dev-Key`
4. Set appropriate limits (optional):
   - Daily limit: $5-10 for development
   - Monthly limit: $50-100 for production
5. Copy the API key immediately (only shown once)

### 4. Choose Your Models

OpenRouter provides access to multiple models. Recommended options:

**For Development**:
- `openai/gpt-4o-mini` - Fast and cost-effective ($0.15/1M tokens)
- `anthropic/claude-3-haiku` - Good balance of speed and quality

**For Production**:
- `openai/gpt-4o` - High quality, reliable ($5/1M tokens)
- `anthropic/claude-3.5-sonnet` - Excellent reasoning abilities

**Budget Option**:
- `meta-llama/llama-3.1-8b-instruct:free` - Free tier model

### 5. Test API Access

```bash
# Test your OpenRouter API key
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello, world!"}]
  }'
```

## OpenAI Setup (Alternative)

### 1. Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up for an account
3. Verify your phone number
4. Complete account setup

### 2. Add Payment Method

1. Navigate to **"Billing"** → **"Payment methods"**
2. Add a credit card
3. Set usage limits (recommended):
   - Monthly budget: $50-100
   - Email alerts at 50% and 90%

### 3. Generate API Key

1. Go to **"API Keys"** section
2. Click **"Create new secret key"**
3. Give it a name: `Your-App-Development`
4. Copy the API key (starts with `sk-`)
5. Store securely - only shown once

### 4. Test API Access

```bash
# Test your OpenAI API key
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini", 
    "messages": [{"role": "user", "content": "Hello, world!"}]
  }'
```

## Environment Configuration

### Update Environment Source File

Edit your `.env.source-of-truth.local` file:

```bash
# Update the LLM Config section:
| false  | true   | LLM Config        | OPENROUTER_API_KEY        | sk-or-v1-your-actual-key-here           |
| false  | true   | LLM Config        | OPENAI_API_KEY            | sk-your-actual-openai-key-here          |
| false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o-mini                      |
| false  | true   | LLM Config        | LLM_FALLBACK_MODEL        | openai/gpt-4o-mini                      |
```

### Model Configuration Options

**For OpenRouter (Recommended)**:
```bash
| false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o-mini                      |
| false  | true   | LLM Config        | LLM_FALLBACK_MODEL        | meta-llama/llama-3.1-8b-instruct:free  |
```

**For OpenAI Direct**:
```bash
| false  | true   | LLM Config        | LLM_MODEL                 | gpt-4o-mini                             |
| false  | true   | LLM Config        | LLM_FALLBACK_MODEL        | gpt-3.5-turbo                           |
```

**For Production**:
```bash
| false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o                           |
| false  | true   | LLM Config        | LLL_FALLBACK_MODEL        | openai/gpt-4o-mini                      |
```

### Sync Environment Variables

After updating the source file:

```bash
# Sync environment variables  
bun run sync-env

# Restart development servers
bun dev
```

## Model Selection Guide

### Cost Comparison (per 1M tokens)

| Model | Provider Via OpenRouter | Direct Cost | Quality | Speed |
|-------|------------------------|-------------|---------|-------|
| GPT-4o | $5.00 | $5.00 | Excellent | Medium |
| GPT-4o-mini | $0.15 | $0.15 | Very Good | Fast |
| Claude 3.5 Sonnet | $3.00 | N/A | Excellent | Medium |
| Claude 3 Haiku | $0.25 | N/A | Good | Very Fast |
| Llama 3.1 8B | Free | N/A | Good | Fast |

### Use Case Recommendations

**Chat Interface (Primary Model)**:
- Development: `openai/gpt-4o-mini`
- Production: `openai/gpt-4o` or `anthropic/claude-3.5-sonnet`

**Fallback Model**:
- Always use a cheaper/faster model
- `openai/gpt-4o-mini` or `meta-llama/llama-3.1-8b-instruct:free`

**Embeddings (if using vector search)**:
- `openai/text-embedding-3-small` ($0.02/1M tokens)
- `text-embedding-ada-002` ($0.10/1M tokens)

## Features Integration

### Chat Interface

Your application uses LLM APIs for:
- **Conversational AI**: User chat interactions
- **Knowledge Q&A**: RAG-based responses
- **Code Generation**: AI-assisted development
- **Content Summarization**: Document processing

### API Usage Patterns

**Streaming Responses**:
```javascript
// Example of streaming API usage
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [...],
    model: process.env.LLM_MODEL,
    stream: true
  })
});
```

**Fallback Logic**:
- Primary model fails → Automatically try fallback model
- Rate limit exceeded → Switch to fallback temporarily
- Cost optimization → Use cheaper model for simple queries

## Cost Management

### OpenRouter Cost Optimization

1. **Set API Key Limits**:
   - Daily spending limit: $5-10 for development
   - Monthly limit: $50-100 for production

2. **Monitor Usage**:
   - Check OpenRouter dashboard regularly
   - Set up billing alerts
   - Track cost per feature

3. **Model Selection Strategy**:
   - Use `gpt-4o-mini` for most interactions
   - Reserve `gpt-4o` for complex queries only
   - Use free models for testing/development

### OpenAI Cost Optimization

1. **Set Billing Limits**:
   - Monthly budget alerts at $25, $50, $100
   - Hard stop at $150 to prevent runaway costs

2. **Token Management**:
   - Implement conversation length limits
   - Clear old conversation history
   - Use shorter prompts when possible

### Cost Monitoring

Track usage with these methods:

```bash
# Check recent API usage (OpenRouter)
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://openrouter.ai/api/v1/usage"

# Check OpenAI usage  
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.openai.com/v1/usage"
```

## Security Best Practices

### API Key Security

- **Never commit API keys** to version control
- **Use environment variables** for all API keys
- **Rotate keys regularly** (monthly for production)
- **Set spending limits** to prevent abuse
- **Monitor usage patterns** for anomalies

### Rate Limiting

Implement application-level rate limiting:
- **Per-user limits**: 50-100 requests/hour
- **IP-based limits**: 200 requests/hour  
- **Global limits**: Based on your API quotas

### Error Handling

```javascript
// Example error handling for LLM APIs
try {
  const response = await callLLMAPI(prompt);
  return response;
} catch (error) {
  if (error.status === 429) {
    // Rate limit - try fallback model
    return await callFallbackModel(prompt);
  } else if (error.status === 401) {
    // Invalid API key
    console.error('LLM API authentication failed');
    throw new Error('AI service temporarily unavailable');
  }
  // Other errors...
}
```

## Testing & Verification

### 1. Test API Configuration

```bash
# Verify environment variables are set
cat apps/web/.env.local | grep -E "(OPENAI|OPENROUTER|LLM)"

# Check Convex environment  
cd apps/convex && bunx convex env list | grep -E "(OPENAI|OPENROUTER|LLM)"
```

### 2. Test Chat Interface

1. Start development server: `bun dev`
2. Navigate to the chat interface
3. Send a test message: "Hello, can you help me?"
4. Verify you get a response
5. Check browser network tab for API calls

### 3. Test Model Fallback

1. Temporarily set invalid primary model
2. Send chat message
3. Verify fallback model is used
4. Check application logs for fallback messages

### 4. Test Cost Controls

1. Set very low API key limits ($1)
2. Send multiple requests to hit limit
3. Verify proper error handling
4. Reset limits after testing

## Troubleshooting

### Common Issues

**Error: "Invalid API key"**
- Verify API key is correctly set in environment
- Check that `bun run sync-env` was executed
- Ensure API key hasn't expired or been revoked

**Error: "Model not found"**
- Check model name spelling in environment config
- Verify model is available on your chosen provider
- Check OpenRouter model catalog for correct names

**Error: "Rate limit exceeded"**
- Check your API usage limits
- Implement request queuing/throttling
- Consider upgrading your API plan

**Error: "Insufficient credits/quota"**
- Add more credits to OpenRouter account
- Check billing/payment method for OpenAI
- Monitor spending against limits

**No response from AI**
- Check network connectivity
- Verify API endpoints are accessible
- Check application logs for detailed errors
- Test API key with curl commands

### Debug Steps

1. **Check Environment Setup**:
   ```bash
   # Verify sync worked
   bun run sync-env
   
   # Check environment files
   grep LLM apps/web/.env.local
   ```

2. **Test API Keys Directly**:
   ```bash
   # Test OpenRouter
   curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
     -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
   ```

3. **Check Application Logs**:
   - Browser developer console
   - Convex function logs
   - Server-side logs for API calls

4. **Monitor API Usage**:
   - Check provider dashboards for usage
   - Look for error patterns in API responses
   - Verify spending hasn't exceeded limits

## Advanced Configuration

### Custom Model Parameters

Configure model behavior in your environment:

```bash
# Add custom model parameters
| false  | true   | LLM Config        | LLM_TEMPERATURE           | 0.7                                     |
| false  | true   | LLM Config        | LLM_MAX_TOKENS            | 1000                                    |
| false  | true   | LLM Config        | LLM_TOP_P                 | 0.9                                     |
```

### Multiple Model Support

Set up different models for different use cases:

```bash
# Specialized models
| false  | true   | LLM Config        | CHAT_MODEL                | openai/gpt-4o                           |
| false  | true   | LLM Config        | SUMMARY_MODEL             | openai/gpt-4o-mini                      |
| false  | true   | LLM Config        | CODE_MODEL                | anthropic/claude-3.5-sonnet            |
```

### Regional Configuration

For better performance/compliance:

```bash
# Use regional OpenAI endpoints if available
| false  | true   | LLM Config        | OPENAI_BASE_URL           | https://api.openai.com/v1               |
```

## Related Documentation

- **[Environment Management](./environment-management.md)** - Environment variable strategy
- **[API Security and Secret Management](./api-security-and-secret-management.md)** - API security best practices
- **[Scripts and Commands Reference](./scripts-and-commands-reference.md)** - Using sync-env command
- **[Cost-Effective Logging](./cost-effective-logging-in-convex-agentic-systems.md)** - Cost management strategies

## External Resources

- **[OpenRouter Documentation](https://openrouter.ai/docs)**
- **[OpenAI API Documentation](https://platform.openai.com/docs)**
- **[OpenRouter Model Pricing](https://openrouter.ai/models)**
- **[OpenAI Pricing](https://openai.com/pricing)**
- **[Model Performance Comparisons](https://openrouter.ai/rankings)**

---

**Created**: For AI-powered application setup  
**Cost Target**: <$10/month for small scale applications  
**Security**: Follow API key security best practices