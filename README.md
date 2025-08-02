# Starter NextJS Convex AI

> An opinionated, production-grade starter template for building AI-native applications using modern edge-first technologies and the BMAD (Breakthrough Method for Agile AI Driven Development) methodology.

## Overview

This template provides a foundational solution for developers, architects, and tech-savvy entrepreneurs to rapidly build AI-first applications. It combines a best-in-class technical foundation with integrated workflows for managing an AI workforce, enabling you to act as a "Context Engineer" directing AI agents to build robust, maintainable applications.

### Key Features

- **AI-First Architecture** - Built from the ground up for AI agent collaboration with Claude Code integration
- **BMAD Methodology** - Structured approach to AI-assisted development with context engineering
- **Modern Edge Stack** - Next.js, Convex, TypeScript, Tailwind CSS deployed on Cloudflare
- **Real-time Development** - Chrome DevTools to Claude Code bridge for seamless debugging
- **Production Ready** - Built-in error tracking, monitoring, and testing infrastructure
- **Cost Optimized** - Designed to run under $10/month at small scale

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **Backend**: Convex for real-time data and serverless functions
- **Styling**: Tailwind CSS + ShadCN UI components
- **Deployment**: Cloudflare Pages/Workers for edge computing
- **Package Manager**: Bun for fast, modern dependency management
- **Testing**: Jest (unit), Playwright (E2E)
- **Monitoring**: Sentry, PostHog integration ready

## Getting Started

### Prerequisites

- Node.js 18+ or Bun runtime
- Git
- Chrome/Chromium browser (for dev tools integration)
- Claude Code account (for AI assistance)
- Convex account (sign up at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/appydave/starter-nextjs-convex-ai.git
cd starter-nextjs-convex-ai
```

2. Install dependencies:

```bash
bun install
```

3. Set up Convex Backend:

```bash
# Navigate to Convex directory
cd apps/convex

# Initialize Convex (if not already done)
bunx convex dev

# This will:
# - Create a new Convex project or connect to existing
# - Generate environment variables
# - Deploy initial schema and functions
# - Start the development server
```

4. Configure Environment Variables:

```bash
# Copy Convex URL from terminal output to web app
cd ../web
cp .env.local.example .env.local

# Edit .env.local with your Convex URL:
# NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

5. Start the development servers:

```bash
# Terminal 1: Start Convex backend (if not already running)
cd apps/convex && bunx convex dev

# Terminal 2: Start Next.js with Claude integration
cd apps/web && bun dev:claude
```

6. Open http://localhost:3000 in your browser

## 🚀 New Repository Setup

**To get a new repository running in the cloud with everything configured:**

🎯 **[New Repository Setup Guide](./docs/new-repository-setup-guide.md)** ⏱️ 2-3 hours

This dedicated guide takes you from zero to a fully deployed AI application with:

- ✅ **Live site** on Cloudflare Pages
- ✅ **GitHub authentication** (+ optional Google)
- ✅ **AI chat** powered by OpenRouter/OpenAI
- ✅ **Automated deployments** via GitHub Actions
- ✅ **Under $10/month** total cost

**Quick Reference**:

- **[Setup Verification Checklist](./docs/setup-verification-checklist.md)** - Systematic verification process
- **[Development Guide](./docs/development-guide.md)** - Daily development workflow
- **[Scripts & Commands](./docs/technical-guides/scripts-and-commands-reference.md)** - All available commands

### Quick Commands

```bash
# Development
bun dev              # Start development server
bun dev:claude       # Development with Claude logging integration

# Build & Production
bun build            # Build for production
bun start            # Start production server

# Testing
bun test             # Run Jest unit tests
bun test:e2e         # Run Playwright E2E tests
bun test:e2e:ui      # Run Playwright with UI mode

# Code Quality
bun lint             # Run ESLint
bun format           # Run Prettier
bun typecheck        # Run TypeScript compiler checks

# Convex Backend
bunx convex dev      # Start Convex development server
bunx convex deploy   # Deploy Convex functions

# Claude Integration
bun chrome:debug     # Start Chrome with debugging port
bun claude:bridge    # Start Claude Dev Bridge for log capture
```

## Convex Backend Setup

### Understanding Convex Integration

This project uses Convex as the backend-as-a-service for real-time data, authentication, and serverless functions. The Convex backend is located in `apps/convex/` and provides:

- **Real-time Database**: Reactive queries that update automatically
- **Authentication**: Secure user management and session handling
- **Serverless Functions**: Backend logic without server management
- **Type Safety**: Full TypeScript integration with the frontend

### Initial Convex Setup

1. **Create a Convex Account**: Sign up at [convex.dev](https://convex.dev) if you haven't already.

2. **Initialize Your Convex Project**:

   ```bash
   cd apps/convex
   bunx convex dev
   ```

   This will:
   - Prompt you to create a new project or connect to an existing one
   - Generate deployment URLs and environment variables
   - Deploy the initial schema and functions
   - Start the development server

3. **Configure Environment Variables**:
   ```bash
   # Copy the Convex URL from the terminal output
   cd ../web
   echo "NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud" > .env.local
   ```

### Convex Development Workflow

**Schema Changes**: Edit `apps/convex/schema.ts` to define your data structure

```typescript
// Example: Adding a new table
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }).index('by_email', ['email']),
});
```

**Backend Functions**: Create functions in `apps/convex/` directory

```typescript
// Example: Query function
export const getUsers = query({
  args: {},
  handler: async ctx => {
    return await ctx.db.query('users').collect();
  },
});
```

**Frontend Integration**: Use Convex hooks in React components

```typescript
// Example: Using the query in a component
import { useQuery } from "convex/react";
import { api } from "../convex/api";

export function UsersList() {
  const users = useQuery(api.users.getUsers);
  return <div>{users?.map(user => <p key={user._id}>{user.name}</p>)}</div>;
}
```

### Convex Authentication

The project includes a complete authentication system:

- **User Registration**: Email/password signup with secure hashing
- **Login/Logout**: Session-based authentication
- **Protected Routes**: Client-side route protection
- **User Management**: Profile updates and session management

Test the authentication:

1. Start the development server
2. Visit `/register` to create an account
3. Visit `/login` to sign in
4. Access `/protected` to see authenticated content

### Convex Deployment

**Development**: `bunx convex dev` - Auto-deploys changes to development environment
**Production**: `bunx convex deploy` - Deploys to production environment

### Common Issues & Solutions

**"Cannot connect to Convex"**:

- Ensure `NEXT_PUBLIC_CONVEX_URL` is set in `.env.local`
- Check that Convex dev server is running
- Verify your Convex deployment is active

**"Schema validation errors"**:

- Check your schema definition in `apps/convex/schema.ts`
- Ensure all required fields are present
- Use the Convex dashboard to inspect your data

**"Function not found"**:

- Verify function is exported in the correct file
- Check that Convex dev server has recompiled
- Ensure you're importing from the correct API path

## Project Structure

```
starter-nextjs-convex-ai/
├── apps/web/              # Next.js application
│   ├── app/              # App Router pages and layouts
│   ├── components/       # React components
│   ├── lib/             # Utilities and shared code
│   └── convex/          # Convex backend functions
├── packages/
│   ├── ui/              # Shared UI components library
│   └── convex/          # Shared Convex schemas/helpers
├── tests/               # E2E Playwright tests
├── docs/                # Comprehensive documentation
│   ├── methodology/     # BMAD method guides
│   ├── technical-guides/# Implementation guides
│   └── historical/      # Planning documents
├── CLAUDE.md            # Claude Code specific instructions
└── README.md            # This file
```

## Development Workflow

### BMAD Method

This project follows the BMAD (Before, Model, After, Document) methodology:

1. **Before**: Capture context and requirements
2. **Model**: Use Claude Code for implementation
3. **After**: Verify, test, and refine results
4. **Document**: Update documentation and learnings

### AI-Assisted Development

1. **Setup Chrome DevTools Integration**

   ```bash
   bun chrome:debug      # Start Chrome with debugging
   bun claude:bridge     # Start log capture bridge
   ```

2. **Work with Claude Code**
   - Use CLAUDE.md for project-specific AI guidance
   - Leverage built-in context from documentation
   - Follow established patterns and conventions

3. **Testing & Validation**
   - Unit tests for business logic
   - Integration tests for Convex functions
   - E2E tests for critical user flows
   - Automatic test result capture to Claude

### Deployment

The template is configured for edge deployment on Cloudflare Pages:

```bash
# Deploy to Cloudflare Pages (automatic on git push)
git push origin main

# Manual deployment (if needed)
npx wrangler pages deploy apps/web/.vercel/output/static --project-name=your-project

# Deploy Convex backend
bunx convex deploy --prod
```

📖 **Important**: For first-time deployment setup, see the **[Cloudflare Pages Setup Guide](./docs/technical-guides/cloudflare-pages-setup.md)** for detailed configuration instructions.

## File System Exploration

For AI-assisted development and large codebase analysis, this project includes a comprehensive file exploration system optimized for LLM context management.

### Quick File Commands Reference

```bash
# Complete project views
files -i 'apps/**/*' -i 'docs/**/*' -i 'packages/**/*' -i 'scripts/**/*' -i 'tests/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree  # All files (no hidden)
files -i '**/*' -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree  # All files (with hidden)

# Code-focused views  
files -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/__tests__/**/*' -e '**/test*' -e '**/storybook/**/*' -d -f tree  # Code only
files -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -i 'tests/**/*.ts' -i 'tests/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/storybook/**/*' -d -f tree  # Code + tests

# Documentation views
files -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -i 'docs/technical-guides/**/*' -i 'docs/template-usage/**/*' -e 'docs/testing/uat/**/*' -d -f tree  # Permanent docs
files -i 'docs/testing/uat/**/*' -i 'docs/examples/**/*' -i 'docs/**/story-*' -i 'docs/**/*sprint*' -d -f tree  # Transient docs

# Specialized views
files -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree  # Hidden config only
files -i '**/wrangler*' -i '**/.github/**/*' -i '**/cloudflare*' -i '**/deploy*' -i 'scripts/**/*' -e '**/node_modules/**/*' -d -f tree  # Deployment files
files -i 'apps/convex/**/*' -i 'apps/workers/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree  # Backend only
files -i 'apps/web/**/*' -i 'packages/ui/**/*' -i 'packages/storybook/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree  # Frontend only
```

**Usage Notes:**
- Remove `-f tree` to include actual file contents (use carefully with large contexts)
- Add specific patterns for focused analysis: `-i 'apps/web/components/**/*'`
- Combine queries for multi-perspective analysis
- See **[File System Exploration Guide](./docs/technical-guides/file-system-exploration-and-segmentation-kdd.md)** for complete reference

### AI Context Optimization

This system provides **15 specialized queries** designed for different development scenarios:
- **Complete project views** for comprehensive analysis
- **Code-focused views** for implementation work  
- **Documentation views** for architectural understanding
- **Module-specific views** for targeted development
- **Maintenance views** for cleanup and deployment

Particularly powerful with **Google Gemini's million-token context window** for whole-codebase analysis.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Getting Started Guide](./docs/index.md)** - Overview and quick start
- **[File System Exploration](./docs/technical-guides/file-system-exploration-and-segmentation-kdd.md)** - LLM context optimization
- **[Cloudflare Pages Setup](./docs/technical-guides/cloudflare-pages-setup.md)** - Complete deployment setup guide
- **[Project Brief](./docs/project-brief.md)** - Vision and objectives
- **[Product Requirements](./docs/prd.md)** - Detailed specifications
- **[Architecture Guide](./docs/architecture.md)** - Technical decisions
- **[BMAD Methodology](./docs/methodology/bmad-context-engineering.md)** - AI development approach
- **[Technical Guides](./docs/technical-guides/)** - Implementation patterns

## Key Innovations

### Chrome DevTools to Claude Code Bridge

Seamless integration between browser debugging and AI assistance:

- Zero-friction console log capture
- Automatic context preservation
- E2E test integration

### Cost-Conscious Architecture

Built to scale efficiently on modern platforms:

- Hybrid logging pattern for < $10/month operation
- Smart error sampling with Sentry
- Convex-first data strategy

### AI-Native Development Flow

Every aspect optimized for AI collaboration:

- Context-rich documentation
- Specialized agent personas
- Continuous feedback loops

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

Areas for contribution:

- Additional agent personas
- Integration patterns
- Cost optimization strategies
- Developer experience improvements

## Community

- **Discord**: [Join our community](https://discord.gg/starter-nextjs)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/appydave/starter-nextjs-convex-ai/discussions)
- **Twitter**: [@appydave](https://twitter.com/appydave)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [BMAD Method](https://github.com/bmadcode/BMAD-METHOD) - For the development methodology
- [Claude Code](https://claude.ai/code) - Anthropic's official CLI
- [Convex](https://convex.dev) - Real-time backend platform
- [Vercel](https://vercel.com) - For Next.js and deployment inspiration
- [ShadCN](https://ui.shadcn.com) - For the UI component patterns

---

_Built with AI assistance for the AI-assisted development era._

# Testing CI/CD Pipeline

# Testing CI/CD Pipeline - Fri 18 Jul 2025 12:49:09 +07
