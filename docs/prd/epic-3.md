# Epic 3: Resilient Real-time Logging

**Goal:** To implement a developer-first real-time logging system using Cloudflare Workers + Upstash Redis architecture that captures distributed traces across browser, Cloudflare Workers, and Convex backend, optimized for AI agent assistance and debugging workflows, with cost-effective and reliable infrastructure.

## Technical Documentation

**Primary Implementation Documents:**

- [`docs/technical-guides/logging-refactor-comprehensive-specifications.md`](../technical-guides/logging-refactor-comprehensive-specifications.md) - Complete technical specifications, architecture diagrams, component details, and integration patterns
- [`docs/technical-guides/worker-redis-logging-architecture.md`](../technical-guides/worker-redis-logging-architecture.md) - Detailed architecture overview with system flow and component specifications
- [`docs/technical-guides/convex-logging-cleanup-strategy.md`](../technical-guides/convex-logging-cleanup-strategy.md) - Systematic cleanup plan for removing broken Convex logging system
- [`docs/technical-guides/logging-refactor-agent-delegation-guidelines.md`](../technical-guides/logging-refactor-agent-delegation-guidelines.md) - Agent delegation strategy and implementation phases

**System Analysis:**

- [`docs/logging-system-comprehensive-analysis.md`](../logging-system-comprehensive-analysis.md) - Analysis of current broken system, race conditions, and components to preserve

---

## Story 3.1: Browser Log Capture Foundation

_As a developer, I need a reliable system to capture browser console logs and errors with trace correlation, so that I can debug issues across the entire application stack._

**Acceptance Criteria:**

1.  A console.log override system is implemented that captures all browser console output without interfering with normal logging.
2.  A Convex HTTP Action endpoint is created to receive browser logs directly from the client.
3.  Log correlation system is implemented with trace_id, user_id, and system_area tagging.
4.  A toggleable mechanism allows developers to enable/disable browser log capture as needed.
5.  **Future Enhancement**: Chrome remote debugging infrastructure is designed for comprehensive event capture.

---

## Story 3.2: Multi-System Log Ingestion & Correlation

_As a developer, I want logs from browser, Cloudflare Workers, and Convex backend to be correlated with trace IDs, so that I can follow a complete request flow across all systems._

**Acceptance Criteria:**

1.  The Convex HTTP Action endpoint handles browser console logs with CORS configuration.
2.  Cloudflare Workers logging utilities are enhanced to propagate trace correlation data.
3.  Convex Log Streams webhook integration captures backend function execution logs.
4.  Log ingestion creates entries in both `log_queue` for processing and `recent_log_entries` for real-time viewing.
5.  **Fallback**: Cloudflare Worker proxy is available if direct Convex CORS proves problematic.

---

## Story 3.3: System Admin Monitoring & Controls

_As a developer, I need administrative controls and monitoring tools to manage the logging system's health, performance, and costs, so that I can maintain optimal system operation and troubleshoot issues effectively._

**Acceptance Criteria:**

1.  Rate limiting status dashboard shows current usage across all systems (browser, worker, backend) with real-time quota management.
2.  Cost and budget monitoring displays monthly write usage, estimated costs, and budget remaining with configurable alerts.
3.  Database health monitoring shows storage usage, record counts, and cleanup recommendations.
4.  Administrative cleanup controls provide both safe maintenance cleanup and emergency full cleanup options.
5.  Log correlation search enables querying logs by trace ID, message content, system, or time range for troubleshooting.
6.  **Developer Experience**: System health overview provides at-a-glance status of all logging components and potential issues.

---

## Story 3.4: Specialized Worker Infrastructure & Redis Integration

_As a developer, I need a robust Cloudflare Worker + Upstash Redis logging infrastructure that handles high-frequency log ingestion without race conditions, so that I can reliably capture logs from all systems during development._

**Acceptance Criteria:**

1.  A specialized Cloudflare Worker (`apps/workers/log-ingestion/`) handles log ingestion with built-in rate limiting and batching.
2.  Upstash Redis integration provides cost-effective short-term log storage with 1-hour TTL (~$2/month vs $10).
3.  Multi-system support ingests logs from browser, Convex functions, and other Cloudflare Workers with automatic system detection.
4.  Worker-based rate limiting eliminates database race conditions while preserving trace correlation capabilities.
5.  **Integration**: Monorepo deployment patterns with Turbo for coordinated development and deployment workflows.
6.  **Migration**: Complete removal of broken Convex logging tables and files with fresh start approach.

---

## Story 3.5: On-Demand Log Visualization & Clean Admin Interface

_As a developer, I want a clean debugging interface that fetches logs on-demand from Redis storage and provides trace correlation analysis, so that I can efficiently debug issues without real-time overhead._

**Acceptance Criteria:**

1.  A new `/debug` interface allows trace ID search to fetch logs from Redis storage on-demand.
2.  Timeline visualization displays chronological logs across all systems (browser, Convex, workers) with system filtering.
3.  Convex integration fetches logs from Redis only during active debugging sessions, not for real-time processing.
4.  Log correlation engine operates on fetched data to provide error chain analysis and performance insights.
5.  **Claude Code Integration**: Structured log export functionality for AI debugging assistance and pattern analysis.
6.  **Developer Experience**: Clean, focused interface optimized for debugging workflows rather than real-time monitoring.
