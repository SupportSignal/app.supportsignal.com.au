import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Simple test table to verify Convex connection
  test_messages: defineTable({
    message: v.string(),
    timestamp: v.number(),
  }),

  // User authentication table following architecture/data-models.md
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Required password field
    profile_image_url: v.optional(v.string()),
    role: v.string(),
    hasLLMAccess: v.optional(v.boolean()), // LLM access control flag
  }).index('by_email', ['email']),

  // BetterAuth sessions table
  sessions: defineTable({
    userId: v.id('users'),
    sessionToken: v.string(),
    expires: v.number(),
    rememberMe: v.optional(v.boolean()),
  })
    .index('by_session_token', ['sessionToken'])
    .index('by_user_id', ['userId']),

  // BetterAuth accounts table for oauth providers (future use)
  accounts: defineTable({
    userId: v.id('users'),
    type: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
  })
    .index('by_provider_account', ['provider', 'providerAccountId'])
    .index('by_user_id', ['userId']),

  // Password reset tokens
  password_reset_tokens: defineTable({
    userId: v.id('users'),
    token: v.string(),
    expires: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_user_id', ['userId']),

  // Debug logs table for synced Redis data analysis
  debug_logs: defineTable({
    id: v.string(), // Original log ID from Redis
    trace_id: v.string(),
    user_id: v.optional(v.string()),
    system: v.union(v.literal("browser"), v.literal("convex"), v.literal("worker"), v.literal("manual")),
    level: v.union(v.literal("log"), v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    timestamp: v.number(),
    context: v.optional(v.any()),
    stack: v.optional(v.string()),
    raw_data: v.any(), // Full original log entry
    synced_at: v.number(), // When this was synced from Redis
  })
    .index('by_trace_id', ['trace_id'])
    .index('by_user_id', ['user_id'])
    .index('by_system', ['system'])
    .index('by_timestamp', ['timestamp'])
    .index('by_synced_at', ['synced_at']),

  // Note: Old logging tables removed - now handled by Cloudflare Worker + Redis
  // Old tables (log_queue, recent_log_entries, rate_limit_state, message_fingerprints)
  // have been migrated to Redis-based storage for better cost efficiency

  // Chat sessions for conversation tracking
  chat_sessions: defineTable({
    userId: v.id('users'),
    title: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
    correlation_id: v.string(),
  })
    .index('by_user_id', ['userId'])
    .index('by_correlation_id', ['correlation_id']),

  // Chat messages within sessions
  chat_messages: defineTable({
    sessionId: v.id('chat_sessions'),
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
    correlation_id: v.string(),
    model_used: v.optional(v.string()),
    tokens_used: v.optional(v.number()),
    has_llm_access: v.boolean(), // Track if message used LLM or fallback
  })
    .index('by_session_id', ['sessionId'])
    .index('by_correlation_id', ['correlation_id']),

  // Document chunks metadata (vectors stored in Vectorize)
  document_chunks: defineTable({
    source_document: v.string(), // File path or document identifier
    chunk_index: v.number(),
    content: v.string(),
    chunk_hash: v.string(), // For deduplication
    vectorize_id: v.string(), // ID in Cloudflare Vectorize
    metadata: v.object({
      file_path: v.string(),
      file_type: v.string(),
      modified_at: v.number(),
      chunk_size: v.number(),
    }),
    created_at: v.number(),
    correlation_id: v.string(),
  })
    .index('by_source_document', ['source_document'])
    .index('by_chunk_hash', ['chunk_hash'])
    .index('by_vectorize_id', ['vectorize_id']),

  // Source documents tracking
  source_documents: defineTable({
    file_path: v.string(),
    file_type: v.string(),
    content_hash: v.string(), // For change detection
    last_processed: v.number(),
    chunk_count: v.number(),
    processing_status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    error_message: v.optional(v.string()),
    correlation_id: v.string(),
  })
    .index('by_file_path', ['file_path'])
    .index('by_content_hash', ['content_hash'])
    .index('by_processing_status', ['processing_status']),
});
