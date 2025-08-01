import { v } from 'convex/values';
import { query, QueryCtx } from './_generated/server';

/**
 * Handler function for getting document by file path
 */
export async function getDocumentByPathHandler(
  ctx: QueryCtx,
  args: { filePath: string }
) {
  return await ctx.db
    .query('source_documents')
    .withIndex('by_file_path', q => q.eq('file_path', args.filePath))
    .first();
}

/**
 * Query to get document by file path
 */
export const getDocumentByPath = query({
  args: { filePath: v.string() },
  handler: getDocumentByPathHandler,
});

/**
 * Handler function for getting all documents with pagination
 */
export async function getDocumentsHandler(
  ctx: QueryCtx,
  args: { limit?: number }
) {
  const limit = args.limit || 10;

  return await ctx.db.query('source_documents').order('desc').take(limit);
}

/**
 * Query to get all documents with pagination
 */
export const getDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: getDocumentsHandler,
});

/**
 * Handler function for getting document chunks by source document
 */
export async function getDocumentChunksHandler(
  ctx: QueryCtx,
  args: { sourceDocument: string; limit?: number }
) {
  const limit = args.limit || 50;

  return await ctx.db
    .query('document_chunks')
    .withIndex('by_source_document', q =>
      q.eq('source_document', args.sourceDocument)
    )
    .order('asc')
    .take(limit);
}

/**
 * Query to get document chunks by source document
 */
export const getDocumentChunks = query({
  args: {
    sourceDocument: v.string(),
    limit: v.optional(v.number()),
  },
  handler: getDocumentChunksHandler,
});

/**
 * Handler function for getting document chunk by vectorize ID
 */
export async function getChunkByVectorizeIdHandler(
  ctx: QueryCtx,
  args: { vectorizeId: string }
) {
  return await ctx.db
    .query('document_chunks')
    .withIndex('by_vectorize_id', q => q.eq('vectorize_id', args.vectorizeId))
    .first();
}

/**
 * Query to get document chunk by vectorize ID
 */
export const getChunkByVectorizeId = query({
  args: { vectorizeId: v.string() },
  handler: getChunkByVectorizeIdHandler,
});
