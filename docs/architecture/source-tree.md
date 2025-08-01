# Source Tree

Complete project structure for the Agentic Starter Template - a Next.js template for building AI-first applications using the BMAD (Breakthrough Method for Agile AI Driven Development) methodology.

## Project Overview

**Name:** starter-nextjs-convex-ai
**Type:** TypeScript Monorepo (Turborepo + Bun)
**Architecture:** Edge-first, AI-native development template
**Tech Stack:** Next.js, Convex, Cloudflare, TypeScript, Tailwind CSS, ShadCN UI

## Full Directory Structure

```plaintext
/
├── .bmad-core/                           # 🤖 BMAD Methodology Framework
│   ├── agent-teams/                      # Agent team configurations
│   │   ├── team-all.yaml                 # Complete agent workforce
│   │   ├── team-fullstack.yaml          # Fullstack development team
│   │   ├── team-ide-minimal.yaml        # Minimal IDE integration team
│   │   └── team-no-ui.yaml              # Backend-focused team
│   ├── agents/                          # AI agent persona definitions
│   │   ├── analyst.md                   # Business analyst agent
│   │   ├── architect.md                 # Solutions architect agent
│   │   ├── bmad-master.md               # BMAD methodology coordinator
│   │   ├── bmad-orchestrator.md         # Process orchestration agent
│   │   ├── dev.md                       # Development agent
│   │   ├── pm.md                        # Project manager agent
│   │   ├── po.md                        # Product owner agent
│   │   ├── qa.md                        # Quality assurance agent
│   │   ├── sm.md                        # Scrum master agent
│   │   ├── test-dev.md                  # Test development agent
│   │   └── ux-expert.md                 # UX/UI design agent
│   ├── checklists/                      # Quality assurance checklists
│   │   ├── architect-checklist.md       # Architecture validation
│   │   ├── change-checklist.md          # Change management checklist
│   │   ├── kdd-validation-checklist.md  # Knowledge-driven development validation
│   │   ├── pm-checklist.md              # Project management checklist
│   │   ├── po-master-checklist.md       # Product owner master checklist
│   │   ├── story-dod-checklist.md       # Story definition-of-done
│   │   └── story-draft-checklist.md     # Story draft validation
│   ├── data/                            # BMAD knowledge base
│   │   ├── bmad-kb.md                   # Core BMAD knowledge
│   │   ├── brainstorming-techniques.md  # Ideation methodologies
│   │   ├── elicitation-methods.md       # Requirements gathering techniques
│   │   ├── estimation-guidelines.md     # Sprint estimation guidelines
│   │   └── technical-preferences.md     # Technical decision preferences
│   ├── tasks/                           # Automated task definitions
│   │   ├── advanced-elicitation.md      # Advanced requirements gathering
│   │   ├── brownfield-create-epic.md    # Epic creation for existing projects
│   │   ├── brownfield-create-story.md   # Story creation for existing projects
│   │   ├── capture-kdd-knowledge.md     # Knowledge capture automation
│   │   ├── correct-course.md            # Course correction procedures
│   │   ├── create-brownfield-story.md   # Brownfield story automation
│   │   ├── create-deep-research-prompt.md # Research prompt generation
│   │   ├── create-doc.md                # Documentation creation
│   │   ├── create-next-story.md         # Next story generation
│   │   ├── document-project.md          # Project documentation automation
│   │   ├── execute-checklist.md         # Checklist execution automation
│   │   ├── facilitate-brainstorming-session.md # Brainstorming facilitation
│   │   ├── generate-ai-frontend-prompt.md # Frontend prompt generation
│   │   ├── generate-user-uat.md         # User acceptance test generation
│   │   ├── index-docs.md                # Documentation indexing
│   │   ├── kb-mode-interaction.md       # Knowledge base interaction
│   │   ├── review-story.md              # Story review automation
│   │   ├── shard-doc.md                 # Document sharding
│   │   └── validate-next-story.md       # Story validation
│   ├── templates/                       # Document templates
│   │   ├── architecture-tmpl.yaml       # Architecture template
│   │   ├── brainstorming-output-tmpl.yaml # Brainstorming output template
│   │   ├── brownfield-architecture-tmpl.yaml # Brownfield architecture template
│   │   ├── brownfield-prd-tmpl.yaml     # Brownfield PRD template
│   │   ├── competitor-analysis-tmpl.yaml # Competitor analysis template
│   │   ├── front-end-architecture-tmpl.yaml # Frontend architecture template
│   │   ├── front-end-spec-tmpl.yaml     # Frontend specification template
│   │   ├── fullstack-architecture-tmpl.yaml # Fullstack architecture template
│   │   ├── market-research-tmpl.yaml    # Market research template
│   │   ├── prd-tmpl.yaml                # Product requirements template
│   │   ├── project-brief-tmpl.yaml      # Project brief template
│   │   ├── story-tmpl.yaml              # Story template
│   │   └── uat-simple-tmpl.yaml         # UAT template
│   ├── utils/                           # BMAD utilities
│   │   ├── bmad-doc-template.md         # BMAD documentation template
│   │   └── workflow-management.md       # Workflow management utilities
│   ├── workflows/                       # Development workflows
│   │   ├── brownfield-fullstack.yaml    # Brownfield fullstack workflow
│   │   ├── brownfield-service.yaml      # Brownfield service workflow
│   │   ├── brownfield-ui.yaml           # Brownfield UI workflow
│   │   ├── greenfield-fullstack.yaml    # Greenfield fullstack workflow
│   │   ├── greenfield-service.yaml      # Greenfield service workflow
│   │   └── greenfield-ui.yaml           # Greenfield UI workflow
│   ├── core-config.yaml                 # Core BMAD configuration
│   └── install-manifest.yaml            # Installation manifest
│
├── .claude/                             # 🤖 Claude Code Integration
│   ├── commands/                        # Claude custom commands
│   │   └── BMad/                        # BMAD-specific commands
│   │       ├── agents/                  # Agent command definitions
│   │       └── tasks/                   # Task command definitions
│   └── settings.local.json              # Claude local settings
│
├── .github/                             # 🚀 CI/CD Pipeline
│   └── workflows/
│       └── ci.yml                       # GitHub Actions CI/CD workflow
│
├── .husky/                              # 🔧 Git Hooks
│   ├── _/                               # Husky internal files
│   ├── commit-msg                       # Commit message validation
│   └── pre-commit                       # Pre-commit code quality checks
│
├── .obsidian/                           # 📝 Obsidian Documentation
│   ├── app.json                         # Obsidian app configuration
│   ├── appearance.json                  # UI appearance settings
│   ├── core-plugins.json                # Core plugins configuration
│   ├── graph.json                       # Knowledge graph settings
│   ├── themes/                          # Custom themes
│   │   └── AnuPpuccin/                  # AnuPpuccin theme
│   └── workspace.json                   # Workspace configuration
│
├── .turbo/                              # ⚡ Turborepo Cache
│   ├── cache/                           # Build cache files
│   ├── cookies/                         # Turbo session cookies
│   ├── daemon/                          # Turbo daemon logs
│   └── preferences/                     # Turbo preferences
│
├── .wrangler/                           # ☁️ Cloudflare Wrangler
│   └── tmp/                             # Temporary Wrangler files
│
├── apps/                                # 📱 Application Layer
│   ├── convex/                          # 🔄 Convex Backend Application
│   │   ├── _generated/                  # Auto-generated Convex files
│   │   │   ├── api.d.ts                 # API type definitions
│   │   │   ├── api.js                   # API implementation
│   │   │   ├── dataModel.d.ts           # Data model types
│   │   │   ├── server.d.ts              # Server type definitions
│   │   │   └── server.js                # Server implementation
│   │   ├── auth.ts                      # Authentication functions
│   │   ├── email.ts                     # Email service functions
│   │   ├── logs.ts                      # Logging functions (Story 3.1)
│   │   ├── migrations.ts                # Database migrations
│   │   ├── queries.ts                   # Database query functions
│   │   ├── schema.ts                    # Database schema definitions
│   │   ├── users.ts                     # User management functions
│   │   ├── convex.json                  # Convex configuration
│   │   └── package.json                 # Convex package dependencies
│   │
│   ├── web/                             # 🌐 Next.js Frontend Application
│   │   ├── .vercel/                     # Vercel build output
│   │   │   ├── output/                  # Static export output
│   │   │   └── project.json             # Vercel project configuration
│   │   ├── app/                         # Next.js App Router
│   │   │   ├── api/                     # API route handlers
│   │   │   ├── auth/                    # Authentication pages
│   │   │   ├── change-password/         # Password change page
│   │   │   ├── forgot-password/         # Password recovery page
│   │   │   ├── login/                   # Login page
│   │   │   ├── protected/               # Protected route pages
│   │   │   ├── register/                # User registration page
│   │   │   ├── reset-password/          # Password reset page
│   │   │   ├── showcase/                # Component showcase page (Story 2.3)
│   │   │   ├── test-github-oauth/       # OAuth testing page
│   │   │   ├── test-input/              # Input testing page
│   │   │   ├── globals.css              # Global CSS styles
│   │   │   ├── layout.tsx               # Root layout component
│   │   │   ├── page.tsx                 # Home page component
│   │   │   └── providers.tsx            # Context providers
│   │   ├── components/                  # React Components
│   │   │   ├── auth/                    # Authentication components
│   │   │   ├── dev/                     # Development utility components
│   │   │   ├── logging/                 # Logging components (Story 3.1)
│   │   │   ├── theme/                   # Theme components (Story 2.4)
│   │   │   └── ui/                      # UI components (ShadCN)
│   │   ├── lib/                         # Library Functions
│   │   │   ├── __tests__/               # Unit tests
│   │   │   ├── email/                   # Email utilities
│   │   │   ├── auth.ts                  # Authentication utilities
│   │   │   ├── config.ts                # Configuration utilities
│   │   │   ├── console-override.ts      # Console override utilities (Story 3.1)
│   │   │   ├── convex.ts                # Convex client configuration
│   │   │   ├── test-utils.tsx           # Testing utilities
│   │   │   └── utils.ts                 # General utilities
│   │   ├── out/                         # Static export output
│   │   ├── tests/                       # Test Files
│   │   │   └── e2e/                     # End-to-end tests
│   │   ├── components.json              # ShadCN components configuration
│   │   ├── convex -> ../convex/_generated # Symlink to Convex generated files
│   │   ├── next.config.js               # Next.js configuration
│   │   ├── package.json                 # Web app package dependencies
│   │   ├── postcss.config.js            # PostCSS configuration
│   │   ├── tailwind.config.js           # Tailwind CSS configuration
│   │   └── tsconfig.json                # TypeScript configuration
│   │
│   └── workers/                         # ☁️ Cloudflare Workers (Planned)
│
├── packages/                            # 📦 Shared Packages
│   ├── config/                          # ⚙️ Shared Configuration (Planned)
│   ├── data-access/                     # 🏪 Repository Pattern Implementation (Planned)
│   ├── shared-types/                    # 📋 Shared TypeScript Types (Planned)
│   ├── storybook/                       # 📚 Storybook Environment
│   │   ├── .storybook/                  # Storybook configuration
│   │   │   ├── main.ts                  # Main Storybook configuration
│   │   │   └── preview.ts               # Preview configuration
│   │   ├── stories/                     # Component stories
│   │   │   ├── assets/                  # Story assets
│   │   │   ├── Button.stories.ts        # Button component stories
│   │   │   ├── Button.tsx               # Button component
│   │   │   ├── Configure.mdx            # Configuration documentation
│   │   │   ├── Header.stories.ts        # Header component stories
│   │   │   ├── Header.tsx               # Header component
│   │   │   ├── Page.stories.ts          # Page component stories
│   │   │   ├── Page.tsx                 # Page component
│   │   │   └── *.css                    # Component styles
│   │   ├── storybook-static/            # Built Storybook static files
│   │   ├── package.json                 # Storybook package dependencies
│   │   ├── tailwind.config.js           # Tailwind configuration for Storybook
│   │   └── tsconfig.json                # TypeScript configuration
│   │
│   └── ui/                              # 🎨 Shared UI Component Library
│       ├── src/                         # Source components
│       │   ├── __tests__/               # Component unit tests
│       │   ├── lib/                     # UI utilities
│       │   ├── button.tsx               # Button component
│       │   ├── card.tsx                 # Card component
│       │   └── input.tsx                # Input component
│       ├── package.json                 # UI package dependencies
│       └── tsconfig.json                # TypeScript configuration
│
├── docs/                                # 📖 Comprehensive Documentation
│   ├── architecture/                    # 🏗️ Architecture Documentation (Sharded)
│   │   ├── api-implementation-details.md # API implementation guide
│   │   ├── architectural-addendum-final-clarifications.md # Final clarifications
│   │   ├── coding-standards.md          # Development conventions
│   │   ├── components.md                # Component interaction patterns
│   │   ├── data-models.md               # Database schema and relationships
│   │   ├── error-handling-strategy.md   # Error handling approach
│   │   ├── high-level-architecture.md   # System diagrams and patterns
│   │   ├── infrastructure-and-deployment.md # Deployment strategy
│   │   ├── introduction.md              # Architecture introduction
│   │   ├── security.md                  # Multi-layered security strategy
│   │   ├── source-tree.md               # This file - project structure
│   │   ├── tech-stack.md                # Technology choices and versions
│   │   ├── test-strategy-and-standards.md # Testing approach
│   │   └── index.md                     # Architecture navigation
│   │
│   ├── examples/                        # 💡 Implementation Examples
│   │   ├── backend/                     # Backend implementation examples
│   │   ├── cicd-deployment/             # CI/CD and deployment examples
│   │   ├── cloudflare-pages-deployment/ # Cloudflare Pages deployment guide
│   │   ├── configuration/               # Configuration examples
│   │   ├── frontend/                    # Frontend implementation examples
│   │   ├── monorepo-setup/              # Monorepo configuration examples
│   │   ├── testing/                     # Testing implementation examples
│   │   └── index.md                     # Examples navigation
│   │
│   ├── guides/                          # 🚀 Implementation Guides
│   │   ├── kdd-implementation-guide.md  # Knowledge-driven development guide
│   │   ├── kdd-setup-guide.md           # KDD setup instructions
│   │   ├── sprint-estimation-implementation-guide.md # Sprint planning guide
│   │   └── index.md                     # Guides navigation
│   │
│   ├── historical/                      # 📜 Historical Documentation
│   │   ├── preliminary-epics.md         # Early epic planning
│   │   ├── preliminary-tech-stack.md    # Initial technology choices
│   │   └── index.md                     # Historical documentation navigation
│   │
│   ├── lessons-learned/                 # 🎓 Knowledge Capture
│   │   ├── anti-patterns/               # Approaches to avoid
│   │   ├── architecture/                # Architecture lessons
│   │   ├── process/                     # Process insights
│   │   ├── stories/                     # Story-specific learnings
│   │   ├── technology/                  # Technology-specific lessons
│   │   └── index.md                     # Lessons learned navigation
│   │
│   ├── methodology/                     # 🧠 BMAD Methodology
│   │   ├── agentic-architect-developer-persona.md # AI personas for development
│   │   ├── bmad-context-engineering.md  # Structured AI development approach
│   │   ├── bmad-overview.md             # BMAD methodology overview
│   │   ├── kdd-integration-overview.md  # Knowledge-driven development integration
│   │   └── youtube-brief-methodology.md # Video creation methodology
│   │
│   ├── patterns/                        # 🎯 Established Patterns
│   │   ├── architecture-patterns.md     # System design patterns
│   │   ├── backend-patterns.md          # Convex, API, and server-side patterns
│   │   ├── development-workflow-patterns.md # Process and collaboration patterns
│   │   ├── frontend-patterns.md         # React, Next.js, and UI patterns
│   │   ├── testing-patterns.md          # Testing strategies across all layers
│   │   └── index.md                     # Patterns navigation
│   │
│   ├── peer-reviews/                    # 👥 External Feedback
│   │   ├── convex-structure-analysis.md # Monorepo structure review
│   │   └── structure-decision-audit.md  # Architecture decision review
│   │
│   ├── prd/                            # 📋 Product Requirements (Sharded)
│   │   ├── epic-1.md                    # Platform Foundation
│   │   ├── epic-2.md                    # UI Toolkit
│   │   ├── epic-3.md                    # Real-time Logging
│   │   ├── epic-4.md                    # Conversational AI
│   │   ├── epic-5.md                    # Production Features
│   │   ├── epic-6.md                    # Documentation
│   │   ├── epic-7.md                    # Hybrid Workflow
│   │   ├── 1-goals-and-background-context.md # Project goals and context
│   │   ├── 2-requirements.md            # Core requirements
│   │   ├── 3-user-interface-design-goals.md # UI design objectives
│   │   ├── 4-technical-assumptions.md   # Technical assumptions
│   │   ├── 5-finalized-epic-roadmap.md  # Epic roadmap
│   │   ├── 6-epic-details.md            # Detailed epic specifications
│   │   └── index.md                     # PRD navigation
│   │
│   ├── stories/                         # 📝 Development Stories
│   │   ├── 1.1.story.md                 # Setup Monorepo & Basic Structure
│   │   ├── 1.2.story.md                 # Add Convex to Monorepo
│   │   ├── 1.3.story.md                 # Create Basic Next.js App Structure
│   │   ├── 1.4.story.md                 # Setup Cloudflare Pages Deployment
│   │   ├── 1.5.story.md                 # Foundational Authentication
│   │   ├── 1.6.story.md                 # CI/CD Pipeline
│   │   ├── 1.7.story.md                 # Testing Infrastructure
│   │   ├── 1.8.story.md                 # Error Handling & Monitoring Setup
│   │   ├── 1.9.story.md                 # Development Environment Polish
│   │   ├── 2.1.story.md                 # UI Component Foundation
│   │   ├── 2.2.story.md                 # Design System Implementation
│   │   ├── 2.3.story.md                 # Component Showcase Page
│   │   ├── 2.4.story.md                 # Theme & Dark Mode Toggler
│   │   └── 3.1.story.md                 # Console Override & Logging Bridge
│   │
│   ├── technical-guides/                # 🔧 Technical Implementation Guides
│   │   ├── authentication-architecture.md # Complete authentication system guide
│   │   ├── cicd-pipeline-setup.md       # CI/CD pipeline configuration
│   │   ├── cloudflare-pages-deployment-troubleshooting.md # Deployment troubleshooting
│   │   ├── cloudflare-pages-setup.md    # Cloudflare Pages setup guide
│   │   ├── convex-components-guide.md   # Convex architecture patterns
│   │   ├── cost-effective-logging-in-convex-agentic-systems.md # Logging strategies
│   │   ├── dev-error-pipeline.md        # Chrome DevTools to Claude Code bridge
│   │   └── github-oauth-setup.md        # GitHub OAuth configuration
│   │
│   ├── testing/                         # 🧪 User Acceptance Testing
│   │   ├── uat-plan-1.2.md              # UAT for Convex integration
│   │   ├── uat-plan-1.4.md              # UAT for Cloudflare deployment
│   │   ├── uat-plan-1.5.md              # UAT for authentication
│   │   ├── uat-plan-1.6.md              # UAT for CI/CD pipeline
│   │   ├── uat-plan-1.7.md              # UAT for testing infrastructure
│   │   ├── uat-plan-1.8.md              # UAT for error handling
│   │   └── uat-plan-2.1.md              # UAT for UI components
│   │
│   ├── youtube-briefs/                  # 🎥 Video Creation Briefs
│   │   ├── ci-monitoring-automation-brief.md # CI monitoring demonstration
│   │   ├── kdd-methodology-brief.md     # Knowledge-driven development video
│   │   ├── specialized-test-agent-setup.md # Test agent setup guide
│   │   ├── sprint-estimation-brief.md   # Sprint planning video guide
│   │   └── index.md                     # YouTube briefs navigation
│   │
│   ├── architecture.md                  # Legacy architecture document
│   ├── development-guide.md             # Development workflow guide
│   ├── index.md                         # Main documentation navigation
│   ├── prd.md                          # Legacy PRD document
│   └── project-brief.md                 # Complete project brief
│
├── scripts/                             # 🔧 Development Scripts
│   ├── ci-monitor.sh                    # CI monitoring automation
│   ├── ci-status.sh                     # CI status checking
│   └── smart-push.sh                    # Smart push with CI monitoring
│
├── test-config/                         # 🧪 Test Configuration
│   └── setup-test-env.js                # Test environment setup
│
├── .env.ai.example                      # AI service environment variables template
├── .env.example                         # Environment variables template
├── .env.local                           # Local environment variables (gitignored)
├── .env.local.example                   # Local environment template
├── .gitignore                           # Git ignore rules
├── .prettierrc                          # Prettier code formatting configuration
├── bun.lock                             # Bun lockfile
├── CLAUDE.md                            # Claude Code specific instructions
├── commitlint.config.js                 # Commit message linting configuration
├── eslint.config.js                     # ESLint configuration
├── index.ts                             # Monorepo entry point
├── LICENSE                              # Project license
├── package.json                         # Root package configuration
├── playwright.config.ts                 # Playwright E2E testing configuration
├── README.md                            # Project readme
├── tsconfig.json                        # Root TypeScript configuration
└── turbo.json                           # Turborepo configuration
```

## Key Directory Breakdown

### 🤖 AI & Development Framework

**`.bmad-core/`** - Complete BMAD methodology implementation
- **Status**: ✅ Fully Implemented
- **Purpose**: Provides structured AI-assisted development workflows, agent definitions, task automation, and development methodology templates

**`.claude/`** - Claude Code integration
- **Status**: ✅ Implemented
- **Purpose**: Custom commands and settings for Claude Code integration

### 📱 Application Architecture

**`apps/convex/`** - Convex Backend Application
- **Status**: ✅ Implemented (Stories 1.2, 1.5, 3.1)
- **Purpose**: Real-time database, serverless functions, authentication, and logging
- **Key Files**: `schema.ts`, `auth.ts`, `logs.ts`, `users.ts`, `queries.ts`

**`apps/web/`** - Next.js Frontend Application
- **Status**: ✅ Core Implemented (Stories 1.3, 1.4, 2.3, 2.4, 3.1)
- **Purpose**: React-based web application with App Router, authentication, and theming
- **Key Features**: Authentication pages, component showcase, theme toggler, console override

**`apps/workers/`** - Cloudflare Workers
- **Status**: 🔄 Planned
- **Purpose**: Edge compute functions and middleware

### 📦 Shared Packages

**`packages/ui/`** - Shared UI Component Library
- **Status**: ✅ Basic Implementation (Story 2.1)
- **Purpose**: Reusable React components built with ShadCN UI patterns

**`packages/storybook/`** - Component Development Environment
- **Status**: ✅ Implemented
- **Purpose**: Component development, testing, and documentation

**`packages/config/`** - Shared Configuration
- **Status**: 🔄 Planned
- **Purpose**: Shared ESLint, TypeScript, and other configurations

**`packages/data-access/`** - Repository Pattern Implementation
- **Status**: 🔄 Planned
- **Purpose**: Abstracted data access layer following repository pattern

**`packages/shared-types/`** - Shared TypeScript Types
- **Status**: 🔄 Planned
- **Purpose**: Common type definitions across packages

### 📖 Comprehensive Documentation

**`docs/`** - Complete project documentation following BMAD methodology
- **Status**: ✅ Extensive Implementation
- **Structure**: Sharded documentation with navigation indexes
- **Key Sections**:
  - **`prd/`**: Product requirements (Epic 1-7)
  - **`architecture/`**: Technical architecture and design decisions
  - **`stories/`**: Development stories (1.1-3.1 implemented)
  - **`methodology/`**: BMAD and KDD implementation guides
  - **`technical-guides/`**: Detailed implementation guides
  - **`testing/`**: User acceptance testing plans
  - **`patterns/`**: Established development patterns
  - **`examples/`**: Real implementation examples
  - **`lessons-learned/`**: Knowledge capture from development

### 🚀 DevOps & Infrastructure

**`.github/workflows/`** - CI/CD Pipeline
- **Status**: ✅ Implemented (Story 1.6)
- **Purpose**: Automated testing, building, and deployment via GitHub Actions

**`scripts/`** - Development Automation
- **Status**: ✅ Implemented
- **Purpose**: CI monitoring, smart push, and development workflow automation

### 🧪 Testing Infrastructure

**`test-config/`** - Test Configuration
- **Status**: ✅ Implemented (Story 1.7)
- **Purpose**: Jest and Playwright test environment setup

**Testing Files**: Distributed across `apps/web/tests/`, `packages/ui/src/__tests__/`
- **Status**: ✅ Basic Implementation
- **Purpose**: Unit tests, integration tests, and E2E tests

## Technology Stack Implementation Status

### ✅ Fully Implemented
- **Monorepo**: Turborepo + Bun package management
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Convex real-time database and serverless functions
- **Authentication**: BetterAuth with Convex adapter
- **UI Components**: ShadCN UI with custom theme system
- **CI/CD**: GitHub Actions with smart monitoring
- **Testing**: Jest (unit) + Playwright (E2E)
- **Documentation**: Comprehensive BMAD-structured documentation
- **AI Integration**: Claude Code with BMAD methodology framework

### 🔄 Partially Implemented
- **Cloudflare Integration**: Pages deployment configured, Workers planned
- **Logging System**: Basic console override implemented, full logging bridge in progress
- **Component Library**: Basic components implemented, full library planned

### 📋 Planned
- **RAG System**: Cloudflare Vectorize integration
- **Advanced AI Features**: Self-modifying code capabilities
- **Production Monitoring**: Sentry integration
- **Advanced UI Features**: Complex component interactions

## Current Development State

The project is in **active development** with the foundation complete and core features implemented. Currently working on **Epic 3: Real-time Logging** with the console override system (Story 3.1) implemented and logging bridge in progress.

### Recent Milestones
- ✅ **Epic 1: Platform Foundation** - Complete monorepo, deployment, authentication
- ✅ **Epic 2: UI Toolkit** - Component showcase and theming system
- 🔄 **Epic 3: Real-time Logging** - Console override implemented, bridge in progress

### Next Steps
- Complete logging bridge and resilient architecture
- Implement RAG foundation for conversational AI
- Add production monitoring and quality of life features

## AI-Native Architecture

This project is specifically designed for AI-assisted development with:

- **Agent-Ready Structure**: Clear separation of concerns and well-documented patterns
- **Context-Rich Documentation**: Extensive documentation for AI context consumption
- **Automated Workflows**: BMAD methodology with task automation and agent orchestration
- **Knowledge Capture**: Systematic lessons learned and pattern documentation
- **Feedback Loops**: Integration between development, testing, and production insights

The architecture prioritizes **clarity, maintainability, and AI collaboration** over traditional development patterns, making it an ideal template for AI-first development workflows.
