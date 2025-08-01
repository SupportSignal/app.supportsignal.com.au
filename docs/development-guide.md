# Development Guide

## Table of Contents

1. [Overview](#overview)
2. [Port Management Strategy](#port-management-strategy)
3. [Local vs Hosted Services](#local-vs-hosted-services)
4. [Reserved Network Ports](#reserved-network-ports)
5. [Port Configuration](#port-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Development Workflow Integration](#development-workflow-integration)

## Overview

This guide provides comprehensive information for developers working on this Next.js + Convex AI-first application. It covers port management strategies that separate human-controlled and AI-controlled development processes, ensuring predictable port allocation and avoiding conflicts.

## Port Management Strategy

### Core Problem

When you manually start a development server from the command line, it blocks that port. If Claude/AI tries to start the same service later, it gets bumped to an unpredictable port, causing confusion and broken workflows.

### Solution: Separated Port Ranges

We use different port ranges for human vs AI-controlled processes:

- **Human Ports**: Standard default ports (3000, 6006, 9222, etc.)
- **AI Ports**: Offset by +100 from human ports (3100, 6106, 9322, etc.)

This ensures both can run simultaneously with predictable port allocation.

### Development Environment Architecture

Our development environment includes:

**Local Services** (need port separation):

- Next.js development servers
- Storybook instances
- Chrome debug interfaces
- Playwright test runners
- Local development tools

**Hosted Services** (no port separation needed):

- Convex backend (serverless - same URL for all)
- Cloudflare Pages (hosted service)

## Local vs Hosted Services

### Local Services (Port Management Required)

These services run on your local machine and need port separation:

| Service            | Description              | Port Management                 |
| ------------------ | ------------------------ | ------------------------------- |
| Next.js Dev Server | Local development server | Human: 3000, AI: 3100           |
| Storybook          | Component development    | Human: 6006, AI: 6106           |
| Chrome Debug       | Browser debugging        | Human: 9222, AI: 9322           |
| Playwright         | E2E testing              | Human: 4000-4099, AI: 4100-4199 |
| Local Tools        | Development utilities    | Human: 8000-8099, AI: 8100-8199 |

### Hosted Services (No Port Management)

These services are hosted externally and shared by all users:

| Service          | Description             | Access Method                                   |
| ---------------- | ----------------------- | ----------------------------------------------- |
| Convex Backend   | Serverless database/API | Single URL: `https://your-project.convex.cloud` |
| Cloudflare Pages | Static site hosting     | Single URL: `https://your-site.pages.dev`       |
| GitHub Actions   | CI/CD pipeline          | Web interface only                              |

## Reserved Network Ports

### Human-Controlled Ports (Manual Terminal Usage)

| Service                 | Default Port | Environment Variable    | Override Command                    |
| ----------------------- | ------------ | ----------------------- | ----------------------------------- |
| Next.js Dev Server      | 3000         | `PORT`                  | `PORT=3000 bun dev`                 |
| Storybook               | 6006         | `STORYBOOK_PORT`        | `STORYBOOK_PORT=6006 bun storybook` |
| Chrome Debug            | 9222         | `CHROME_DEBUG_PORT`     | `--remote-debugging-port=9222`      |
| Playwright Tests        | 4000-4099    | `PLAYWRIGHT_PORT_RANGE` | Dynamic allocation                  |
| Local Development Tools | 8000-8099    | `DEV_TOOLS_PORT_RANGE`  | Various                             |

### AI-Controlled Ports (Claude/AI Agent Usage)

| Service              | Default Port | Environment Variable       | Override Command                    |
| -------------------- | ------------ | -------------------------- | ----------------------------------- |
| Next.js Dev Server   | 3100         | `AI_PORT`                  | `PORT=3100 bun dev`                 |
| Storybook            | 6106         | `AI_STORYBOOK_PORT`        | `STORYBOOK_PORT=6106 bun storybook` |
| Chrome Debug         | 9322         | `AI_CHROME_DEBUG_PORT`     | `--remote-debugging-port=9322`      |
| Playwright Tests     | 4100-4199    | `AI_PLAYWRIGHT_PORT_RANGE` | Dynamic allocation                  |
| AI Development Tools | 8100-8199    | `AI_DEV_TOOLS_PORT_RANGE`  | Various                             |

### Port Range Allocation

```
1000-2999: System and infrastructure
3000-3099: Human Next.js and related services
3100-3199: AI Next.js and related services
4000-4099: Human testing tools
4100-4199: AI testing tools
5000-5999: Reserved for future expansion
6000-6099: Human development tools (Storybook, etc.)
6100-6199: AI development tools
7000-7999: Reserved for future expansion
8000-8099: Human utility services
8100-8199: AI utility services
9000-9099: Reserved for future expansion
9200-9299: Human debugging tools
9300-9399: AI debugging tools
```

## Port Configuration

### Environment Variables

Create separate configuration files for human vs AI usage:

#### `.env.local` (Human Development)

```bash
# Human-controlled ports
PORT=3000
STORYBOOK_PORT=6006
CHROME_DEBUG_PORT=9222
PLAYWRIGHT_PORT_RANGE=4000-4099
DEV_TOOLS_PORT_RANGE=8000-8099

# Shared services (same for human and AI)
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

#### `.env.ai` (AI Development)

```bash
# AI-controlled ports
PORT=3100
STORYBOOK_PORT=6106
CHROME_DEBUG_PORT=9322
PLAYWRIGHT_PORT_RANGE=4100-4199
DEV_TOOLS_PORT_RANGE=8100-8199

# Shared services (same for human and AI)
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

### Command-Line Overrides

#### Human Development (Default Ports)

```bash
# Next.js development server
bun dev                           # Uses port 3000

# Storybook
bun storybook                     # Uses port 6006

# Chrome debug mode
bun chrome:debug                  # Uses port 9222

# Playwright tests
bun test:e2e                      # Uses ports 4000-4099
```

#### AI Development (Offset Ports)

```bash
# Next.js development server
PORT=3100 bun dev                 # Uses port 3100

# Storybook
STORYBOOK_PORT=6106 bun storybook # Uses port 6106

# Chrome debug mode
CHROME_DEBUG_PORT=9322 bun chrome:debug # Uses port 9322

# Playwright tests
PLAYWRIGHT_PORT_RANGE=4100-4199 bun test:e2e # Uses ports 4100-4199
```

### Convex Configuration (Shared Service)

Since Convex is serverless, both human and AI use the same configuration:

```bash
# Start Convex development (shared)
bunx convex dev

# The Convex URL is the same for everyone
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

## Troubleshooting

### Checking Port Availability

#### Using netstat (macOS/Linux)

```bash
# Check if human ports are available
netstat -an | grep :3000  # Next.js human
netstat -an | grep :6006  # Storybook human
netstat -an | grep :9222  # Chrome debug human

# Check if AI ports are available
netstat -an | grep :3100  # Next.js AI
netstat -an | grep :6106  # Storybook AI
netstat -an | grep :9322  # Chrome debug AI
```

#### Using lsof (macOS/Linux)

```bash
# Check what process is using human ports
lsof -i :3000
lsof -i :6006
lsof -i :9222

# Check what process is using AI ports
lsof -i :3100
lsof -i :6106
lsof -i :9322
```

### Common Port Conflicts

#### Next.js Port Conflicts

**Human Next.js (3000) already running, AI tries to start:**

```bash
# AI should use offset port
PORT=3100 bun dev
```

**AI Next.js (3100) already running, human tries to start:**

```bash
# Human should use default port
PORT=3000 bun dev
```

#### Storybook Port Conflicts

**Human Storybook (6006) already running, AI tries to start:**

```bash
# AI should use offset port
STORYBOOK_PORT=6106 bun storybook
```

#### Chrome Debug Port Conflicts

**Human Chrome debug (9222) already running, AI tries to start:**

```bash
# AI should use offset port
CHROME_DEBUG_PORT=9322 bun chrome:debug
```

### Port Conflict Resolution Workflow

1. **Identify the conflict**: Check error messages for port numbers
2. **Determine the user**: Are you (human) or Claude (AI) trying to start the service?
3. **Use the correct port range**:
   - Human: Use default ports (3000, 6006, 9222)
   - AI: Use offset ports (3100, 6106, 9322)
4. **Kill conflicting processes if necessary**:
   ```bash
   # Kill process using a port
   lsof -ti :3000 | xargs kill -9
   ```
5. **Test the resolution**: Start the service with the correct port
6. **Document the configuration**: Update environment variables

## Development Workflow Integration

### Standard Development Commands

#### Human Development Workflow

```bash
# Terminal 1: Start Convex (shared service)
bunx convex dev

# Terminal 2: Start Next.js (human port 3000)
bun dev

# Terminal 3: Start Storybook (human port 6006)
bun storybook

# Terminal 4: Run tests (human port range 4000-4099)
bun test:e2e
```

#### AI Development Workflow

When Claude/AI agents need to start services:

```bash
# Start Next.js on AI port
PORT=3100 bun dev

# Start Storybook on AI port
STORYBOOK_PORT=6106 bun storybook

# Start Chrome debug on AI port
CHROME_DEBUG_PORT=9322 bun chrome:debug

# Run tests on AI port range
PLAYWRIGHT_PORT_RANGE=4100-4199 bun test:e2e
```

### Simultaneous Human + AI Development

This setup allows both human and AI to run development servers simultaneously:

```bash
# Human development (default ports)
PORT=3000 bun dev &           # Next.js on port 3000
STORYBOOK_PORT=6006 bun storybook &  # Storybook on port 6006

# AI development (offset ports)
PORT=3100 bun dev &           # Next.js on port 3100
STORYBOOK_PORT=6106 bun storybook &  # Storybook on port 6106

# Both connect to the same Convex backend
bunx convex dev               # Shared Convex service
```

### Environment-Specific Configuration

#### Development Environment Variables

Create a `.env.ports` file for easy port management:

```bash
# Human development ports
HUMAN_NEXT_PORT=3000
HUMAN_STORYBOOK_PORT=6006
HUMAN_CHROME_DEBUG_PORT=9222
HUMAN_TEST_PORT_RANGE=4000-4099

# AI development ports
AI_NEXT_PORT=3100
AI_STORYBOOK_PORT=6106
AI_CHROME_DEBUG_PORT=9322
AI_TEST_PORT_RANGE=4100-4199

# Shared services
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

## Best Practices

### Port Management Guidelines

1. **Always use the correct port range**: Human (default) vs AI (offset +100)
2. **Check port availability** before starting services
3. **Use environment variables** for port configuration
4. **Document port assignments** when deviating from defaults
5. **Test both human and AI workflows** to ensure they work simultaneously
6. **Keep shared services consistent** (Convex URL, etc.)

### Development Environment Setup

1. **Clone the repository**
2. **Install dependencies**: `bun install`
3. **Configure environment variables**: Set up both `.env.local` and `.env.ai`
4. **Test port separation**: Start both human and AI services
5. **Verify Convex connection**: Ensure both can connect to the same backend
6. **Document your setup**: Note any custom port configurations

### Troubleshooting Checklist

- [ ] Verify you're using the correct port range (human vs AI)
- [ ] Check if the port is already in use: `lsof -i :PORT`
- [ ] Confirm environment variables are set correctly
- [ ] Test that both human and AI services can run simultaneously
- [ ] Verify Convex URL is consistent across all configurations
- [ ] Check firewall settings if ports are not accessible
- [ ] Review logs for port-related error messages

### Quick Reference

**Human Ports**: 3000, 6006, 9222, 4000-4099, 8000-8099
**AI Ports**: 3100, 6106, 9322, 4100-4199, 8100-8199
**Shared Services**: Convex (same URL), Cloudflare Pages (same URL)

## Development Scripts & Environment Management

### Script Ecosystem Integration

This project includes a comprehensive script ecosystem for development workflow automation:

**Package.json Scripts**:

- `bun dev` - Start development servers (respects PORT environment variable)
- `bun run sync-env` - Synchronize environment variables from source of truth
- `bun run push` - Smart git push with pre-validation and CI monitoring
- `bun run ci:status` - Check GitHub Actions CI status
- `bun run ci:watch` - Monitor CI execution in real-time

**Shell Scripts (`/scripts/` directory)**:

- `sync-env.js` - Advanced environment variable synchronization
- `smart-push.sh` - Intelligent git operations with validation
- `ci-monitor.sh` & `ci-status.sh` - CI/CD monitoring utilities
- `cleanup-logs.sh` - Convex log management for cost control
- `grant-llm-access.sh` - User permission management

### Environment Variable Management

The project uses a centralized environment management system:

1. **Source of Truth**: `.env.source-of-truth.local` (human-readable table format)
2. **Distribution**: `bun run sync-env` generates app-specific environment files
3. **Validation**: Built-in security checks and consistency validation
4. **Backup**: Automatic backup before changes

**Workflow Integration**:

```bash
# Update environment variables
nano .env.source-of-truth.local

# Sync to all applications
bun run sync-env

# Restart development servers
bun dev
```

### Development Workflow Integration

**Daily Development Workflow**:

```bash
# 1. Sync environment (if changed)
bun run sync-env

# 2. Start development with port management
PORT=3000 bun dev    # Human development
# OR
PORT=3100 bun dev    # AI development

# 3. Pre-commit validation
bun run push         # Validates before pushing
```

**CI/CD Integration**:

- `bun run push` includes pre-push validation (lint, typecheck, build)
- `bun run ci:watch` monitors GitHub Actions pipeline
- Port management ensures consistent behavior across environments

For complete script documentation, see **[Scripts and Commands Reference](./technical-guides/scripts-and-commands-reference.md)**.

---

For more information about development commands and workflows, see [CLAUDE.md](../CLAUDE.md).
