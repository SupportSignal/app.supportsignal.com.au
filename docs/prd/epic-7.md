# Epic 7: Experimental Hybrid Agent Workflow (PoC)

**Goal:** To build a proof-of-concept hybrid workflow where the deployed production application can offload complex, token-intensive tasks to a developer's local machine in real-time, using Convex as a secure message bus.

---
## Story 7.1: Define the Direct Tasking Schemas
*As an architect, I need tables in Convex to manage direct tasks sent to a local agent and their corresponding results, so that the production app and local tools can communicate asynchronously.*

**Acceptance Criteria:**
1.  A new table, `claude_direct_tasks`, is created in the Convex schema.
2.  A new table, `claude_direct_results`, is created.
3.  Appropriate indexes are created for querying tasks by status.

---
## Story 7.2: Implement the Production Task Dispatcher
*As a Context Engineer, I want to submit a task from the production "Agentic Console," so that I can request work from a connected local agent.*

**Acceptance Criteria:**
1.  The "Agentic Console" UI is updated with a "Dispatch to Local Agent" button.
2.  Clicking this button creates a new document in the `claude_direct_tasks` table.
3.  The UI subscribes to the `claude_direct_results` table to wait for a response.

---
## Story 7.3: Implement the Local `claude-code` Provider & Server
*As a developer, I want a local server that uses a custom Vercel AI SDK provider to process tasks using my personal Claude subscription, so I can handle complex jobs without incurring project API costs.*

**Acceptance Criteria:**
1.  A local-only server is created in `packages/agent-scripts`.
2.  It uses the Vercel AI SDK configured with a custom provider that wraps the `@instantlyeasy/claude-code-sdk-ts` library.
3.  The server subscribes to the `claude_direct_tasks` table and writes results to the `claude_direct_results` table.