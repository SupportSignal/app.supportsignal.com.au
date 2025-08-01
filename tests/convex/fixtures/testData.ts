/**
 * Test fixtures for Knowledge Ingestion Service testing
 */

export const mockDocuments = {
  simple: {
    _id: 'doc_simple_123',
    file_path: 'test-simple.md',
    file_type: 'markdown',
    content_hash: 'hash123456789abcdef',
    chunk_count: 3,
    processing_status: 'completed' as const,
    last_processed: 1703123456789,
    correlation_id: '12345678-1234-4000-8000-123456789abc',
    _creationTime: 1703123456789,
  },
  large: {
    _id: 'doc_large_456',
    file_path: 'test-large.md',
    file_type: 'markdown',
    content_hash: 'hash456789abcdef123',
    chunk_count: 15,
    processing_status: 'completed' as const,
    last_processed: 1703123456790,
    correlation_id: '87654321-4321-4000-8000-987654321cba',
    _creationTime: 1703123456790,
  },
  processing: {
    _id: 'doc_processing_789',
    file_path: 'test-processing.md',
    file_type: 'markdown',
    content_hash: 'hash789abcdef123456',
    chunk_count: 0,
    processing_status: 'processing' as const,
    last_processed: 1703123456791,
    correlation_id: '11223344-5566-4000-8000-778899aabbcc',
    _creationTime: 1703123456791,
  },
};

export const mockChunks = [
  {
    _id: 'chunk_123_0',
    source_document: 'test-simple.md',
    chunk_index: 0,
    content: 'This is the first chunk of test content with meaningful information for testing.',
    chunk_hash: 'chunkhash123',
    vectorize_id: 'hash123456789abc_c0',
    metadata: {
      file_path: 'test-simple.md',
      file_type: 'markdown',
      modified_at: 1703123456789,
      chunk_size: 77,
    },
    created_at: 1703123456789,
    correlation_id: '12345678-1234-4000-8000-123456789abc',
    _creationTime: 1703123456789,
  },
  {
    _id: 'chunk_123_1',
    source_document: 'test-simple.md',
    chunk_index: 1,
    content: 'This is the second chunk containing additional test data for validation purposes.',
    chunk_hash: 'chunkhash456',
    vectorize_id: 'hash123456789abc_c1',
    metadata: {
      file_path: 'test-simple.md',
      file_type: 'markdown',
      modified_at: 1703123456789,
      chunk_size: 79,
    },
    created_at: 1703123456789,
    correlation_id: '12345678-1234-4000-8000-123456789abc',
    _creationTime: 1703123456789,
  },
  {
    _id: 'chunk_123_2',
    source_document: 'test-simple.md',
    chunk_index: 2,
    content: 'Final chunk of the test document with concluding remarks and summary information.',
    chunk_hash: 'chunkhash789',
    vectorize_id: 'hash123456789abc_c2',
    metadata: {
      file_path: 'test-simple.md',
      file_type: 'markdown',
      modified_at: 1703123456789,
      chunk_size: 80,
    },
    created_at: 1703123456789,
    correlation_id: '12345678-1234-4000-8000-123456789abc',
    _creationTime: 1703123456789,
  },
];

export const mockTextContent = {
  short: 'This is a short test document.',
  medium: 'This is a medium-length test document that should be chunked into multiple segments when processed. '.repeat(10),
  long: 'This is a very long test document that will definitely require chunking. '.repeat(100),
  empty: '',
  whitespace: '   \n\t   ',
  markdown: `# Test Document

## Introduction
This is a test markdown document with various elements.

## Content
Here's some content with **bold** and *italic* text.

### Subsection
More content here with code:

\`\`\`javascript
function test() {
  return 'hello world';
}
\`\`\`

## Conclusion
This concludes our test document.`,
  code: `// TypeScript test file
interface TestInterface {
  id: string;
  name: string;
  value: number;
}

class TestClass implements TestInterface {
  constructor(
    public id: string,
    public name: string,
    public value: number
  ) {}

  process(): string {
    return \`Processing \${this.name} with value \${this.value}\`;
  }
}

export default TestClass;`,
};

export const mockEmbeddings = {
  // Mock 1536-dimension embedding (OpenAI text-embedding-3-small format)
  dimension1536: Array.from({ length: 1536 }, (_, i) => Math.sin(i * 0.01)),
  // Smaller embedding for testing dimension validation
  dimension512: Array.from({ length: 512 }, (_, i) => Math.cos(i * 0.01)),
  // Invalid embeddings for error testing
  empty: [],
  invalid: [NaN, Infinity, 'not_a_number'],
};

export const mockVectorizeResponses = {
  insertSuccess: {
    result: {
      mutationId: 'mutation_123456789',
      count: 3,
    },
  },
  querySuccess: {
    result: {
      matches: [
        {
          id: 'hash123456789abc_c0',
          score: 0.95,
          metadata: {
            source_document: 'test-simple.md',
            chunk_index: 0,
            file_path: 'test-simple.md',
            file_type: 'markdown',
            chunk_size: 77,
            content_preview: 'This is the first chunk of test content with meaningful information for testing.',
          },
        },
        {
          id: 'hash123456789abc_c1',
          score: 0.87,
          metadata: {
            source_document: 'test-simple.md',
            chunk_index: 1,
            file_path: 'test-simple.md',
            file_type: 'markdown',
            chunk_size: 79,
            content_preview: 'This is the second chunk containing additional test data for validation purposes.',
          },
        },
      ],
    },
  },
  deleteSuccess: {
    result: {
      mutationId: 'mutation_delete_123',
      count: 2,
    },
  },
  databaseInfo: {
    result: {
      name: 'test-knowledge-base',
      description: 'Test vector database',
      dimensions: 1536,
      metric: 'cosine',
      vectors: { count: 150 },
    },
  },
  apiError: {
    status: 400,
    statusText: 'Bad Request',
    text: () => Promise.resolve('Invalid vector dimensions'),
  },
  authError: {
    status: 401,
    statusText: 'Unauthorized',
    text: () => Promise.resolve('Invalid API token'),
  },
};

export const mockOpenAIResponses = {
  embeddingSuccess: {
    data: [
      {
        embedding: mockEmbeddings.dimension1536,
        index: 0,
        object: 'embedding',
      },
    ],
    model: 'text-embedding-3-small',
    object: 'list',
    usage: {
      prompt_tokens: 15,
      total_tokens: 15,
    },
  },
  embeddingError: {
    error: {
      message: 'Invalid API key',
      type: 'invalid_request_error',
      param: null,
      code: 'invalid_api_key',
    },
  },
  rateLimitError: {
    error: {
      message: 'Rate limit exceeded',
      type: 'rate_limit_error',
      param: null,
      code: 'rate_limit_exceeded',
    },
  },
};

export const mockConfigurations = {
  complete: {
    llm: {
      openRouterApiKey: 'test-openrouter-key-1234567890',
      defaultModel: 'anthropic/claude-3-haiku',
      fallbackModel: 'openai/gpt-4o-mini',
      openAiApiKey: 'test-openai-key-sk-1234567890',
    },
    vectorize: {
      accountId: 'test-cloudflare-account-123',
      apiToken: 'test-cloudflare-token-456',
      databaseId: 'test-vectorize-db-789',
    },
    environment: 'test' as const,
  },
  missingOpenAI: {
    llm: {
      openRouterApiKey: 'test-openrouter-key-1234567890',
      defaultModel: 'anthropic/claude-3-haiku',
      fallbackModel: 'openai/gpt-4o-mini',
      openAiApiKey: undefined,
    },
    vectorize: {
      accountId: 'test-cloudflare-account-123',
      apiToken: 'test-cloudflare-token-456',
      databaseId: 'test-vectorize-db-789',
    },
    environment: 'test' as const,
  },
  missingVectorize: {
    llm: {
      openRouterApiKey: 'test-openrouter-key-1234567890',
      defaultModel: 'anthropic/claude-3-haiku',
      fallbackModel: 'openai/gpt-4o-mini',
      openAiApiKey: 'test-openai-key-sk-1234567890',
    },
    vectorize: {
      accountId: undefined,
      apiToken: undefined,
      databaseId: undefined,
    },
    environment: 'test' as const,
  },
  invalid: {
    llm: {
      openRouterApiKey: 'invalid',
      defaultModel: 'unknown/model',
      fallbackModel: 'another/unknown',
      openAiApiKey: 'placeholder',
    },
    vectorize: {
      accountId: '',
      apiToken: '',
      databaseId: '',
    },
    environment: 'test' as const,
  },
};

export const createMockResponse = (data: any, status = 200, ok = true) => {
  const jestFn = (global as any).jest?.fn || (() => ({ mockResolvedValue: () => Promise.resolve() }));
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: jestFn().mockResolvedValue?.(data) || (() => Promise.resolve(data)),
    text: jestFn().mockResolvedValue?.(JSON.stringify(data)) || (() => Promise.resolve(JSON.stringify(data))),
  };
};

export const createMockErrorResponse = (status: number, message: string) => {
  const jestFn = (global as any).jest?.fn || (() => ({ 
    mockRejectedValue: () => Promise.reject(),
    mockResolvedValue: () => Promise.resolve()
  }));
  return {
    ok: false,
    status,
    statusText: 'Error',
    json: jestFn().mockRejectedValue?.(new Error('Response not JSON')) || (() => Promise.reject(new Error('Response not JSON'))),
    text: jestFn().mockResolvedValue?.(message) || (() => Promise.resolve(message)),
  };
};