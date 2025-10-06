// @ts-nocheck
/**
 * ⚠️ PROOF OF CONCEPT - Knowledge Mutations Tests
 *
 * STATUS: POC tests for experimental RAG knowledge ingestion mutations
 * - Tests reference removed schema tables (source_documents, document_chunks)
 * - May fail due to schema mismatches - skip if needed
 * - Demonstrates testing patterns for document CRUD and chunk management
 *
 * DO NOT REMOVE: Valuable test patterns for future RAG feature implementation
 *
 * Comprehensive tests for knowledgeMutations.ts
 * Tests: CRUD operations, ID generation, document management, chunk management
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockDocuments, mockChunks } from './fixtures/testData';

// Mock Convex modules
jest.mock('@convex/_generated/server');
jest.mock('@convex/_generated/api');

const { createMockCtx } = require('./__mocks__/_generated/server');

// Import functions to test
import {
  createOrUpdateDocument,
  createDocumentChunk,
  updateDocumentStatus,
  deleteDocument,
  deleteChunksBySource,
  getDocumentByPath,
} from '@convex/knowledgeMutations';

describe('Knowledge Mutations', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockCtx();
    jest.clearAllMocks();
  });

  describe('createOrUpdateDocument', () => {
    const validArgs = {
      filePath: 'test-document.md',
      fileType: 'markdown',
      contentHash: 'hash123456789abcdef',
      correlationId: '12345678-1234-4000-8000-123456789abc',
    };

    describe('Document Creation', () => {
      it('should create new document when none exists', async () => {
        // No existing document found
        mockCtx.db._setMockData('source_documents_first', null);

        const result = await createOrUpdateDocument(mockCtx, validArgs);

        expect(typeof result).toBe('string');
        expect(result).toMatch(/^source_documents_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('source_documents', {
          file_path: validArgs.filePath,
          file_type: validArgs.fileType,
          content_hash: validArgs.contentHash,
          last_processed: expect.any(Number),
          chunk_count: 0,
          processing_status: 'processing',
          correlation_id: validArgs.correlationId,
        });
      });

      it('should set initial processing status to processing', async () => {
        mockCtx.db._setMockData('source_documents_first', null);

        await createOrUpdateDocument(mockCtx, validArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].processing_status).toBe('processing');
        expect(insertCall[1].chunk_count).toBe(0);
      });

      it('should set current timestamp for last_processed', async () => {
        mockCtx.db._setMockData('source_documents_first', null);
        const beforeTime = Date.now();

        await createOrUpdateDocument(mockCtx, validArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        const afterTime = Date.now();
        expect(insertCall[1].last_processed).toBeGreaterThanOrEqual(beforeTime);
        expect(insertCall[1].last_processed).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('Document Updates', () => {
      it('should update existing document with same content hash', async () => {
        const existingDoc = {
          ...mockDocuments.simple,
          content_hash: validArgs.contentHash, // Same hash
        };
        mockCtx.db._setMockData('source_documents_first', existingDoc);

        const result = await createOrUpdateDocument(mockCtx, validArgs);

        expect(result).toBe(existingDoc._id);
        expect(mockCtx.db.patch).toHaveBeenCalledWith(existingDoc._id, {
          file_type: validArgs.fileType,
          content_hash: validArgs.contentHash,
          last_processed: expect.any(Number),
          processing_status: 'processing',
          correlation_id: validArgs.correlationId,
          chunk_count: 0,
        });
      });

      it('should cleanup old chunks when content hash changes', async () => {
        const existingDoc = {
          ...mockDocuments.simple,
          content_hash: 'old_hash_different', // Different hash
        };
        mockCtx.db._setMockData('source_documents_first', existingDoc);

        // Mock the deleteChunksBySource call
        mockCtx.runMutation.mockResolvedValue([
          'old_vector_id_1',
          'old_vector_id_2',
        ]);

        const result = await createOrUpdateDocument(mockCtx, validArgs);

        expect(result).toBe(existingDoc._id);
        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/deleteChunksBySource',
          {
            sourceDocument: validArgs.filePath,
            correlationId: validArgs.correlationId,
          }
        );
      });

      it('should not cleanup chunks when content hash is unchanged', async () => {
        const existingDoc = {
          ...mockDocuments.simple,
          content_hash: validArgs.contentHash, // Same hash
        };
        mockCtx.db._setMockData('source_documents_first', existingDoc);

        await createOrUpdateDocument(mockCtx, validArgs);

        expect(mockCtx.runMutation).not.toHaveBeenCalled();
      });

      it('should reset chunk count when updating document', async () => {
        const existingDoc = {
          ...mockDocuments.simple,
          chunk_count: 15, // Had chunks before
        };
        mockCtx.db._setMockData('source_documents_first', existingDoc);

        await createOrUpdateDocument(mockCtx, validArgs);

        const patchCall = mockCtx.db.patch.mock.calls[0];
        expect(patchCall[1].chunk_count).toBe(0);
      });
    });

    describe('Input Validation and Edge Cases', () => {
      it('should handle special characters in file path', async () => {
        const specialArgs = {
          ...validArgs,
          filePath: 'docs/test file with spaces & symbols!.md',
        };

        mockCtx.db._setMockData('source_documents_first', null);

        await createOrUpdateDocument(mockCtx, specialArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].file_path).toBe(specialArgs.filePath);
      });

      it('should handle Unicode characters in file path', async () => {
        const unicodeArgs = {
          ...validArgs,
          filePath: 'docs/测试文档-français-🚀.md',
        };

        mockCtx.db._setMockData('source_documents_first', null);

        await createOrUpdateDocument(mockCtx, unicodeArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].file_path).toBe(unicodeArgs.filePath);
      });

      it('should handle very long file paths', async () => {
        const longPath = 'very/long/path/'.repeat(50) + 'document.md';
        const longArgs = { ...validArgs, filePath: longPath };

        mockCtx.db._setMockData('source_documents_first', null);

        await createOrUpdateDocument(mockCtx, longArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].file_path).toBe(longPath);
      });

      it('should handle different file types', async () => {
        const fileTypes = [
          'typescript',
          'javascript',
          'python',
          'json',
          'yaml',
        ];

        for (const fileType of fileTypes) {
          mockCtx.db.insert.mockClear();
          mockCtx.db._setMockData('source_documents_first', null);

          await createOrUpdateDocument(mockCtx, { ...validArgs, fileType });

          const insertCall = mockCtx.db.insert.mock.calls[0];
          expect(insertCall[1].file_type).toBe(fileType);
        }
      });

      it('should handle very long content hashes', async () => {
        const longHash = 'a'.repeat(1000);
        const hashArgs = { ...validArgs, contentHash: longHash };

        mockCtx.db._setMockData('source_documents_first', null);

        await createOrUpdateDocument(mockCtx, hashArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].content_hash).toBe(longHash);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        mockCtx.db.query.mockImplementation(() => {
          throw new Error('Database connection failed');
        });

        await expect(
          createOrUpdateDocument(mockCtx, validArgs)
        ).rejects.toThrow('Database connection failed');
      });

      it('should handle insert failures', async () => {
        mockCtx.db._setMockData('source_documents_first', null);
        mockCtx.db.insert.mockImplementation(() => {
          throw new Error('Insert failed');
        });

        await expect(
          createOrUpdateDocument(mockCtx, validArgs)
        ).rejects.toThrow('Insert failed');
      });

      it('should handle patch failures', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.db.patch.mockImplementation(() => {
          throw new Error('Patch failed');
        });

        await expect(
          createOrUpdateDocument(mockCtx, validArgs)
        ).rejects.toThrow('Patch failed');
      });
    });
  });

  describe('createDocumentChunk', () => {
    const validChunkArgs = {
      sourceDocument: 'test-document.md',
      chunkIndex: 0,
      content: 'This is test chunk content for validation purposes.',
      chunkHash: 'chunk_hash_123456',
      vectorizeId: 'hash123456789abc_c0',
      metadata: {
        file_path: 'test-document.md',
        file_type: 'markdown',
        modified_at: 1703123456789,
        chunk_size: 52,
      },
      correlationId: '12345678-1234-4000-8000-123456789abc',
    };

    describe('Successful Chunk Creation', () => {
      it('should create document chunk with all required fields', async () => {
        const result = await createDocumentChunk(mockCtx, validChunkArgs);

        expect(typeof result).toBe('string');
        expect(result).toMatch(/^document_chunks_\d+$/);
        expect(mockCtx.db.insert).toHaveBeenCalledWith('document_chunks', {
          source_document: validChunkArgs.sourceDocument,
          chunk_index: validChunkArgs.chunkIndex,
          content: validChunkArgs.content,
          chunk_hash: validChunkArgs.chunkHash,
          vectorize_id: validChunkArgs.vectorizeId,
          metadata: validChunkArgs.metadata,
          created_at: expect.any(Number),
          correlation_id: validChunkArgs.correlationId,
        });
      });

      it('should set current timestamp for created_at', async () => {
        const beforeTime = Date.now();

        await createDocumentChunk(mockCtx, validChunkArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        const afterTime = Date.now();
        expect(insertCall[1].created_at).toBeGreaterThanOrEqual(beforeTime);
        expect(insertCall[1].created_at).toBeLessThanOrEqual(afterTime);
      });

      it('should handle multiple chunks with different indices', async () => {
        const chunkIndices = [0, 1, 5, 10, 999];

        for (const index of chunkIndices) {
          mockCtx.db.insert.mockClear();

          const args = {
            ...validChunkArgs,
            chunkIndex: index,
            vectorizeId: `hash123456789abc_c${index}`,
          };

          await createDocumentChunk(mockCtx, args);

          const insertCall = mockCtx.db.insert.mock.calls[0];
          expect(insertCall[1].chunk_index).toBe(index);
          expect(insertCall[1].vectorize_id).toBe(`hash123456789abc_c${index}`);
        }
      });

      it('should handle large chunk content', async () => {
        const largeContent = 'Large chunk content. '.repeat(1000);
        const largeArgs = {
          ...validChunkArgs,
          content: largeContent,
          metadata: {
            ...validChunkArgs.metadata,
            chunk_size: largeContent.length,
          },
        };

        await createDocumentChunk(mockCtx, largeArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].content).toBe(largeContent);
        expect(insertCall[1].metadata.chunk_size).toBe(largeContent.length);
      });
    });

    describe('Metadata Handling', () => {
      it('should preserve complex metadata structures', async () => {
        const complexMetadata = {
          file_path: 'complex/path/document.md',
          file_type: 'markdown',
          modified_at: 1703123456789,
          chunk_size: 250,
          custom_field: 'custom_value',
          nested_data: {
            author: 'test_author',
            version: '1.0.0',
          },
        };

        const complexArgs = {
          ...validChunkArgs,
          metadata: complexMetadata,
        };

        await createDocumentChunk(mockCtx, complexArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].metadata).toEqual(complexMetadata);
      });

      it('should handle metadata with special characters', async () => {
        const specialMetadata = {
          file_path: 'docs/file with spaces & symbols!.md',
          file_type: 'markdown-extended',
          modified_at: 1703123456789,
          chunk_size: 52,
          special_notes: 'Contains @#$%^&*() characters',
        };

        const specialArgs = {
          ...validChunkArgs,
          metadata: specialMetadata,
        };

        await createDocumentChunk(mockCtx, specialArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].metadata).toEqual(specialMetadata);
      });
    });

    describe('Input Validation and Edge Cases', () => {
      it('should handle empty chunk content', async () => {
        const emptyArgs = {
          ...validChunkArgs,
          content: '',
          metadata: {
            ...validChunkArgs.metadata,
            chunk_size: 0,
          },
        };

        await createDocumentChunk(mockCtx, emptyArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].content).toBe('');
        expect(insertCall[1].metadata.chunk_size).toBe(0);
      });

      it('should handle Unicode content', async () => {
        const unicodeContent = 'Unicode content: 世界 🌍 café naïve résumé';
        const unicodeArgs = {
          ...validChunkArgs,
          content: unicodeContent,
          metadata: {
            ...validChunkArgs.metadata,
            chunk_size: unicodeContent.length,
          },
        };

        await createDocumentChunk(mockCtx, unicodeArgs);

        const insertCall = mockCtx.db.insert.mock.calls[0];
        expect(insertCall[1].content).toBe(unicodeContent);
      });

      it('should handle special vectorize ID formats', async () => {
        const specialIds = [
          'hash123_c0',
          'very-long-hash-with-dashes_c999',
          'hash.with.dots_c15',
          'hash_with_underscores_c7',
        ];

        for (const vectorizeId of specialIds) {
          mockCtx.db.insert.mockClear();

          const args = { ...validChunkArgs, vectorizeId };

          await createDocumentChunk(mockCtx, args);

          const insertCall = mockCtx.db.insert.mock.calls[0];
          expect(insertCall[1].vectorize_id).toBe(vectorizeId);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle database insert failures', async () => {
        mockCtx.db.insert.mockImplementation(() => {
          throw new Error('Insert failed');
        });

        await expect(
          createDocumentChunk(mockCtx, validChunkArgs)
        ).rejects.toThrow('Insert failed');
      });

      it('should handle malformed context', async () => {
        const malformedCtx = { db: null };

        await expect(
          createDocumentChunk(malformedCtx as any, validChunkArgs)
        ).rejects.toThrow();
      });
    });
  });

  describe('updateDocumentStatus', () => {
    const documentId = 'source_documents_123' as any;
    const baseArgs = { documentId };

    describe('Status Updates', () => {
      it('should update document to completed status', async () => {
        const args = {
          ...baseArgs,
          status: 'completed' as const,
          chunkCount: 5,
        };

        await updateDocumentStatus(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(documentId, {
          processing_status: 'completed',
          last_processed: expect.any(Number),
          chunk_count: 5,
        });
      });

      it('should update document to failed status with error', async () => {
        const args = {
          ...baseArgs,
          status: 'failed' as const,
          errorMessage: 'Processing failed due to invalid content',
        };

        await updateDocumentStatus(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(documentId, {
          processing_status: 'failed',
          last_processed: expect.any(Number),
          error_message: 'Processing failed due to invalid content',
        });
      });

      it('should update to processing status', async () => {
        const args = {
          ...baseArgs,
          status: 'processing' as const,
        };

        await updateDocumentStatus(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(documentId, {
          processing_status: 'processing',
          last_processed: expect.any(Number),
        });
      });

      it('should update to pending status', async () => {
        const args = {
          ...baseArgs,
          status: 'pending' as const,
        };

        await updateDocumentStatus(mockCtx, args);

        expect(mockCtx.db.patch).toHaveBeenCalledWith(documentId, {
          processing_status: 'pending',
          last_processed: expect.any(Number),
        });
      });
    });

    describe('Optional Fields', () => {
      it('should include chunk count when provided', async () => {
        const args = {
          ...baseArgs,
          status: 'completed' as const,
          chunkCount: 10,
        };

        await updateDocumentStatus(mockCtx, args);

        const patchCall = mockCtx.db.patch.mock.calls[0];
        expect(patchCall[1].chunk_count).toBe(10);
      });

      it('should not include chunk count when not provided', async () => {
        const args = {
          ...baseArgs,
          status: 'processing' as const,
        };

        await updateDocumentStatus(mockCtx, args);

        const patchCall = mockCtx.db.patch.mock.calls[0];
        expect(patchCall[1]).not.toHaveProperty('chunk_count');
      });

      it('should include error message when provided', async () => {
        const errorMessage = 'Detailed error description';
        const args = {
          ...baseArgs,
          status: 'failed' as const,
          errorMessage,
        };

        await updateDocumentStatus(mockCtx, args);

        const patchCall = mockCtx.db.patch.mock.calls[0];
        expect(patchCall[1].error_message).toBe(errorMessage);
      });

      it('should not include error message when not provided', async () => {
        const args = {
          ...baseArgs,
          status: 'completed' as const,
        };

        await updateDocumentStatus(mockCtx, args);

        const patchCall = mockCtx.db.patch.mock.calls[0];
        expect(patchCall[1]).not.toHaveProperty('error_message');
      });
    });

    describe('Timestamp Handling', () => {
      it('should update last_processed timestamp', async () => {
        const beforeTime = Date.now();

        await updateDocumentStatus(mockCtx, {
          ...baseArgs,
          status: 'completed' as const,
        });

        const patchCall = mockCtx.db.patch.mock.calls[0];
        const afterTime = Date.now();
        expect(patchCall[1].last_processed).toBeGreaterThanOrEqual(beforeTime);
        expect(patchCall[1].last_processed).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('Error Handling', () => {
      it('should handle database patch failures', async () => {
        mockCtx.db.patch.mockImplementation(() => {
          throw new Error('Patch failed');
        });

        await expect(
          updateDocumentStatus(mockCtx, {
            ...baseArgs,
            status: 'completed' as const,
          })
        ).rejects.toThrow('Patch failed');
      });

      it('should handle invalid document IDs', async () => {
        mockCtx.db.patch.mockImplementation(() => {
          throw new Error('Document not found');
        });

        await expect(
          updateDocumentStatus(mockCtx, {
            documentId: 'invalid_id' as any,
            status: 'completed' as const,
          })
        ).rejects.toThrow('Document not found');
      });
    });
  });

  describe('deleteChunksBySource', () => {
    const validArgs = {
      sourceDocument: 'test-document.md',
      correlationId: '12345678-1234-4000-8000-123456789abc',
    };

    beforeEach(() => {
      // Setup mock chunks for deletion
      mockCtx.db._setMockData('document_chunks_collect', mockChunks);
    });

    describe('Successful Chunk Deletion', () => {
      it('should delete all chunks for source document', async () => {
        const result = await deleteChunksBySource(mockCtx, validArgs);

        expect(Array.isArray(result)).toBe(true);
        expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
        expect(mockCtx.db.delete).toHaveBeenCalledTimes(mockChunks.length);

        // Verify each chunk was deleted
        mockChunks.forEach(chunk => {
          expect(mockCtx.db.delete).toHaveBeenCalledWith(chunk._id);
        });
      });

      it('should return vectorize IDs for external cleanup', async () => {
        const result = await deleteChunksBySource(mockCtx, validArgs);

        const expectedVectorizeIds = mockChunks
          .map(chunk => chunk.vectorize_id)
          .filter(id => id && id !== 'placeholder');

        expect(result).toEqual(expectedVectorizeIds);
      });

      it('should filter out placeholder vectorize IDs', async () => {
        const chunksWithPlaceholders = [
          ...mockChunks,
          {
            ...mockChunks[0],
            _id: 'chunk_placeholder',
            vectorize_id: 'placeholder',
          },
          {
            ...mockChunks[0],
            _id: 'chunk_null',
            vectorize_id: null,
          },
        ];

        mockCtx.db._setMockData(
          'document_chunks_collect',
          chunksWithPlaceholders
        );

        const result = await deleteChunksBySource(mockCtx, validArgs);

        // Should not include placeholder or null vectorize_ids
        expect(result).not.toContain('placeholder');
        expect(result).not.toContain(null);
        expect(result.length).toBe(mockChunks.length); // Only valid IDs
      });

      it('should handle empty chunk collections', async () => {
        mockCtx.db._setMockData('document_chunks_collect', []);

        const result = await deleteChunksBySource(mockCtx, validArgs);

        expect(result).toEqual([]);
        expect(mockCtx.db.delete).not.toHaveBeenCalled();
      });

      it('should log deletion count', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await deleteChunksBySource(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          `Deleted ${mockChunks.length} chunks for document: ${validArgs.sourceDocument}`
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Different Source Documents', () => {
      it('should handle different document types', async () => {
        const documentTypes = [
          'document.md',
          'file.tsx',
          'script.py',
          'config.json',
          'style.css',
        ];

        for (const sourceDocument of documentTypes) {
          mockCtx.db.delete.mockClear();

          await deleteChunksBySource(mockCtx, {
            ...validArgs,
            sourceDocument,
          });

          expect(mockCtx.db.query).toHaveBeenCalledWith('document_chunks');
        }
      });

      it('should handle special characters in document names', async () => {
        const specialDocs = [
          'file with spaces.md',
          'document@with#symbols.txt',
          'file-with-dashes_and_underscores.py',
          'unicode_测试文档.md',
        ];

        for (const sourceDocument of specialDocs) {
          mockCtx.db.delete.mockClear();

          const result = await deleteChunksBySource(mockCtx, {
            ...validArgs,
            sourceDocument,
          });

          expect(Array.isArray(result)).toBe(true);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle database query failures', async () => {
        mockCtx.db.query.mockImplementation(() => {
          throw new Error('Query failed');
        });

        await expect(deleteChunksBySource(mockCtx, validArgs)).rejects.toThrow(
          'Query failed'
        );
      });

      it('should handle delete operation failures', async () => {
        mockCtx.db.delete.mockImplementation(() => {
          throw new Error('Delete failed');
        });

        await expect(deleteChunksBySource(mockCtx, validArgs)).rejects.toThrow(
          'Delete failed'
        );
      });

      it('should handle partial deletion failures gracefully', async () => {
        // Mock delete to fail on second call
        mockCtx.db.delete
          .mockResolvedValueOnce(undefined) // First delete succeeds
          .mockImplementation(() => {
            throw new Error('Second delete failed');
          });

        await expect(deleteChunksBySource(mockCtx, validArgs)).rejects.toThrow(
          'Second delete failed'
        );

        // First chunk should have been deleted
        expect(mockCtx.db.delete).toHaveBeenCalledWith(mockChunks[0]._id);
      });
    });
  });

  describe('getDocumentByPath', () => {
    describe('Successful Document Retrieval', () => {
      it('should return document when found', async () => {
        const expectedDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', expectedDoc);

        const result = await getDocumentByPath(mockCtx, {
          filePath: 'test-simple.md',
        });

        expect(result).toEqual(expectedDoc);
        expect(mockCtx.db.query).toHaveBeenCalledWith('source_documents');
      });

      it('should return null when document not found', async () => {
        mockCtx.db._setMockData('source_documents_first', null);

        const result = await getDocumentByPath(mockCtx, {
          filePath: 'nonexistent.md',
        });

        expect(result).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in file paths', async () => {
        const specialPath = 'docs/file with spaces & symbols!.md';
        const expectedDoc = { ...mockDocuments.simple, file_path: specialPath };
        mockCtx.db._setMockData('source_documents_first', expectedDoc);

        const result = await getDocumentByPath(mockCtx, {
          filePath: specialPath,
        });

        expect(result).toEqual(expectedDoc);
      });
    });
  });

  describe('deleteDocument', () => {
    const validArgs = { filePath: 'test-document.md' };

    describe('Successful Document Deletion', () => {
      it('should delete document and return vectorize IDs', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);

        // Mock deleteChunksBySource to return vectorize IDs
        const expectedVectorizeIds = ['vector_1', 'vector_2', 'vector_3'];
        mockCtx.runMutation.mockResolvedValue(expectedVectorizeIds);

        const result = await deleteDocument(mockCtx, validArgs);

        expect(result.deleted).toBe(true);
        expect(result.vectorizeIds).toEqual(expectedVectorizeIds);
        expect(mockCtx.db.delete).toHaveBeenCalledWith(existingDoc._id);
      });

      it('should delete chunks before deleting document', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.runMutation.mockResolvedValue([]);

        await deleteDocument(mockCtx, validArgs);

        expect(mockCtx.runMutation).toHaveBeenCalledWith(
          'internal/knowledgeMutations/deleteChunksBySource',
          {
            sourceDocument: validArgs.filePath,
            correlationId: expect.any(String),
          }
        );
      });

      it('should generate correlation ID for deletion tracking', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.runMutation.mockResolvedValue([]);

        await deleteDocument(mockCtx, validArgs);

        const runMutationCall = mockCtx.runMutation.mock.calls[0];
        expect(runMutationCall[1].correlationId).toMatch(/^\d+-\w+$/);
      });

      it('should log deletion summary', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const existingDoc = mockDocuments.simple;
        const vectorizeIds = ['vector_1', 'vector_2'];

        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.runMutation.mockResolvedValue(vectorizeIds);

        await deleteDocument(mockCtx, validArgs);

        expect(consoleSpy).toHaveBeenCalledWith(
          `Deleted document: ${validArgs.filePath} with ${vectorizeIds.length} vectorize entries`
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Error Handling', () => {
      it('should throw error when document not found', async () => {
        mockCtx.db._setMockData('source_documents_first', null);

        await expect(deleteDocument(mockCtx, validArgs)).rejects.toThrow(
          `Document not found: ${validArgs.filePath}`
        );
      });

      it('should handle chunk deletion failures', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.runMutation.mockRejectedValue(
          new Error('Chunk deletion failed')
        );

        await expect(deleteDocument(mockCtx, validArgs)).rejects.toThrow(
          'Chunk deletion failed'
        );
      });

      it('should handle document deletion failures', async () => {
        const existingDoc = mockDocuments.simple;
        mockCtx.db._setMockData('source_documents_first', existingDoc);
        mockCtx.runMutation.mockResolvedValue([]);
        mockCtx.db.delete.mockImplementation(() => {
          throw new Error('Document deletion failed');
        });

        await expect(deleteDocument(mockCtx, validArgs)).rejects.toThrow(
          'Document deletion failed'
        );
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Complete Document Lifecycle', () => {
      it('should handle create, update, and delete operations', async () => {
        const filePath = 'lifecycle-test.md';
        const correlationId = '12345678-1234-4000-8000-123456789abc';

        // 1. Create document
        mockCtx.db._setMockData('source_documents_first', null);
        const documentId = await createOrUpdateDocument(mockCtx, {
          filePath,
          fileType: 'markdown',
          contentHash: 'hash123',
          correlationId,
        });

        expect(typeof documentId).toBe('string');

        // 2. Create chunks
        for (let i = 0; i < 3; i++) {
          await createDocumentChunk(mockCtx, {
            sourceDocument: filePath,
            chunkIndex: i,
            content: `Chunk ${i} content`,
            chunkHash: `chunk_hash_${i}`,
            vectorizeId: `hash123_c${i}`,
            metadata: {
              file_path: filePath,
              file_type: 'markdown',
              modified_at: Date.now(),
              chunk_size: 15,
            },
            correlationId,
          });
        }

        // 3. Update document status
        await updateDocumentStatus(mockCtx, {
          documentId: documentId as any,
          status: 'completed',
          chunkCount: 3,
        });

        // 4. Delete document
        const mockDoc = { _id: documentId, file_path: filePath };
        mockCtx.db._setMockData('source_documents_first', mockDoc);
        mockCtx.runMutation.mockResolvedValue([
          'hash123_c0',
          'hash123_c1',
          'hash123_c2',
        ]);

        const deleteResult = await deleteDocument(mockCtx, { filePath });

        expect(deleteResult.deleted).toBe(true);
        expect(deleteResult.vectorizeIds).toHaveLength(3);
      });
    });

    describe('Error Recovery Scenarios', () => {
      it('should handle partial operation failures gracefully', async () => {
        const filePath = 'error-test.md';
        const correlationId = '12345678-1234-4000-8000-123456789abc';

        // Document creation succeeds
        mockCtx.db._setMockData('source_documents_first', null);
        const documentId = await createOrUpdateDocument(mockCtx, {
          filePath,
          fileType: 'markdown',
          contentHash: 'hash123',
          correlationId,
        });

        expect(typeof documentId).toBe('string');

        // Chunk creation fails
        mockCtx.db.insert.mockImplementationOnce(() => {
          throw new Error('Chunk creation failed');
        });

        await expect(
          createDocumentChunk(mockCtx, {
            sourceDocument: filePath,
            chunkIndex: 0,
            content: 'Test content',
            chunkHash: 'chunk_hash_0',
            vectorizeId: 'hash123_c0',
            metadata: {
              file_path: filePath,
              file_type: 'markdown',
              modified_at: Date.now(),
              chunk_size: 12,
            },
            correlationId,
          })
        ).rejects.toThrow('Chunk creation failed');

        // Status update should still work
        await updateDocumentStatus(mockCtx, {
          documentId: documentId as any,
          status: 'failed',
          errorMessage: 'Chunk creation failed',
        });

        expect(mockCtx.db.patch).toHaveBeenCalledWith(
          documentId,
          expect.objectContaining({
            processing_status: 'failed',
            error_message: 'Chunk creation failed',
          })
        );
      });
    });
  });
});
