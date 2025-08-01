// @ts-nocheck
// DEPRECATED - Log correlation migrated to Worker + Redis
// This file is kept for reference but should not be used in production

// The old Convex-based log correlation has been replaced with:
// - Worker-based log retrieval from Redis using trace_id
// - Client-side correlation and analysis of Redis log data  
// - No database queries needed - Redis handles trace-based log grouping

// Migration completed: 2025-01-29
// New log retrieval: Worker endpoint GET /logs?trace_id={trace_id}

export const deprecated = true;

// For log correlation, use the Worker API:
// GET https://log-ingestion.your-worker-domain.workers.dev/logs?trace_id={trace_id}
// Returns logs sorted by timestamp with automatic Redis TTL management

// If you need to access old correlation functions for migration purposes,
// they can be found in the git history before 2025-01-29