# Mock Knowledge Document

This is a mock document for testing the Knowledge Ingestion Service in Story 4.2.

## Features

The knowledge ingestion system can process various types of content:

- **Markdown documents** with headers, lists, and formatting
- **Code snippets** with syntax highlighting
- **Technical documentation** with examples and explanations

## Usage Example

```typescript
// Example TypeScript code
interface Document {
  id: string;
  content: string;
  source: string;
  metadata?: Record<string, any>;
}

export function processDocument(doc: Document): Promise<ProcessResult> {
  return knowledgeService.addDocument(doc);
}
```

## Implementation Details

The system uses:
1. Text chunking with overlap for context preservation  
2. OpenAI embeddings (text-embedding-3-small model)
3. Cloudflare Vectorize for vector storage
4. Convex for database operations

This document provides enough content to create multiple chunks and test the complete ingestion pipeline including embedding generation and vector storage.