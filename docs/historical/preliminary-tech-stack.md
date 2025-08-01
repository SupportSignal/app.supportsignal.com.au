Here is your **complete tech stack** as captured and normalized from the live document:

---

## ✅ AI-Accelerated Tech Stack Summary

### 📦 Core Technologies

| Area              | Tool/Framework                                     |
| ----------------- | -------------------------------------------------- |
| Package Manager   | **Bun** – ultra-fast installs, built-in runner     |
| Language          | **TypeScript** (strict mode)                       |
| Framework         | **Next.js** (App Router, React 18+)                |
| UI Layer          | **ShadCN + Tailwind CSS + Radix UI**               |
| State Management  | **Zustand** – lightweight state store            |
| Backend + DB      | **Convex** – queries, mutations, durable workflows |
| Schema Validation | **Zod** – runtime validation & type enforcement    |
| Auth              | **BetterAuth** (with Convex adapter)               |

---

### 🧪 Quality & Dev Workflow

| Area        | Tools/Practices                                  |
| ----------- | ------------------------------------------------ |
| Testing     | **Jest + React Testing Library** (unit + integration) |
| E2E Testing | **Playwright** (browser automation)              |
| Linting     | **ESLint + Prettier**                            |
| Git Hooks   | **Husky + lint-staged + commitlint**             |
| CI/CD       | **GitHub Actions** (build → test → deploy)       |

---

### 📡 Observability & Logs

| Tool         | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| **PostHog**  | Product analytics, user behavior tracking                  |
| **Sentry**   | Frontend + backend error logging and stack traces          |
| **Logflare** | Real-time logging for ...? |

### Context Engineering

| Area     | Details                                                |
| -------- | ------------------------------------------------------ |
| **BMAD-METHOD** | AI Dev Flow	and context engineering framework |
| **Project Brief** | Overview of the AI project, goals, and scope |
| **Architecture** | High-level system design and components |
| **PRD** | Product Requirements Document detailing features and user stories |
| **Epics** | High-level features or themes for the project |
| **Stories** | Specific user needs and scenarios scoped to epic and created just-in-time |
| **Aditional Documents** | Additional context documents for specific features or components, coding standards and conventions, and any other relevant information |

### Claude Agentic Development

| Tool                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| **Claude Code**         | AI agent for code generation, debugging, and context-aware development |
| **Claude Extras**       | MCPs & Hooks for advanced agent capabilities |
| **Claude SDK**          | Closing the loop with with Application context, HITL requests and GitHub Issue triage |

---

### ⚙️ Developer Tools

| Tool                | Purpose                                      |
| ------------------- | -------------------------------------------- |
| **iTerm2 + VSCode** | Core development experience                  |
| **MCP (Docker)**    | Agent memory, prompt eval, future RAG layers |

---

### 📤 Integration & Communication

| Layer         | Details                                                |
| ------------- | ------------------------------------------------------ |
| SOA Layer     | **n8n** for task/event pipelines and API orchestration |
| Issue Flow    | AI-triaged GitHub Issues with Claude agent context     |
| Notifications | Claude hook with bell notifications   |

---

### 💡 Convex AI Agent Capabilities

* Durable workflows with retries
* Real-time shared state for agents
* Persistent memory (e.g., conversation history)
* Parallel task execution
* Seamless integration with Claude & log ingestion

---

### 🧑‍💻 Client vs Server Responsibilities

| Role              | Where It Lives                                        |
| ----------------- | ----------------------------------------------------- |
| Client Code       | React components, Zustand stores, Convex subscriptions, Cloudflare hooks |
| Server Logic      | **Convex** (queries, mutations, actions), **Cloudflare Workers** (middleware, edge functions) |

**Convex Actions cover**:

* Email sending
* PDF generation
* AI model calls
* External API integrations
* Workflows / retries

---

### 📁 Monorepo Layout (Example)

```
ToDo
```








