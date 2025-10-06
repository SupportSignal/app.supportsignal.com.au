// @ts-nocheck
/**
 * ⚠️ PROOF OF CONCEPT - Knowledge System Tests
 *
 * STATUS: POC tests for experimental RAG knowledge ingestion feature
 * - Tests reference removed schema tables (source_documents, document_chunks)
 * - May fail due to schema mismatches - skip if needed
 * - Demonstrates testing patterns for document queries and chunking
 *
 * DO NOT REMOVE: Valuable test patterns for future RAG feature implementation
 *
 * Comprehensive tests for knowledge.ts - Query functions
 * Tests: getDocumentByPathHandler, getDocumentsHandler, getDocumentChunksHandler, getChunkByVectorizeIdHandler
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockDocuments, mockChunks } from '@convex-tests/fixtures/testData';

// Mock Convex modules at top level before imports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockServer = require('@convex-tests/__mocks__/_generated/server');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockApi = require('@convex-tests/__mocks__/_generated/api');

const { createMockCtx } = require('@convex-tests/__mocks__/_generated/server');

// Import the handler functions to test
import {
  getDocumentByPathHandler,
  getDocumentsHandler,
  getDocumentChunksHandler,
  getChunkByVectorizeIdHandler,
} from '@convex/knowledge';

describe('Knowledge Query Functions', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockCtx();
    if (global.jest) {
      global.jest.clearAllMocks();
    }
  });

  describe('getDocumentByPathHandler', () => {
    it('should return document when found by file path', async () => {
      // Setup mock data
      const expectedDoc = mockDocuments.simple;
      mockCtx.db._setMockData('source_documents_first', expectedDoc);

      // Execute query
      const result = await getDocumentByPathHandler(mockCtx, {
        filePath: 'test-simple.md',
      });

      // Verify results
      expect(result).toEqual(expectedDoc);
      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
    });

    it('should return null when document not found', async () => {
      // Setup: no mock data set (defaults to null)

      // Execute query
      const result = await getDocumentByPathHandler(mockCtx, {
        filePath: 'nonexistent.md',
      });

      // Verify results
      expect(result).toBeNull();
      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
    });

    it('should handle empty file path', async () => {
      // Execute query with empty path
      const result = await getDocumentByPathHandler(mockCtx, { filePath: '' });

      // Should still query (validation happens at Convex level)
      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
      expect(result).toBeNull();
    });

    it('should handle special characters in file path', async () => {
      const specialPath = 'docs/test-file with spaces & symbols.md';
      const expectedDoc = { ...mockDocuments.simple, file_path: specialPath };
      mockCtx.db._setMockData('source_documents_first', expectedDoc);

      const result = await getDocumentByPathHandler(mockCtx, {
        filePath: specialPath,
      });

      expect(result).toEqual(expectedDoc);
      expect(result.file_path).toBe(specialPath);
    });
  });

  describe('getDocumentsHandler', () => {
    beforeEach(() => {
      // Setup multiple documents for pagination testing
      const allDocs = [
        mockDocuments.simple,
        mockDocuments.large,
        mockDocuments.processing,
      ];
      mockCtx.db._setMockData('source_documents_collect', allDocs);
    });

    it('should return documents with default limit', async () => {
      const result = await getDocumentsHandler(mockCtx, {});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10); // Default limit
      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
    });

    it('should return documents with custom limit', async () => {
      const customLimit = 2;
      const result = await getDocumentsHandler(mockCtx, { limit: customLimit });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(customLimit);
      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
    });

    it('should handle limit of 1', async () => {
      const result = await getDocumentsHandler(mockCtx, { limit: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should handle limit of 0', async () => {
      // Mock empty result for limit 0
      mockCtx.db._setMockData('source_documents_collect', []);

      const result = await getDocumentsHandler(mockCtx, { limit: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle large limit values', async () => {
      const largeLimit = 1000;
      const result = await getDocumentsHandler(mockCtx, { limit: largeLimit });

      expect(Array.isArray(result)).toBe(true);
      // Should return all available documents (3 in our test set)
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array when no documents exist', async () => {
      // Clear mock data
      mockCtx.db._setMockData('source_documents_collect', []);

      const result = await getDocumentsHandler(mockCtx, {});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle undefined limit (use default)', async () => {
      const result = await getDocumentsHandler(mockCtx, { limit: undefined });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10); // Should use default limit
    });
  });

  describe('getDocumentChunksHandler', () => {
    beforeEach(() => {
      // Setup chunks for specific source document
      mockCtx.db._setMockData('document_chunks_collect', mockChunks);
    });

    it('should return chunks for existing document', async () => {
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');

      // Verify all chunks belong to the requested document
      result.forEach((chunk: any) => {
        expect(chunk.source_document).toBe('test-simple.md');
      });
    });

    it('should return chunks with custom limit', async () => {
      const customLimit = 2;
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
        limit: customLimit,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(customLimit);
    });

    it('should return empty array for nonexistent document', async () => {
      // Clear mock data for this test
      mockCtx.db._setMockData('document_chunks_collect', []);

      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'nonexistent.md',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle default limit when not specified', async () => {
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(50); // Default limit
    });

    it('should handle limit of 1', async () => {
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
        limit: 1,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should verify chunk structure', async () => {
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
      });

      if (result.length > 0) {
        const chunk = result[0];
        expect(chunk).toHaveProperty('_id');
        expect(chunk).toHaveProperty('source_document');
        expect(chunk).toHaveProperty('chunk_index');
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('chunk_hash');
        expect(chunk).toHaveProperty('vectorize_id');
        expect(chunk).toHaveProperty('metadata');
        expect(chunk).toHaveProperty('created_at');
        expect(chunk).toHaveProperty('correlation_id');
      }
    });

    it('should handle chunks ordered by index', async () => {
      const result = await getDocumentChunksHandler(mockCtx, {
        sourceDocument: 'test-simple.md',
      });

      // Verify chunks are in order (mocked data should be ordered)
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i].chunk_index).toBeGreaterThanOrEqual(
            result[i - 1].chunk_index
          );
        }
      }
    });
  });

  describe('getChunkByVectorizeIdHandler', () => {
    beforeEach(() => {
      // Setup single chunk for vectorize ID queries
      const targetChunk = mockChunks[0];
      mockCtx.db._setMockData('document_chunks_first', targetChunk);
    });

    it('should return chunk when found by vectorize ID', async () => {
      const vectorizeId = 'hash123456789abc_c0';
      const expectedChunk = mockChunks[0];

      const result = await getChunkByVectorizeIdHandler(mockCtx, {
        vectorizeId,
      });

      expect(result).toEqual(expectedChunk);
      expect(result.vectorize_id).toBe(vectorizeId);
      expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
    });

    it('should return null when chunk not found', async () => {
      // Clear mock data
      mockCtx.db._setMockData('document_chunks_first', null);

      const result = await getChunkByVectorizeIdHandler(mockCtx, {
        vectorizeId: 'nonexistent_vectorize_id',
      });

      expect(result).toBeNull();
      expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
    });

    it('should handle empty vectorize ID', async () => {
      await getChunkByVectorizeIdHandler(mockCtx, {
        vectorizeId: '',
      });

      // Should still query (validation happens at Convex level)
      expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
    });

    it('should handle vectorize ID format validation', async () => {
      const validFormats = [
        'hash123456789abc_c0',
        'hash456789abcdef_c15',
        'hash789abcdef123_c999',
      ];

      for (const vectorizeId of validFormats) {
        await getChunkByVectorizeIdHandler(mockCtx, { vectorizeId });
        expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
      }
    });

    it('should verify returned chunk structure', async () => {
      const vectorizeId = 'hash123456789abc_c0';
      const result = await getChunkByVectorizeIdHandler(mockCtx, {
        vectorizeId,
      });

      if (result) {
        expect(result).toHaveProperty('_id');
        expect(result).toHaveProperty('source_document');
        expect(result).toHaveProperty('chunk_index');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('vectorize_id');
        expect(result.vectorize_id).toBe(vectorizeId);
        expect(typeof result.chunk_index).toBe('number');
        expect(typeof result.content).toBe('string');
      }
    });

    it('should handle special characters in vectorize ID', async () => {
      const specialVectorizeId = 'hash-with-dashes_c0';
      const specialChunk = {
        ...mockChunks[0],
        vectorize_id: specialVectorizeId,
      };
      mockCtx.db._setMockData('document_chunks_first', specialChunk);

      const result = await getChunkByVectorizeIdHandler(mockCtx, {
        vectorizeId: specialVectorizeId,
      });

      expect(result).toEqual(specialChunk);
      expect(result.vectorize_id).toBe(specialVectorizeId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      mockCtx.db.query.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // All functions should propagate the error
      await expect(
        getDocumentByPathHandler(mockCtx, { filePath: 'test.md' })
      ).rejects.toThrow('Database connection failed');

      await expect(getDocumentsHandler(mockCtx, {})).rejects.toThrow(
        'Database connection failed'
      );

      await expect(
        getDocumentChunksHandler(mockCtx, { sourceDocument: 'test.md' })
      ).rejects.toThrow('Database connection failed');

      await expect(
        getChunkByVectorizeIdHandler(mockCtx, { vectorizeId: 'test_id' })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed context object', async () => {
      const malformedCtx = { db: null };

      await expect(
        getDocumentByPathHandler(malformedCtx as any, { filePath: 'test.md' })
      ).rejects.toThrow();
    });

    it('should handle very long file paths', async () => {
      const longPath = 'very/long/path/'.repeat(100) + 'document.md';

      // Should not throw, even with very long paths
      const result = await getDocumentByPathHandler(mockCtx, {
        filePath: longPath,
      });

      expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
      expect(result).toBeNull(); // No mock data set for this path
    });

    it('should handle Unicode characters in file paths', async () => {
      const unicodePath = 'docs/测试文档-français-🚀.md';
      const unicodeDoc = { ...mockDocuments.simple, file_path: unicodePath };
      mockCtx.db._setMockData('source_documents_first', unicodeDoc);

      const result = await getDocumentByPathHandler(mockCtx, {
        filePath: unicodePath,
      });

      expect(result).toEqual(unicodeDoc);
      expect(result.file_path).toBe(unicodePath);
    });
  });
});
