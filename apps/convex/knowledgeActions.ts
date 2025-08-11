// @ts-nocheck
'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import { ConvexError } from 'convex/values';
import crypto from 'crypto';
import {
  chunkText,
  generateEmbeddingsForChunks,
  DEFAULT_CHUNKING_CONFIG,
  calculateTextStats,
  TextChunk,
} from './lib/textProcessing';
import { getConfig } from './lib/config';
import { createVectorizeClient, VectorizeVector } from './lib/vectorize';

/**
 * Handler function for adding a document with embeddings and vector storage
 */
export async function addDocumentHandler(
  ctx: any,
  args: {
    content: string;
    source: string;
    metadata?: {
      file_path: string;
      file_type: string;
      modified_at: number;
    };
  }
): Promise<{
  documentId: string;
  chunksCreated: number;
  status: string;
}> {
  try {
    // Generate correlation ID for tracing
    const correlationId = crypto.randomUUID();

    // Validate input content
    if (!args.content || args.content.trim().length === 0) {
      throw new ConvexError('Content cannot be empty');
    }

    if (!args.source || args.source.trim().length === 0) {
      throw new ConvexError('Source cannot be empty');
    }

    // Create content hash for deduplication
    const contentHash = crypto
      .createHash('sha256')
      .update(args.content)
      .digest('hex');

    // Check if document already exists and is up to date
    const existingDoc: {
      _id: string;
      content_hash: string;
      chunk_count: number;
    } | null = await ctx.runQuery(api.knowledgeMutations.getDocumentByPath, {
      filePath: args.source,
    });

    if (existingDoc && existingDoc.content_hash === contentHash) {
      // eslint-disable-next-line no-console
      console.log(
        `Document ${args.source} already exists with same content hash`
      );
      return {
        documentId: existingDoc._id,
        chunksCreated: existingDoc.chunk_count,
        status: 'already_exists',
      };
    }

    // Create or update source document record
    const documentId = await ctx.runMutation(
      internal.knowledgeMutations.createOrUpdateDocument,
      {
        filePath: args.source,
        fileType: args.metadata?.file_type || 'unknown',
        contentHash,
        correlationId,
      }
    );

    // Task 2 & 7: Text chunking and embedding generation with environment config
    // eslint-disable-next-line no-console
    console.log(
      `Processing document ${args.source}: ${calculateTextStats(args.content).wordCount} words`
    );

    // Load configuration
    const config = getConfig();

    // Chunk the text for optimal embedding generation
    const textChunks = chunkText(args.content, DEFAULT_CHUNKING_CONFIG);
    // eslint-disable-next-line no-console
    console.log(
      `Created ${textChunks.length} chunks for document ${args.source}`
    );

    // Generate embeddings if OpenAI API key is available
    let chunksWithEmbeddings: Array<{
      chunk: TextChunk;
      embedding: number[] | null;
    }>;

    if (config.llm.openAiApiKey) {
      try {
        // eslint-disable-next-line no-console
        console.log(`Generating embeddings for ${textChunks.length} chunks...`);
        const embeddingResults = await generateEmbeddingsForChunks(
          textChunks,
          config.llm.openAiApiKey
        );
        chunksWithEmbeddings = embeddingResults;
        // eslint-disable-next-line no-console
        console.log(`Successfully generated embeddings for all chunks`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to generate embeddings:', error);
        // Fallback to placeholder embeddings
        chunksWithEmbeddings = textChunks.map(chunk => ({
          chunk,
          embedding: null,
        }));
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        'OpenAI API key not configured - skipping embedding generation'
      );
      chunksWithEmbeddings = textChunks.map(chunk => ({
        chunk,
        embedding: null,
      }));
    }

    // Task 3: Integrate with Cloudflare Vectorize for vector storage
    const vectorizeClient = createVectorizeClient(config.vectorize);
    let chunksCreated = 0;

    // Prepare vectors for batch insertion
    const vectorsToInsert: VectorizeVector[] = [];
    const chunksToStore = [];

    for (const chunkWithEmbedding of chunksWithEmbeddings) {
      const { chunk, embedding } = chunkWithEmbedding;

      // Create chunk hash for deduplication
      const chunkHash = crypto
        .createHash('sha256')
        .update(`${args.source}:${chunk.index}:${chunk.content}`)
        .digest('hex');

      // Generate unique vectorize ID (max 64 bytes for Vectorize)
      // Use first 16 chars of content hash + chunk index to stay under limit
      const shortHash = contentHash.substring(0, 16);
      const vectorizeId = `${shortHash}_c${chunk.index}`;

      // Store chunk data for later Convex insertion
      chunksToStore.push({
        sourceDocument: args.source,
        chunkIndex: chunk.index,
        content: chunk.content,
        chunkHash,
        vectorizeId,
        metadata: {
          file_path: args.source,
          file_type: args.metadata?.file_type || 'unknown',
          modified_at: args.metadata?.modified_at || Date.now(),
          chunk_size: chunk.content.length,
        },
        correlationId,
      });

      // If we have an embedding and Vectorize client, prepare for vector insertion
      if (embedding && vectorizeClient) {
        vectorsToInsert.push({
          id: vectorizeId,
          values: embedding,
          metadata: {
            source_document: args.source,
            chunk_index: chunk.index,
            file_path: args.source,
            file_type: args.metadata?.file_type || 'unknown',
            chunk_size: chunk.content.length,
            content_preview: chunk.content.substring(0, 100), // First 100 chars for debugging
          },
        });
      }

      chunksCreated++;
    }

    // Insert vectors into Vectorize if available
    if (vectorsToInsert.length > 0 && vectorizeClient) {
      try {
        console.log(
          `Inserting ${vectorsToInsert.length} vectors into Vectorize...`
        );
        const insertResult =
          await vectorizeClient.insertVectors(vectorsToInsert);
        console.log(
          `Successfully inserted vectors: mutation ${insertResult.mutationId}, count: ${insertResult.count}`
        );
      } catch (error) {
        console.error('Failed to insert vectors into Vectorize:', error);
        // Continue processing - we'll store metadata even if vector insertion fails
      }
    } else if (vectorsToInsert.length > 0) {
      console.warn(
        `${vectorsToInsert.length} vectors ready but Vectorize client not available`
      );
    }

    // Store chunk metadata in Convex (always do this, regardless of vector insertion success)
    for (const chunkData of chunksToStore) {
      await ctx.runMutation(
        internal.knowledgeMutations.createDocumentChunk,
        chunkData
      );
    }

    // Update document processing status
    await ctx.runMutation(internal.knowledgeMutations.updateDocumentStatus, {
      documentId,
      status: 'completed',
      chunkCount: chunksCreated,
    });

    // eslint-disable-next-line no-console
    console.log(
      `Successfully processed document ${args.source}: ${chunksCreated} chunks created`
    );

    return {
      documentId,
      chunksCreated,
      status: 'completed',
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing document:', error);
    throw new ConvexError(
      `Failed to process document: ${(error as Error).message}`
    );
  }
}

/**
 * Knowledge ingestion action for processing documents and creating vector embeddings
 * Follows AC 1 & 2: Create Convex action that takes text content as input
 */
export const addDocument = action({
  args: {
    content: v.string(),
    source: v.string(),
    metadata: v.optional(
      v.object({
        file_path: v.string(),
        file_type: v.string(),
        modified_at: v.number(),
      })
    ),
  },
  handler: addDocumentHandler,
});

/**
 * Handler function for querying vector similarity
 */
export async function queryVectorSimilarityHandler(
  ctx: any,
  args: {
    query: string;
    topK?: number;
    includeContent?: boolean;
  }
): Promise<{
  matches: Array<{
    id: string;
    score: number;
    chunk: {
      content: string;
      source_document: string;
      chunk_index: number;
      metadata: any;
    } | null;
  }>;
  queryStats: {
    totalResults: number;
    processingTimeMs: number;
  };
}> {
  const startTime = Date.now();

  try {
    // Load configuration
    const config = getConfig();

    // Generate embedding for the query
    if (!config.llm.openAiApiKey) {
      throw new ConvexError(
        'OpenAI API key required for query embedding generation'
      );
    }

    const { generateEmbeddingForText } = await import('./lib/textProcessing');
    const queryEmbedding = await generateEmbeddingForText(
      args.query,
      config.llm.openAiApiKey
    );

    // Create Vectorize client
    const vectorizeClient = createVectorizeClient(config.vectorize);
    if (!vectorizeClient) {
      throw new ConvexError('Vectorize configuration incomplete');
    }

    // Query vectors
    const topK = args.topK || 5;
    const vectorResults = await vectorizeClient.queryVectors(
      queryEmbedding,
      topK,
      true, // include metadata
      false // don't include values
    );

    // If content is requested, fetch chunk details from Convex
    const matches = [];
    for (const match of vectorResults.matches) {
      let chunkData = null;

      if (args.includeContent !== false) {
        // Query Convex for chunk content using vectorize_id
        const chunk = await ctx.runQuery(api.knowledge.getChunkByVectorizeId, {
          vectorizeId: match.id,
        });

        chunkData = chunk
          ? {
              content: chunk.content,
              source_document: chunk.source_document,
              chunk_index: chunk.chunk_index,
              metadata: chunk.metadata,
            }
          : null;
      }

      matches.push({
        id: match.id,
        score: match.score,
        chunk: chunkData,
      });
    }

    const processingTimeMs = Date.now() - startTime;

    // eslint-disable-next-line no-console
    console.log(
      `Vector similarity search completed: ${matches.length} results in ${processingTimeMs}ms`
    );

    return {
      matches,
      queryStats: {
        totalResults: matches.length,
        processingTimeMs,
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error querying vector similarity:', error);
    throw new ConvexError(
      `Failed to query vector similarity: ${(error as Error).message}`
    );
  }
}

/**
 * Query action for similarity search in vector database
 * Used for RAG (Retrieval Augmented Generation) queries
 */
export const queryVectorSimilarity = action({
  args: {
    query: v.string(),
    topK: v.optional(v.number()),
    includeContent: v.optional(v.boolean()),
  },
  handler: queryVectorSimilarityHandler,
});
