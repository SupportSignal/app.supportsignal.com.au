# Epic 5: Quality of Life & Production-Ready Features

**Goal:** To add high-value features that enhance the developer experience (DX) and demonstrate production-readiness, including a simple theme customizer, observability integrations, and database seeding scripts.

---
## Story 5.1: Implement UI Theme Customizer
*As a developer, I want a simple UI to change core branding elements like colors and fonts, so I can quickly customize the template for a new project.*

**Acceptance Criteria:**
1.  A "Theming" section is added to a `/settings` page.
2.  The UI provides controls to change primary/secondary colors.
3.  Changes are applied in real-time using CSS Custom Properties.
4.  A "Save Theme" button is present.

---
## Story 5.2: Persist User Theme Settings
*As a developer, I want my theme customizations to be saved, so they persist across sessions.*

**Acceptance Criteria:**
1.  The `users` schema in Convex is updated with a `themeSettings` field.
2.  Clicking "Save Theme" saves settings to the user's profile via a Convex mutation.
3.  When the app loads, it fetches and applies the user's saved theme.

---
## Story 5.3: Build the Observability Showcase
*As a developer, I want a simple page to demonstrate that our observability tools are working, so I can trust that errors and events are being captured.*

**Acceptance Criteria:**
1.  A new page is created at `/debug/observability`.
2.  The page contains buttons to trigger a sample Sentry error and a sample PostHog event.
3.  The page includes links to the project's Sentry and PostHog dashboards for verification.

---
## Story 5.4: Create Initial Database Seeding Scripts
*As a developer, I want a baseline database seeding script, so I can easily populate my development environment with realistic test data.*

**Acceptance Criteria:**
1.  A new script is created in `packages/agent-scripts/seed.ts`.
2.  The script uses `Faker.js` to generate a sample set of data.
3.  A `bun run seed` command is added to execute the script.
4.  The development database is successfully populated after running the script.