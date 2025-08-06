# Backend Only

> **Generated:** 2025-08-06 13:57:23 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Convex backend and workers only

---

└─ apps
  ├─ convex
  │ ├─ README.md
  │ ├─ _generated
  │ ├─ agent.ts
  │ ├─ agentActions.ts
  │ ├─ analysis.ts
  │ ├─ auth.ts
  │ ├─ cleanup.deprecated.ts
  │ ├─ cleanup.old.ts
  │ ├─ cleanupLoggingTables.ts
  │ ├─ clearAll.ts
  │ ├─ companies.ts
  │ ├─ convex.json
  │ ├─ debugActions.ts
  │ ├─ debugLogs.ts
  │ ├─ email.ts
  │ ├─ incidents.ts
  │ ├─ internalLogging.ts
  │ ├─ jest.config.js
  │ ├─ knowledge.ts
  │ ├─ knowledgeActions.ts
  │ ├─ knowledgeMutations.ts
  │ ├─ lib
  │ │ ├─ auth.ts
  │ │ ├─ config.ts
  │ │ ├─ redisLogFetcher.ts
  │ │ ├─ textProcessing.ts
  │ │ ├─ vectorize.ts
  │ ├─ logCorrelation.deprecated.ts
  │ ├─ logCorrelation.old.ts
  │ ├─ logStreamsWebhook.ts
  │ ├─ loggingAction.ts
  │ ├─ migrations.ts
  │ ├─ monitoring.ts
  │ ├─ package.json
  │ ├─ prompts.ts
  │ ├─ queries.ts
  │ ├─ rateLimiter.deprecated.ts
  │ ├─ rateLimiter.old.ts
  │ ├─ schema.ts
  │ ├─ seed.ts
  │ ├─ simpleCleanup.ts
  │ ├─ tsconfig.json
  │ ├─ users.ts
  │ ├─ workerSync.ts
  └─ workers
    └─ log-ingestion
      ├─ dist
      │ ├─ index.js
      ├─ jest.config.js
      ├─ node_modules
      ├─ package.json
      ├─ src
      │ ├─ index.ts
      │ ├─ log-processor.ts
      │ ├─ rate-limiter.ts
      │ ├─ redis-client.ts
      │ ├─ types.ts
      ├─ tsconfig.json
      ├─ wrangler.toml
      └─ wrangler.toml.example