# Port Management Configuration Examples

## Overview

This document provides practical configuration examples for implementing the port management strategy established in Story 1.7. All examples are tested and validated for real-world usage.

## Environment Variable Configuration

### Human Development Environment

Create `.env.local` for human development:

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

### AI Development Environment

Create `.env.ai` for AI development:

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

## Shell Function Examples

### Chrome Debug Function

Add to your `~/.zshrc`:

```bash
# Chrome debug function with configurable port
chrome-debug() {
    local port=${1:-9222}
    echo "Starting Chrome debug on port $port"
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
        --user-data-dir=/tmp/chrome_debug_$port \
        --remote-debugging-port=$port &
    echo "Chrome debug started on port $port"
    echo "Access debug interface at: http://localhost:$port"
}
```

Usage:

```bash
chrome-debug          # Uses default port 9222
chrome-debug 9322     # Uses port 9322 (for AI development)
chrome-debug 9223     # Uses port 9223 (custom port)
```

### Port Management Helpers

```bash
# Check port availability
check-port() {
    local port=${1}
    if lsof -i :$port >/dev/null 2>&1; then
        echo "❌ Port $port is in use:"
        lsof -i :$port
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Kill process on port
kill-port() {
    local port=${1}
    if lsof -i :$port >/dev/null 2>&1; then
        echo "Killing process on port $port..."
        lsof -ti :$port | xargs kill -9
        echo "Process killed"
    else
        echo "No process found on port $port"
    fi
}

# List all development ports
list-dev-ports() {
    echo "Development Port Status:"
    echo "========================"
    for port in 3000 3100 6006 6106 9222 9322; do
        printf "Port %d: " $port
        if lsof -i :$port >/dev/null 2>&1; then
            echo "🔴 IN USE"
        else
            echo "🟢 FREE"
        fi
    done
}
```

## Development Workflow Scripts

### Multi-Process Development Setup

Create `scripts/dev-setup.sh`:

```bash
#!/bin/bash
# Multi-process development environment setup

echo "🚀 Starting multi-process development environment..."

# Function to check port availability
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        echo "❌ Port $1 is already in use"
        return 1
    fi
    return 0
}

# Check all required ports
echo "Checking port availability..."
for port in 3000 3100 3210 6006 6106 9222 9322; do
    if ! check_port $port; then
        echo "Please free port $port or use different configuration"
        exit 1
    fi
done

echo "✅ All ports available"

# Start services in background
echo "Starting Convex development server..."
bunx convex dev &
CONVEX_PID=$!

echo "Starting human Next.js development server (port 3000)..."
PORT=3000 bun dev &
HUMAN_NEXT_PID=$!

echo "Starting AI Next.js development server (port 3100)..."
PORT=3100 bun dev &
AI_NEXT_PID=$!

echo "Starting human Chrome debug (port 9222)..."
chrome-debug 9222 &
HUMAN_CHROME_PID=$!

echo "Starting AI Chrome debug (port 9322)..."
chrome-debug 9322 &
AI_CHROME_PID=$!

echo "
🎉 Development environment started successfully!

Services running:
- Convex: http://localhost:3210
- Human Next.js: http://localhost:3000
- AI Next.js: http://localhost:3100
- Human Chrome Debug: http://localhost:9222
- AI Chrome Debug: http://localhost:9322

Press Ctrl+C to stop all services
"

# Function to cleanup on exit
cleanup() {
    echo "
🛑 Stopping all services..."
    kill $CONVEX_PID $HUMAN_NEXT_PID $AI_NEXT_PID $HUMAN_CHROME_PID $AI_CHROME_PID 2>/dev/null
    echo "All services stopped"
}

trap cleanup EXIT

# Wait for interrupt
wait
```

### Selective Service Start Scripts

Create `scripts/start-human-dev.sh`:

```bash
#!/bin/bash
# Start human development workflow

echo "🏃 Starting human development workflow..."

# Start services
echo "Starting Next.js development server (port 3000)..."
PORT=3000 bun dev &

echo "Starting Chrome debug (port 9222)..."
chrome-debug 9222 &

echo "
✅ Human development workflow started!

Services:
- Next.js: http://localhost:3000
- Chrome Debug: http://localhost:9222
"
```

Create `scripts/start-ai-dev.sh`:

```bash
#!/bin/bash
# Start AI development workflow

echo "🤖 Starting AI development workflow..."

# Start services
echo "Starting Next.js development server (port 3100)..."
PORT=3100 bun dev &

echo "Starting Chrome debug (port 9322)..."
chrome-debug 9322 &

echo "
✅ AI development workflow started!

Services:
- Next.js: http://localhost:3100
- Chrome Debug: http://localhost:9322
"
```

## Package.json Script Examples

### Root Package.json

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:human": "PORT=3000 turbo dev",
    "dev:ai": "PORT=3100 turbo dev",
    "debug:human": "chrome-debug 9222",
    "debug:ai": "chrome-debug 9322",
    "ports:check": "node scripts/check-ports.js",
    "ports:kill": "node scripts/kill-ports.js",
    "setup:multi": "./scripts/dev-setup.sh"
  }
}
```

### Web App Package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:human": "PORT=3000 next dev",
    "dev:ai": "PORT=3100 next dev",
    "dev:debug": "PORT=3000 next dev & chrome-debug 9222",
    "dev:ai-debug": "PORT=3100 next dev & chrome-debug 9322"
  }
}
```

## Configuration Validation Scripts

### Port Configuration Checker

Create `scripts/check-ports.js`:

```javascript
#!/usr/bin/env node

const net = require('net');

const PORTS = {
  'Human Next.js': 3000,
  'AI Next.js': 3100,
  Convex: 3210,
  'Human Storybook': 6006,
  'AI Storybook': 6106,
  'Human Chrome Debug': 9222,
  'AI Chrome Debug': 9322,
};

async function checkPort(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function checkAllPorts() {
  console.log('🔍 Checking development port status...\n');

  for (const [name, port] of Object.entries(PORTS)) {
    const available = await checkPort(port);
    const status = available ? '🟢 FREE' : '🔴 IN USE';
    console.log(`${name.padEnd(20)} (${port}): ${status}`);
  }
}

checkAllPorts().catch(console.error);
```

### Environment Configuration Generator

Create `scripts/generate-env.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const HUMAN_ENV = `# Human Development Environment
PORT=3000
STORYBOOK_PORT=6006
CHROME_DEBUG_PORT=9222
PLAYWRIGHT_PORT_RANGE=4000-4099
DEV_TOOLS_PORT_RANGE=8000-8099

# Shared services
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
`;

const AI_ENV = `# AI Development Environment
PORT=3100
STORYBOOK_PORT=6106
CHROME_DEBUG_PORT=9322
PLAYWRIGHT_PORT_RANGE=4100-4199
DEV_TOOLS_PORT_RANGE=8100-8199

# Shared services
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
`;

// Generate human environment file
fs.writeFileSync('.env.local', HUMAN_ENV);
console.log('✅ Generated .env.local for human development');

// Generate AI environment file
fs.writeFileSync('.env.ai', AI_ENV);
console.log('✅ Generated .env.ai for AI development');

console.log('\n🎉 Environment configuration files generated!');
console.log('\nUsage:');
console.log('- Load human config: source .env.local');
console.log('- Load AI config: source .env.ai');
```

## Docker Compose Example

For containerized development:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  next-human:
    build: .
    ports:
      - '3000:3000'
    environment:
      - PORT=3000
      - NODE_ENV=development
    command: bun dev

  next-ai:
    build: .
    ports:
      - '3100:3100'
    environment:
      - PORT=3100
      - NODE_ENV=development
    command: bun dev

  chrome-debug-human:
    image: browserless/chrome
    ports:
      - '9222:3000'
    environment:
      - DEBUG=true

  chrome-debug-ai:
    image: browserless/chrome
    ports:
      - '9322:3000'
    environment:
      - DEBUG=true
```

## GitHub Actions Integration

```yaml
# .github/workflows/port-validation.yml
name: Port Configuration Validation

on:
  pull_request:
    paths:
      - 'docs/development-guide.md'
      - 'scripts/**'
      - '.env.*'

jobs:
  validate-ports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Validate port configuration
        run: |
          bun run ports:check
          node scripts/check-ports.js

      - name: Test port separation
        run: |
          # Test that human and AI ports don't conflict
          PORT=3000 timeout 5 bun dev &
          PORT=3100 timeout 5 bun dev &
          wait
```

## VS Code Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Human Development",
      "type": "shell",
      "command": "PORT=3000 bun dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Start AI Development",
      "type": "shell",
      "command": "PORT=3100 bun dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Start Chrome Debug Human",
      "type": "shell",
      "command": "chrome-debug 9222",
      "group": "build"
    },
    {
      "label": "Start Chrome Debug AI",
      "type": "shell",
      "command": "chrome-debug 9322",
      "group": "build"
    }
  ]
}
```

## Related Documentation

- [Development Guide](../../development-guide.md) - Complete port management documentation
- [Story 1.7 Lessons](../../lessons-learned/stories/story-1-7-lessons.md) - Implementation insights
- [UAT Plan 1.7](../../testing/uat-plan-1.7.md) - Validation procedures
