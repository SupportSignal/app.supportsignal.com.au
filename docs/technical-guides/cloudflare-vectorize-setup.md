# Cloudflare Vectorize Setup Guide

**Epic**: 4 - AI-Powered Chat Interface  
**Story**: 4.2 - Knowledge Ingestion Service  
**Date Created**: 2025-01-26  
**Last Updated**: 2025-01-26

## Overview

This guide provides comprehensive instructions for setting up Cloudflare Vectorize for the Knowledge Ingestion Service, including database configuration, API setup, and integration with the Convex backend.

## Prerequisites

- Cloudflare account with access to Vectorize (may require paid plan)
- Convex development environment set up
- OpenAI API key for embedding generation

## Step 1: Cloudflare Vectorize Database Setup

### 1.1 Create Vectorize Database

1. **Navigate to Cloudflare Dashboard**
   - Log into your Cloudflare account
   - Go to "Workers & Pages" > "Vectorize"

2. **Create New Database**
   ```bash
   # Using Wrangler CLI (recommended)
   npx wrangler vectorize create starter-nextjs-convex-ai-knowledge \
     --dimensions 1536 \
     --metric cosine
   ```

   **Or via Dashboard:**
   - Click "Create Database"
   - **Database Name**: `starter-nextjs-convex-ai-knowledge`
   - **Dimensions**: `1536`
   - **Metric**: `cosine`
   - Click "Create"

### 1.2 Critical Configuration Requirements

#### **Database Naming Convention**
- **✅ Recommended**: `{project-name}-knowledge`
- **❌ Avoid**: Generic names like `knowledge-base` or `embeddings`
- **Reason**: Prevents conflicts in multi-project environments

#### **Dimension Requirements**
- **Required**: `1536` dimensions
- **Reason**: Compatible with OpenAI text-embedding-3-small model
- **⚠️ Important**: This cannot be changed after creation

#### **Metric Selection**
- **Required**: `cosine` similarity
- **Reason**: Optimal for text embeddings and semantic similarity

## Step 2: API Token Configuration

### 2.1 Create API Token

1. **Navigate to API Tokens**
   - Go to "My Profile" > "API Tokens"
   - Click "Create Token"

2. **Configure Token Permissions**
   ```
   Token Name: Vectorize Access for {Project Name}
   
   Permissions:
   - Zone:Zone:Read (if using domains)
   - Account:Cloudflare Workers:Edit
   - Account:Account:Read
   - Zone:Zone Settings:Read
   
   Account Resources:
   - Include: All accounts (or specific account)
   
   Zone Resources: 
   - Include: All zones (or specific zones)
   ```

3. **Minimum Required Permissions**
   ```
   Account:Cloudflare Workers:Edit (for Vectorize operations)
   Account:Account:Read (for account access)
   ```

### 2.2 Retrieve Account Information

```bash
# Get your account ID
npx wrangler whoami

# List Vectorize databases to verify setup
npx wrangler vectorize list
```

## Step 3: Environment Configuration

### 3.1 Environment Variables Setup

Add the following to your `apps/convex/.env.local`:

```env
# Cloudflare Vectorize Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
VECTORIZE_DATABASE_ID=starter-nextjs-convex-ai-knowledge

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=sk-your-openai-key-here
```

### 3.2 Configuration Validation

```typescript
// Test configuration in Convex
const config = getConfig();
console.log('Vectorize Config:', {
  hasAccountId: !!config.vectorize.accountId,
  hasApiToken: !!config.vectorize.apiToken,
  databaseId: config.vectorize.databaseId,
});
```

## Step 4: API Version Requirements

### 4.1 Critical API Version Issue

**⚠️ CRITICAL**: Use API v2, not v1

```typescript
// ✅ Correct API endpoint
const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${databaseId}`;

// ❌ Incorrect - v1 does not work reliably
const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v1/indexes/${databaseId}`;
```

**Issue Details:**
- API v1 has inconsistent behavior with vector operations
- v2 provides stable insert/query operations
- v1 may cause authentication or data corruption issues

### 4.2 Vector ID Constraints

**Critical Limitation**: Vector IDs must be ≤ 64 bytes

```typescript
// ✅ Correct - shortened hash approach
const shortHash = contentHash.substring(0, 16);
const vectorizeId = `${shortHash}_c${chunkIndex}`;

// ❌ Incorrect - will exceed 64 bytes
const vectorizeId = `${fullContentHash}_chunk_${chunkIndex}_${timestamp}`;
```

## Step 5: Integration Testing

### 5.1 Connection Test

```bash
# Test Vectorize connection
npx convex run knowledgeActions:addDocument '{
  "content": "Test document for Vectorize connectivity",
  "source": "vectorize-test.md"
}'
```

**Expected Output:**
```
Successfully inserted vectors: mutation 3b46e8e9-9f67-4070-aed1-7efd9e335836
{
  documentId: "k1234567890abcdef",
  chunksCreated: 1,
  status: "completed"
}
```

### 5.2 Vector Storage Verification

```bash
# Check database info
npx wrangler vectorize get starter-nextjs-convex-ai-knowledge

# Query vectors (if using CLI)
npx wrangler vectorize query starter-nextjs-convex-ai-knowledge \
  --vector [0.1,0.2,0.3,...] \
  --top-k 5
```

## Step 6: Common Issues and Troubleshooting

### 6.1 Authentication Issues

**Symptom**: `HTTP 401 Unauthorized`

**Solutions:**
1. **Verify API Token Permissions**
   ```bash
   # Test token with account access
   curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/accounts"
   ```

2. **Check Token Scope**
   - Ensure `Account:Cloudflare Workers:Edit` permission
   - Verify account ID matches token scope

### 6.2 Vector ID Length Issues

**Symptom**: `HTTP 400 Bad Request` with vector insertion

**Solution:**
```typescript
// Validate vector ID length
if (vectorizeId.length > 64) {
  throw new Error(`Vector ID too long: ${vectorizeId.length} bytes`);
}
```

### 6.3 Dimension Mismatch

**Symptom**: `HTTP 400 Bad Request` with embedding dimension error

**Solution:**
```typescript
// Verify embedding dimensions
if (embedding.length !== 1536) {
  throw new Error(`Expected 1536 dimensions, got ${embedding.length}`);
}
```

### 6.4 API Version Issues

**Symptom**: Inconsistent behavior or authentication failures

**Solution:**
- Always use `/vectorize/v2/` endpoints
- Update any existing code using v1

## Step 7: Environment Sync Workflow

### 7.1 Development to Production

```bash
# Export from development
npx wrangler vectorize list

# Recreate in production with same configuration
npx wrangler vectorize create production-knowledge-db \
  --dimensions 1536 \
  --metric cosine
```

### 7.2 Environment Variable Management

**Development Environment:**
- Store in `apps/convex/.env.local`
- Not committed to repository

**Production Environment:**
- Configure in Convex environment variables
- Use Convex dashboard or CLI for setting

```bash
# Set production environment variables
npx convex env set CLOUDFLARE_ACCOUNT_ID your-production-account-id
npx convex env set CLOUDFLARE_API_TOKEN your-production-token
npx convex env set VECTORIZE_DATABASE_ID production-knowledge-db
```

## Step 8: Performance Optimization

### 8.1 Batch Operations

```typescript
// ✅ Efficient - batch vector insertion
await vectorizeClient.insertVectors(vectorBatch);

// ❌ Inefficient - individual insertions
for (const vector of vectors) {
  await vectorizeClient.insertVectors([vector]);
}
```

### 8.2 Metadata Optimization

```typescript
// ✅ Optimized metadata
metadata: {
  source_document: filePath,
  chunk_index: index,
  file_type: fileType,
  chunk_size: content.length,
  content_preview: content.substring(0, 100), // For debugging only
}

// ❌ Avoid large metadata
metadata: {
  full_content: content, // Don't store full content in metadata
  large_object: complexData, // Keep metadata minimal
}
```

## Step 9: Monitoring and Maintenance

### 9.1 Database Monitoring

```bash
# Check database statistics
npx wrangler vectorize get starter-nextjs-convex-ai-knowledge

# Monitor vector count and usage
npx wrangler vectorize describe starter-nextjs-convex-ai-knowledge
```

### 9.2 Cleanup Operations

```typescript
// Coordinated cleanup across Convex and Vectorize
const vectorizeIds = await ctx.runMutation(internal.knowledgeMutations.deleteChunksBySource, {
  sourceDocument: filePath,
  correlationId,
});

// Clean up vectors from Vectorize
if (vectorizeIds.length > 0 && vectorizeClient) {
  await vectorizeClient.deleteVectors(vectorizeIds);
}
```

## Step 10: Cost Management

### 10.1 Embedding Cost Optimization

- **Model**: OpenAI text-embedding-3-small ($0.00002/1K tokens)
- **Chunking Strategy**: Balance chunk size vs. number of chunks
- **Deduplication**: Hash-based change detection prevents reprocessing

### 10.2 Vectorize Usage Tracking

- Monitor vector count and query frequency
- Implement usage alerts for cost control
- Regular cleanup of outdated vectors

## Conclusion

Following this guide ensures a robust Cloudflare Vectorize setup that integrates seamlessly with the Knowledge Ingestion Service. The key success factors are:

1. **Correct API Version** (v2, not v1)
2. **Proper Vector ID Management** (≤ 64 bytes)
3. **Comprehensive Environment Configuration**
4. **Thorough Testing and Validation**

For troubleshooting specific issues, refer to the [Vectorize Troubleshooting](#step-6-common-issues-and-troubleshooting) section or check the Convex logs for detailed error messages.