# Dynamic Source Tree System

This directory contains dynamically generated source tree views of the project using gpt_context commands.

## Project Overview

**Name:** SupportSignal Application  
**Type:** TypeScript Monorepo (Next.js + Convex + Cloudflare)  
**Architecture:** AI-powered support signal application  
**Tech Stack:** Next.js, Convex, Cloudflare Pages/Workers, TypeScript, Tailwind CSS, ShadCN UI

## Current Development State

**Latest Story:** 1.1 (Multi-tenant database implementation)  
**Epic Status:** Epic 1 (Core Infrastructure) in progress  
**Major Systems:** Multi-tenant architecture, authentication, database design, integration testing

## Technology Stack Status

### ✅ Fully Implemented

- **Monorepo**: Bun package management
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Convex real-time database and serverless functions
- **Authentication**: BetterAuth with Convex adapter
- **UI Components**: ShadCN UI with custom theme system
- **CI/CD**: GitHub Actions with smart monitoring
- **Testing**: Jest (unit) + Playwright (E2E)

### 🔄 Partially Implemented

- **Multi-tenant Architecture**: Database schema implemented, tenant isolation in progress
- **Cloudflare Integration**: Pages deployment configured
- **AI Features**: Planning phase for conversational AI components
- **Incident Management**: Database schema designed

### 📋 Planned

- **Advanced AI Features**: Support signal analysis and response
- **Production Monitoring**: Comprehensive observability
- **Advanced UI Features**: Real-time incident dashboard
- **Knowledge Base Integration**: AI-powered support documentation

## Key Components Status

- **`apps/convex/`** - ✅ Backend with multi-tenant schema, auth, incident management
- **`apps/web/`** - ✅ Next.js app with authentication and core UI
- **`packages/ui/`** - ✅ Shared component library
- **`tests/`** - ✅ Comprehensive testing across all layers
- **`docs/`** - ✅ Extensive BMAD-structured documentation
- **`scripts/`** - ✅ Development and integration testing tools

## Using This System

1. **Manual Commands**: Use `commands.md` for individual gpt_context commands
2. **Batch Generation**: Run `generate-trees.sh` to refresh all views
3. **Live Views**: Generated markdown files provide current project state
4. **Categories**: 15 different views covering code, docs, tests, config, etc.

This system replaces static documentation with dynamic, always-current source trees.