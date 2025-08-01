# 6. Epic Details

## **Epic 1: Platform Foundation & End-to-End Deployment**
**Goal:** To establish the complete project foundation by setting up the monorepo, configuring Convex, Cloudflare (Pages & Workers), and BetterAuth. This epic culminates in a fully automated CI/CD pipeline that deploys a minimal, authenticated page, proving the entire stack works end-to-end.

---
### **Story 1.1: Monorepo & Tooling Initialization**
*As a developer, I want a new project initialized with a Bun-based Turborepo and essential DX tooling, so that I have a clean, consistent, and high-quality starting point for development.*

**Acceptance Criteria:**
1.  A new project directory is created and initialized as a Git repository.
2.  The project is configured as a Bun-based monorepo using Turborepo.
3.  The root `package.json` includes scripts for linting, testing, and formatting.
4.  ESLint, Prettier, Husky, and commitlint are configured at the root level.
5.  The basic monorepo folder structure (`apps`, `packages`) is created.

---
### **Story 1.2: Basic Next.js App Shell**
*As a developer, I want a basic Next.js application shell set up within the monorepo, so that I have a place to start building the user interface.*

**Acceptance Criteria:**
1.  A new Next.js application is created within the `apps/web` directory.
2.  The application includes a single homepage (`/`) that displays a "Welcome" message.
3.  The application successfully runs locally using the `bun run dev` command.
4.  The application is configured with TypeScript (Strict Mode) and Tailwind CSS.

---
### **Story 1.3: Cloudflare Pages Deployment**
*As a developer, I want the basic Next.js app to be deployable via Cloudflare Pages, so that I can view the application on a public URL and validate the hosting setup.*

**Acceptance Criteria:**
1.  A Cloudflare Pages project is configured for the `apps/web` application.
2.  The Next.js adapter for Cloudflare is installed and configured.
3.  A manual deployment to Cloudflare Pages succeeds.
4.  The "Welcome" page is accessible at the provided `*.pages.dev` URL.

---
### **Story 1.4: Convex Backend Integration**
*As a developer, I want the Next.js frontend to be connected to a Convex backend project, so that the foundation for real-time data and server logic is in place.*

**Acceptance Criteria:**
1.  A new Convex project is initialized and linked to the `apps/convex` directory.
2.  The `ConvexProvider` is correctly configured to wrap the Next.js application.
3.  A simple test query is created in Convex and called from the homepage to confirm the connection.

---
### **Story 1.5: Foundational Authentication**
*As a user, I want to be able to sign up, log in, and log out of the application, so that my identity can be securely managed.*

**Acceptance Criteria:**
1.  BetterAuth is integrated with the Convex backend and the Next.js frontend.
2.  The UI includes functional "Login" and "Logout" buttons.
3.  A user can successfully sign up for a new account.
4.  Upon login, the user's session is established and can be verified.
5.  A basic client-side protected component or page is created that is only visible to authenticated users.

---
### **Story 1.6: Automated CI/CD Pipeline**
*As a developer, I want a CI/CD pipeline in GitHub Actions, so that every push to the main branch is automatically tested and deployed.*

**Acceptance Criteria:**
1.  A GitHub Actions workflow file is created in `.github/workflows/`.
2.  The workflow triggers automatically on push to the `main` branch.
3.  The pipeline includes jobs for linting, testing, and building the applications.
4.  If all jobs pass, the pipeline automatically deploys the app to Cloudflare Pages.
5.  The pipeline fails and blocks deployment if any job fails.

---
### **Story 1.7: Port Management Documentation**
*As a developer, I want a clear port management strategy documented, so that I can avoid conflicts between my local development server and AI-driven test runners.*

**Acceptance Criteria:**
1.  A `CONTRIBUTING.md` or `docs/development-guide.md` file is created.
2.  The document outlines reserved network ports for different processes (e.g., Main dev server, Storybook, AI Test Runners).
3.  The document provides clear instructions on how to configure these ports.

## **Epic 2: UI Toolkit & Component Showcase**
**Goal:** To integrate the full UI toolkit (ShadCN, Tailwind) and Storybook. This epic focuses on building out the component showcase page with a functional light/dark mode theme toggle, creating a living library for all future UI development.

---
### **Story 2.1: Integrate ShadCN/UI Library**
*As a developer, I want the ShadCN/UI library fully integrated into the Next.js application, so that I have a set of accessible, themeable components to build with.*

**Acceptance Criteria:**
1.  The ShadCN/UI CLI is used to initialize the library in the `apps/web` project.
2.  Core dependencies like Tailwind CSS and Radix UI are correctly configured.
3.  A handful of basic components (e.g., `Button`, `Card`, `Input`) are added to the `packages/ui` directory.
4.  The components can be successfully imported and rendered on the homepage.

---
### **Story 2.2: Set Up Storybook Environment**
*As a developer, I want a Storybook environment set up for our shared UI package, so that I can develop, test, and document components in isolation.*

**Acceptance Criteria:**
1.  Storybook is initialized in a new `packages/storybook` directory.
2.  It is configured to find and display components from the `packages/ui` directory.
3.  A sample story is created for the `Button` component.
4.  The Storybook instance can be run locally using a dedicated script (e.g., `bun run storybook`).

---
### **Story 2.3: Build the Component Showcase Page**
*As a user, I want to view a page that showcases all available UI components, so that I can understand the visual language and capabilities of the starter template.*

**Acceptance Criteria:**
1.  A new page is created at `/showcase` in the Next.js application.
2.  This page imports and displays an instance of every component from the `packages/ui` library.
3.  The page is linked in the main navigation.
4.  The page layout is clean, responsive, and easy to navigate.

---
### **Story 2.4: Implement Theme & Dark Mode Toggler**
*As a user, I want to be able to switch between light and dark modes, so that I can use the application comfortably in different lighting conditions.*

**Acceptance Criteria:**
1.  A theme provider is configured at the root of the Next.js application.
2.  A UI control (e.g., a button with a sun/moon icon) is added to the main layout.
3.  Clicking the control instantly toggles the application's color scheme between light and dark mode.
4.  The user's theme preference is persisted across sessions (e.g., using local storage).
5.  All components on the `/showcase` page render correctly in both light and dark modes.

## **Epic 3: Resilient Real-time Logging**
**Goal:** To implement a resilient, real-time "Live Log Stream" feature by creating a log buffer pattern that prevents system overload and manages costs, while providing a useful observability tool.

---
### **Story 3.1: Define Log Queue & Cache Schemas**
*As a developer, I need schemas for both a raw log queue and a temporary real-time cache, so that we can decouple log ingestion from processing.*

**Acceptance Criteria:**
1.  A `log_queue` table is defined in the Convex schema to act as the initial buffer for all incoming log events.
2.  The `recent_log_entries` table (for the UI) is defined with a Time-To-Live (TTL) index configured to automatically delete documents after 60 minutes.
3.  A scheduled function is created to periodically purge any logs older than the TTL as a failsafe mechanism.

---
### **Story 3.2: Implement Log Ingestion/Enqueue Mutation**
*As a developer, I want a fast, lightweight mutation to enqueue incoming log events, so that log producers (client, server) can fire events without waiting for processing.*

**Acceptance Criteria:**
1.  A Convex mutation `log:enqueue` is created.
2.  Its only responsibility is to write a raw log document to the `log_queue` table.
3.  The client-side and server-side logging utilities are updated to call this `log:enqueue` mutation.

---
### **Story 3.3: Build the Batch Processing & Sampling Agent**
*As an architect, I want a scheduled backend agent that processes the log queue in batches, so that we can apply cost-saving logic like deduplication and sampling.*

**Acceptance Criteria:**
1.  A scheduled Convex **action** `log:processQueue` is created to run every 10-15 seconds.
2.  The action reads all new documents from the `log_queue`.
3.  It includes logic to deduplicate identical messages within the batch.
4.  It includes basic sampling logic (e.g., process all `ERROR` logs, but only 20% of `INFO` logs).
5.  The processed batch is sent to Logflare for long-term storage.
6.  The processed batch is also written to the `recent_log_entries` table for the UI.
7.  Successfully processed logs are deleted from the `log_queue`.

---
### **Story 3.4: Build the Real-time Log Stream UI**
*As a user, I want to see a live stream of the *processed* log events, so that I can observe the system's real-time activity.*

**Acceptance Criteria:**
1.  The `/logs` page is built to query the `recent_log_entries` table.
2.  The UI updates in real-time as the `log:processQueue` agent adds new entries to the table.
3.  The UI correctly displays aggregated logs (e.g., `(x100) Error: Failed to connect...`).
4.  A disclaimer is present on the UI explaining it shows a temporary, real-time view of recent events.

## **Epic 4: Conversational AI & RAG Foundation**
**Goal:** To implement the user-facing chat interface and the foundational `KnowledgeService` connected to our Vector DB, delivering a functional chatbot that can answer questions based on ingested documents (including source code and markdown).

---
### **Story 4.1: Build the Basic Chat UI**
*As a user, I want a clean, familiar chat interface, so that I can easily interact with the AI assistant.*

**Acceptance Criteria:**
1.  A new page is created at `/chat`.
2.  The UI includes a message display area, a user input field, and a send button.
3.  The chat history is displayed with clear visual distinction between "user" and "assistant" messages.
4.  The input field is disabled while the assistant is generating a response.
5.  The interface is fully responsive and works on mobile devices.

---
### **Story 4.2: Implement the Knowledge Ingestion Service**
*As a developer, I need a backend service to process documents, create vector embeddings, and store them in our Vector DB, so that our AI has a knowledge base to retrieve context from.*

**Acceptance Criteria:**
1.  A Convex action `knowledge:addDocument` is created.
2.  This action takes text content as input.
3.  It uses a library to generate vector embeddings for chunks of the document text.
4.  The text chunks and their embeddings are successfully stored in our Cloudflare Vectorize DB.
5.  The seeding script is configured to process all key project documents in `/docs` and key source code files in `apps/` and `packages/`.

---
### **Story 4.3: Implement the RAG-Powered Chat Backend**
*As a developer, I want to connect the chat UI to a backend that uses RAG to generate context-aware responses, so that the chatbot can answer questions about our project.*

**Acceptance Criteria:**
1.  The `AI Tool Service` (using the Vercel AI SDK) is configured with a `queryKnowledgeBase` tool.
2.  When the user sends a message, this tool is called.
3.  The tool generates an embedding for the user's query and searches the Vectorize DB for relevant document chunks.
4.  These chunks are compiled into a context block and sent to the Claude API along with the original user query.
5.  The response from Claude is streamed back to the frontend UI.

---
### **Story 4.4: Display Sources for RAG Responses**
*As a user, I want to see the sources the AI used to formulate its answer, so that I can trust the information and explore the topic further.*

**Acceptance Criteria:**
1.  The RAG response object from the backend includes metadata about which document chunks were used as context.
2.  The chat UI displays a "Sources" section below each AI-generated message.
3.  This section lists the source documents (e.g., `README.md`, `ARCHITECTURE.md`) that were used to generate the answer.

## **Epic 5: Quality of Life & Production-Ready Features**
**Goal:** To add high-value features that enhance the developer experience (DX) and demonstrate production-readiness, including a simple theme customizer, observability integrations, and database seeding scripts.

---
### **Story 5.1: Implement UI Theme Customizer**
*As a developer, I want a simple UI to change core branding elements like colors and fonts, so I can quickly customize the template for a new project.*

**Acceptance Criteria:**
1.  A "Theming" section is added to a `/settings` page.
2.  The UI provides controls to change primary/secondary colors.
3.  Changes are applied in real-time using CSS Custom Properties.
4.  A "Save Theme" button is present.

---
### **Story 5.2: Persist User Theme Settings**
*As a developer, I want my theme customizations to be saved, so they persist across sessions.*

**Acceptance Criteria:**
1.  The `users` schema in Convex is updated with a `themeSettings` field.
2.  Clicking "Save Theme" saves settings to the user's profile via a Convex mutation.
3.  When the app loads, it fetches and applies the user's saved theme.

---
### **Story 5.3: Build the Observability Showcase**
*As a developer, I want a simple page to demonstrate that our observability tools are working, so I can trust that errors and events are being captured.*

**Acceptance Criteria:**
1.  A new page is created at `/debug/observability`.
2.  The page contains buttons to trigger a sample Sentry error and a sample PostHog event.
3.  The page includes links to the project's Sentry and PostHog dashboards for verification.

---
### **Story 5.4: Create Initial Database Seeding Scripts**
*As a developer, I want a baseline database seeding script, so I can easily populate my development environment with realistic test data.*

**Acceptance Criteria:**
1.  A new script is created in `packages/agent-scripts/seed.ts`.
2.  The script uses `Faker.js` to generate a sample set of data.
3.  A `bun run seed` command is added to execute the script.
4.  The development database is successfully populated after running the script.

## **Epic 6: Documentation & Onboarding Polish**
**Goal:** To complete all user-facing documentation, including "Getting Started" and "Deployment" guides, and perform a final polish of the entire starter template for its v1.0 release.

---
### **Story 6.1: Write the "Getting Started" Guide (README.md)**
*As a new developer, I want a comprehensive `README.md` file, so that I can understand the project's purpose and how to set it up locally.*

**Acceptance Criteria:**
1.  The root `README.md` is created.
2.  It includes a project description, feature list, and link to the Tech Stack.
3.  It provides clear, step-by-step instructions for cloning and running the project locally.

---
### **Story 6.2: Create the "Zero-to-Production" Deployment Guide**
*As a new developer, I want a step-by-step guide to configure all the required external services, so I can deploy my own instance of the starter template.*

**Acceptance Criteria:**
1.  A `docs/DEPLOYMENT_GUIDE.md` is created.
2.  It includes instructions for setting up Convex, Cloudflare, and BetterAuth.
3.  It provides a checklist of all required environment variables.

---
### **Story 6.3: Write the "Agentic Workflows" Documentation**
*As a Context Engineer, I want clear documentation on the two agentic pathways, so I can set up my environment and use the system effectively.*

**Acceptance Criteria:**
1.  A `docs/AGENTIC_WORKFLOWS.md` is created.
2.  The document explains the difference between the "Live App Pathway" (API Keys) and the "Local Dev Pathway" (CLI & subscription).
3.  It provides setup instructions for both the `claude` CLI and the project's API keys.

---
### **Story 6.4: Finalize and Polish All UI Components**
*As a user, I want a polished and visually consistent UI, so that the starter template feels professional and ready to use.*

**Acceptance Criteria:**
1.  A full review of all UI components is conducted.
2.  Inconsistent styling, spacing, or typography is corrected.
3.  All UI text is reviewed for clarity and typos.

---
### **Story 6.5: Prepare BMad Templates for Distribution**
*As a developer using this starter, I want clean, ready-to-use BMad templates and coding standards, so that I can start planning my own project immediately.*

**Acceptance Criteria:**
1.  A `/docs/templates` directory is created.
2.  It is populated with clean versions of the `Project Brief`, `Architecture`, and `PRD` templates.
3.  A `CODING_STANDARDS.md` template is included.

## **Epic 7: Experimental Hybrid Agent Workflow (PoC)**
**Goal:** To build a proof-of-concept hybrid workflow where the deployed production application can offload complex, token-intensive tasks to a developer's local machine in real-time, using Convex as a secure message bus.

---
### **Story 7.1: Define the Direct Tasking Schemas**
*As an architect, I need tables in Convex to manage direct tasks sent to a local agent and their corresponding results, so that the production app and local tools can communicate asynchronously.*

**Acceptance Criteria:**
1.  A new table, `claude_direct_tasks`, is created in the Convex schema.
2.  A new table, `claude_direct_results`, is created.
3.  Appropriate indexes are created for querying tasks by status.

---
### **Story 7.2: Implement the Production Task Dispatcher**
*As a Context Engineer, I want to submit a task from the production "Agentic Console," so that I can request work from a connected local agent.*

**Acceptance Criteria:**
1.  The "Agentic Console" UI is updated with a "Dispatch to Local Agent" button.
2.  Clicking this button creates a new document in the `claude_direct_tasks` table.
3.  The UI subscribes to the `claude_direct_results` table to wait for a response.

---
### **Story 7.3: Implement the Local `claude-code` Provider & Server**
*As a developer, I want a local server that uses a custom Vercel AI SDK provider to process tasks using my personal Claude subscription, so I can handle complex jobs without incurring project API costs.*

**Acceptance Criteria:**
1.  A local-only server is created in `packages/agent-scripts`.
2.  It uses the Vercel AI SDK configured with a custom provider that wraps the `@instantlyeasy/claude-code-sdk-ts` library.
3.  The server subscribes to the `claude_direct_tasks` table and writes results to the `claude_direct_results` table.

---

## Individual Epic Files

For focused development work, each epic is also available as a separate file optimized for AI agent consumption:

- [Epic 1: Platform Foundation & End-to-End Deployment](./epic-1.md)
- [Epic 2: UI Toolkit & Component Showcase](./epic-2.md)
- [Epic 3: Resilient Real-time Logging](./epic-3.md)
- [Epic 4: Conversational AI & RAG Foundation](./epic-4.md)
- [Epic 5: Quality of Life & Production-Ready Features](./epic-5.md)
- [Epic 6: Documentation & Onboarding Polish](./epic-6.md)
- [Epic 7: Experimental Hybrid Agent Workflow (PoC)](./epic-7.md)

