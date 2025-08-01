# **Architectural Addendum: Final Clarifications**

## **1. Architecture Decision Records (ADRs)**

To ensure the long-term maintainability and understanding of the project, we will adopt the practice of creating Architecture Decision Records (ADRs) for all significant architectural choices.

**Action:** Create a new directory at the root of the project: `docs/adr/`.

Each ADR will be a short markdown file documenting a single decision. For example, `001-choice-of-convex-and-cloudflare.md` would contain:
* **Status:** Decided
* **Context:** The need for a real-time, performant, edge-first backend for an agentic starter template.
* **Decision:** We chose a combination of Convex for the real-time database/backend and Cloudflare for hosting/edge compute.
* **Consequences:** This provides exceptional performance and a modern developer experience but introduces a degree of vendor lock-in, which we accept as a strategic trade-off. Alternatives considered were Vercel/Supabase and a traditional AWS/GCP stack.

This practice provides invaluable context for future developers (human or AI) on *why* our system is built the way it is.

## **2. State Management Philosophy**

To ensure clarity and prevent state-related bugs, the following rule will be added to the `Coding Standards` section:

> **State Management Rule:** All persistent data that needs to be shared between users or sessions **must** live in Convex. The client-side state manager (Zustand) should **only** be used for ephemeral, non-persistent, client-only UI state (e.g., "is this modal currently open?", "is this navigation menu expanded?"). Any state that needs to be bookmarkable or shared via a URL should be stored in URL search parameters.

## **3. Local Database Migration Strategy**

To clarify the development workflow, the following will be added to the `Infrastructure and Deployment` section:

> **Local Database Migrations:** All schema changes are managed by the Convex CLI. Developers **must** run the `npx convex dev` command in their terminal during local development. This command watches for changes in the `apps/convex/` directory and automatically pushes schema updates and function deployments to their personal development backend, ensuring a developer's environment is always in sync with the latest schema definitions in the codebase.

