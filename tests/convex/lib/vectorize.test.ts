// @ts-nocheck
/**
 * Comprehensive tests for lib/vectorize.ts
 * Tests: VectorizeClient methods, authentication, validation, error handling
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import {
  mockEmbeddings,
  mockVectorizeResponses,
  mockConfigurations,
  createMockResponse,
  createMockErrorResponse,
} from '../fixtures/testData';

// Import functions and classes to test
import {
  VectorizeClient,
  createVectorizeClient,
  type VectorizeVector,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type VectorizeInsertResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type VectorizeQueryResponse,
} from '@convex/lib/vectorize';

describe('Vectorize Client', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let client: VectorizeClient;
  let validConfig: any;

  beforeEach(() => {
    // Setup global fetch mock
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();

    // Setup valid configuration
    validConfig = {
      accountId: 'test-account-123',
      apiToken: 'test-token-456',
      databaseId: 'test-db-789',
    };

    // Create client instance
    client = new VectorizeClient(validConfig);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('VectorizeClient Constructor', () => {
    describe('Valid Configuration', () => {
      it('should create client with valid configuration', () => {
        const client = new VectorizeClient(validConfig);

        expect(client).toBeInstanceOf(VectorizeClient);
        // Private properties are not directly accessible, but we can test behavior
      });

      it('should construct correct base URL', () => {
        // We can test this indirectly by checking the fetch URLs in other tests
        const client = new VectorizeClient(validConfig);
        expect(client).toBeInstanceOf(VectorizeClient);
      });
    });

    describe('Invalid Configuration', () => {
      it('should throw error for missing accountId', () => {
        const invalidConfig = { ...validConfig, accountId: undefined };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });

      it('should throw error for missing apiToken', () => {
        const invalidConfig = { ...validConfig, apiToken: undefined };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });

      it('should throw error for missing databaseId', () => {
        const invalidConfig = { ...validConfig, databaseId: undefined };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });

      it('should throw error for empty accountId', () => {
        const invalidConfig = { ...validConfig, accountId: '' };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });

      it('should throw error for empty apiToken', () => {
        const invalidConfig = { ...validConfig, apiToken: '' };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });

      it('should throw error for empty databaseId', () => {
        const invalidConfig = { ...validConfig, databaseId: '' };

        expect(() => new VectorizeClient(invalidConfig)).toThrow(
          'Vectorize configuration is incomplete'
        );
      });
    });
  });

  describe('insertVectors', () => {
    const createTestVectors = (count: number): VectorizeVector[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `test_vector_${i}`,
        values: mockEmbeddings.dimension1536,
        metadata: {
          source_document: `test_doc_${i}.md`,
          chunk_index: i,
          file_type: 'markdown',
          chunk_size: 100 + i,
        },
      }));
    };

    describe('Successful Insertions', () => {
      it('should insert vectors successfully', async () => {
        const vectors = createTestVectors(3);
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.insertSuccess)
        );

        const result = await client.insertVectors(vectors);

        expect(result).toEqual(mockVectorizeResponses.insertSuccess.result);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.cloudflare.com/client/v4/accounts/test-account-123/vectorize/v2/indexes/test-db-789/insert',
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer test-token-456',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vectors }),
          }
        );
      });

      it('should handle single vector insertion', async () => {
        const vectors = createTestVectors(1);
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.insertSuccess)
        );

        const result = await client.insertVectors(vectors);

        expect(result).toEqual(mockVectorizeResponses.insertSuccess.result);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should handle large batch insertions', async () => {
        const vectors = createTestVectors(100);
        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'large_batch_123', count: 100 },
          })
        );

        const result = await client.insertVectors(vectors);

        expect(result.count).toBe(100);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('should handle vectors with complex metadata', async () => {
        const vectors: VectorizeVector[] = [
          {
            id: 'complex_vector_1',
            values: mockEmbeddings.dimension1536,
            metadata: {
              source_document: 'complex_doc.md',
              chunk_index: 0,
              file_type: 'markdown',
              chunk_size: 1500,
              custom_field: 'custom_value',
              numeric_field: 42,
              boolean_field: true,
              nested_info: 'deep_data',
            },
          },
        ];

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.insertSuccess)
        );

        const result = await client.insertVectors(vectors);

        expect(result).toEqual(mockVectorizeResponses.insertSuccess.result);

        // Verify complex metadata was included in request
        const requestBody = JSON.parse(
          mockFetch.mock.calls[0][1]?.body as string
        );
        expect(requestBody.vectors[0].metadata.custom_field).toBe(
          'custom_value'
        );
        expect(requestBody.vectors[0].metadata.numeric_field).toBe(42);
        expect(requestBody.vectors[0].metadata.boolean_field).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors', async () => {
        const vectors = createTestVectors(1);
        mockFetch.mockResolvedValue(
          createMockErrorResponse(400, 'Bad Request')
        );

        await expect(client.insertVectors(vectors)).rejects.toThrow(
          'Failed to insert vectors: Vectorize API error: 400 Error - Bad Request'
        );
      });

      it('should handle authentication errors', async () => {
        const vectors = createTestVectors(1);
        mockFetch.mockResolvedValue(
          createMockErrorResponse(401, 'Unauthorized')
        );

        await expect(client.insertVectors(vectors)).rejects.toThrow(
          'Failed to insert vectors: Vectorize API error: 401 Error - Unauthorized'
        );
      });

      it('should handle network errors', async () => {
        const vectors = createTestVectors(1);
        mockFetch.mockRejectedValue(new Error('Network connection failed'));

        await expect(client.insertVectors(vectors)).rejects.toThrow(
          'Failed to insert vectors: Network connection failed'
        );
      });

      it('should handle timeout errors', async () => {
        const vectors = createTestVectors(1);
        mockFetch.mockRejectedValue(new Error('Request timeout'));

        await expect(client.insertVectors(vectors)).rejects.toThrow(
          'Failed to insert vectors: Request timeout'
        );
      });

      it('should handle malformed response', async () => {
        const vectors = createTestVectors(1);
        const malformedResponse = {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
          text: jest.fn().mockResolvedValue('Invalid JSON response'),
        };
        mockFetch.mockResolvedValue(malformedResponse as any);

        await expect(client.insertVectors(vectors)).rejects.toThrow(
          'Failed to insert vectors: Invalid JSON'
        );
      });
    });

    describe('Input Validation', () => {
      it('should handle empty vectors array', async () => {
        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'empty_123', count: 0 },
          })
        );

        const result = await client.insertVectors([]);

        expect(result.count).toBe(0);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ vectors: [] }),
          })
        );
      });

      it('should handle vectors with missing metadata', async () => {
        const vectors: VectorizeVector[] = [
          {
            id: 'no_metadata_vector',
            values: mockEmbeddings.dimension1536,
            // metadata is optional
          },
        ];

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.insertSuccess)
        );

        const result = await client.insertVectors(vectors);

        expect(result).toEqual(mockVectorizeResponses.insertSuccess.result);
      });

      it('should handle vectors with special characters in IDs', async () => {
        const vectors: VectorizeVector[] = [
          {
            id: 'test-vector_with-special.chars_123',
            values: mockEmbeddings.dimension1536,
            metadata: { test: 'data' },
          },
        ];

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.insertSuccess)
        );

        const result = await client.insertVectors(vectors);

        expect(result).toEqual(mockVectorizeResponses.insertSuccess.result);
      });
    });
  });

  describe('queryVectors', () => {
    describe('Successful Queries', () => {
      it('should query vectors with default parameters', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.querySuccess)
        );

        const result = await client.queryVectors(queryVector);

        expect(result).toEqual(mockVectorizeResponses.querySuccess.result);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.cloudflare.com/client/v4/accounts/test-account-123/vectorize/v2/indexes/test-db-789/query',
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer test-token-456',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vector: queryVector,
              topK: 5,
              returnMetadata: true,
              returnValues: false,
            }),
          }
        );
      });

      it('should query vectors with custom parameters', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        const topK = 10;
        const includeMetadata = false;
        const includeValues = true;

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.querySuccess)
        );

        const result = await client.queryVectors(
          queryVector,
          topK,
          includeMetadata,
          includeValues
        );

        expect(result).toEqual(mockVectorizeResponses.querySuccess.result);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              vector: queryVector,
              topK: 10,
              returnMetadata: false,
              returnValues: true,
            }),
          })
        );
      });

      it('should handle queries with no matches', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        const emptyResponse = {
          result: {
            matches: [],
          },
        };
        mockFetch.mockResolvedValue(createMockResponse(emptyResponse));

        const result = await client.queryVectors(queryVector);

        expect(result.matches).toHaveLength(0);
      });

      it('should handle different topK values', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        const testCases = [1, 5, 10, 50, 100];

        for (const topK of testCases) {
          mockFetch.mockClear();
          mockFetch.mockResolvedValue(
            createMockResponse(mockVectorizeResponses.querySuccess)
          );

          await client.queryVectors(queryVector, topK);

          const requestBody = JSON.parse(
            mockFetch.mock.calls[0][1]?.body as string
          );
          expect(requestBody.topK).toBe(topK);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors in queries', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        mockFetch.mockResolvedValue(
          createMockErrorResponse(400, 'Invalid vector dimensions')
        );

        await expect(client.queryVectors(queryVector)).rejects.toThrow(
          'Failed to query vectors: Vectorize API error: 400 Error - Invalid vector dimensions'
        );
      });

      it('should handle authentication errors in queries', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        mockFetch.mockResolvedValue(
          createMockErrorResponse(401, 'Invalid API token')
        );

        await expect(client.queryVectors(queryVector)).rejects.toThrow(
          'Failed to query vectors: Vectorize API error: 401 Error - Invalid API token'
        );
      });

      it('should handle rate limiting errors', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        mockFetch.mockResolvedValue(
          createMockErrorResponse(429, 'Too Many Requests')
        );

        await expect(client.queryVectors(queryVector)).rejects.toThrow(
          'Failed to query vectors: Vectorize API error: 429 Error - Too Many Requests'
        );
      });

      it('should handle malformed query responses', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        const malformedResponse = {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: jest.fn().mockRejectedValue(new Error('Malformed JSON')),
          text: jest.fn().mockResolvedValue('Malformed response'),
        };
        mockFetch.mockResolvedValue(malformedResponse as any);

        await expect(client.queryVectors(queryVector)).rejects.toThrow(
          'Failed to query vectors: Malformed JSON'
        );
      });
    });

    describe('Input Validation', () => {
      it('should handle different vector dimensions', async () => {
        const vectors = [
          mockEmbeddings.dimension1536,
          mockEmbeddings.dimension512,
        ];

        for (const vector of vectors) {
          mockFetch.mockClear();
          mockFetch.mockResolvedValue(
            createMockResponse(mockVectorizeResponses.querySuccess)
          );

          await client.queryVectors(vector);

          const requestBody = JSON.parse(
            mockFetch.mock.calls[0][1]?.body as string
          );
          expect(requestBody.vector).toEqual(vector);
        }
      });

      it('should handle edge case topK values', async () => {
        const queryVector = mockEmbeddings.dimension1536;
        const edgeCases = [0, 1, 1000];

        for (const topK of edgeCases) {
          mockFetch.mockClear();
          mockFetch.mockResolvedValue(
            createMockResponse(mockVectorizeResponses.querySuccess)
          );

          await client.queryVectors(queryVector, topK);

          const requestBody = JSON.parse(
            mockFetch.mock.calls[0][1]?.body as string
          );
          expect(requestBody.topK).toBe(topK);
        }
      });
    });
  });

  describe('deleteVectors', () => {
    describe('Successful Deletions', () => {
      it('should delete vectors by IDs', async () => {
        const idsToDelete = ['vector_1', 'vector_2', 'vector_3'];
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.deleteSuccess)
        );

        const result = await client.deleteVectors(idsToDelete);

        expect(result).toEqual(mockVectorizeResponses.deleteSuccess.result);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.cloudflare.com/client/v4/accounts/test-account-123/vectorize/v2/indexes/test-db-789/delete',
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer test-token-456',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: idsToDelete }),
          }
        );
      });

      it('should handle single vector deletion', async () => {
        const idsToDelete = ['single_vector'];
        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'delete_single_123', count: 1 },
          })
        );

        const result = await client.deleteVectors(idsToDelete);

        expect(result.count).toBe(1);
      });

      it('should handle empty IDs array', async () => {
        const idsToDelete: string[] = [];
        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'delete_empty_123', count: 0 },
          })
        );

        const result = await client.deleteVectors(idsToDelete);

        expect(result.count).toBe(0);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ ids: [] }),
          })
        );
      });

      it('should handle large batch deletions', async () => {
        const idsToDelete = Array.from(
          { length: 100 },
          (_, i) => `vector_${i}`
        );
        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'delete_batch_123', count: 100 },
          })
        );

        const result = await client.deleteVectors(idsToDelete);

        expect(result.count).toBe(100);
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors in deletions', async () => {
        const idsToDelete = ['vector_1'];
        mockFetch.mockResolvedValue(
          createMockErrorResponse(404, 'Vectors not found')
        );

        await expect(client.deleteVectors(idsToDelete)).rejects.toThrow(
          'Failed to delete vectors: Vectorize API error: 404 Error - Vectors not found'
        );
      });

      it('should handle authentication errors in deletions', async () => {
        const idsToDelete = ['vector_1'];
        mockFetch.mockResolvedValue(
          createMockErrorResponse(401, 'Unauthorized')
        );

        await expect(client.deleteVectors(idsToDelete)).rejects.toThrow(
          'Failed to delete vectors: Vectorize API error: 401 Error - Unauthorized'
        );
      });

      it('should handle network errors in deletions', async () => {
        const idsToDelete = ['vector_1'];
        mockFetch.mockRejectedValue(new Error('Connection lost'));

        await expect(client.deleteVectors(idsToDelete)).rejects.toThrow(
          'Failed to delete vectors: Connection lost'
        );
      });
    });

    describe('Input Validation', () => {
      it('should handle IDs with special characters', async () => {
        const specialIds = [
          'vector-with-dashes',
          'vector_with_underscores',
          'vector.with.dots',
          'vector@with#symbols',
        ];

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.deleteSuccess)
        );

        const result = await client.deleteVectors(specialIds);

        expect(result).toEqual(mockVectorizeResponses.deleteSuccess.result);

        const requestBody = JSON.parse(
          mockFetch.mock.calls[0][1]?.body as string
        );
        expect(requestBody.ids).toEqual(specialIds);
      });

      it('should handle very long vector IDs', async () => {
        const longId = 'very_long_vector_id_' + 'x'.repeat(1000);
        const idsToDelete = [longId];

        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.deleteSuccess)
        );

        await client.deleteVectors(idsToDelete);

        const requestBody = JSON.parse(
          mockFetch.mock.calls[0][1]?.body as string
        );
        expect(requestBody.ids).toEqual([longId]);
      });
    });
  });

  describe('getDatabaseInfo', () => {
    describe('Successful Info Retrieval', () => {
      it('should get database information', async () => {
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.databaseInfo)
        );

        const result = await client.getDatabaseInfo();

        expect(result).toEqual(mockVectorizeResponses.databaseInfo.result);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.cloudflare.com/client/v4/accounts/test-account-123/vectorize/v2/indexes/test-db-789',
          {
            method: 'GET',
            headers: {
              Authorization: 'Bearer test-token-456',
              'Content-Type': 'application/json',
            },
          }
        );
      });

      it('should return complete database metadata', async () => {
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.databaseInfo)
        );

        const result = await client.getDatabaseInfo();

        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('dimensions');
        expect(result).toHaveProperty('metric');
        expect(result).toHaveProperty('vectors');
        expect(result.vectors).toHaveProperty('count');

        expect(typeof result.name).toBe('string');
        expect(typeof result.dimensions).toBe('number');
        expect(typeof result.metric).toBe('string');
        expect(typeof result.vectors.count).toBe('number');
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors in database info retrieval', async () => {
        mockFetch.mockResolvedValue(
          createMockErrorResponse(404, 'Database not found')
        );

        await expect(client.getDatabaseInfo()).rejects.toThrow(
          'Failed to get database info: Vectorize API error: 404 Error - Database not found'
        );
      });

      it('should handle authentication errors', async () => {
        mockFetch.mockResolvedValue(
          createMockErrorResponse(401, 'Unauthorized')
        );

        await expect(client.getDatabaseInfo()).rejects.toThrow(
          'Failed to get database info: Vectorize API error: 401 Error - Unauthorized'
        );
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network timeout'));

        await expect(client.getDatabaseInfo()).rejects.toThrow(
          'Failed to get database info: Network timeout'
        );
      });
    });
  });

  describe('testConnection', () => {
    describe('Successful Connection Tests', () => {
      it('should return true for successful connection', async () => {
        mockFetch.mockResolvedValue(
          createMockResponse(mockVectorizeResponses.databaseInfo)
        );

        const result = await client.testConnection();

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Failed Connection Tests', () => {
      it('should return false for failed connection', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockFetch.mockResolvedValue(
          createMockErrorResponse(401, 'Unauthorized')
        );

        const result = await client.testConnection();

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Vectorize connection test failed:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should return false for network errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockFetch.mockRejectedValue(new Error('Network connection failed'));

        const result = await client.testConnection();

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle timeout gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        mockFetch.mockRejectedValue(new Error('Request timeout'));

        const result = await client.testConnection();

        expect(result).toBe(false);

        consoleSpy.mockRestore();
      });
    });
  });

  describe('createVectorizeClient Factory Function', () => {
    describe('Valid Configuration', () => {
      it('should create client with complete configuration', () => {
        const config = mockConfigurations.complete.vectorize;
        const client = createVectorizeClient(config);

        expect(client).toBeInstanceOf(VectorizeClient);
      });

      it('should create client with minimal valid configuration', () => {
        const minimalConfig = {
          accountId: 'test-account',
          apiToken: 'test-token',
          databaseId: 'test-db',
        };

        const client = createVectorizeClient(minimalConfig);

        expect(client).toBeInstanceOf(VectorizeClient);
      });
    });

    describe('Invalid Configuration', () => {
      it('should return null for missing configuration', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config = mockConfigurations.missingVectorize.vectorize;

        const client = createVectorizeClient(config);

        expect(client).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Vectorize configuration incomplete - vector operations will be disabled'
        );

        consoleSpy.mockRestore();
      });

      it('should return null for empty configuration', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const emptyConfig = {};

        const client = createVectorizeClient(emptyConfig as any);

        expect(client).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should return null for partially empty configuration', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const partialConfig = {
          accountId: 'test-account',
          apiToken: '', // Empty
          databaseId: 'test-db',
        };

        const client = createVectorizeClient(partialConfig);

        expect(client).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Integration Scenarios', () => {
    describe('Complete Vector Lifecycle', () => {
      it('should handle insert, query, and delete operations', async () => {
        // Setup responses for each operation
        mockFetch
          .mockResolvedValueOnce(
            createMockResponse(mockVectorizeResponses.insertSuccess)
          )
          .mockResolvedValueOnce(
            createMockResponse(mockVectorizeResponses.querySuccess)
          )
          .mockResolvedValueOnce(
            createMockResponse(mockVectorizeResponses.deleteSuccess)
          );

        // 1. Insert vectors
        const vectors: VectorizeVector[] = [
          {
            id: 'lifecycle_test_vector',
            values: mockEmbeddings.dimension1536,
            metadata: { source: 'test_document.md' },
          },
        ];

        const insertResult = await client.insertVectors(vectors);
        expect(insertResult).toEqual(
          mockVectorizeResponses.insertSuccess.result
        );

        // 2. Query vectors
        const queryResult = await client.queryVectors(
          mockEmbeddings.dimension1536
        );
        expect(queryResult).toEqual(mockVectorizeResponses.querySuccess.result);

        // 3. Delete vectors
        const deleteResult = await client.deleteVectors([
          'lifecycle_test_vector',
        ]);
        expect(deleteResult).toEqual(
          mockVectorizeResponses.deleteSuccess.result
        );

        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    describe('Error Recovery Scenarios', () => {
      it('should handle partial operation failures gracefully', async () => {
        // Insert succeeds, query fails, delete succeeds
        mockFetch
          .mockResolvedValueOnce(
            createMockResponse(mockVectorizeResponses.insertSuccess)
          )
          .mockResolvedValueOnce(
            createMockErrorResponse(500, 'Internal Server Error')
          )
          .mockResolvedValueOnce(
            createMockResponse(mockVectorizeResponses.deleteSuccess)
          );

        const vectors: VectorizeVector[] = [
          {
            id: 'error_recovery_vector',
            values: mockEmbeddings.dimension1536,
          },
        ];

        // Insert should succeed
        const insertResult = await client.insertVectors(vectors);
        expect(insertResult).toEqual(
          mockVectorizeResponses.insertSuccess.result
        );

        // Query should fail
        await expect(
          client.queryVectors(mockEmbeddings.dimension1536)
        ).rejects.toThrow('Failed to query vectors');

        // Delete should still succeed
        const deleteResult = await client.deleteVectors([
          'error_recovery_vector',
        ]);
        expect(deleteResult).toEqual(
          mockVectorizeResponses.deleteSuccess.result
        );
      });
    });

    describe('Performance and Scalability', () => {
      it('should handle large vector operations efficiently', async () => {
        const largeVectorSet = Array.from({ length: 1000 }, (_, i) => ({
          id: `large_set_vector_${i}`,
          values: mockEmbeddings.dimension1536,
          metadata: { batch: 'large_test', index: i },
        }));

        mockFetch.mockResolvedValue(
          createMockResponse({
            result: { mutationId: 'large_batch_123', count: 1000 },
          })
        );

        const startTime = Date.now();
        const result = await client.insertVectors(largeVectorSet);
        const endTime = Date.now();

        expect(result.count).toBe(1000);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly (mocked)

        // Verify the large payload was sent correctly
        const requestBody = JSON.parse(
          mockFetch.mock.calls[0][1]?.body as string
        );
        expect(requestBody.vectors).toHaveLength(1000);
      });

      it('should maintain consistent API format across operations', async () => {
        const operations = [
          () =>
            client.insertVectors([
              {
                id: 'consistency_test',
                values: mockEmbeddings.dimension1536,
              },
            ]),
          () => client.queryVectors(mockEmbeddings.dimension1536),
          () => client.deleteVectors(['consistency_test']),
          () => client.getDatabaseInfo(),
        ];

        // Mock all operations to succeed
        mockFetch.mockResolvedValue(createMockResponse({ result: {} }));

        for (const operation of operations) {
          mockFetch.mockClear();
          await operation();

          const call = mockFetch.mock.calls[0];
          const [url, options] = call;

          // Verify consistent URL structure
          expect(url).toContain(
            'https://api.cloudflare.com/client/v4/accounts/test-account-123/vectorize/v2/indexes/test-db-789'
          );

          // Verify consistent headers
          expect(options?.headers).toEqual(
            expect.objectContaining({
              Authorization: 'Bearer test-token-456',
              'Content-Type': 'application/json',
            })
          );
        }
      });
    });

    describe('Configuration Edge Cases', () => {
      it('should handle special characters in configuration', () => {
        const specialConfig = {
          accountId: 'account-with-dashes_123',
          apiToken: 'token-with-special@chars#456',
          databaseId: 'db.with.dots_789',
        };

        const client = new VectorizeClient(specialConfig);
        expect(client).toBeInstanceOf(VectorizeClient);
      });

      it('should handle very long configuration values', () => {
        const longConfig = {
          accountId: 'a'.repeat(100),
          apiToken: 'b'.repeat(200),
          databaseId: 'c'.repeat(150),
        };

        const client = new VectorizeClient(longConfig);
        expect(client).toBeInstanceOf(VectorizeClient);
      });
    });
  });
});
