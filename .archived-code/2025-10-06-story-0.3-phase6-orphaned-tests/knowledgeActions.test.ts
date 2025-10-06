// @ts-nocheck
/**
 * ⚠️ PROOF OF CONCEPT - Knowledge Actions Tests
 *
 * STATUS: POC tests for experimental RAG knowledge ingestion actions
 * - Tests reference removed schema tables and vectorization workflows
 * - May fail due to schema mismatches - skip if needed
 * - Demonstrates testing patterns for vector similarity and document workflows
 *
 * DO NOT REMOVE: Valuable test patterns for future RAG feature implementation
 *
 * Comprehensive tests for knowledgeActions.ts
 * Tests: addDocumentHandler action, queryVectorSimilarityHandler, deduplication logic, integration workflows
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mockDocuments,
  mockChunks,
  mockTextContent,
  mockEmbeddings,
  mockVectorizeResponses,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mockOpenAIResponses,
  mockConfigurations,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createMockResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createMockErrorResponse,
} from '@convex-tests/fixtures/testData';

// Mock Convex modules at top level before imports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockServer = require('@convex-tests/__mocks__/_generated/server');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockApi = require('@convex-tests/__mocks__/_generated/api');

const { createMockCtx } = require('@convex-tests/__mocks__/_generated/server');

// Import handler functions to test
import {
  addDocumentHandler,
  queryVectorSimilarityHandler,
} from '@convex/knowledgeActions';

describe('Knowledge Actions', () => {
  let mockCtx: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let mockTextProcessing: any;
  let mockConfig: any;
  let mockVectorize: any;

  beforeEach(() => {
    mockCtx = createMockCtx();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Setup module mocks
    mockTextProcessing = require('@convex/lib/textProcessing');
    mockConfig = require('@convex/lib/config');
    mockVectorize = require('@convex/lib/vectorize');

    // Setup default mock implementations
    mockConfig.getConfig.mockReturnValue(mockConfigurations.complete);

    mockTextProcessing.chunkText.mockReturnValue([
      {
        content: 'First chunk of test content',
        index: 0,
        startPosition: 0,
        endPosition: 27,
        wordCount: 5,
      },
      {
        content: 'Second chunk of test content',
        index: 1,
        startPosition: 20,
        endPosition: 48,
        wordCount: 5,
      },
    ]);

    mockTextProcessing.calculateTextStats.mockReturnValue({
      characterCount: 100,
      wordCount: 15,
      lineCount: 3,
      paragraphCount: 2,
    });

    mockTextProcessing.generateEmbeddingsForChunks.mockResolvedValue([
      {
        chunk: mockTextProcessing.chunkText()[0],
        embedding: mockEmbeddings.dimension1536,
      },
      {
        chunk: mockTextProcessing.chunkText()[1],
        embedding: mockEmbeddings.dimension1536,
      },
    ]);

    mockTextProcessing.generateEmbeddingForText.mockResolvedValue(
      mockEmbeddings.dimension1536
    );

    const mockVectorizeClient = {
      insertVectors: jest
        .fn()
        .mockResolvedValue(mockVectorizeResponses.insertSuccess.result),
      queryVectors: jest
        .fn()
        .mockResolvedValue(mockVectorizeResponses.querySuccess.result),
      testConnection: jest.fn().mockResolvedValue(true),
    };

    mockVectorize.createVectorizeClient.mockReturnValue(mockVectorizeClient);

    // Setup Convex mocks
    mockCtx.runQuery.mockResolvedValue(null); // No existing document by default
    mockCtx.runMutation.mockResolvedValue('mock_document_id');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addDocumentHandler', () => {
    const validArgs = {
      content: mockTextContent.medium,
      source: 'test-document.md',
      metadata: {
        file_path: 'test-document.md',
        file_type: 'markdown',
        modified_at: Date.now(),
      },
    };

    describe('Successful Document Processing', () => {
      it('should process new document completely', async () => {
        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result).toEqual({
          documentId: 'mock_document_id',
          chunksCreated: 2,
          status: 'completed',
        });

        // Verify processing steps
        expect(mockTextProcessing.chunkText).toHaveBeenCalledWith(
          validArgs.content,
          expect.any(Object)
        );
        expect(
          mockTextProcessing.generateEmbeddingsForChunks
        ).toHaveBeenCalled();
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/createOrUpdateDocument',
          expect.objectContaining({
            filePath: validArgs.source,
            fileType: validArgs.metadata?.file_type,
            contentHash: expect.any(String),
            correlationId: expect.any(String),
          })
        );
      });

      it('should generate and use correlation ID consistently', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        // Verify correlation ID is used in document creation
        const createDocumentCall = mockCtx.runMutation.mock.calls.find(
          call =>
            call[0] === 'internal/knowledgeMutations/createOrUpdateDocument'
        );
        expect(createDocumentCall[1].correlationId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
      });

      it('should create content hash for deduplication', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        const createDocumentCall = mockCtx.runMutation.mock.calls.find(
          call =>
            call[0] === 'internal/knowledgeMutations/createOrUpdateDocument'
        );
        expect(createDocumentCall[1].contentHash).toBeTruthy();
        expect(typeof createDocumentCall[1].contentHash).toBe('string');
      });

      it('should handle document with metadata', async () => {
        const argsWithMeta = {
          ...validArgs,
          metadata: {
            file_path: 'docs/advanced-guide.md',
            file_type: 'markdown',
            modified_at: 1703123456789,
          },
        };

        await addDocumentHandler(mockCtx, argsWithMeta);

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/createOrUpdateDocument',
          expect.objectContaining({
            filePath: argsWithMeta.metadata.file_path,
            fileType: argsWithMeta.metadata.file_type,
          })
        );
      });

      it('should handle document without metadata', async () => {
        const argsWithoutMeta = {
          content: validArgs.content,
          source: validArgs.source,
        };

        await addDocumentHandler(mockCtx, argsWithoutMeta);

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/createOrUpdateDocument',
          expect.objectContaining({
            filePath: argsWithoutMeta.source,
            fileType: 'unknown',
          })
        );
      });

      it('should create chunks with proper vectorize IDs', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        // Find chunk creation calls
        const chunkCalls = mockCtx.runMutation.mock.calls.filter(
          call => call[0] === 'internal/knowledgeMutations/createDocumentChunk'
        );

        expect(chunkCalls).toHaveLength(2);

        chunkCalls.forEach((call, index) => {
          const chunkData = call[1];
          expect(chunkData.vectorizeId).toMatch(/^[a-f0-9]{16}_c\d+$/);
          expect(chunkData.chunkIndex).toBe(index);
          expect(chunkData.sourceDocument).toBe(validArgs.source);
        });
      });

      it('should update document status to completed', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/updateDocumentStatus',
          {
            documentId: 'mock_document_id',
            status: 'completed',
            chunkCount: 2,
          }
        );
      });
    });

    describe('Document Deduplication', () => {
      it('should return existing document if content hash matches', async () => {
        const existingDoc = {
          _id: 'existing_doc_123',
          content_hash: 'matching_hash',
          chunk_count: 5,
        };

        // Mock content hash generation to return matching hash
        const mockCrypto = {
          createHash: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn(() => 'matching_hash'),
          })),
        };
        (global as any).crypto = mockCrypto;

        mockCtx.runQuery.mockResolvedValue(existingDoc);

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result).toEqual({
          documentId: existingDoc._id,
          chunksCreated: existingDoc.chunk_count,
          status: 'already_exists',
        });

        // Should not process chunks or embeddings
        expect(mockTextProcessing.chunkText).not.toHaveBeenCalled();
        expect(
          mockTextProcessing.generateEmbeddingsForChunks
        ).not.toHaveBeenCalled();
      });

      it('should process document if content hash differs', async () => {
        const existingDoc = {
          _id: 'existing_doc_123',
          content_hash: 'different_hash',
          chunk_count: 5,
        };

        mockCtx.runQuery.mockResolvedValue(existingDoc);

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result.status).toBe('completed');
        expect(mockTextProcessing.chunkText).toHaveBeenCalled();
      });

      it('should process document if no existing document found', async () => {
        mockCtx.runQuery.mockResolvedValue(null);

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result.status).toBe('completed');
        expect(mockTextProcessing.chunkText).toHaveBeenCalled();
      });
    });

    describe('Embedding Generation', () => {
      it('should generate embeddings when OpenAI key is available', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        expect(
          mockTextProcessing.generateEmbeddingsForChunks
        ).toHaveBeenCalledWith(
          expect.any(Array),
          mockConfigurations.complete.llm.openAiApiKey
        );
      });

      it('should skip embeddings when OpenAI key is missing', async () => {
        mockConfig.getConfig.mockReturnValue(mockConfigurations.missingOpenAI);

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await addDocumentHandler(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          'OpenAI API key not configured - skipping embedding generation'
        );
        expect(
          mockTextProcessing.generateEmbeddingsForChunks
        ).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle embedding generation failures gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockTextProcessing.generateEmbeddingsForChunks.mockRejectedValue(
          new Error('Embedding generation failed')
        );

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result.status).toBe('completed');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to generate embeddings:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should use placeholder embeddings when generation fails', async () => {
        jest.spyOn(console, 'error').mockImplementation();
        mockTextProcessing.generateEmbeddingsForChunks.mockRejectedValue(
          new Error('API error')
        );

        await addDocumentHandler(mockCtx, validArgs);

        // Should still create chunks with null embeddings
        const chunkCalls = mockCtx.runMutation.mock.calls.filter(
          call => call[0] === 'internal/knowledgeMutations/createDocumentChunk'
        );
        expect(chunkCalls).toHaveLength(2);
      });
    });

    describe('Vector Storage Integration', () => {
      it('should insert vectors when Vectorize client is available', async () => {
        const mockClient = mockVectorize.createVectorizeClient();

        await addDocumentHandler(mockCtx, validArgs);

        expect(mockClient.insertVectors).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringMatching(/^[a-f0-9]{16}_c\d+$/),
              values: mockEmbeddings.dimension1536,
              metadata: expect.objectContaining({
                source_document: validArgs.source,
                file_type: validArgs.metadata?.file_type || 'unknown',
              }),
            }),
          ])
        );
      });

      it('should handle missing Vectorize client gracefully', async () => {
        mockVectorize.createVectorizeClient.mockReturnValue(null);
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result.status).toBe('completed');
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'vectors ready but Vectorize client not available'
          )
        );

        consoleSpy.mockRestore();
      });

      it('should continue processing when vector insertion fails', async () => {
        const mockClient = mockVectorize.createVectorizeClient();
        mockClient.insertVectors.mockRejectedValue(
          new Error('Vectorize API error')
        );

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await addDocumentHandler(mockCtx, validArgs);

        expect(result.status).toBe('completed');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to insert vectors into Vectorize:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should generate valid vectorize IDs under 64 bytes', async () => {
        await addDocumentHandler(mockCtx, validArgs);

        const chunkCalls = mockCtx.runMutation.mock.calls.filter(
          call => call[0] === 'internal/knowledgeMutations/createDocumentChunk'
        );

        chunkCalls.forEach(call => {
          const vectorizeId = call[1].vectorizeId;
          expect(vectorizeId.length).toBeLessThanOrEqual(64);
          expect(vectorizeId).toMatch(/^[a-f0-9]{16}_c\d+$/);
        });
      });
    });

    describe('Input Validation', () => {
      it('should reject empty content', async () => {
        const invalidArgs = { ...validArgs, content: '' };

        await expect(addDocumentHandler(mockCtx, invalidArgs)).rejects.toThrow(
          'Content cannot be empty'
        );
      });

      it('should reject whitespace-only content', async () => {
        const invalidArgs = { ...validArgs, content: '   \n\t   ' };

        await expect(addDocumentHandler(mockCtx, invalidArgs)).rejects.toThrow(
          'Content cannot be empty'
        );
      });

      it('should reject empty source', async () => {
        const invalidArgs = { ...validArgs, source: '' };

        await expect(addDocumentHandler(mockCtx, invalidArgs)).rejects.toThrow(
          'Source cannot be empty'
        );
      });

      it('should reject whitespace-only source', async () => {
        const invalidArgs = { ...validArgs, source: '   ' };

        await expect(addDocumentHandler(mockCtx, invalidArgs)).rejects.toThrow(
          'Source cannot be empty'
        );
      });

      it('should handle very large content', async () => {
        const largeContent = mockTextContent.long.repeat(10);
        const largeArgs = { ...validArgs, content: largeContent };

        const result = await addDocumentHandler(mockCtx, largeArgs);

        expect(result.status).toBe('completed');
        expect(mockTextProcessing.chunkText).toHaveBeenCalledWith(
          largeContent,
          expect.any(Object)
        );
      });

      it('should handle Unicode content', async () => {
        const unicodeContent = 'Unicode test: 世界 🌍 café naïve résumé';
        const unicodeArgs = { ...validArgs, content: unicodeContent };

        const result = await addDocumentHandler(mockCtx, unicodeArgs);

        expect(result.status).toBe('completed');
      });
    });

    describe('Error Handling', () => {
      it('should handle document creation failures', async () => {
        mockCtx.runMutation.mockRejectedValue(new Error('Database error'));

        await expect(addDocumentHandler(mockCtx, validArgs)).rejects.toThrow(
          'Failed to process document: Database error'
        );
      });

      it('should handle chunk creation failures', async () => {
        // First call (createOrUpdateDocument) succeeds, second fails
        mockCtx.runMutation
          .mockResolvedValueOnce('mock_document_id')
          .mockRejectedValue(new Error('Chunk creation failed'));

        await expect(addDocumentHandler(mockCtx, validArgs)).rejects.toThrow(
          'Failed to process document: Chunk creation failed'
        );
      });

      it('should handle text processing failures', async () => {
        mockTextProcessing.chunkText.mockImplementation(() => {
          throw new Error('Text chunking failed');
        });

        await expect(addDocumentHandler(mockCtx, validArgs)).rejects.toThrow(
          'Failed to process document: Text chunking failed'
        );
      });

      it('should log errors before throwing', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockCtx.runMutation.mockRejectedValue(new Error('Test error'));

        await expect(addDocumentHandler(mockCtx, validArgs)).rejects.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Error processing document:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Logging and Monitoring', () => {
      it('should log processing steps', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await addDocumentHandler(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Processing document ${validArgs.source}`)
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Created 2 chunks')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully processed document')
        );

        consoleSpy.mockRestore();
      });

      it('should log embedding generation', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await addDocumentHandler(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Generating embeddings for 2 chunks')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          'Successfully generated embeddings for all chunks'
        );

        consoleSpy.mockRestore();
      });

      it('should log vector insertion', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await addDocumentHandler(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Inserting 2 vectors into Vectorize')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Successfully inserted vectors')
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('queryVectorSimilarityHandler', () => {
    const validArgs = {
      query: 'test search query',
      topK: 5,
      includeContent: true,
    };

    beforeEach(() => {
      // Setup chunks for content retrieval
      mockCtx.runQuery.mockResolvedValue(mockChunks[0]);
    });

    describe('Successful Vector Queries', () => {
      it('should perform complete similarity search with content', async () => {
        const result = await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(result).toEqual({
          matches: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              score: expect.any(Number),
              chunk: expect.objectContaining({
                content: expect.any(String),
                source_document: expect.any(String),
                chunk_index: expect.any(Number),
                metadata: expect.any(Object),
              }),
            }),
          ]),
          queryStats: {
            totalResults: expect.any(Number),
            processingTimeMs: expect.any(Number),
          },
        });

        // Verify embedding generation for query
        expect(
          mockTextProcessing.generateEmbeddingForText
        ).toHaveBeenCalledWith(
          validArgs.query,
          mockConfigurations.complete.llm.openAiApiKey
        );

        // Verify vector search
        const mockClient = mockVectorize.createVectorizeClient();
        expect(mockClient.queryVectors).toHaveBeenCalledWith(
          mockEmbeddings.dimension1536,
          validArgs.topK,
          true,
          false
        );
      });

      it('should handle query without content inclusion', async () => {
        const argsWithoutContent = { ...validArgs, includeContent: false };

        const result = await queryVectorSimilarityHandler(
          mockCtx,
          argsWithoutContent
        );

        expect(result.matches[0].chunk).toBeNull();
        expect(mockCtx.runQuery).not.toHaveBeenCalledWith(
          'knowledge/getChunkByVectorizeId',
          expect.any(Object)
        );
      });

      it('should use default parameters when not specified', async () => {
        const minimalArgs = { query: 'test query' };

        await queryVectorSimilarityHandler(mockCtx, minimalArgs);

        const mockClient = mockVectorize.createVectorizeClient();
        expect(mockClient.queryVectors).toHaveBeenCalledWith(
          expect.any(Array),
          5, // default topK
          true, // default includeMetadata
          false // default includeValues
        );
      });

      it('should handle custom topK values', async () => {
        const customArgs = { ...validArgs, topK: 10 };

        await queryVectorSimilarityHandler(mockCtx, customArgs);

        const mockClient = mockVectorize.createVectorizeClient();
        expect(mockClient.queryVectors).toHaveBeenCalledWith(
          expect.any(Array),
          10,
          expect.any(Boolean),
          expect.any(Boolean)
        );
      });

      it('should retrieve chunk content for each match', async () => {
        // Mock multiple matches
        const multipleMatches = {
          matches: [
            { id: 'vec_1', score: 0.95 },
            { id: 'vec_2', score: 0.87 },
          ],
        };
        const mockClient = mockVectorize.createVectorizeClient();
        mockClient.queryVectors.mockResolvedValue(multipleMatches);

        await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(mockCtx.runQuery).toHaveBeenCalledTimes(2);
        expect(mockCtx.runQuery).toHaveBeenCalledWith(
          'knowledge/getChunkByVectorizeId',
          { vectorizeId: 'vec_1' }
        );
        expect(mockCtx.runQuery).toHaveBeenCalledWith(
          'knowledge/getChunkByVectorizeId',
          { vectorizeId: 'vec_2' }
        );
      });

      it('should handle missing chunks gracefully', async () => {
        mockCtx.runQuery.mockResolvedValue(null); // Chunk not found

        const result = await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(result.matches[0].chunk).toBeNull();
      });

      it('should track processing time', async () => {
        const result = await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(result.queryStats.processingTimeMs).toBeGreaterThan(0);
        expect(typeof result.queryStats.processingTimeMs).toBe('number');
      });
    });

    describe('Configuration Requirements', () => {
      it('should require OpenAI API key for query embedding', async () => {
        mockConfig.getConfig.mockReturnValue(mockConfigurations.missingOpenAI);

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow(
          'OpenAI API key required for query embedding generation'
        );
      });

      it('should require Vectorize configuration', async () => {
        mockVectorize.createVectorizeClient.mockReturnValue(null);

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow('Vectorize configuration incomplete');
      });

      it('should work with complete configuration', async () => {
        mockConfig.getConfig.mockReturnValue(mockConfigurations.complete);

        const result = await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(result).toBeTruthy();
        expect(result.matches).toBeDefined();
        expect(result.queryStats).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle embedding generation failures', async () => {
        mockTextProcessing.generateEmbeddingForText.mockRejectedValue(
          new Error('Embedding generation failed')
        );

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow(
          'Failed to query vector similarity: Embedding generation failed'
        );
      });

      it('should handle vector search failures', async () => {
        const mockClient = mockVectorize.createVectorizeClient();
        mockClient.queryVectors.mockRejectedValue(
          new Error('Vectorize API error')
        );

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow(
          'Failed to query vector similarity: Vectorize API error'
        );
      });

      it('should handle chunk retrieval failures', async () => {
        mockCtx.runQuery.mockRejectedValue(new Error('Database error'));

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow('Failed to query vector similarity: Database error');
      });

      it('should log errors before throwing', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const mockClient = mockVectorize.createVectorizeClient();
        mockClient.queryVectors.mockRejectedValue(new Error('Test error'));

        await expect(
          queryVectorSimilarityHandler(mockCtx, validArgs)
        ).rejects.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Error querying vector similarity:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Correlation ID Tracking', () => {
      it('should generate correlation ID for query tracking', async () => {
        // Mock crypto.randomUUID to verify it's called
        const mockUUID = 'query-correlation-id-123';
        (global as any).crypto = {
          randomUUID: jest.fn(() => mockUUID),
        };

        await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(global.crypto.randomUUID).toHaveBeenCalled();
      });
    });

    describe('Logging and Monitoring', () => {
      it('should log successful query completion', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await queryVectorSimilarityHandler(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Vector similarity search completed')
        );

        consoleSpy.mockRestore();
      });

      it('should include result count and timing in logs', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await queryVectorSimilarityHandler(mockCtx, validArgs);

        const logCall = consoleSpy.mock.calls.find(call =>
          call[0].includes('Vector similarity search completed')
        );
        expect(logCall[0]).toContain(`${result.matches.length} results`);
        expect(logCall[0]).toContain(`${result.queryStats.processingTimeMs}ms`);

        consoleSpy.mockRestore();
      });
    });

    describe('Input Validation', () => {
      it('should handle empty query strings', async () => {
        const emptyArgs = { ...validArgs, query: '' };

        // Should pass validation to embedding generation which might handle it
        await expect(
          queryVectorSimilarityHandler(mockCtx, emptyArgs)
        ).rejects.toThrow(); // Will fail at embedding generation
      });

      it('should handle very long queries', async () => {
        const longQuery = 'very long query '.repeat(1000);
        const longArgs = { ...validArgs, query: longQuery };

        await queryVectorSimilarityHandler(mockCtx, longArgs);

        expect(
          mockTextProcessing.generateEmbeddingForText
        ).toHaveBeenCalledWith(longQuery, expect.any(String));
      });

      it('should handle Unicode queries', async () => {
        const unicodeQuery = 'Unicode search: 世界 🌍 café naïve';
        const unicodeArgs = { ...validArgs, query: unicodeQuery };

        await queryVectorSimilarityHandler(mockCtx, unicodeArgs);

        expect(
          mockTextProcessing.generateEmbeddingForText
        ).toHaveBeenCalledWith(unicodeQuery, expect.any(String));
      });

      it('should handle extreme topK values', async () => {
        const extremeArgs = { ...validArgs, topK: 0 };

        await queryVectorSimilarityHandler(mockCtx, extremeArgs);

        const mockClient = mockVectorize.createVectorizeClient();
        expect(mockClient.queryVectors).toHaveBeenCalledWith(
          expect.any(Array),
          0,
          expect.any(Boolean),
          expect.any(Boolean)
        );
      });
    });
  });

  describe('Integration Workflows', () => {
    describe('Complete Knowledge Ingestion Pipeline', () => {
      it('should handle document ingestion followed by search', async () => {
        // Step 1: Ingest document
        const ingestArgs = {
          content: mockTextContent.medium,
          source: 'integration-test.md',
          metadata: {
            file_path: 'integration-test.md',
            file_type: 'markdown',
            modified_at: Date.now(),
          },
        };

        const ingestResult = await addDocumentHandler(mockCtx, ingestArgs);
        expect(ingestResult.status).toBe('completed');

        // Step 2: Search for content
        const searchArgs = {
          query: 'test search for ingested content',
          topK: 3,
          includeContent: true,
        };

        const searchResult = await queryVectorSimilarityHandler(
          mockCtx,
          searchArgs
        );
        expect(searchResult.matches).toBeDefined();
        expect(searchResult.queryStats.totalResults).toBeGreaterThanOrEqual(0);
      });

      it('should handle batch document processing', async () => {
        const documents = [
          { content: 'First document content', source: 'doc1.md' },
          { content: 'Second document content', source: 'doc2.md' },
          { content: 'Third document content', source: 'doc3.md' },
        ];

        const results = [];
        for (const doc of documents) {
          const result = await addDocumentHandler(mockCtx, doc);
          results.push(result);
        }

        expect(results).toHaveLength(3);
        expect(results.every(r => r.status === 'completed')).toBe(true);
      });
    });

    describe('Error Recovery Scenarios', () => {
      it('should handle partial system failures gracefully', async () => {
        // Document processing succeeds, but vector search has issues
        const ingestArgs = {
          content: mockTextContent.medium,
          source: 'recovery-test.md',
        };

        const ingestResult = await addDocumentHandler(mockCtx, ingestArgs);
        expect(ingestResult.status).toBe('completed');

        // Simulate vector search failure
        const mockClient = mockVectorize.createVectorizeClient();
        mockClient.queryVectors.mockRejectedValue(
          new Error('Search service down')
        );

        const searchArgs = { query: 'test query' };

        await expect(
          queryVectorSimilarityHandler(mockCtx, searchArgs)
        ).rejects.toThrow('Search service down');
      });

      it('should handle graceful degradation scenarios', async () => {
        // Process document without embeddings
        mockConfig.getConfig.mockReturnValue(mockConfigurations.missingOpenAI);

        const args = {
          content: mockTextContent.medium,
          source: 'degraded-test.md',
        };

        const result = await addDocumentHandler(mockCtx, args);

        expect(result.status).toBe('completed');
        expect(result.chunksCreated).toBeGreaterThan(0);
        // Document should be processed even without embeddings
      });
    });

    describe('Performance and Scalability', () => {
      it('should handle large document processing efficiently', async () => {
        const largeContent = mockTextContent.long.repeat(50);

        // Mock many chunks for large content
        const manyChunks = Array.from({ length: 50 }, (_, i) => ({
          content: `Chunk ${i} content`,
          index: i,
          startPosition: i * 100,
          endPosition: (i + 1) * 100,
          wordCount: 10,
        }));

        mockTextProcessing.chunkText.mockReturnValue(manyChunks);
        mockTextProcessing.generateEmbeddingsForChunks.mockResolvedValue(
          manyChunks.map(chunk => ({
            chunk,
            embedding: mockEmbeddings.dimension1536,
          }))
        );

        const startTime = Date.now();

        const result = await addDocumentHandler(mockCtx, {
          content: largeContent,
          source: 'large-document.md',
        });

        const processingTime = Date.now() - startTime;

        expect(result.status).toBe('completed');
        expect(result.chunksCreated).toBe(50);
        expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      });

      it('should handle concurrent search queries', async () => {
        const queries = [
          'first search query',
          'second search query',
          'third search query',
        ];

        const searchPromises = queries.map(query =>
          queryVectorSimilarityHandler(mockCtx, { query })
        );

        const results = await Promise.all(searchPromises);

        expect(results).toHaveLength(3);
        expect(results.every(r => r.matches !== undefined)).toBe(true);
      });
    });

    describe('Configuration-Dependent Behavior', () => {
      it('should adapt to available services', async () => {
        const testConfigs = [
          mockConfigurations.complete,
          mockConfigurations.missingOpenAI,
          mockConfigurations.missingVectorize,
        ];

        for (const config of testConfigs) {
          mockConfig.getConfig.mockReturnValue(config);
          mockCtx.runMutation.mockClear();

          const args = {
            content: 'Test content for configuration',
            source: `config-test-${config.environment}.md`,
          };

          if (config === mockConfigurations.missingVectorize) {
            mockVectorize.createVectorizeClient.mockReturnValue(null);
          } else {
            mockVectorize.createVectorizeClient.mockReturnValue({
              insertVectors: jest
                .fn()
                .mockResolvedValue({ mutationId: 'test', count: 1 }),
              queryVectors: jest.fn().mockResolvedValue({ matches: [] }),
            });
          }

          const result = await addDocumentHandler(mockCtx, args);

          expect(result.status).toBe('completed');
          // Should succeed regardless of configuration
        }
      });
    });
  });
});
