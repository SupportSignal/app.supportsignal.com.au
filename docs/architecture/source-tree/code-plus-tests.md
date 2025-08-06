# Code Plus Tests

> **Generated:** 2025-08-06 13:57:23 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Implementation and test files only

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
│ │ ├─ __tests__
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
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
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ page.test.tsx
│ │ │ │ ├─ page.tsx
│ │ │ ├─ test-llm
│ │ │ │ └─ page.tsx
│ │ ├─ lib
│ │ │ ├─ __tests__
│ │ │ │ ├─ console-override.test.ts
│ │ │ ├─ auth.ts
│ │ │ ├─ config.ts
│ │ │ ├─ console-override.ts
│ │ │ ├─ convex-api.ts
│ │ │ ├─ convex.ts
│ │ │ ├─ email
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ email-service.test.ts
│ │ │ │ │ ├─ email-templates.test.ts
│ │ │ │ ├─ email-service.ts
│ │ │ │ ├─ email-templates.ts
│ │ │ ├─ utils.ts
│ │ │ ├─ version-storage.ts
│ │ │ ├─ version-utils.ts
│ │ │ ├─ test-utils.tsx
│ │ ├─ next-env.d.ts
│ │ ├─ types
│ │ │ ├─ chat.ts
│ │ ├─ components
│ │ │ ├─ auth
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ auth-provider-methods.test.tsx
│ │ │ │ │ ├─ auth-provider.test.tsx
│ │ │ │ │ ├─ change-password-form.test.tsx
│ │ │ │ │ ├─ github-oauth-button.test.tsx
│ │ │ │ │ ├─ google-oauth-button.test.tsx
│ │ │ │ │ ├─ login-form.test.tsx
│ │ │ │ │ ├─ logout-button.test.tsx
│ │ │ │ │ ├─ password-reset-confirm-form.test.tsx
│ │ │ │ │ ├─ password-reset-form.test.tsx
│ │ │ │ │ ├─ register-form.test.tsx
│ │ │ │ │ ├─ remember-me.test.tsx
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
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ assistant-message.test.tsx
│ │ │ │ │ ├─ chat-interface.test.tsx
│ │ │ │ │ ├─ message-list.test.tsx
│ │ │ │ │ ├─ typing-indicator.test.tsx
│ │ │ │ │ ├─ user-message.test.tsx
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
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ mock-email-viewer.test.tsx
│ │ │ │ ├─ mock-email-viewer.tsx
│ │ │ │ ├─ version-debug.tsx
│ │ │ │ ├─ version-flash-notification.tsx
│ │ │ │ ├─ version-indicator.tsx
│ │ │ │ ├─ version-provider.tsx
│ │ │ ├─ logging
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ logging-provider.test.tsx
│ │ │ │ │ ├─ logging-status.test.tsx
│ │ │ │ ├─ logging-provider.tsx
│ │ │ │ ├─ logging-status.tsx
│ │ │ └─ theme
│ │ │   ├─ __tests__
│ │ │   │ ├─ theme-integration.test.tsx
│ │ │   │ ├─ theme-provider.test.tsx
│ │ │   │ ├─ theme-toggle.test.tsx
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
├─ packages
│ ├─ ui
│ │ ├─ index.ts
│ │ └─ src
│ │   ├─ lib
│ │   │ ├─ utils.ts
│ │   ├─ __tests__
│ │   │ ├─ button.test.tsx
│ │   │ ├─ card.test.tsx
│ │   │ ├─ input.test.tsx
│ │   ├─ alert-dialog.tsx
│ │   ├─ alert.tsx
│ │   ├─ badge.tsx
│ │   ├─ button.tsx
│ │   ├─ card.tsx
│ │   ├─ checkbox.tsx
│ │   ├─ collapsible.tsx
│ │   ├─ dropdown-menu.tsx
│ │   ├─ input.tsx
│ │   ├─ label.tsx
│ │   ├─ progress.tsx
│ │   ├─ select.tsx
│ │   ├─ separator.tsx
│ │   ├─ table.tsx
│ │   ├─ tabs.tsx
│ │   ├─ textarea.tsx
│ │   └─ tooltip.tsx
└─ tests
  ├─ convex
  │ ├─ fixtures
  │ │ ├─ testData.ts
  │ ├─ knowledge.test.ts
  │ ├─ knowledgeActions.test.ts
  │ ├─ knowledgeMutations.test.ts
  │ ├─ lib
  │ │ ├─ config.test.ts
  │ │ ├─ textProcessing.test.ts
  │ │ ├─ vectorize.test.ts
  │ ├─ setup.ts
  ├─ web
  │ ├─ __tests__
  │ │ ├─ centralized-rate-limiting.test.ts
  │ │ ├─ log-correlation-engine.test.ts
  │ │ ├─ log-streams-webhook-logic.test.ts
  │ │ ├─ logging-action-enhancements.test.ts
  │ ├─ centralized-rate-limiting.test.ts
  │ ├─ lib
  │ │ ├─ __tests__
  │ │ │ ├─ console-override.test.ts
  │ │ ├─ email
  │ │ │ └─ __tests__
  │ │ │   ├─ email-service.test.ts
  │ │ │   └─ email-templates.test.ts
  │ ├─ log-correlation-engine.test.ts
  │ ├─ log-streams-webhook-logic.test.ts
  │ ├─ logging-action-enhancements.test.ts
  │ ├─ setup.ts
  │ ├─ app
  │ │ ├─ showcase
  │ │ │ └─ __tests__
  │ │ │   └─ page.test.tsx
  │ ├─ components
  │ │ ├─ auth
  │ │ │ ├─ __tests__
  │ │ │ │ ├─ auth-provider-methods.test.tsx
  │ │ │ │ ├─ auth-provider.test.tsx
  │ │ │ │ ├─ change-password-form.test.tsx
  │ │ │ │ ├─ github-oauth-button.test.tsx
  │ │ │ │ ├─ google-oauth-button.test.tsx
  │ │ │ │ ├─ login-form.test.tsx
  │ │ │ │ ├─ logout-button.test.tsx
  │ │ │ │ ├─ password-reset-confirm-form.test.tsx
  │ │ │ │ ├─ password-reset-form.test.tsx
  │ │ │ │ ├─ register-form.test.tsx
  │ │ │ │ └─ remember-me.test.tsx
  │ │ ├─ chat
  │ │ │ ├─ __tests__
  │ │ │ │ ├─ assistant-message.test.tsx
  │ │ │ │ ├─ chat-interface.test.tsx
  │ │ │ │ ├─ message-list.test.tsx
  │ │ │ │ ├─ typing-indicator.test.tsx
  │ │ │ │ └─ user-message.test.tsx
  │ │ ├─ debug-logs
  │ │ │ ├─ __tests__
  │ │ │ │ ├─ cleanup-controls.test.tsx
  │ │ │ │ ├─ cost-monitoring.test.tsx
  │ │ │ │ ├─ database-health.test.tsx
  │ │ │ │ ├─ log-search.test.tsx
  │ │ │ │ ├─ rate-limit-status.test.tsx
  │ │ │ │ └─ system-health-overview.test.tsx
  │ │ ├─ dev
  │ │ │ ├─ __tests__
  │ │ │ │ └─ mock-email-viewer.test.tsx
  │ │ ├─ logging
  │ │ │ ├─ __tests__
  │ │ │ │ ├─ logging-provider.test.tsx
  │ │ │ │ └─ logging-status.test.tsx
  │ │ └─ theme
  │ │   └─ __tests__
  │ │     ├─ theme-integration.test.tsx
  │ │     ├─ theme-provider.test.tsx
  │ │     └─ theme-toggle.test.tsx
  └─ workers
    └─ log-ingestion
      ├─ integration
      │ ├─ cross-system.test.ts
      │ ├─ integration.test.ts
      │ ├─ jest-globals.ts
      │ ├─ load.test.ts
      │ ├─ migration.test.ts
      │ ├─ setup.ts
      └─ src
        ├─ index.test.ts
        ├─ log-processor.test.ts
        ├─ rate-limiter.test.ts
        └─ redis-client.test.ts