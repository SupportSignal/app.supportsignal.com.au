# Frontend Only

> **Generated:** 2025-08-06 13:57:23 UTC  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** Next.js web app only

---

├─ apps
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
│ │ └─ types
│ │   └─ chat.ts
└─ packages
  ├─ ui
  │ ├─ index.ts
  │ ├─ jest.config.js
  │ ├─ jest.setup.js
  │ ├─ package.json
  │ ├─ src
  │ │ ├─ __tests__
  │ │ │ ├─ button.test.tsx
  │ │ │ ├─ card.test.tsx
  │ │ │ ├─ input.test.tsx
  │ │ ├─ alert-dialog.tsx
  │ │ ├─ alert.tsx
  │ │ ├─ badge.tsx
  │ │ ├─ button.tsx
  │ │ ├─ card.tsx
  │ │ ├─ checkbox.tsx
  │ │ ├─ collapsible.tsx
  │ │ ├─ dropdown-menu.tsx
  │ │ ├─ input.tsx
  │ │ ├─ label.tsx
  │ │ ├─ lib
  │ │ │ ├─ utils.ts
  │ │ ├─ progress.tsx
  │ │ ├─ select.tsx
  │ │ ├─ separator.tsx
  │ │ ├─ table.tsx
  │ │ ├─ tabs.tsx
  │ │ ├─ textarea.tsx
  │ │ ├─ tooltip.tsx
  │ ├─ tsconfig.json
  └─ storybook
    ├─ CLAUDE.md
    ├─ README.md
    ├─ index.ts
    ├─ node_modules
    ├─ package.json
    ├─ pnpm-lock.yaml
    ├─ stories
    │ ├─ Button.stories.ts
    │ ├─ Button.stories.tsx
    │ ├─ Button.tsx
    │ ├─ Configure.mdx
    │ ├─ Header.stories.ts
    │ ├─ Header.tsx
    │ ├─ Page.stories.ts
    │ ├─ Page.tsx
    │ ├─ assets
    │ │ ├─ accessibility.png
    │ │ ├─ accessibility.svg
    │ │ ├─ addon-library.png
    │ │ ├─ assets.png
    │ │ ├─ avif-test-image.avif
    │ │ ├─ context.png
    │ │ ├─ discord.svg
    │ │ ├─ docs.png
    │ │ ├─ figma-plugin.png
    │ │ ├─ github.svg
    │ │ ├─ share.png
    │ │ ├─ styling.png
    │ │ ├─ testing.png
    │ │ ├─ theming.png
    │ │ ├─ tutorials.svg
    │ │ ├─ youtube.svg
    │ ├─ button.css
    │ ├─ header.css
    │ ├─ page.css
    ├─ storybook.css
    ├─ tailwind.config.js
    └─ tsconfig.json