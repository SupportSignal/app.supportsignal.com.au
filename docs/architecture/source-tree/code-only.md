# Code Only

> **Generated:** 2025-08-06 13:57:23 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Implementation code without tests/docs

---

├─ apps
│ ├─ convex
│ │ ├─ agent.ts
│ │ ├─ agentActions.ts
│ │ ├─ analysis.ts
│ │ ├─ auth.ts
│ │ ├─ cleanup.deprecated.ts
│ │ ├─ cleanup.old.ts
│ │ ├─ cleanupLoggingTables.ts
│ │ ├─ clearAll.ts
│ │ ├─ companies.ts
│ │ ├─ debugActions.ts
│ │ ├─ debugLogs.ts
│ │ ├─ email.ts
│ │ ├─ incidents.ts
│ │ ├─ internalLogging.ts
│ │ ├─ knowledge.ts
│ │ ├─ knowledgeActions.ts
│ │ ├─ knowledgeMutations.ts
│ │ ├─ lib
│ │ │ ├─ auth.ts
│ │ │ ├─ config.ts
│ │ │ ├─ redisLogFetcher.ts
│ │ │ ├─ textProcessing.ts
│ │ │ ├─ vectorize.ts
│ │ ├─ logCorrelation.deprecated.ts
│ │ ├─ logCorrelation.old.ts
│ │ ├─ logStreamsWebhook.ts
│ │ ├─ loggingAction.ts
│ │ ├─ migrations.ts
│ │ ├─ monitoring.ts
│ │ ├─ prompts.ts
│ │ ├─ queries.ts
│ │ ├─ rateLimiter.deprecated.ts
│ │ ├─ rateLimiter.old.ts
│ │ ├─ schema.ts
│ │ ├─ seed.ts
│ │ ├─ simpleCleanup.ts
│ │ ├─ users.ts
│ │ ├─ workerSync.ts
│ ├─ web
│ │ ├─ app
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ │ │ └─ route.ts
│ │ │ ├─ debug
│ │ │ │ ├─ lib
│ │ │ │ │ ├─ debug-api.ts
│ │ │ │ ├─ components
│ │ │ │ │ ├─ CorrelationPanel.tsx
│ │ │ │ │ ├─ ExportControls.tsx
│ │ │ │ │ ├─ LogEntryCard.tsx
│ │ │ │ │ ├─ LogTableViewer.tsx
│ │ │ │ │ ├─ RecentTraces.tsx
│ │ │ │ │ ├─ TestLogGenerator.tsx
│ │ │ │ │ ├─ TimelineViewer.tsx
│ │ │ │ │ ├─ TraceSearchForm.tsx
│ │ │ │ ├─ page.tsx
│ │ │ ├─ admin
│ │ │ │ ├─ layout.tsx
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ └─ page.tsx
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │   └─ page.tsx
│ │ │ ├─ change-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ chat
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-env
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ page.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ page.tsx
│ │ │ ├─ forgot-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ layout.tsx
│ │ │ ├─ login
│ │ │ │ ├─ page.tsx
│ │ │ ├─ page.tsx
│ │ │ ├─ protected
│ │ │ │ ├─ page.tsx
│ │ │ ├─ providers.tsx
│ │ │ ├─ register
│ │ │ │ ├─ page.tsx
│ │ │ ├─ reset-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ showcase
│ │ │ │ ├─ page.tsx
│ │ │ ├─ test-llm
│ │ │ │ └─ page.tsx
│ │ ├─ lib
│ │ │ ├─ auth.ts
│ │ │ ├─ config.ts
│ │ │ ├─ console-override.ts
│ │ │ ├─ convex-api.ts
│ │ │ ├─ convex.ts
│ │ │ ├─ email
│ │ │ │ ├─ email-service.ts
│ │ │ │ ├─ email-templates.ts
│ │ │ ├─ utils.ts
│ │ │ ├─ version-storage.ts
│ │ │ ├─ version-utils.ts
│ │ ├─ next-env.d.ts
│ │ ├─ types
│ │ │ ├─ chat.ts
│ │ ├─ components
│ │ │ ├─ auth
│ │ │ │ ├─ auth-provider.tsx
│ │ │ │ ├─ change-password-form.tsx
│ │ │ │ ├─ github-oauth-button.tsx
│ │ │ │ ├─ google-oauth-button.tsx
│ │ │ │ ├─ login-form.tsx
│ │ │ │ ├─ logout-button.tsx
│ │ │ │ ├─ password-reset-confirm-form.tsx
│ │ │ │ ├─ password-reset-form.tsx
│ │ │ │ ├─ register-form.tsx
│ │ │ ├─ chat
│ │ │ │ ├─ assistant-message.tsx
│ │ │ │ ├─ chat-interface.tsx
│ │ │ │ ├─ message-list.tsx
│ │ │ │ ├─ typing-indicator.tsx
│ │ │ │ ├─ user-message.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ cleanup-controls.tsx
│ │ │ │ ├─ cost-monitoring.tsx
│ │ │ │ ├─ database-health.tsx
│ │ │ │ ├─ debug-logs-table.tsx
│ │ │ │ ├─ export-controls-card.tsx
│ │ │ │ ├─ log-search.tsx
│ │ │ │ ├─ rate-limit-status.tsx
│ │ │ │ ├─ redis-stats-card.tsx
│ │ │ │ ├─ suppression-rules-panel.tsx
│ │ │ │ ├─ sync-controls-card.tsx
│ │ │ │ ├─ system-health-overview.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ mock-email-viewer.tsx
│ │ │ │ ├─ version-debug.tsx
│ │ │ │ ├─ version-flash-notification.tsx
│ │ │ │ ├─ version-indicator.tsx
│ │ │ │ ├─ version-provider.tsx
│ │ │ ├─ logging
│ │ │ │ ├─ logging-provider.tsx
│ │ │ │ ├─ logging-status.tsx
│ │ │ └─ theme
│ │ │   ├─ theme-provider.tsx
│ │ │   └─ theme-toggle.tsx
│ ├─ workers
│ │ └─ log-ingestion
│ │   └─ src
│ │     ├─ index.ts
│ │     ├─ log-processor.ts
│ │     ├─ rate-limiter.ts
│ │     ├─ redis-client.ts
│ │     └─ types.ts
└─ packages
  └─ ui
    ├─ index.ts
    └─ src
      ├─ lib
      │ ├─ utils.ts
      ├─ alert-dialog.tsx
      ├─ alert.tsx
      ├─ badge.tsx
      ├─ button.tsx
      ├─ card.tsx
      ├─ checkbox.tsx
      ├─ collapsible.tsx
      ├─ dropdown-menu.tsx
      ├─ input.tsx
      ├─ label.tsx
      ├─ progress.tsx
      ├─ select.tsx
      ├─ separator.tsx
      ├─ table.tsx
      ├─ tabs.tsx
      ├─ textarea.tsx
      └─ tooltip.tsx