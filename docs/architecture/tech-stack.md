# Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Technologies** | Next.js | 14.2.x | Full-stack React framework for the web application. |
| | TypeScript | 5.4.x | Language for type safety and maintainability. |
| | Convex | 1.12.x | Real-time backend platform, database, and functions. |
| | Zod | 3.23.x | Schema validation and type enforcement. |
| **Platform & Hosting**| Cloudflare | N/A | Pages, Workers, R2, KV, Vectorize DB for hosting and edge services. |
| **Authentication** | BetterAuth | Latest | Authentication service with a first-party Convex adapter. |
| **UI** | ShadCN/UI & Tailwind | Latest | Accessible component library and utility-first CSS. |
| **Client State** | Zustand | 4.5.x | Minimalist state management for ephemeral UI state. |
| **Quality & Workflow**| Bun | 1.1.x | JS Runtime, Package Manager, and Test Runner. |
| | Turborepo | 2.0.x | High-performance monorepo build system. |
| | Jest & RTL | Latest | Unit and integration testing for components and logic. |
| | Playwright | Latest | End-to-end browser automation testing. |
| | ESLint & Prettier | Latest | Code linting and formatting standards. |
| | Husky & lint-staged | Latest | Git hooks to run scripts before commits. |
| | commitlint | Latest | Enforces a consistent and readable commit message format. |
| | GitHub Actions | N/A | CI/CD pipeline for build, test, and deployment. |
| **Observability** | Sentry | N/A | Frontend and backend error logging and stack traces. |
| | PostHog | N/A | Product analytics and user behavior tracking. |
| | Logflare | N/A | Real-time log ingestion, especially for Cloudflare Workers. |
| **Agentic Tooling**| Vercel AI SDK | Latest | Powers the in-app, user-facing chatbot interface and tool-calling. |
| | Claude SDK | Latest | Enables direct backend communication with Claude models. |
| | Storybook | 8.1.x | UI component workshop for isolated development. |
| **Data Seeding** | Faker.js | 8.4.x | Realistic mock data generation for testing and development. |
