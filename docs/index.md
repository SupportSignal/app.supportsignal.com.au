# Starter NextJS Convex AI - Documentation

## Overview

This is a Next.js template for building AI-first applications using the BMAD (Breakthrough Method for Agile AI Driven Development) methodology. It combines modern web development practices with structured AI-assisted development workflows.

## Key Features

- **AI-First Architecture** - Built from the ground up for AI agent collaboration
- **BMAD Methodology** - Structured approach to AI-assisted development
- **Modern Stack** - Next.js, Convex, TypeScript, Tailwind CSS
- **Developer Experience** - Chrome DevTools to Claude Code integration
- **Cost-Effective** - Optimized for <$10/month at small scale

## Quick Links

- **[Getting Started](../README.md)** - Setup and installation
- **[Development Server Startup Guide](./development-server-startup-guide.md)** - Complete server startup instructions
- **[Development Guide](./development-guide.md)** - Port management and development workflow
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code specific instructions
- **[BMAD Method](./methodology/bmad-context-engineering.md)** - Development methodology

## 🚀 New Repository Setup

**To get a new repository running in the cloud with everything configured:**

🎯 **[New Repository Setup Guide](./new-repository-setup-guide.md)** ⏱️ 2-3 hours

Dedicated step-by-step guide for deploying this template to production with all services configured.

## Core Documentation (BMAD-METHOD)

Following BMAD methodology, these documents form the foundation:

- **[SupportSignal PRD](./prd.md)** - Complete product requirements for SupportSignal application
- **[Product Requirements (PRD)](./prd/)** - Detailed product requirements document (sharded)
- **[Architecture](./architecture/)** - Technical architecture and design decisions (sharded)

### 📋 SupportSignal Product Requirements

**[SupportSignal PRD Documentation](./prd/)**

- **[PRD Overview](./prd/index.md)** - Navigation and complete requirements overview
- **[Epic 1: Data Foundation & Backend Setup](./prd/epic-1.md)** - Infrastructure, database schema, AI integration, authentication
- **[Epic 2: Incident Capture Workflow](./prd/epic-2.md)** - 7-step capture wizard, narrative collection, AI clarification system
- **[Epic 3: Incident Analysis Workflow](./prd/epic-3.md)** - 4-step analysis process, contributing conditions, classification system

### 🏗️ Architecture (Sharded)

**[architecture/](./architecture/)**

- **[Architecture Overview](./architecture/index.md)** - Complete architecture navigation
- **[High-Level Architecture](./architecture/high-level-architecture.md)** - System diagrams and patterns
- **[Tech Stack](./architecture/tech-stack.md)** - Technology choices and versions
- **[Data Models](./architecture/data-models.md)** - Database schema and relationships
- **[API Implementation](./architecture/api-implementation-details.md)** - OpenAPI and Convex functions
- **[Components](./architecture/components.md)** - Component interaction patterns
- **[Coding Standards](./architecture/coding-standards.md)** - Development conventions
- **[Security](./architecture/security.md)** - Multi-layered security strategy

## Documentation Structure

### 📚 Methodology

**[methodology/](./methodology/)**

- **[BMAD Context Engineering](./methodology/bmad-context-engineering.md)** - Structured AI development approach
- **[Agentic Architect Developer Persona](./methodology/agentic-architect-developer-persona.md)** - AI personas for requirements gathering
- **[Multi-Layer Manifest Architecture KDD](./methodology/multi-layer-manifest-architecture-kdd.md)** - Knowledge management system for complex multi-layer templates
- **[Mobile Optimization Story 3.5](./methodology/mobile-optimization-story-3.5.md)** - Mobile-first responsive design implementation progress and UAT testing plan

### 🔧 Technical Guides

**[technical-guides/](./technical-guides/)**

- **[TypeScript Configuration Best Practices](./technical-guides/typescript-configuration-best-practices.md)** - Battle-tested TypeScript config patterns for monorepos, focusing on consistency and environment parity
- **[CI/Environment Debugging Methodology](./technical-guides/ci-debugging-methodology.md)** - Systematic approach to debugging CI failures, environment differences, and build configuration issues
- **[Worker Deployment Setup](./technical-guides/worker-deployment-setup.md)** - Cloudflare Workers + Redis logging infrastructure deployment
- **[Log Ingestion Worker Setup KDD](./technical-guides/log-ingestion-worker-setup-kdd.md)** - Knowledge and lessons learned from centralized logging implementation
- **[Cost-Effective Logging](./technical-guides/cost-effective-logging-in-convex-agentic-systems.md)** - Legacy Convex logging strategies (superseded by Worker system)

#### 🧠 Recent Knowledge Discovery & Design (KDD) Documents

- **[PDF Generation Debugging KDD](./technical-guides/pdf-generation-debugging-kdd.md)** - **CRITICAL DEBUGGING GUIDE** - Multi-layer PDF generation issues, component architecture, storage limits, character encoding, and UX patterns
- **[PDF Generation Implementation KDD](./technical-guides/pdf-generation-implementation-kdd.md)** - jsPDF vs Puppeteer for serverless environments, comprehensive incident data gathering patterns  
- **[API Compatibility Patterns KDD](./technical-guides/api-compatibility-patterns-kdd.md)** - Runtime vs compile-time validation gaps, compatibility wrapper patterns for API mismatches
- **[Implementation vs Testing Gap KDD](./technical-guides/implementation-vs-testing-gap-kdd.md)** - User-first validation methodology, complete workflow testing over technical implementation
- **[Dev Error Pipeline](./technical-guides/dev-error-pipeline.md)** - Chrome DevTools to Claude Code integration
- **[AI Model Configuration Architecture KDD](./technical-guides/ai-model-configuration-architecture-kdd.md)** - Environment-driven AI model configuration vs database hardcoding
- **[Convex Components Guide](./technical-guides/convex-components-guide.md)** - Convex architecture patterns and component examples
- **[React + Convex Development Patterns KDD](./technical-guides/react-convex-patterns-kdd.md)** - **Critical patterns** - Avoid useEffect recursion, proper data flow, anti-patterns to prevent
- **[Business Logic Validation Failure KDD](./technical-guides/business-logic-validation-failure-kdd.md)** - **Critical debugging pattern** - Business logic validation must precede technical error resolution
- **[Authentication Architecture](./technical-guides/authentication-architecture.md)** - Complete authentication system architecture and security patterns
- **[Cloudflare Pages Setup](./technical-guides/cloudflare-pages-setup.md)** - Step-by-step Cloudflare Pages deployment guide
- **[Cloudflare Pages Troubleshooting](./technical-guides/cloudflare-pages-deployment-troubleshooting.md)** - Systematic troubleshooting for deployment issues
- **[Implementing Manifest Systems Guide](./technical-guides/implementing-manifest-systems-guide.md)** - Step-by-step guide for adopting Multi-Layer Manifest Architecture

### 🚀 Operations & Deployment

**[operations/](./operations/)** - Production deployment and operations procedures

**Deployment Operations:**
- **[Deployment Guide](./operations/deployment-guide.md)** - Comprehensive deployment procedures for all platforms (Cloudflare Pages, Convex, Workers)
- **[Deployment Verification](./operations/deployment-verification.md)** - Post-deployment verification and health check procedures
- **[Rollback Procedures](./operations/rollback-procedures.md)** - Platform-specific rollback and incident response procedures

**Configuration Management:**
- **[Configuration Management](./operations/configuration-management.md)** - Environment configuration protocols and sync-env usage patterns
- **[Configuration Drift Detection](./operations/configuration-drift-detection.md)** - Automated drift detection and prevention procedures

**CI/CD Operations:**
- **[CI/CD Pipeline Operations](./operations/cicd-pipeline-operations.md)** - Pipeline monitoring, troubleshooting, and failure response

**Verification Scripts:** (See `scripts/` directory)
- `verify-deployment.sh` - Comprehensive deployment verification across all platforms
- `verify-worker-health.sh` - Detailed Cloudflare Worker health checks
- `verify-environment.sh` - Environment detection and configuration validation
- `validate-config.sh` - Configuration validation and consistency checks
- `check-config-drift.sh` - Configuration drift detection
- `health-check.sh` - Quick service health verification

### 🧪 Testing

**[testing/](./testing/)**

#### Technical Testing (For Developers)

- **[Testing Infrastructure Lessons Learned](./testing/technical/testing-infrastructure-lessons-learned.md)** - **START HERE for debugging** - Real problems and solutions from testing implementation
- **[Testing Infrastructure Architecture KDD](./testing/technical/testing-infrastructure-architecture-kdd.md)** - **Critical architecture lessons** - BadConvexModuleIdentifier resolution and test separation patterns
- **[Testing Patterns](./testing/technical/testing-patterns.md)** - **For implementation** - Concrete patterns for React components, hooks, Convex functions
- **[Test Strategy & Standards](./testing/technical/test-strategy-and-standards.md)** - **For context** - Testing framework, coverage targets, CI/CD integration

#### Functional Testing (For QA/Product)

- **[Functional Test Plans](./testing/uat/)** - User acceptance testing for individual stories

### 📚 Knowledge-Driven Development (KDD)

**Comprehensive guides and systematic knowledge libraries:**

**Last Updated**: 2025-09-30 | **Knowledge Base Stats**: 7+ patterns | 15+ examples | 11+ lessons learned

#### Recent Knowledge Assets Added

**Latest Patterns** (September 2025):
- **[Environment-Aware URL Configuration](./technical-guides/environment-aware-url-configuration-kdd.md)** - Centralized URL configuration with environment detection (Story 8.2)

**Latest Examples** (September 2025):
- **[URL Configuration Implementation](./examples/backend/)** - Working environment-aware URL system with comprehensive test suite

**Latest Lessons** (September 2025):
- **[Jest/Bun Test Runner Compatibility](./technical-guides/environment-aware-url-configuration-kdd.md)** - API differences between test runners affecting implementation

#### [Implementation Guides](./guides/)

Complete implementation and usage guides for AI agents and developers:

- **[KDD Implementation Guide](./guides/kdd-implementation-guide.md)** - Complete KDD methodology implementation framework
- **[KDD Setup Guide](./guides/kdd-setup-guide.md)** - Practical setup guide with quick start and real examples
- **[Sprint Estimation Implementation Guide](./guides/sprint-estimation-implementation-guide.md)** - BMAD enhancement with sprint planning capabilities

#### [YouTube Briefs](./youtube-briefs/)

Video creation briefs for sharing knowledge and demonstrations:

- **[CI Monitoring Automation Brief](./youtube-briefs/ci-monitoring-automation-brief.md)** - Smart push and CI monitoring system demonstration
- **[Sprint Estimation Brief](./youtube-briefs/sprint-estimation-brief.md)** - BMAD sprint planning enhancement video guide
- **[KDD Methodology Brief](./youtube-briefs/kdd-methodology-brief.md)** - Knowledge-Driven Development video presentation guide

**Knowledge Libraries for systematic development:**

#### [Patterns Library](./patterns/) - 7+ Established Patterns

**Purpose**: Architectural patterns and best practices validated through real implementations

- **[Frontend Patterns](./patterns/frontend-patterns.md)** - React, Next.js, and UI patterns
- **[Backend Patterns](./patterns/backend-patterns.md)** - Convex, API, and server-side patterns (Updated: 2025-09-30)
- **[Testing Patterns](./testing/technical/testing-patterns.md)** - Testing strategies across all layers (Updated: 2025-09-30)
- **[Architecture Patterns](./patterns/architecture-patterns.md)** - System design patterns
- **[Development Workflow Patterns](./patterns/development-workflow-patterns.md)** - Process and collaboration patterns

**📋 [Pattern Index](./patterns/index.md)** - Complete pattern navigation and usage guidelines

#### [Examples Library](./examples/) - 15+ Working Examples

**Purpose**: Real implementation examples extracted from successful story completions

- **[Monorepo Setup](./examples/monorepo-setup/)** - Complete Bun/Turborepo configuration example
- **[Frontend Examples](./examples/frontend/)** - React and Next.js implementation examples
- **[Backend Examples](./examples/backend/)** - Convex function examples and runtime patterns (Updated: 2025-09-30)
  - **[Knowledge Ingestion Deployment Patterns](./examples/backend/knowledge-ingestion-deployment-patterns.md)** - Vector storage deployment patterns and configuration management
- **[Testing Examples](./examples/testing/)** - Comprehensive testing examples
- **[CI/CD Deployment Examples](./examples/cicd-deployment/)** - Complete CI/CD pipeline and deployment examples
- **[Configuration Examples](./examples/configuration/)** - Project configuration examples

**📋 [Examples Index](./examples/index.md)** - Complete examples navigation with setup instructions

#### [Lessons Learned](./lessons-learned/) - 12+ Captured Insights

**Purpose**: Cross-story insights and breakthroughs captured from real development challenges

- **[Configuration & Environment](./lessons-learned/)** - Critical environment and deployment insights
  - **[Deployment Operations Implementation KDD](./lessons-learned/deployment-operations-implementation-kdd.md)** - Story 8.4 lessons: Multi-platform deployment, configuration management, automated verification, rollback procedures (Added: 2025-10-01)
  - **[OAuth Production Setup Implementation KDD](./lessons-learned/oauth-production-setup-implementation-kdd.md)** - Story 8.3 lessons: OAuth production setup, centralized URL generation (Added: 2025-09-30)
- **[Story Lessons](./lessons-learned/stories/)** - Insights from individual story implementations
  - **[Story 1.6 Lessons](./lessons-learned/stories/story-1-6-lessons.md)** - CI/CD Pipeline implementation learnings
  - **[Story 4.2 Knowledge Ingestion Lessons](./lessons-learned/stories/story-4.2-knowledge-ingestion-lessons.md)** - Cloudflare Vectorize integration and vector storage patterns
- **[Technology Lessons](./lessons-learned/technology/)** - Technology-specific learnings
- **[Process Lessons](./lessons-learned/process/)** - Development workflow insights
- **[Anti-Patterns](./lessons-learned/anti-patterns/)** - Approaches to avoid
  - **[React + Convex Patterns KDD](./technical-guides/react-convex-patterns-kdd.md)** - Critical anti-patterns that cause useEffect recursion and performance issues

**📋 [Lessons Index](./lessons-learned/index.md)** - Complete lessons navigation organized by category and impact

#### Knowledge Base Health & Maintenance

**📊 Knowledge Base Statistics** (Last Updated: 2025-09-30):
- **Total Knowledge Assets**: 33+ files
- **Patterns**: 7+ established architectural patterns
- **Examples**: 15+ working implementation examples
- **Lessons**: 11+ insights from story implementations
- **Cross-References**: Maintained via KDD process

**🔄 Maintenance Schedule**:
- **KDD Updates**: After every story completion (automatic)
- **TOC Maintenance**: During KDD execution (systematic)
- **Health Checks**: Monthly via `.bmad-core/templates/toc-update-tmpl.md`
- **Quarterly Reviews**: Pattern consolidation and structure optimization

**🛠 Knowledge Base Tools**:
- **[KDD Complete Guide](./methodology/kdd-complete-guide.md)** - Full KDD methodology
- **[TOC Update Templates](./.bmad-core/templates/toc-update-tmpl.md)** - Standardized TOC maintenance
- **[KDD Quick Reference](./methodology/kdd-quick-reference.md)** - Commands and checklists

#### [Peer Reviews](./peer-reviews/)

Architectural discussions and external feedback:

- **[Convex Structure Analysis](./peer-reviews/convex-structure-analysis.md)** - Review of monorepo structure vs simplified approach

### 🚧 Historical Work

**[historical/](./historical/)**

- **[Overview](./historical/index.md)** - Early planning documents
- **[Tech Stack](./historical/preliminary-tech-stack.md)** - Technology choices
- **[Epics](./historical/preliminary-epics.md)** - Feature breakdown

## Development Workflow

```mermaid
graph TD
    subgraph "Input & Feedback Sources"
        direction LR
        A[Production<br/>(Sentry, PostHog, Logs)]
        B[User<br/>(Feedback Widget)]
        C[Developer/PO<br/>(Directives)]
        D[Testing<br/>(Playwright, CI)]
        E[Data & Process<br/>(Pipelines, Reviews)]
    end
    subgraph "Core Agentic System"
        direction TB
        F((Knowledge Base <br/> Vector + Graph Context))
        G{AI Workforce <br/> (Claude Code Agents)}
        H(BMAD-METHOD <br/> Process & Templates)
    end
    subgraph "Outputs & Artifacts"
        direction LR
        I[Codebase]
        J[Documentation]
        K[GitHub Issues]
        L[Test Data Profiles]
        M[Agent Definitions]
    end
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    G --> F
    F --> H
    H --> F
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
```

## Getting Started with Development

1. **Review Core Documents**
   - Read [Project Brief](./project-brief.md) for context
   - Study [PRD Overview](./prd/index.md) for requirements navigation
   - Understand [Architecture Overview](./architecture/index.md) for technical decisions

2. **Understand the Methodology**
   - Read [BMAD Context Engineering](./methodology/bmad-context-engineering.md)
   - Review the [Agentic Persona](./methodology/agentic-architect-developer-persona.md)

3. **Setup Development Environment**
   - Follow the [Dev Error Pipeline](./technical-guides/dev-error-pipeline.md) setup
   - Configure Chrome DevTools integration

4. **Start Building**
   - Use BMAD agents for planning
   - Implement with Claude Code
   - Test with integrated tooling

## Key Innovations

### 1. Chrome DevTools to Claude Code Bridge

Seamless integration between browser debugging and AI assistance:

- Zero-friction console log capture
- Automatic context preservation
- E2E test integration

### 2. Cost-Conscious Architecture

Built to scale efficiently:

- Hybrid logging pattern
- Smart error sampling
- Convex-first data strategy

### 3. AI-Native Development Flow

Every aspect optimized for AI collaboration:

- Context-rich story files
- Specialized agent personas
- Continuous feedback loops

## Contributing

This template is designed to evolve. Contributions are welcome in:

- Additional agent personas
- Integration patterns
- Cost optimization strategies
- Developer experience improvements

## Resources

- **BMAD Method**: [GitHub - bmadcode/BMAD-METHOD](https://github.com/bmadcode/BMAD-METHOD)
- **Claude Code**: [Anthropic's official CLI](https://claude.ai/code)
- **Convex**: [Backend platform](https://convex.dev)
- **Community**: Join the discussion on Discord

---

_This project demonstrates how AI can be a true development partner when given proper context and structure. It's not about replacing developers, but amplifying their capabilities through intelligent collaboration._
