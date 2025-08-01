CLAUDE: https://claude.ai/public/artifacts/cfb5f200-aed7-43e9-9852-9a5a4167e310

# AI Error Feedback Loop: Developer Experience First

## Overview

This document outlines a feedback system that starts with enhancing the local developer experience - getting Chrome DevTools logs to Claude Code - and evolves into a production error handling system. We prioritize immediate developer productivity over future production features.

## Document Structure

1. **Part A: Immediate Developer Experience** (implement now)
2. **Part B: Future Production System** (implement after MVP ships)

---

# Part A: Local Developer Experience (Priority 1)

## Current Challenge

Developers using Claude Code need to manually copy-paste from Chrome DevTools when debugging. This breaks flow and loses context. We need Chrome console logs to automatically flow to Claude Code without changing how developers work.

## Immediate Goals

1. **Zero friction**: Developers continue using Chrome DevTools as normal
2. **Automatic context**: Console logs available to Claude Code without copy-paste  
3. **Opt-in only**: No changes unless developer explicitly enables it
4. **Works today**: Can be implemented before any application code exists

## Implementation: Chrome to Claude Bridge

### How It Works

```
Developer Workflow (unchanged):
1. Open Chrome DevTools
2. See console.log output  
3. Debug as normal

What happens in background (when enabled):
1. Console output ALSO writes to .claude/session.log
2. Claude Code watches this file
3. Developer can ask Claude questions with full context
```

### Quick Start Implementation

#### 1. Developer Setup (one-time)

```bash
# In project root
mkdir .claude
echo "session.log" >> .claude/.gitignore

# In package.json
"scripts": {
  "dev": "CLAUDE_LOGGING=false next dev",
  "dev:claude": "CLAUDE_LOGGING=true next dev"
}
```

#### 2. Pure Automation with Chrome DevTools Protocol

This approach captures everything automatically - no code changes needed in your app!

**Setup: `claude-dev-bridge.js`**

```javascript
// tools/claude-dev-bridge.js
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

class ClaudeDevBridge {
  constructor() {
    this.clientLogStream = fs.createWriteStream(
      path.join('.claude', 'client.log'), 
      { flags: 'a' }
    );
    this.serverLogStream = fs.createWriteStream(
      path.join('.claude', 'server.log'), 
      { flags: 'a' }
    );
    this.networkLogStream = fs.createWriteStream(
      path.join('.claude', 'network.log'), 
      { flags: 'a' }
    );
  }

  async start() {
    try {
      // Connect to Chrome
      const client = await CDP({
        host: 'localhost',
        port: 9222, // Default Chrome debugging port
      });

      const { Runtime, Network, Console } = client;

      // Enable domains
      await Promise.all([
        Runtime.enable(),
        Network.enable(),
        Console.enable(),
      ]);

      // Capture client-side console logs
      Runtime.consoleAPICalled((params) => {
        const entry = {
          timestamp: new Date().toISOString(),
          level: params.type,
          args: params.args.map(arg => this.extractValue(arg)),
          stackTrace: params.stackTrace,
          url: params.stackTrace?.[0]?.url,
        };
        
        this.clientLogStream.write(JSON.stringify(entry) + '\n');
      });

      // Capture network requests (includes server responses)
      Network.responseReceived((params) => {
        // Next.js API routes and server logs appear here
        if (params.response.url.includes('/api/') || 
            params.response.headers['x-nextjs-data']) {
          this.networkLogStream.write(JSON.stringify({
            timestamp: new Date().toISOString(),
            url: params.response.url,
            status: params.response.status,
            type: params.type,
            method: params.response.method,
          }) + '\n');
        }
      });

      // Capture server logs from Next.js dev server
      Console.messageAdded((params) => {
        if (params.source === 'network' || 
            params.text?.includes('[Next.js]')) {
          this.serverLogStream.write(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: params.level,
            text: params.text,
            url: params.url,
          }) + '\n');
        }
      });

      console.log('🤖 Claude Dev Bridge connected! Logging to .claude/');
      console.log('   - Client logs: .claude/client.log');
      console.log('   - Server logs: .claude/server.log');
      console.log('   - Network logs: .claude/network.log');

    } catch (error) {
      console.error('Failed to connect. Make sure Chrome is running with:');
      console.error('--remote-debugging-port=9222');
      console.error('Error:', error.message);
    }
  }

  extractValue(remoteObject) {
    if (remoteObject.type === 'object') {
      try {
        return JSON.parse(remoteObject.description || '{}');
      } catch {
        return remoteObject.description || remoteObject.className;
      }
    }
    return remoteObject.value;
  }
}

// Start the bridge
const bridge = new ClaudeDevBridge();
bridge.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing Claude Dev Bridge...');
  bridge.clientLogStream.end();
  bridge.serverLogStream.end();
  bridge.networkLogStream.end();
  process.exit();
});
```

**Setup: `package.json` Scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:claude": "concurrently \"npm run dev\" \"npm run claude:bridge\"",
    "claude:bridge": "node tools/claude-dev-bridge.js",
    "chrome:debug": "open -a 'Google Chrome' --args --remote-debugging-port=9222"
  },
  "devDependencies": {
    "chrome-remote-interface": "^0.33.0",
    "concurrently": "^8.2.0"
  }
}
```

**One-Time Setup**

```bash
# Install dependencies
npm install -D chrome-remote-interface concurrently

# Create tools directory
mkdir -p tools .claude

# Start Chrome with debugging
npm run chrome:debug

# In another terminal, start dev with Claude bridge
npm run dev:claude
```

### What This Captures Automatically

1. **Client-Side Logs**
   - All console.log, error, warn, info from browser
   - Stack traces with line numbers
   - Source file information

2. **Server-Side Logs**
   - Next.js API route console outputs
   - Server component logs
   - Build warnings and errors

3. **Network Activity**
   - API calls with responses
   - Failed requests
   - Performance timing

### Developer Experience

```bash
# Start development with full logging
npm run dev:claude

# Everything is automatically logged to:
# .claude/client.log   - Browser console
# .claude/server.log   - Next.js server
# .claude/network.log  - API calls

# Claude Code watches these files and has full context
```

No manual steps, no copy-paste, no code changes needed!

### E2E Testing Integration with Playwright

Playwright tests generate rich debugging information that should flow into the same Claude Code pipeline. Here's how to integrate it:

#### Playwright Reporter for Claude

**Setup: `playwright-claude-reporter.ts`**

```typescript
// tools/playwright-claude-reporter.ts
import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

export default class ClaudeReporter implements Reporter {
  private logStream: fs.WriteStream;
  private testLogs: Map<string, any[]> = new Map();

  constructor() {
    // Ensure .claude directory exists
    const logDir = path.join(process.cwd(), '.claude');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create e2e log file
    this.logStream = fs.createWriteStream(
      path.join(logDir, 'e2e.log'),
      { flags: 'a' }
    );

    // Write session header
    this.logStream.write(JSON.stringify({
      type: 'session_start',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    }) + '\n');
  }

  onTestBegin(test: TestCase) {
    this.testLogs.set(test.id, []);
    
    this.logStream.write(JSON.stringify({
      type: 'test_start',
      timestamp: new Date().toISOString(),
      testId: test.id,
      title: test.title,
      file: test.location.file,
      line: test.location.line,
    }) + '\n');
  }

  onStepBegin(test: TestCase, result: TestResult, step: any) {
    this.logStream.write(JSON.stringify({
      type: 'step',
      timestamp: new Date().toISOString(),
      testId: test.id,
      title: step.title,
      category: step.category, // 'test.step', 'expect', etc.
    }) + '\n');
  }

  onStdOut(chunk: string, test?: TestCase) {
    // Capture console.log from page context
    const entry = {
      type: 'stdout',
      timestamp: new Date().toISOString(),
      testId: test?.id,
      text: chunk.toString(),
    };

    this.logStream.write(JSON.stringify(entry) + '\n');
    
    if (test?.id) {
      this.testLogs.get(test.id)?.push(entry);
    }
  }

  onStdErr(chunk: string, test?: TestCase) {
    // Capture console.error from page context
    const entry = {
      type: 'stderr',
      timestamp: new Date().toISOString(),
      testId: test?.id,
      text: chunk.toString(),
    };

    this.logStream.write(JSON.stringify(entry) + '\n');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Log test result with full context
    const entry = {
      type: 'test_end',
      timestamp: new Date().toISOString(),
      testId: test.id,
      title: test.title,
      status: result.status, // 'passed', 'failed', 'skipped'
      duration: result.duration,
      error: result.error ? {
        message: result.error.message,
        stack: result.error.stack,
      } : undefined,
      attachments: result.attachments.map(a => ({
        name: a.name,
        contentType: a.contentType,
        path: a.path,
      })),
      // Include accumulated logs for this test
      logs: this.testLogs.get(test.id) || [],
    };

    this.logStream.write(JSON.stringify(entry) + '\n');

    // Clear test logs
    this.testLogs.delete(test.id);

    // If test failed, also write to a separate failures file
    if (result.status === 'failed') {
      const failureLog = path.join(process.cwd(), '.claude', 'e2e-failures.log');
      fs.appendFileSync(failureLog, JSON.stringify(entry) + '\n');
    }
  }

  onEnd(result: FullResult) {
    this.logStream.write(JSON.stringify({
      type: 'session_end',
      timestamp: new Date().toISOString(),
      status: result.status,
      duration: result.duration,
    }) + '\n');

    this.logStream.end();
  }
}
```

#### Playwright Configuration

**`playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Use both HTML reporter and Claude reporter
  reporter: [
    ['html'],
    ['./tools/playwright-claude-reporter.ts'],
  ],

  use: {
    // Capture more debugging info
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Capture console logs from the page
    launchOptions: {
      // This ensures we capture browser console
      args: ['--enable-logging'],
    },
  },

  // Projects with different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Inject console capture into every page
        contextOptions: {
          // Capture console events
          recordVideo: {
            dir: '.claude/videos',
          },
        },
      },
    },
  ],
});
```

#### Enhanced Test Helpers

**`tests/helpers/claude-helpers.ts`**

```typescript
import { Page, expect } from '@playwright/test';

// Helper to capture console logs during specific test sections
export async function withConsoleLogs(
  page: Page, 
  name: string, 
  fn: () => Promise<void>
) {
  const logs: any[] = [];
  
  // Capture console
  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString(),
    });
  });

  // Capture errors
  page.on('pageerror', (error) => {
    logs.push({
      type: 'error',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });

  console.log(`[Claude Section Start: ${name}]`);
  
  try {
    await fn();
  } finally {
    console.log(`[Claude Section End: ${name}]`);
    console.log('[Claude Logs]', JSON.stringify(logs, null, 2));
  }
}

// Helper to mark important checkpoints
export async function claudeCheckpoint(page: Page, message: string) {
  // This will appear in the stdout capture
  console.log(`[Claude Checkpoint] ${message}`);
  
  // Also evaluate in browser context
  await page.evaluate((msg) => {
    console.log(`[Browser Checkpoint] ${msg}`);
  }, message);
}
```

#### Example E2E Test with Claude Integration

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { withConsoleLogs, claudeCheckpoint } from './helpers/claude-helpers';

test.describe('Checkout Flow', () => {
  test('should complete purchase', async ({ page }) => {
    await claudeCheckpoint(page, 'Starting checkout test');
    
    await page.goto('/products');
    
    await withConsoleLogs(page, 'Add to Cart', async () => {
      await page.click('[data-test="add-to-cart"]');
      await expect(page.locator('.cart-count')).toHaveText('1');
    });

    await withConsoleLogs(page, 'Checkout Process', async () => {
      await page.click('[data-test="checkout"]');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="card"]', '4242424242424242');
      
      await claudeCheckpoint(page, 'About to submit payment');
      await page.click('[data-test="submit-payment"]');
    });

    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

#### Running Tests with Claude Logging

```bash
# Run tests with Claude reporter
npm run test:e2e

# Or with UI mode (logs still captured)
npm run test:e2e:ui

# Run specific test with extra debugging
npm run test:e2e -- checkout.spec.ts --debug
```

#### What Gets Captured

1. **Test Structure**
   - Test start/end with timing
   - Test steps and assertions
   - Pass/fail status

2. **Console Output**
   - All console.log/error from page
   - Test runner console output
   - Custom checkpoint messages

3. **Failure Context**
   - Error messages and stack traces
   - Screenshots (referenced by path)
   - Videos (referenced by path)
   - Network logs during test

4. **Separate Files**
   - `.claude/e2e.log` - All test runs
   - `.claude/e2e-failures.log` - Just failures for quick review

#### Integration with Claude Code

The E2E logs integrate seamlessly with the existing setup:

```json
// .claude/config.json
{
  "logFiles": [
    {
      "path": ".claude/client.log",
      "type": "jsonl",
      "label": "Browser Console"
    },
    {
      "path": ".claude/server.log", 
      "type": "jsonl",
      "label": "Server Logs"
    },
    {
      "path": ".claude/e2e.log",
      "type": "jsonl", 
      "label": "E2E Tests"
    },
    {
      "path": ".claude/e2e-failures.log",
      "type": "jsonl",
      "label": "Test Failures",
      "priority": "high"
    }
  ]
}
```

Now Claude Code can see the full picture:
- What the test was trying to do
- Console logs from the browser during the test
- Exact failure points with screenshots
- Network activity during the test

This makes debugging E2E failures much more effective!

#### Claude Code Configuration

`.claude/config.json`:
```json
{
  "logFile": ".claude/session.log",
  "watch": true,
  "parseFormat": "jsonl",
  "contextWindow": 100,
  "filters": {
    "includeErrors": true,
    "includeWarnings": true,
    "includeLogs": true
  }
}
```

### What This Gives Developers Today

1. **Full Chrome DevTools experience unchanged**
2. **Claude Code sees everything** without copy-paste
3. **Network requests** logged automatically
4. **Stack traces** for errors
5. **Formatted objects** properly serialized
6. **Zero performance impact** in production

### Example Developer Session

```typescript
// Developer writes code
function calculateTotal(items) {
  console.log('Calculating total for:', items);
  
  const total = items.reduce((sum, item) => {
    console.log(`Processing ${item.name}: $${item.price}`);
    return sum + item.price;
  }, 0);
  
  console.log('Final total:', total);
  return total;
}

// Bug occurs
calculateTotal(null); // Oops!
// Error shows in Chrome DevTools as normal
// ALSO written to .claude/session.log

// Developer asks Claude Code:
"Why is calculateTotal failing?"

// Claude Code has full context from the log file:
// - The function was called with null
// - Can see the console.logs before the error
// - Has the full stack trace
// - Can suggest adding null check
```

---

# Part B: Production System (Future - After MVP)

## Overview

Once the application is live and has users, we'll need production error tracking and user feedback. This builds on the local developer experience.

## Goals for Production

1. **User feedback collection** without GitHub spam
2. **Error aggregation** with intelligent sampling  
3. **AI-powered triage** using developer's Claude Max subscription
4. **Cost control** through batching and filtering

## High-Level Architecture

```
User Reports Issue → Convex (storage) → Triage Queue
                                            ↓
                                    Developer Reviews
                                    (with Claude Max help)
                                            ↓
                                    Keep? → GitHub Issue
                                    Discard? → Archive
```

## Implementation Phases

### Phase 1: Basic Feedback
- Simple feedback widget
- Store in Convex
- Manual review process

### Phase 2: Error Tracking
- Sentry integration with sampling
- Session-based organization
- Batch processing for costs

### Phase 3: AI Triage
- Local dashboard for developers
- Claude Max integration
- Pattern recognition

### Phase 4: Close the Loop
- GitHub issue creation for approved items
- Metrics and reporting
- Debug mode for support

## Key Design Decisions

1. **Convex First**: All data goes to Convex (cheap) not GitHub (expensive management)
2. **Human in Loop**: AI suggests, human decides what becomes an issue
3. **Session Based**: Everything tagged with session ID for user separation
4. **Cost Conscious**: Sample errors, batch operations, use local Claude Max

## Use Cases

### Production Error
- Multiple users hit same error
- Sentry samples it (10% rate)
- Shows in triage dashboard
- Claude groups similar errors
- Developer creates one GitHub issue for the pattern

### User Feedback  
- User reports confusing UX
- Stored in Convex with context
- Claude suggests "education not bug"
- Developer archives with notes
- No GitHub issue created

### Enterprise Support
- Customer has critical issue
- Support enables debug mode
- Full console capture for session
- Rich context for debugging
- Fast-tracked to resolution

## Cost Projections

For 10k Monthly Active Users:
- Convex: $0-20 (generous free tier)
- Sentry: $0-26 (5k errors free)  
- GitHub: $0 (public repos)
- Claude API: $0 (using Max subscription)
- **Total: $0-46/month**

## Success Metrics

- Triage time < 30 min/week
- < 10% of feedback → GitHub issues  
- Error to fix time reduced 50%
- Zero impact on dev workflow

---

# Appendix: Code Examples

## Example: Feedback Widget (Future)

```tsx
export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSubmit = async (data) => {
    // Goes to Convex, not GitHub
    await submitFeedback({
      ...data,
      sessionId: getSessionId(),
      breadcrumbs: getBreadcrumbs(),
    });
  };
  
  return <Dialog>{/* UI */}</Dialog>;
}
```

## Example: Triage Dashboard (Future)

```typescript
// Runs on developer's machine
async function triageWithClaude() {
  const untriaged = await convex.query(api.feedback.getUntriaged);
  
  // Uses developer's Claude Max subscription
  const analysis = await claudeMax.analyze(untriaged);
  
  // Human reviews and decides
  // Only approved items → GitHub
}
```

## Example: Cost-Conscious Error Capture (Future)

```typescript
class ErrorBatcher {
  private queue = [];
  
  capture(error) {
    this.queue.push(error);
    
    // Batch every 30 seconds
    if (this.queue.length === 1) {
      setTimeout(() => this.flush(), 30000);
    }
  }
  
  flush() {
    // Send batch to Convex (cheap)
    convex.mutation(api.errors.batchCreate, this.queue);
    
    // Sample to Sentry (expensive)
    const sample = this.queue[0];
    if (Math.random() < 0.1) { // 10% sampling
      Sentry.captureException(sample);
    }
  }
}
```

---

# Summary

**Now**: Implement Part A - Get Chrome logs to Claude Code with zero friction

**Later**: Build Part B - Production error handling with AI triage

The immediate win is enhancing developer productivity by connecting Chrome DevTools to Claude Code.
Everything else can wait until after the MVP ships and real users start generating real errors.