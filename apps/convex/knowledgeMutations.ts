// @ts-nocheck
import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';

/**
 * ⚠️ PROOF OF CONCEPT - Knowledge Ingestion Mutations
 *
 * This file contains POC mutations for RAG knowledge base management.
 *
 * TABLES USED (currently removed from schema):
 * - source_documents: Document storage and metadata
 * - document_chunks: Chunked content with vector embeddings
 *
 * STATUS: Experimental - Not production ready
 * - @ts-nocheck required due to removed schema tables
 * - Demonstrates document upload, chunking, and vectorization workflows
 * - Tests may fail - skip if needed
 *
 * KEY PATTERNS:
 * - Document ingestion with file type detection
 * - Automatic chunking for vector search
 * - Vectorize integration for semantic search
 *
 * DO NOT REMOVE: Contains valuable implementation patterns for future RAG features
 */

/**
 * Simple unique ID generation for V8 runtime (without crypto dependency)
 */
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Internal mutation to delete all chunks for a source document
 */
export const deleteChunksBySource = internalMutation({
  args: {
    sourceDocument: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all chunks for this source document
    const chunks = await ctx.db
      .query('document_chunks')
      .withIndex('by_source_document', (q) => q.eq('source_document', args.sourceDocument))
      .collect();

    // Delete each chunk (and return vectorize_ids for external cleanup)
    const vectorizeIds: string[] = [];
    for (const chunk of chunks) {
      if (chunk.vectorize_id && chunk.vectorize_id !== 'placeholder') {
        vectorizeIds.push(chunk.vectorize_id);
      }
      await ctx.db.delete(chunk._id);
    }

    console.log(`Deleted ${chunks.length} chunks for document: ${args.sourceDocument}`);
    return vectorizeIds; // Return for Vectorize cleanup
  },
});

/**
 * Internal mutation to create or update source document record
 */
export const createOrUpdateDocument = internalMutation({
  args: {
    filePath: v.string(),
    fileType: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('source_documents')
      .withIndex('by_file_path', (q) => q.eq('file_path', args.filePath))
      .first();

    if (existing) {
      // If content hash changed, clean up old chunks first
      if (existing.content_hash !== args.contentHash) {
        console.log(`Content changed for ${args.filePath}, cleaning up old chunks`);
        await ctx.runMutation(internal.knowledgeMutations.deleteChunksBySource, {
          sourceDocument: args.filePath,
        });
      }

      // Update existing document
      await ctx.db.patch(existing._id, {
        file_type: args.fileType,
        content_hash: args.contentHash,
        last_processed: Date.now(),
        processing_status: 'processing',
        chunk_count: 0, // Reset, will be updated after processing
      });
      return existing._id;
    } else {
      // Create new document
      return await ctx.db.insert('source_documents', {
        file_path: args.filePath,
        file_type: args.fileType,
        content_hash: args.contentHash,
        last_processed: Date.now(),
        chunk_count: 0,
        processing_status: 'processing',
      });
    }
  },
});

/**
 * Internal mutation to create document chunk record
 */
export const createDocumentChunk = internalMutation({
  args: {
    sourceDocument: v.string(),
    chunkIndex: v.number(),
    content: v.string(),
    chunkHash: v.string(),
    vectorizeId: v.string(),
    metadata: v.object({
      file_path: v.string(),
      file_type: v.string(),
      modified_at: v.number(),
      chunk_size: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('document_chunks', {
      source_document: args.sourceDocument,
      chunk_index: args.chunkIndex,
      content: args.content,
      chunk_hash: args.chunkHash,
      vectorize_id: args.vectorizeId,
      metadata: args.metadata,
      created_at: Date.now(),
    });
  },
});

/**
 * Internal mutation to update document processing status
 */
export const updateDocumentStatus = internalMutation({
  args: {
    documentId: v.id('source_documents'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    chunkCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: {
      processing_status: 'pending' | 'processing' | 'completed' | 'failed';
      last_processed: number;
      chunk_count?: number;
      error_message?: string;
    } = {
      processing_status: args.status,
      last_processed: Date.now(),
    };

    if (args.chunkCount !== undefined) {
      updateData.chunk_count = args.chunkCount;
    }

    if (args.errorMessage) {
      updateData.error_message = args.errorMessage;
    }

    await ctx.db.patch(args.documentId, updateData);
  },
});

/**
 * Query to get document by file path
 */
export const getDocumentByPath = query({
  args: { filePath: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('source_documents')
      .withIndex('by_file_path', (q) => q.eq('file_path', args.filePath))
      .first();
  },
});

/**
 * Public mutation to delete a document and all its chunks
 */
export const deleteDocument = mutation({
  args: { filePath: v.string() },
  handler: async (ctx, args): Promise<{ deleted: boolean; vectorizeIds: string[] }> => {
    // Find the document
    const document = await ctx.db
      .query('source_documents')
      .withIndex('by_file_path', (q) => q.eq('file_path', args.filePath))
      .first();

    if (!document) {
      throw new Error(`Document not found: ${args.filePath}`);
    }

    const correlationId = generateSimpleId();

    // Delete all chunks and get vectorize IDs for cleanup
    const vectorizeIds: string[] = await ctx.runMutation(internal.knowledgeMutations.deleteChunksBySource, {
      sourceDocument: args.filePath,
      correlationId,
    });

    // Delete the source document
    await ctx.db.delete(document._id);

    console.log(`Deleted document: ${args.filePath} with ${vectorizeIds.length} vectorize entries`);
    
    return {
      deleted: true,
      vectorizeIds, // For external Vectorize cleanup
    };
  },
});