"use node";

import OpenAI from 'openai';

/**
 * Configuration for text chunking
 */
export interface ChunkingConfig {
  maxChunkSize: number;
  overlapSize: number;
  preserveWords: boolean;
}

/**
 * Default chunking configuration optimized for embeddings
 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxChunkSize: 1000, // Characters per chunk
  overlapSize: 200,   // Overlap between chunks for context preservation
  preserveWords: true, // Don't break words in the middle
};

/**
 * Represents a text chunk with metadata
 */
export interface TextChunk {
  content: string;
  index: number;
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

/**
 * Chunk text into overlapping segments for better context preservation
 * Implements AC 3: Text chunking algorithm with configurable chunk size
 */
export function chunkText(text: string, config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < text.length) {
    const endPosition = Math.min(currentPosition + config.maxChunkSize, text.length);
    let chunkEnd = endPosition;

    // If preserve words is enabled and we're not at the end of text,
    // find the last word boundary within the chunk
    if (config.preserveWords && endPosition < text.length) {
      const remainingText = text.substring(currentPosition, endPosition);
      const lastSpaceIndex = remainingText.lastIndexOf(' ');
      const lastNewlineIndex = remainingText.lastIndexOf('\n');
      const lastWordBoundary = Math.max(lastSpaceIndex, lastNewlineIndex);

      if (lastWordBoundary > 0) {
        chunkEnd = currentPosition + lastWordBoundary;
      }
    }

    const chunkContent = text.substring(currentPosition, chunkEnd).trim();
    
    if (chunkContent.length > 0) {
      const wordCount = chunkContent.split(/\s+/).length;
      
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        startPosition: currentPosition,
        endPosition: chunkEnd,
        wordCount,
      });

      chunkIndex++;
    }

    // Move to next chunk with overlap
    const nextPosition = chunkEnd - config.overlapSize;
    currentPosition = Math.max(nextPosition, currentPosition + 1);

    // Prevent infinite loop
    if (currentPosition >= chunkEnd) {
      currentPosition = chunkEnd;
    }
  }

  return chunks;
}

/**
 * Generate embedding for a single text string (alias for generateEmbedding)
 */
export async function generateEmbeddingForText(text: string, apiKey: string): Promise<number[]> {
  return await generateEmbedding(text, apiKey);
}

/**
 * Generate embeddings for text using OpenAI API
 * Implements AC 3: Generate vector embeddings for chunks
 */
export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty for embedding generation');
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('OpenAI API key is required for embedding generation');
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective embedding model
      input: text,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI API');
    }

    return response.data[0].embedding;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
  }
}

/**
 * Generate embeddings for multiple text chunks with batching and retry logic
 */
export async function generateEmbeddingsForChunks(
  chunks: TextChunk[],
  apiKey: string,
  batchSize: number = 10,
  retryAttempts: number = 3
): Promise<Array<{ chunk: TextChunk; embedding: number[] }>> {
  const results: Array<{ chunk: TextChunk; embedding: number[] }> = [];

  // Process chunks in batches to respect API rate limits
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    for (const chunk of batch) {
      let attempts = 0;
      let embedding: number[] | null = null;

      while (attempts < retryAttempts && !embedding) {
        try {
          embedding = await generateEmbedding(chunk.content, apiKey);
          results.push({ chunk, embedding });
          
          // Small delay between requests to respect rate limits
          if (i + batch.indexOf(chunk) < chunks.length - 1) {
            await new Promise<void>(resolve => {
              setTimeout(resolve, 100);
            });
          }
        } catch (error) {
          attempts++;
          // eslint-disable-next-line no-console
          console.warn(`Attempt ${attempts} failed for chunk ${chunk.index}:`, (error as Error).message);
          
          if (attempts < retryAttempts) {
            // Exponential backoff
            const delay = Math.pow(2, attempts) * 1000;
            await new Promise<void>(resolve => {
              setTimeout(resolve, delay);
            });
          } else {
            throw error;
          }
        }
      }
    }
  }

  return results;
}

/**
 * Validate embedding dimensions for Vectorize compatibility
 */
export function validateEmbedding(embedding: number[], expectedDimensions: number = 1536): boolean {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== expectedDimensions) {
    return false;
  }

  // Check if all values are numbers
  return embedding.every(value => typeof value === 'number' && !isNaN(value));
}

/**
 * Calculate text statistics for processing insights
 */
export function calculateTextStats(text: string): {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
} {
  const characterCount = text.length;
  const wordCount = text.trim().split(/\s+/).length;
  const lineCount = text.split('\n').length;
  const paragraphCount = text.split(/\n\s*\n/).length;

  return {
    characterCount,
    wordCount,
    lineCount,
    paragraphCount,
  };
}