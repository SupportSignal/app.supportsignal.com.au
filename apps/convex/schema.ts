import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Simple test table to verify Convex connection
  test_messages: defineTable({
    message: v.string(),
    timestamp: v.number(),
  }),

  // Multi-tenant companies table for SupportSignal
  companies: defineTable({
    name: v.string(), // "Support Signal", "ABC NDIS Provider"
    contact_email: v.string(), // Primary contact
    status: v.union(v.literal("active"), v.literal("trial"), v.literal("suspended")),
    created_at: v.number(),
    created_by: v.optional(v.id("users")), // Temporarily optional for seed data - should be required in production
  })
    .index("by_status", ["status"]),

  // User authentication table with multi-tenant support
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Required password field
    profile_image_url: v.optional(v.string()),
    // Simplified role hierarchy for SupportSignal (snake_case)
    role: v.union(
      v.literal("system_admin"),
      v.literal("company_admin"), 
      v.literal("team_lead"),
      v.literal("frontline_worker")
    ),
    has_llm_access: v.optional(v.boolean()), // LLM access control flag
    // Multi-tenant company association
    company_id: v.optional(v.id("companies")), // Which company they belong to
  })
    .index('by_email', ['email'])
    .index('by_company', ['company_id']),

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
  })
    .index('by_user_id', ['userId']),

  // Chat messages within sessions
  chat_messages: defineTable({
    sessionId: v.id('chat_sessions'),
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
    model_used: v.optional(v.string()),
    tokens_used: v.optional(v.number()),
    has_llm_access: v.boolean(), // Track if message used LLM or fallback
  })
    .index('by_session_id', ['sessionId']),

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
  })
    .index('by_file_path', ['file_path'])
    .index('by_content_hash', ['content_hash'])
    .index('by_processing_status', ['processing_status']),

  // SupportSignal Incident Management Tables
  
  // NDIS participants table with multi-tenant support
  participants: defineTable({
    company_id: v.id("companies"), // Multi-tenant isolation
    first_name: v.string(),
    last_name: v.string(),
    date_of_birth: v.string(),
    ndis_number: v.string(), // NDIS participant identifier
    contact_phone: v.optional(v.string()),
    emergency_contact: v.optional(v.string()),
    support_level: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    care_notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("discharged")),
    created_at: v.number(),
    created_by: v.id("users"),
    updated_at: v.number(),
    updated_by: v.id("users"),
  })
    .index("by_company", ["company_id"])
    .index("by_ndis_number", ["ndis_number"])
    .index("by_status", ["status"])
    .index("by_name", ["last_name", "first_name"]),
  
  // Core incidents table with multi-tenant support
  incidents: defineTable({
    company_id: v.id("companies"), // Multi-tenant isolation
    reporter_name: v.string(),
    participant_id: v.optional(v.id("participants")), // Reference to participant record
    participant_name: v.string(), // Keep for backwards compatibility and non-participant incidents
    event_date_time: v.string(),
    location: v.string(),
    
    // Workflow Status
    capture_status: v.union(v.literal("draft"), v.literal("in_progress"), v.literal("completed")),
    analysis_status: v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed")),
    overall_status: v.union(v.literal("capture_pending"), v.literal("analysis_pending"), v.literal("completed")),
    
    // Audit Fields
    created_at: v.number(),
    created_by: v.optional(v.id("users")), // Temporarily optional for seed data - should be required in production
    updated_at: v.number(),
    
    // Data Quality Tracking
    narrative_hash: v.optional(v.string()),
    questions_generated: v.boolean(),
    narrative_enhanced: v.boolean(),
    analysis_generated: v.boolean(),
  })
    .index("by_company", ["company_id"])
    .index("by_status", ["overall_status"])
    .index("by_created", ["created_at"]),

  // Multi-phase incident narratives
  incident_narratives: defineTable({
    incident_id: v.id("incidents"), // Reference to parent incident
    
    // Original Narratives (user-provided)
    before_event: v.string(), // Pre-incident circumstances
    during_event: v.string(), // Incident occurrence
    end_event: v.string(), // Incident resolution
    post_event: v.string(), // Post-incident support
    
    // Enhanced Narratives (AI-generated)
    before_event_extra: v.optional(v.string()), // AI-enhanced before narrative
    during_event_extra: v.optional(v.string()), // AI-enhanced during narrative
    end_event_extra: v.optional(v.string()), // AI-enhanced end narrative
    post_event_extra: v.optional(v.string()), // AI-enhanced post narrative
    
    // Consolidated Narrative (for analysis)
    consolidated_narrative: v.optional(v.string()), // Combined narrative for AI analysis
    
    // Metadata
    created_at: v.number(),
    updated_at: v.number(),
    enhanced_at: v.optional(v.number()), // When AI enhancement was completed
    version: v.number(), // Version number for change tracking
  })
    .index("by_incident", ["incident_id"])
    .index("by_updated", ["updated_at"]),

  // AI-generated clarification questions
  clarification_questions: defineTable({
    incident_id: v.id("incidents"), // Reference to parent incident
    
    // Question Details
    question_id: v.string(), // Unique question identifier
    phase: v.union( // Which narrative phase
      v.literal("before_event"),
      v.literal("during_event"), 
      v.literal("end_event"),
      v.literal("post_event")
    ),
    question_text: v.string(), // The actual question
    question_order: v.number(), // Display order within phase
    
    // AI Generation Metadata
    generated_at: v.number(), // When question was generated
    ai_model: v.optional(v.string()), // AI model used for generation
    prompt_version: v.optional(v.string()), // Version of prompt used
    
    // Status
    is_active: v.boolean(), // Whether question is currently active
  })
    .index("by_incident", ["incident_id"])
    .index("by_incident_phase", ["incident_id", "phase"])
    .index("by_generated", ["generated_at"]),

  // User responses to clarification questions
  clarification_answers: defineTable({
    incident_id: v.id("incidents"), // Reference to parent incident
    question_id: v.string(), // Reference to clarification question
    
    // Answer Details
    answer_text: v.string(), // User's answer content
    phase: v.union( // Which narrative phase
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"), 
      v.literal("post_event")
    ),
    
    // Metadata
    answered_at: v.number(), // When answer was provided
    answered_by: v.optional(v.id("users")), // Who provided the answer - temporarily optional
    updated_at: v.number(), // Last modification
    is_complete: v.boolean(), // Whether answer is considered complete
    
    // Quality Metrics
    character_count: v.number(), // Length of answer
    word_count: v.number(), // Word count for analysis
  })
    .index("by_incident", ["incident_id"])
    .index("by_incident_phase", ["incident_id", "phase"])
    .index("by_question", ["question_id"])
    .index("by_answered", ["answered_at"]),

  // Incident analysis by team leads
  incident_analysis: defineTable({
    incident_id: v.id("incidents"), // Reference to parent incident
    
    // Contributing Conditions Analysis
    contributing_conditions: v.string(), // AI-generated + user-edited analysis
    conditions_original: v.optional(v.string()), // Original AI-generated content
    conditions_edited: v.boolean(), // Whether user modified AI content
    
    // Analysis Metadata
    analyzed_at: v.number(), // When analysis was performed
    analyzed_by: v.optional(v.id("users")), // Who performed the analysis - temporarily optional
    updated_at: v.number(), // Last modification
    
    // AI Generation Details
    ai_analysis_prompt: v.optional(v.string()), // Prompt used for AI analysis
    ai_model: v.optional(v.string()), // AI model used
    ai_confidence: v.optional(v.number()), // AI confidence score (0-1)
    ai_processing_time: v.optional(v.number()), // Time taken for AI analysis
    
    // Status & Workflow
    analysis_status: v.union(
      v.literal("draft"),
      v.literal("ai_generated"),
      v.literal("user_reviewed"),
      v.literal("completed")
    ),
    
    // Quality Metrics
    revision_count: v.number(), // Number of times analysis was revised
    total_edit_time: v.optional(v.number()), // Total time spent editing
  })
    .index("by_incident", ["incident_id"])
    .index("by_analyzed", ["analyzed_at"])
    .index("by_analyzer", ["analyzed_by"])
    .index("by_status", ["analysis_status"]),

  // Incident categorization and severity assessment
  incident_classifications: defineTable({
    incident_id: v.id("incidents"), // Reference to parent incident
    analysis_id: v.id("incident_analysis"), // Reference to analysis record
    
    // Classification Details
    classification_id: v.string(), // Unique classification identifier
    incident_type: v.union( // Type of incident
      v.literal("behavioural"),
      v.literal("environmental"),
      v.literal("medical"),
      v.literal("communication"),
      v.literal("other")
    ),
    supporting_evidence: v.string(), // Evidence supporting this classification
    
    // Severity & Confidence
    severity: v.union( // Incident severity level
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    confidence_score: v.number(), // AI confidence in classification (0-1)
    
    // User Review
    user_reviewed: v.boolean(), // Whether user reviewed AI classification
    user_modified: v.boolean(), // Whether user modified AI classification
    review_notes: v.optional(v.string()), // User notes on classification
    
    // Metadata
    created_at: v.number(),
    updated_at: v.number(),
    classified_by: v.optional(v.id("users")), // Who classified/reviewed - temporarily optional
    
    // AI Generation
    ai_generated: v.boolean(), // Whether AI-generated or user-created
    ai_model: v.optional(v.string()), // AI model used for generation
    original_ai_classification: v.optional(v.string()), // Original AI classification
  })
    .index("by_incident", ["incident_id"])
    .index("by_analysis", ["analysis_id"])
    .index("by_type", ["incident_type"])
    .index("by_severity", ["severity"])
    .index("by_created", ["created_at"]),

  // AI Prompts subsystem (reusable across platform)
  ai_prompts: defineTable({
    // Prompt Identity
    prompt_name: v.string(), // Identifier (e.g., "generate_clarification_questions")
    prompt_version: v.string(), // Version number (e.g., "v1.2.0")
    
    // Prompt Content
    prompt_template: v.string(), // The actual prompt template
    description: v.optional(v.string()), // Human-readable description
    input_schema: v.optional(v.string()), // JSON schema for expected inputs
    output_schema: v.optional(v.string()), // JSON schema for expected outputs
    
    // Usage Context
    workflow_step: v.optional(v.string()), // Which workflow step uses this prompt
    subsystem: v.optional(v.string()), // "incidents", "chat", etc.
    ai_model: v.optional(v.string()), // Recommended AI model
    max_tokens: v.optional(v.number()), // Token limit for responses
    temperature: v.optional(v.number()), // AI temperature setting
    
    // Versioning
    is_active: v.optional(v.boolean()), // Whether this version is currently active
    created_at: v.number(),
    created_by: v.optional(v.id("users")), // Temporarily optional for seed data - should be required in production
    replaced_at: v.optional(v.number()), // When this version was replaced
    replaced_by: v.optional(v.string()), // Which version replaced this
    
    // Performance Metrics
    usage_count: v.optional(v.number()), // How many times this prompt was used
    average_response_time: v.optional(v.number()), // Average AI response time
    success_rate: v.optional(v.number()), // Success rate (0-1)
  })
    .index("by_name", ["prompt_name"])
    .index("by_name_version", ["prompt_name", "prompt_version"])
    .index("by_active", ["is_active"])
    .index("by_workflow", ["workflow_step"])
    .index("by_subsystem", ["subsystem"]),

  // AI request/response logging for performance monitoring and debugging
  ai_request_logs: defineTable({
    // Request Identification
    correlation_id: v.string(), // Unique identifier for tracing requests
    operation: v.string(), // "generateClarificationQuestions", "enhanceNarrative", etc.
    
    // AI Service Details
    model: v.string(), // "openai/gpt-4.1-nano", etc.
    prompt_template: v.string(), // Name of prompt template used
    
    // Request/Response Data
    input_data: v.any(), // Input parameters for the AI operation
    output_data: v.optional(v.any()), // AI response data
    
    // Performance Metrics
    processing_time_ms: v.number(), // Total processing time
    tokens_used: v.optional(v.number()), // Tokens consumed by AI model
    cost_usd: v.optional(v.number()), // Estimated cost in USD
    
    // Status & Error Handling
    success: v.boolean(), // Whether operation completed successfully
    error_message: v.optional(v.string()), // Error details if failed
    
    // Context & Attribution
    user_id: v.optional(v.id("users")), // User who initiated the request
    incident_id: v.optional(v.id("incidents")), // Related incident (if applicable)
    
    // Timestamps
    created_at: v.number(), // When request was made
  })
    .index("by_correlation_id", ["correlation_id"])
    .index("by_operation", ["operation"])
    .index("by_created", ["created_at"])
    .index("by_user", ["user_id"])
    .index("by_incident", ["incident_id"])
    .index("by_success", ["success"]),
});
