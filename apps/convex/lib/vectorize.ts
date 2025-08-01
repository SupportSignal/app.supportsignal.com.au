"use node";

/**
 * Cloudflare Vectorize API client for vector storage and similarity search
 * Implements AC 4: Store text chunks and embeddings in Vectorize DB
 */

import { VectorizeConfig } from './config';

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean>;
}

export interface VectorizeInsertResponse {
  mutationId: string;
  count: number;
}

export interface VectorizeQueryResponse {
  matches: Array<{
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, string | number | boolean>;
  }>;
}

export class VectorizeClient {
  private accountId: string;
  private apiToken: string;
  private databaseId: string;
  private baseUrl: string;

  constructor(config: VectorizeConfig) {
    if (!config.accountId || !config.apiToken || !config.databaseId) {
      throw new Error('Vectorize configuration is incomplete');
    }

    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.databaseId = config.databaseId;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/vectorize/v2/indexes/${this.databaseId}`;
  }

  /**
   * Insert vectors into Vectorize database
   */
  async insertVectors(vectors: VectorizeVector[]): Promise<VectorizeInsertResponse> {
    try {

      const response = await fetch(`${this.baseUrl}/insert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vectors,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vectorize API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result.result as VectorizeInsertResponse;
    } catch (error) {
      console.error('Error inserting vectors:', error);
      throw new Error(`Failed to insert vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Query vectors by similarity search
   */
  async queryVectors(
    vector: number[],
    topK: number = 5,
    includeMetadata: boolean = true,
    includeValues: boolean = false
  ): Promise<VectorizeQueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector,
          topK,
          returnMetadata: includeMetadata,
          returnValues: includeValues,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vectorize API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result.result as VectorizeQueryResponse;
    } catch (error) {
      console.error('Error querying vectors:', error);
      throw new Error(`Failed to query vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Delete vectors from Vectorize database
   */
  async deleteVectors(ids: string[]): Promise<{ mutationId: string; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vectorize API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Error deleting vectors:', error);
      throw new Error(`Failed to delete vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Get information about the Vectorize database
   */
  async getDatabaseInfo(): Promise<{
    name: string;
    description?: string;
    dimensions: number;
    metric: string;
    vectors: { count: number };
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vectorize API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error('Error getting database info:', error);
      throw new Error(`Failed to get database info: ${(error as Error).message}`);
    }
  }

  /**
   * Test connection to Vectorize database
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getDatabaseInfo();
      return true;
    } catch (error) {
      console.error('Vectorize connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create Vectorize client from configuration
 */
export function createVectorizeClient(config: VectorizeConfig): VectorizeClient | null {
  if (!config.accountId || !config.apiToken || !config.databaseId) {
    console.warn('Vectorize configuration incomplete - vector operations will be disabled');
    return null;
  }

  return new VectorizeClient(config);
}