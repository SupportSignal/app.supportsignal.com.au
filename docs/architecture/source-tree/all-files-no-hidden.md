# All Files (No Hidden)

> **Generated:** 2025-08-06 13:57:23 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Complete project excluding hidden folders

---

├─ apps
│ ├─ convex
│ │ ├─ README.md
│ │ ├─ _generated
│ │ ├─ agent.ts
│ │ ├─ agentActions.ts
│ │ ├─ analysis.ts
│ │ ├─ auth.ts
│ │ ├─ cleanup.deprecated.ts
│ │ ├─ cleanup.old.ts
│ │ ├─ cleanupLoggingTables.ts
│ │ ├─ clearAll.ts
│ │ ├─ companies.ts
│ │ ├─ convex.json
│ │ ├─ debugActions.ts
│ │ ├─ debugLogs.ts
│ │ ├─ email.ts
│ │ ├─ incidents.ts
│ │ ├─ internalLogging.ts
│ │ ├─ jest.config.js
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
│ │ ├─ package.json
│ │ ├─ prompts.ts
│ │ ├─ queries.ts
│ │ ├─ rateLimiter.deprecated.ts
│ │ ├─ rateLimiter.old.ts
│ │ ├─ schema.ts
│ │ ├─ seed.ts
│ │ ├─ simpleCleanup.ts
│ │ ├─ tsconfig.json
│ │ ├─ users.ts
│ │ ├─ workerSync.ts
│ ├─ web
│ │ ├─ __tests__
│ │ │ ├─ centralized-rate-limiting.test.ts
│ │ │ ├─ log-correlation-engine.test.ts
│ │ │ ├─ log-streams-webhook-logic.test.ts
│ │ │ ├─ logging-action-enhancements.test.ts
│ │ ├─ app
│ │ │ ├─ admin
│ │ │ │ ├─ layout.tsx
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ │ │ └─ route.ts
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
│ │ │ ├─ debug
│ │ │ │ ├─ components
│ │ │ │ │ ├─ CorrelationPanel.tsx
│ │ │ │ │ ├─ ExportControls.tsx
│ │ │ │ │ ├─ LogEntryCard.tsx
│ │ │ │ │ ├─ LogTableViewer.tsx
│ │ │ │ │ ├─ RecentTraces.tsx
│ │ │ │ │ ├─ TestLogGenerator.tsx
│ │ │ │ │ ├─ TimelineViewer.tsx
│ │ │ │ │ ├─ TraceSearchForm.tsx
│ │ │ │ ├─ lib
│ │ │ │ │ ├─ debug-api.ts
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-env
│ │ │ │ ├─ page.tsx
│ │ │ ├─ debug-logs
│ │ │ │ ├─ page.tsx
│ │ │ ├─ dev
│ │ │ │ ├─ page.tsx
│ │ │ ├─ forgot-password
│ │ │ │ ├─ page.tsx
│ │ │ ├─ globals.css
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
│ │ ├─ apps
│ │ │ ├─ web
│ │ │ │ └─ tsconfig.src.json
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
│ │ │ ├─ theme
│ │ │ │ ├─ __tests__
│ │ │ │ │ ├─ theme-integration.test.tsx
│ │ │ │ │ ├─ theme-provider.test.tsx
│ │ │ │ │ ├─ theme-toggle.test.tsx
│ │ │ │ ├─ theme-provider.tsx
│ │ │ │ ├─ theme-toggle.tsx
│ │ │ ├─ ui
│ │ ├─ components.json
│ │ ├─ convex
│ │ │ ├─ _generated
│ │ ├─ dist
│ │ │ ├─ 404
│ │ │ │ ├─ index.html
│ │ │ ├─ 404.html
│ │ │ ├─ _headers
│ │ │ ├─ _next
│ │ │ │ ├─ static
│ │ │ │ │ ├─ build_1754282858045
│ │ │ │ │ │ ├─ _buildManifest.js
│ │ │ │ │ │ ├─ _ssgManifest.js
│ │ │ │ │ ├─ chunks
│ │ │ │ │ │ ├─ 108-2bfe596ec743145a.js
│ │ │ │ │ │ ├─ 117-84202582ec257c41.js
│ │ │ │ │ │ ├─ 144.e921b574fff7c897.js
│ │ │ │ │ │ ├─ 1dd3208c-e8236b598a80fd86.js
│ │ │ │ │ │ ├─ 203-838518ae5286684d.js
│ │ │ │ │ │ ├─ 235-3bd7e9e876eefc49.js
│ │ │ │ │ │ ├─ 340-d3101206b9d55f5a.js
│ │ │ │ │ │ ├─ 342-e80eb803939b30c3.js
│ │ │ │ │ │ ├─ 38-b16b1c12665b5400.js
│ │ │ │ │ │ ├─ 388-86d36f460b2fbbdc.js
│ │ │ │ │ │ ├─ 528-b0a42500cf9b4c56.js
│ │ │ │ │ │ ├─ 540.3a55e6706d0bc17b.js
│ │ │ │ │ │ ├─ 65-57e083e9cb6ca665.js
│ │ │ │ │ │ ├─ 696-13233ea4cd3586b3.js
│ │ │ │ │ │ ├─ 831-3d4a98c33686281f.js
│ │ │ │ │ │ ├─ app
│ │ │ │ │ │ │ ├─ _not-found
│ │ │ │ │ │ │ │ ├─ page-0600d3737d016317.js
│ │ │ │ │ │ │ ├─ auth
│ │ │ │ │ │ │ │ ├─ github
│ │ │ │ │ │ │ │ │ ├─ callback
│ │ │ │ │ │ │ │ │ │ └─ page-c9ac3515f0cc0c9d.js
│ │ │ │ │ │ │ │ ├─ google
│ │ │ │ │ │ │ │ │ └─ callback
│ │ │ │ │ │ │ │ │   └─ page-57642b5b5b0e3e36.js
│ │ │ │ │ │ │ ├─ change-password
│ │ │ │ │ │ │ │ ├─ page-9e42e9f4a3d31505.js
│ │ │ │ │ │ │ ├─ chat
│ │ │ │ │ │ │ │ ├─ page-c68b9d9358695e9b.js
│ │ │ │ │ │ │ ├─ debug
│ │ │ │ │ │ │ │ ├─ page-9eaff1fcde18e8ba.js
│ │ │ │ │ │ │ ├─ dev
│ │ │ │ │ │ │ │ ├─ page-4f919b9c0a86de79.js
│ │ │ │ │ │ │ ├─ forgot-password
│ │ │ │ │ │ │ │ ├─ page-3344e5204680dc2f.js
│ │ │ │ │ │ │ ├─ layout-9c6de5d89d796f1a.js
│ │ │ │ │ │ │ ├─ login
│ │ │ │ │ │ │ │ ├─ page-dc4a89cb04435afd.js
│ │ │ │ │ │ │ ├─ page-8deb3234a1c03ae8.js
│ │ │ │ │ │ │ ├─ protected
│ │ │ │ │ │ │ │ ├─ page-bad89bfd72368388.js
│ │ │ │ │ │ │ ├─ register
│ │ │ │ │ │ │ │ ├─ page-c8f8a108789970e8.js
│ │ │ │ │ │ │ ├─ reset-password
│ │ │ │ │ │ │ │ ├─ page-1aa999391f2b86ba.js
│ │ │ │ │ │ │ ├─ showcase
│ │ │ │ │ │ │ │ ├─ page-72b72aa10810238f.js
│ │ │ │ │ │ │ ├─ test-llm
│ │ │ │ │ │ │ │ └─ page-c164355ea52e1269.js
│ │ │ │ │ │ ├─ framework-3664cab31236a9fa.js
│ │ │ │ │ │ ├─ main-1b269a8923acab36.js
│ │ │ │ │ │ ├─ main-app-6cf6fba2f178f590.js
│ │ │ │ │ │ ├─ pages
│ │ │ │ │ │ │ ├─ _app-10a93ab5b7c32eb3.js
│ │ │ │ │ │ │ ├─ _error-2d792b2a41857be4.js
│ │ │ │ │ │ ├─ polyfills-42372ed130431b0a.js
│ │ │ │ │ │ ├─ webpack-d7facb4d25f8faf3.js
│ │ │ │ │ ├─ css
│ │ │ │ │ │ ├─ 7620feb005d9b94b.css
│ │ │ │ │ └─ media
│ │ │ │ │   ├─ 26a46d62cd723877-s.woff2
│ │ │ │ │   ├─ 55c55f0601d81cf3-s.woff2
│ │ │ │ │   ├─ 581909926a08bbc8-s.woff2
│ │ │ │ │   ├─ 8e9860b6e62d6359-s.woff2
│ │ │ │ │   ├─ 97e0cb1ae144a2a9-s.woff2
│ │ │ │ │   ├─ df0a9ae256c0569c-s.woff2
│ │ │ │ │   └─ e4af272ccee01ff0-s.p.woff2
│ │ │ ├─ _routes.json
│ │ │ ├─ _worker.js
│ │ │ │ ├─ __next-on-pages-dist__
│ │ │ │ │ ├─ cache
│ │ │ │ │ │ ├─ adaptor.js
│ │ │ │ │ │ ├─ cache-api.js
│ │ │ │ │ │ └─ kv.js
│ │ │ │ ├─ index.js
│ │ │ │ ├─ nop-build-log.json
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ ├─ index.html
│ │ │ │ │ │ └─ index.txt
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │   ├─ index.html
│ │ │ │ │   └─ index.txt
│ │ │ ├─ cdn-cgi
│ │ │ │ ├─ errors
│ │ │ │ │ └─ no-nodejs_compat.html
│ │ │ ├─ change-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ chat
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ dev
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ forgot-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ index.html
│ │ │ ├─ index.txt
│ │ │ ├─ login
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ protected
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ register
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ reset-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ showcase
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ test-llm
│ │ │ │ ├─ index.html
│ │ │ │ └─ index.txt
│ │ ├─ docs
│ │ │ ├─ chrome-remote-debugging-design.md
│ │ ├─ jest.config.ci.js
│ │ ├─ jest.config.js
│ │ ├─ jest.config.mjs.backup
│ │ ├─ jest.setup.js
│ │ ├─ jest.setup.js.backup
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
│ │ │ ├─ test-utils.tsx
│ │ │ ├─ utils.ts
│ │ │ ├─ version-storage.ts
│ │ │ ├─ version-utils.ts
│ │ ├─ next-env.d.ts
│ │ ├─ next.config.js
│ │ ├─ node_modules
│ │ ├─ out
│ │ │ ├─ 404
│ │ │ │ ├─ index.html
│ │ │ ├─ 404.html
│ │ │ ├─ _next
│ │ │ │ ├─ build_1754452511674
│ │ │ │ ├─ static
│ │ │ │ │ ├─ build_1754452511674
│ │ │ │ │ │ ├─ _buildManifest.js
│ │ │ │ │ │ ├─ _ssgManifest.js
│ │ │ │ │ ├─ chunks
│ │ │ │ │ │ ├─ 108-2bfe596ec743145a.js
│ │ │ │ │ │ ├─ 144.82477060c4018f56.js
│ │ │ │ │ │ ├─ 1dd3208c-d8805bbe278132e7.js
│ │ │ │ │ │ ├─ 230-163ab15b9ead0642.js
│ │ │ │ │ │ ├─ 318-b12c8ed7d4f76e99.js
│ │ │ │ │ │ ├─ 340-78504ce91d8e9728.js
│ │ │ │ │ │ ├─ 38-b16b1c12665b5400.js
│ │ │ │ │ │ ├─ 528-c00304921a536d22.js
│ │ │ │ │ │ ├─ 540.3a55e6706d0bc17b.js
│ │ │ │ │ │ ├─ 599-edd8d3e5c2324c2f.js
│ │ │ │ │ │ ├─ 684-13a4ccd6ce211593.js
│ │ │ │ │ │ ├─ 752-2d72a583f4db2d57.js
│ │ │ │ │ │ ├─ 831-66e50d4db35787ed.js
│ │ │ │ │ │ ├─ 882-153fc80c2fae9d31.js
│ │ │ │ │ │ ├─ 892-8cf7a13961ce6ff4.js
│ │ │ │ │ │ ├─ 898-e5a491636ff39c8b.js
│ │ │ │ │ │ ├─ 980-c23ff734724bc27a.js
│ │ │ │ │ │ ├─ app
│ │ │ │ │ │ │ ├─ _not-found
│ │ │ │ │ │ │ │ ├─ page-d765114ac1af0636.js
│ │ │ │ │ │ │ ├─ auth
│ │ │ │ │ │ │ │ ├─ github
│ │ │ │ │ │ │ │ │ ├─ callback
│ │ │ │ │ │ │ │ │ │ └─ page-b065a5012ddbd1f2.js
│ │ │ │ │ │ │ │ ├─ google
│ │ │ │ │ │ │ │ │ └─ callback
│ │ │ │ │ │ │ │ │   └─ page-b1393c6e0c6a771c.js
│ │ │ │ │ │ │ ├─ change-password
│ │ │ │ │ │ │ │ ├─ page-436a27e1323465a4.js
│ │ │ │ │ │ │ ├─ chat
│ │ │ │ │ │ │ │ ├─ page-ff29c38c3294fd41.js
│ │ │ │ │ │ │ ├─ debug
│ │ │ │ │ │ │ │ ├─ page-5dc3b49f36266005.js
│ │ │ │ │ │ │ ├─ debug-env
│ │ │ │ │ │ │ │ ├─ page-1a8ea4547874976b.js
│ │ │ │ │ │ │ ├─ debug-logs
│ │ │ │ │ │ │ │ ├─ page-f5b54f9666ec2c7c.js
│ │ │ │ │ │ │ ├─ dev
│ │ │ │ │ │ │ │ ├─ page-17dba7df8001f180.js
│ │ │ │ │ │ │ ├─ forgot-password
│ │ │ │ │ │ │ │ ├─ page-32345110b3fb3c25.js
│ │ │ │ │ │ │ ├─ layout-ba1aa7dd69bf90e8.js
│ │ │ │ │ │ │ ├─ login
│ │ │ │ │ │ │ │ ├─ page-b680df5e88d9f75f.js
│ │ │ │ │ │ │ ├─ page-118169d2463159f3.js
│ │ │ │ │ │ │ ├─ protected
│ │ │ │ │ │ │ │ ├─ page-648ab4d44f67d9a2.js
│ │ │ │ │ │ │ ├─ register
│ │ │ │ │ │ │ │ ├─ page-b9350bf81552a0d2.js
│ │ │ │ │ │ │ ├─ reset-password
│ │ │ │ │ │ │ │ ├─ page-e71f40f4e47851cd.js
│ │ │ │ │ │ │ ├─ showcase
│ │ │ │ │ │ │ │ ├─ page-20ddc10fd0eb82c3.js
│ │ │ │ │ │ │ ├─ test-llm
│ │ │ │ │ │ │ │ └─ page-f898e477ce5babee.js
│ │ │ │ │ │ ├─ framework-3664cab31236a9fa.js
│ │ │ │ │ │ ├─ main-app-6cf6fba2f178f590.js
│ │ │ │ │ │ ├─ main-f1b5396e484d1b4c.js
│ │ │ │ │ │ ├─ pages
│ │ │ │ │ │ │ ├─ _app-10a93ab5b7c32eb3.js
│ │ │ │ │ │ │ ├─ _error-2d792b2a41857be4.js
│ │ │ │ │ │ ├─ polyfills-42372ed130431b0a.js
│ │ │ │ │ │ ├─ webpack-beab04a69e0b497f.js
│ │ │ │ │ ├─ css
│ │ │ │ │ │ ├─ 8d81520457afc538.css
│ │ │ │ │ └─ media
│ │ │ │ │   ├─ 26a46d62cd723877-s.woff2
│ │ │ │ │   ├─ 55c55f0601d81cf3-s.woff2
│ │ │ │ │   ├─ 581909926a08bbc8-s.woff2
│ │ │ │ │   ├─ 8e9860b6e62d6359-s.woff2
│ │ │ │ │   ├─ 97e0cb1ae144a2a9-s.woff2
│ │ │ │ │   ├─ df0a9ae256c0569c-s.woff2
│ │ │ │ │   └─ e4af272ccee01ff0-s.p.woff2
│ │ │ ├─ api
│ │ │ │ ├─ redis-stats
│ │ │ ├─ auth
│ │ │ │ ├─ github
│ │ │ │ │ ├─ callback
│ │ │ │ │ │ ├─ index.html
│ │ │ │ │ │ └─ index.txt
│ │ │ │ ├─ google
│ │ │ │ │ └─ callback
│ │ │ │ │   ├─ index.html
│ │ │ │ │   └─ index.txt
│ │ │ ├─ change-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ chat
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug-env
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ debug-logs
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ dev
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ forgot-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ index.html
│ │ │ ├─ index.txt
│ │ │ ├─ login
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ protected
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ register
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ reset-password
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ showcase
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ test-llm
│ │ │ │ ├─ index.html
│ │ │ │ ├─ index.txt
│ │ │ ├─ version-manifest.json
│ │ ├─ package.json
│ │ ├─ postcss.config.js
│ │ ├─ public
│ │ │ ├─ version-manifest.json
│ │ ├─ tailwind.config.js
│ │ ├─ tsconfig.json
│ │ ├─ tsconfig.tsbuildinfo
│ │ ├─ types
│ │ │ └─ chat.ts
│ ├─ workers
│ │ └─ log-ingestion
│ │   ├─ dist
│ │   │ ├─ index.js
│ │   ├─ jest.config.js
│ │   ├─ node_modules
│ │   ├─ package.json
│ │   ├─ src
│ │   │ ├─ index.ts
│ │   │ ├─ log-processor.ts
│ │   │ ├─ rate-limiter.ts
│ │   │ ├─ redis-client.ts
│ │   │ ├─ types.ts
│ │   ├─ tsconfig.json
│ │   ├─ wrangler.toml
│ │   └─ wrangler.toml.example
├─ docs
│ ├─ agents-gemini
│ │ ├─ engineering-assistant.md
│ ├─ architecture
│ │ ├─ api-implementation-details.md
│ │ ├─ architectural-addendum-final-clarifications.md
│ │ ├─ coding-standards.md
│ │ ├─ components.md
│ │ ├─ data-models.md
│ │ ├─ error-handling-strategy.md
│ │ ├─ high-level-architecture.md
│ │ ├─ index.md
│ │ ├─ infrastructure-and-deployment.md
│ │ ├─ introduction.md
│ │ ├─ real-time-user-data-synchronization-kdd.md
│ │ ├─ security.md
│ │ ├─ source-tree
│ │ │ ├─ README.md
│ │ │ ├─ backend-only.md
│ │ │ ├─ code-only.md
│ │ │ ├─ commands.md
│ │ │ ├─ deprecation-cleanup.md
│ │ │ ├─ docs-permanent.md
│ │ │ ├─ generate-trees.sh
│ │ │ ├─ test-backend-only.md
│ │ ├─ source-tree.md
│ │ ├─ tech-stack.md
│ ├─ architecture.md
│ ├─ development-guide.md
│ ├─ development-server-startup-guide.md
│ ├─ examples
│ │ ├─ backend
│ │ │ ├─ adaptive-rate-limiting-pattern.md
│ │ │ ├─ browser-log-capture-system.md
│ │ │ ├─ convex-runtime-architecture-constraints.md
│ │ │ ├─ kdd-story-3.1-summary.md
│ │ │ ├─ knowledge-ingestion-deployment-patterns.md
│ │ │ ├─ message-suppression-pattern.md
│ │ │ ├─ minimal-strategic-mocking-pattern.md
│ │ │ ├─ sensitive-data-redaction-pattern.md
│ │ ├─ cicd-deployment
│ │ │ ├─ cloudflare-pages-github-actions.md
│ │ ├─ cloudflare-pages-deployment
│ │ │ ├─ README.md
│ │ ├─ configuration
│ │ │ ├─ port-management-examples.md
│ │ ├─ index.md
│ │ ├─ monorepo-setup
│ │ │ └─ README.md
│ ├─ features
│ │ ├─ debug-logs-system.md
│ │ ├─ dynamic-source-tree-system.md
│ │ ├─ manifests
│ │ │ ├─ debug-logs-system.manifest.json
│ │ │ └─ testing-system.manifest.json
│ ├─ guides
│ │ ├─ index.md
│ │ ├─ kdd-implementation-guide.md
│ │ ├─ kdd-setup-guide.md
│ │ ├─ sprint-estimation-implementation-guide.md
│ ├─ historical
│ │ ├─ environment-sync-workflow-archive.md
│ │ ├─ index.md
│ ├─ index.md
│ ├─ kdd-lessons-learned.md
│ ├─ lessons-learned
│ │ ├─ anti-patterns
│ │ │ ├─ deployment-anti-patterns.md
│ │ │ ├─ monorepo-symlink-anti-patterns.md
│ │ │ ├─ over-mocking-anti-patterns.md
│ │ ├─ architecture
│ │ │ ├─ monorepo-lessons.md
│ │ ├─ build-output-standardization-kdd.md
│ │ ├─ dual-deployment-and-environment-variable-troubleshooting-kdd.md
│ │ ├─ index.md
│ │ ├─ oauth-environment-variable-configuration-kdd.md
│ ├─ logging-system-comprehensive-analysis.md
│ ├─ methodology
│ │ ├─ agentic-architect-developer-persona.md
│ │ ├─ bmad-context-engineering.md
│ │ ├─ bmad-overview.md
│ │ ├─ discovery-mode-kdd-protocol.md
│ │ ├─ kdd-integration-overview.md
│ │ ├─ youtube-brief-methodology.md
│ ├─ new-features
│ ├─ patterns
│ │ ├─ architecture-patterns.md
│ │ ├─ backend-patterns.md
│ │ ├─ development-workflow-patterns.md
│ │ ├─ frontend-patterns.md
│ │ ├─ index.md
│ │ ├─ react-act-warning-prevention.md
│ │ ├─ testing-architecture-patterns.md
│ ├─ prd
│ │ ├─ epic-1.md
│ │ ├─ epic-2.md
│ │ ├─ epic-3.md
│ │ ├─ index.md
│ ├─ prd.md
│ ├─ security
│ │ ├─ gitleaks-setup.md
│ ├─ setup-verification-checklist.md
│ ├─ stories
│ │ ├─ 1.1.story.md
│ ├─ technical-guides
│ │ ├─ api-security-and-secret-management.md
│ │ ├─ authentication-architecture.md
│ │ ├─ ci-debugging-methodology.md
│ │ ├─ cicd-pipeline-setup.md
│ │ ├─ cloudflare-pages-deployment-troubleshooting.md
│ │ ├─ cloudflare-pages-setup.md
│ │ ├─ cloudflare-vectorize-setup.md
│ │ ├─ convex-components-guide.md
│ │ ├─ convex-logging-cleanup-strategy.md
│ │ ├─ convex-naming-conventions-kdd.md
│ │ ├─ cost-effective-logging-in-convex-agentic-systems.md
│ │ ├─ dev-error-pipeline.md
│ │ ├─ environment-management.md
│ │ ├─ eslint-three-tier-configuration.md
│ │ ├─ file-system-exploration-and-segmentation-kdd.md
│ │ ├─ github-oauth-setup.md
│ │ ├─ google-oauth-setup.md
│ │ ├─ index.md
│ │ ├─ llm-api-setup.md
│ │ ├─ log-ingestion-worker-setup-kdd.md
│ │ ├─ logging-refactor-agent-delegation-guidelines.md
│ │ ├─ logging-refactor-comprehensive-specifications.md
│ │ ├─ project-environment-variable-management.md
│ │ ├─ scripts-and-commands-reference.md
│ │ ├─ typescript-configuration-best-practices.md
│ │ ├─ worker-deployment-setup.md
│ │ ├─ worker-redis-logging-architecture.md
│ ├─ template-usage
│ │ ├─ index.md
│ │ ├─ new-repository-setup-guide.md
│ │ ├─ setup-verification-checklist.md
│ ├─ testing
│ │ ├─ index.md
│ │ ├─ technical
│ │ │ ├─ chat-component-testing-lessons.md
│ │ │ ├─ convex-typescript-error-resolution-kdd.md
│ │ │ ├─ pragmatic-vs-perfectionist-testing-kdd.md
│ │ │ ├─ test-migration-and-configuration-kdd.md
│ │ │ ├─ test-strategy-and-standards.md
│ │ │ ├─ testing-infrastructure-architecture-kdd.md
│ │ │ ├─ testing-infrastructure-lessons-learned.md
│ │ │ ├─ testing-patterns.md
│ │ ├─ test-metrics.json
│ │ └─ uat
│ │   └─ uat-plan-1.1.md
├─ packages
│ ├─ storybook
│ │ ├─ CLAUDE.md
│ │ ├─ README.md
│ │ ├─ index.ts
│ │ ├─ node_modules
│ │ ├─ package.json
│ │ ├─ pnpm-lock.yaml
│ │ ├─ stories
│ │ │ ├─ Button.stories.ts
│ │ │ ├─ Button.stories.tsx
│ │ │ ├─ Button.tsx
│ │ │ ├─ Configure.mdx
│ │ │ ├─ Header.stories.ts
│ │ │ ├─ Header.tsx
│ │ │ ├─ Page.stories.ts
│ │ │ ├─ Page.tsx
│ │ │ ├─ assets
│ │ │ │ ├─ accessibility.png
│ │ │ │ ├─ accessibility.svg
│ │ │ │ ├─ addon-library.png
│ │ │ │ ├─ assets.png
│ │ │ │ ├─ avif-test-image.avif
│ │ │ │ ├─ context.png
│ │ │ │ ├─ discord.svg
│ │ │ │ ├─ docs.png
│ │ │ │ ├─ figma-plugin.png
│ │ │ │ ├─ github.svg
│ │ │ │ ├─ share.png
│ │ │ │ ├─ styling.png
│ │ │ │ ├─ testing.png
│ │ │ │ ├─ theming.png
│ │ │ │ ├─ tutorials.svg
│ │ │ │ ├─ youtube.svg
│ │ │ ├─ button.css
│ │ │ ├─ header.css
│ │ │ ├─ page.css
│ │ ├─ storybook.css
│ │ ├─ tailwind.config.js
│ │ ├─ tsconfig.json
│ ├─ ui
│ │ ├─ index.ts
│ │ ├─ jest.config.js
│ │ ├─ jest.setup.js
│ │ ├─ package.json
│ │ ├─ src
│ │ │ ├─ __tests__
│ │ │ │ ├─ button.test.tsx
│ │ │ │ ├─ card.test.tsx
│ │ │ │ ├─ input.test.tsx
│ │ │ ├─ alert-dialog.tsx
│ │ │ ├─ alert.tsx
│ │ │ ├─ badge.tsx
│ │ │ ├─ button.tsx
│ │ │ ├─ card.tsx
│ │ │ ├─ checkbox.tsx
│ │ │ ├─ collapsible.tsx
│ │ │ ├─ dropdown-menu.tsx
│ │ │ ├─ input.tsx
│ │ │ ├─ label.tsx
│ │ │ ├─ lib
│ │ │ │ ├─ utils.ts
│ │ │ ├─ progress.tsx
│ │ │ ├─ select.tsx
│ │ │ ├─ separator.tsx
│ │ │ ├─ table.tsx
│ │ │ ├─ tabs.tsx
│ │ │ ├─ textarea.tsx
│ │ │ ├─ tooltip.tsx
│ │ └─ tsconfig.json
├─ scripts
│ ├─ add-knowledge.sh
│ ├─ analyze-naming-conventions.ts
│ ├─ bootstrap-version-history.sh
│ ├─ ci-monitor.sh
│ ├─ ci-status.sh
│ ├─ cleanup-integration-test-data.ts
│ ├─ cleanup-logs.sh
│ ├─ debug-env-build.cjs
│ ├─ deploy-worker.sh
│ ├─ grant-llm-access.sh
│ ├─ integration-test.sh
│ ├─ llm-files
│ ├─ manual-cleanup.ts
│ ├─ migrate-logging-cleanup.sh
│ ├─ run-integration-tests.ts
│ ├─ seed-knowledge.cjs
│ ├─ smart-push.sh
│ ├─ sync-env.js
│ ├─ sync.sh
│ ├─ test-uat-4.2.sh
│ ├─ version-config.json
│ ├─ version-increment.sh
└─ tests
  ├─ convex
  │ ├─ __mocks__
  │ │ ├─ _generated
  │ │ ├─ convex
  │ │ │ └─ values.js
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
  │ ├─ app
  │ │ ├─ showcase
  │ │ │ └─ __tests__
  │ │ │   └─ page.test.tsx
  │ ├─ centralized-rate-limiting.test.ts
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
  │ │ ├─ theme
  │ │ │ └─ __tests__
  │ │ │   ├─ theme-integration.test.tsx
  │ │ │   ├─ theme-provider.test.tsx
  │ │ │   └─ theme-toggle.test.tsx
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