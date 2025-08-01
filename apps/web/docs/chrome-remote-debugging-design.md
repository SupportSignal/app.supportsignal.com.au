# Chrome Remote Debugging Infrastructure Design

## Overview

This document outlines the design for comprehensive browser event capture using Chrome DevTools Protocol for Story 3.1 future enhancement.

## Architecture

### Components

1. **Chrome Debug Capture Service** - External Node.js process
2. **DevTools Protocol Interface** - Chrome CDP connection
3. **Convex Integration** - Log ingestion endpoint
4. **Event Filtering** - Smart capture rules
5. **Development Integration** - Seamless dev experience

### Implementation Pattern

```javascript
// External service: tools/chrome-debug-capture.js
class ChromeLogCapture {
  constructor(convexEndpoint, options = {}) {
    this.convexEndpoint = convexEndpoint;
    this.options = {
      port: options.port || 9222,
      captureNetwork: options.captureNetwork ?? true,
      captureConsole: options.captureConsole ?? true,
      captureExceptions: options.captureExceptions ?? true,
      ...options,
    };
  }

  async connect() {
    this.client = await CDP({ port: this.options.port });
    await this.enableDomains();
    await this.attachEventHandlers();
  }

  async enableDomains() {
    const { Runtime, Network, Console } = this.client;
    await Promise.all([Runtime.enable(), Network.enable(), Console.enable()]);
  }

  async attachEventHandlers() {
    const { Runtime, Network } = this.client;

    // Console API calls
    Runtime.consoleAPICalled(this.handleConsoleAPI.bind(this));

    // Network requests/responses
    Network.responseReceived(this.handleNetworkResponse.bind(this));

    // Runtime exceptions
    Runtime.exceptionThrown(this.handleException.bind(this));

    // DOM mutations (optional)
    if (this.options.captureDOMChanges) {
      Runtime.evaluate({
        expression: this.getDOMObserverScript(),
      });
    }
  }
}
```

## Integration Points

### Development Workflow

1. **Chrome Startup**:

   ```bash
   chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
   ```

2. **Service Startup**:

   ```bash
   node tools/chrome-debug-capture.js --endpoint=http://localhost:3000/api/convex/logs
   ```

3. **Integration with Console Override**:
   - Chrome debugging captures everything
   - Console override provides lightweight alternative
   - Both can run simultaneously for comprehensive coverage

### Event Types Captured

1. **Console Events**
   - All console.\* method calls
   - Stack traces and source locations
   - Timing information

2. **Network Events**
   - HTTP requests/responses
   - WebSocket communications
   - Fetch API calls

3. **Runtime Events**
   - JavaScript exceptions
   - Promise rejections
   - Performance metrics

4. **DOM Events** (Optional)
   - Element mutations
   - Event listener attachments
   - CSS changes

## Data Flow

```
Browser → Chrome DevTools Protocol → Node.js Service → Convex HTTP Action → Database
```

## Configuration

### Environment Variables

- `CHROME_DEBUG_PORT`: Chrome debugging port (default: 9222)
- `CHROME_DEBUG_ENABLED`: Enable/disable Chrome debugging
- `CHROME_DEBUG_CAPTURE_NETWORK`: Capture network events
- `CHROME_DEBUG_CAPTURE_DOM`: Capture DOM changes

### Integration with Existing System

```typescript
// In lib/console-override.ts - Detection logic
export function detectChromeDebugging(): boolean {
  return (
    typeof window !== 'undefined' &&
    'chrome' in window &&
    process.env.CHROME_DEBUG_ENABLED === 'true'
  );
}

// Graceful fallback
export function initializeLogging() {
  if (detectChromeDebugging()) {
    console.log('Chrome debugging detected - enhanced capture active');
  } else {
    initializeConsoleOverride();
  }
}
```

## Benefits

### Comprehensive Capture

- All browser events, not just console
- Network request/response data
- Performance timing information
- DOM mutation tracking

### Rich Debugging Context

- Full stack traces
- Source map integration
- Timeline correlation
- Cross-system event linking

### Development Workflow Enhancement

- Real-time debugging assistance
- Automated issue detection
- AI-ready data export
- Performance bottleneck identification

## Implementation Timeline

### Phase 1: Basic CDP Integration

- Chrome DevTools Protocol connection
- Console event capture
- Basic Convex integration

### Phase 2: Network & Exception Capture

- Network request/response logging
- JavaScript exception capture
- Performance metric collection

### Phase 3: Advanced Features

- DOM mutation tracking
- Event correlation
- AI-powered pattern detection

## Usage Examples

### Development Setup

```bash
# Terminal 1: Start Chrome with debugging
chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Terminal 2: Start Next.js dev server
npm run dev

# Terminal 3: Start Chrome debug capture
node tools/chrome-debug-capture.js
```

### Integration Test

```javascript
// Test comprehensive capture
console.log('Test message'); // Captured by both systems
fetch('/api/test'); // Captured by Chrome debugging only
throw new Error('Test error'); // Captured by Chrome debugging with full context
```

## Future Considerations

- **Browser Compatibility**: Currently Chrome-specific, could extend to Firefox
- **Performance Impact**: Monitor overhead of comprehensive capture
- **Security**: Ensure debug port is not exposed in production
- **Scalability**: Consider capture rate limiting for high-traffic scenarios

## Integration with Epic 3 Goals

This Chrome remote debugging infrastructure directly supports Epic 3's goal of creating a developer-first real-time logging system by:

1. **Comprehensive Coverage**: Captures events beyond console logs
2. **AI Agent Support**: Provides rich context for debugging assistance
3. **Development Workflow**: Enhances developer debugging experience
4. **Future-Proof**: Extensible architecture for additional capture types
