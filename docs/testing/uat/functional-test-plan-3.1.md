# UAT Plan 3.1: Browser Log Capture Foundation

**Story**: 3.1 - Browser Log Capture Foundation  
**Epic**: 3 - Resilient Real-time Logging  
**Date Created**: 2025-01-24  
**Last Updated**: 2025-01-24  
**Status**: Ready for Testing

## Implementation Notes
- **Changed from HTTP Actions to Convex Actions**: Due to HTTP Action deployment issues, the implementation uses `loggingAction:processLogs` Convex Action called via ConvexHttpClient instead of direct HTTP endpoints.
- **Functionality remains the same**: Browser console override captures logs and sends them to Convex backend with full correlation support.

---

## Acceptance Criteria Validation

### AC1: Console.log override system captures all browser console output without interfering with normal logging

**Test Cases:**

#### TC1.1: Basic Console Override Functionality
**Objective**: Verify console methods are overridden without affecting display
**Steps**:
1. Start development server: `npm run dev`
2. Open browser DevTools Console
3. Execute: `console.log('Test message')`
4. Execute: `console.error('Test error')`
5. Execute: `console.warn('Test warning')`
6. Execute: `console.info('Test info')`

**Expected Results**:
- All messages appear in browser console as normal
- Console methods behave identically to original functionality
- No visual differences in console output

#### TC1.2: Console Override Persistence
**Objective**: Ensure override survives page navigation
**Steps**:
1. Execute console commands on home page
2. Navigate to `/showcase` page
3. Execute more console commands
4. Navigate back and repeat

**Expected Results**:
- Console override remains active across page transitions
- All console output continues to be captured

#### TC1.3: Console Override Error Handling
**Objective**: Verify graceful handling of console override errors
**Steps**:
1. Disable network connectivity
2. Execute: `console.log('Test during network failure')`
3. Re-enable network
4. Execute: `console.log('Test after network recovery')`

**Expected Results**:
- Console continues to function normally during network issues
- No console loops or infinite recursion
- Original console.log still displays messages

---

### AC2: Convex Action endpoint receives browser logs from client via ConvexHttpClient

**Test Cases:**

#### TC2.1: Convex Action Accessibility
**Objective**: Verify Action endpoint is accessible
**Steps**:
1. Start Convex dev server: `bunx convex dev`
2. Check Convex dashboard for `loggingAction.processLogs` function
3. Test direct action call:
   ```bash
   npx convex run loggingAction:processLogs '{"level":"log","args":["test"],"timestamp":1234567890}'
   ```

**Expected Results**:
- Action appears in Convex dashboard function list
- Direct action calls return success response
- Data stored in both `log_queue` and `recent_log_entries` tables

**Actual Results** ✅:
```json
{
  "result": {
    "logQueueId": "js7bq9kdp6v5pdsm3p0w3bxxb97mb667",
    "recentLogId": "jx72p3s5e5dqz627n3edvbjm197mavvh"
  },
  "success": true
}
```

#### TC2.2: Log Data Validation
**Objective**: Verify proper validation of incoming log data
**Steps**:
1. Send invalid request (missing required fields):
   ```bash
   npx convex run loggingAction:processLogs '{"invalid":"data"}'
   ```
2. Send valid request with all fields:
   ```bash
   npx convex run loggingAction:processLogs '{"level":"error","args":["test error"],"timestamp":1234567890,"trace_id":"test_trace","user_id":"test_user","system_area":"browser"}'
   ```

**Expected Results**:
- Invalid requests handled gracefully (may throw validation errors)
- Valid requests return `{"success": true, "result": {...}}` response
- Data stored in both `log_queue` and `recent_log_entries` tables

**Actual Results** ✅:
- **Invalid request**: Properly validated with clear error message
  ```
  ArgumentValidationError: Object is missing the required field `args`
  ```
- **Valid request**: Success response received
  ```json
  {
    "result": {
      "logQueueId": "js7cvbbcjkt9d92e3jn1wvnw57mbnz0",
      "recentLogId": "jx7ez62bberpnvrj8xtrfmcznd7ma81s"
    },
    "success": true
  }
  ```

#### TC2.3: End-to-End Log Flow
**Objective**: Verify complete browser-to-Convex log flow
**Steps**:
1. Enable development mode logging
2. Execute: `console.log('E2E test message')`
3. Check Convex dashboard data browser
4. Verify entries in both log tables

**Expected Results**:
- Console message appears in browser DevTools
- Log entry created in `log_queue` table
- Log entry created in `recent_log_entries` table
- All correlation fields populated correctly

**Actual Results** ✅:
- End-to-end log flow working correctly
- Browser console messages captured and sent to Convex
- Database entries created successfully

---

### AC3: Log correlation system with trace_id, user_id, and system_area tagging

**Test Cases:**

#### TC3.1: Trace ID Generation and Management
**Objective**: Verify trace ID functionality
**Steps**:
1. Open browser console
2. Execute: `ConsoleLogger.getTraceId()`
3. Execute: `ConsoleLogger.newTrace()`
4. Execute: `ConsoleLogger.getTraceId()` again
5. Execute: `ConsoleLogger.setTraceId('custom_trace_123')`
6. Execute: `ConsoleLogger.getTraceId()`

**Expected Results**:
- Initial trace ID follows pattern: `trace_[timestamp]_[random]`
- `newTrace()` generates different trace ID
- `setTraceId()` successfully updates trace ID
- `getTraceId()` returns current trace ID

**Actual Results** ✅:
- All ConsoleLogger functions working correctly
- Trace ID generation follows expected pattern: `trace_1753335125192_fesrj8yb8`
- `newTrace()` successfully generates new trace ID
- `setTraceId('custom_trace_123')` successfully updates trace ID
- `getTraceId()` returns current trace ID correctly
- Console logging shows trace operations: "New trace created" and "Trace ID updated to"

#### TC3.2: User Context Management
**Objective**: Verify user ID correlation
**Steps**:
1. Execute: `ConsoleLogger.setUserId('test_user_123')`
2. Execute: `console.log('Message with user context')`
3. Check Convex data for log entry
4. Execute: `ConsoleLogger.getUserId()`

**Expected Results**:
- User ID set successfully
- Log entries include correct user_id field
- `getUserId()` returns set user ID

**Actual Results** ✅:
- `setUserId('test_user_123')` executed successfully
- Console logging shows: "User ID updated to: test_user_123"
- `console.log('Message with user context')` captured and sent to Convex
- `getUserId()` returns correct value: `'test_user_123'`
- Log entries in Convex include correct user_id field

#### TC3.3: System Area Tagging
**Objective**: Verify system area correlation
**Steps**:
1. Execute console commands from different contexts
2. Check log entries in Convex
3. Verify system_area field is set to 'browser'

**Expected Results**:
- All browser-originated logs tagged with system_area: 'browser'
- Field consistently populated across all log entries

**Actual Results** ✅:
- System area tagging working correctly
- All browser console logs automatically tagged with `system_area: 'browser'`
- Field consistently populated in Convex database entries

#### TC3.4: Stack Trace Capture
**Objective**: Verify stack trace information is captured
**Steps**:
1. Create function that logs:
   ```javascript
   function testFunction() {
     console.error('Error with stack trace');
   }
   testFunction();
   ```
2. Check Convex log entry for stack_trace field

**Expected Results**:
- stack_trace field populated with function call information
- Stack trace includes function names and line numbers

**Actual Results** ✅:
- Stack trace capture working perfectly
- `stack_trace` field populated with detailed call stack information
- Includes function names (e.g., `testFunction`)
- Contains file paths and line/column numbers
- Shows complete call stack with multiple frames
- Example stack trace shows: `Error at testFunction (webpack-internal:///./lib-pages-browser.js...)`

---

### AC4: Toggleable mechanism allows developers to enable/disable browser log capture

**Test Cases:**

#### TC4.1: Development Mode Toggle
**Objective**: Verify logging enabled in development
**Steps**:
1. Start development server: `npm run dev`
2. Check logging status: `ConsoleLogger.getStatus()`
3. Verify environment: `process.env.NODE_ENV`
4. Check window flag: `window.CLAUDE_LOGGING_ENABLED`

**Expected Results**:
- Status shows `enabled: true` and `initialized: true`
- NODE_ENV is 'development'
- Window flag is true

#### TC4.2: Production Mode Disable
**Objective**: Verify logging disabled in production
**Steps**:
1. Build for production: `npm run build`
2. Start production server: `npm run start`
3. Check logging status: `ConsoleLogger.getStatus()`
4. Execute: `console.log('Production test')`

**Expected Results**:
- Status shows `enabled: false`
- No log entries sent to Convex
- Console override not initialized

#### TC4.3: Manual Toggle Control
**Objective**: Verify manual enable/disable capability
**Steps**:
1. Execute: `window.CLAUDE_LOGGING_ENABLED = false`
2. Execute: `ConsoleLogger.getStatus()`
3. Execute: `console.log('Should not be captured')`
4. Set: `window.CLAUDE_LOGGING_ENABLED = true`
5. Reinitialize logging system

**Expected Results**:
- Status reflects enabled/disabled state correctly
- Log capture behavior matches enabled state
- Manual toggle overrides default behavior

#### TC4.4: Visual Status Indicator
**Objective**: Verify logging status indicator appears in development
**Steps**:
1. Start development server
2. Open application in browser
3. Look for status indicator in bottom-right corner
4. Click "New Trace" button
5. Verify trace ID updates

**Expected Results**:
- Status indicator visible in development mode
- Shows current active/inactive state
- Displays current trace ID (truncated)
- "New Trace" button generates new trace ID

---

### AC5: Chrome remote debugging infrastructure designed for comprehensive event capture

**Test Cases:**

#### TC5.1: Design Documentation Completeness
**Objective**: Verify comprehensive design documentation exists
**Steps**:
1. Read `docs/chrome-remote-debugging-design.md`
2. Verify architecture components section
3. Check implementation patterns
4. Review integration points

**Expected Results**:
- Complete architecture documented
- Implementation patterns provided
- Integration workflow defined
- Future considerations addressed

#### TC5.2: Integration Planning
**Objective**: Verify integration with existing console override system
**Steps**:
1. Review design for compatibility with current implementation
2. Check for conflicting functionality
3. Verify graceful fallback mechanisms

**Expected Results**:
- Chrome debugging complements console override
- Both systems can run simultaneously
- Clear fallback strategy documented
- No conflicts with existing functionality

---

## Manual Testing Scenarios

### Scenario 1: Developer Workflow Integration
**Objective**: Test realistic development workflow
**Steps**:
1. Start development environment
2. Navigate through different pages
3. Interact with components that generate logs
4. Check logging status throughout session
5. Verify trace correlation across page transitions

**Expected Results**:
- Seamless logging throughout development session
- No performance impact on development workflow
- Clear visibility into logging status

### Scenario 2: Error Handling and Edge Cases
**Objective**: Test system resilience
**Steps**:
1. Test with network failures
2. Test with invalid log data
3. Test with extremely high log volume
4. Test browser refresh scenarios
5. Test multiple browser tabs

**Expected Results**:
- Graceful handling of all error conditions
- No system crashes or infinite loops
- Consistent behavior across browser instances

### Scenario 3: Performance Impact Assessment
**Objective**: Verify minimal performance impact
**Steps**:
1. Generate high volume of console logs
2. Monitor browser performance metrics
3. Check network request frequency
4. Verify UI responsiveness

**Expected Results**:
- Minimal performance overhead
- Reasonable network usage
- No UI blocking or delays

---

## Acceptance Sign-off

### Pre-UAT Checklist
- [ ] All unit tests passing (29 tests)
- [ ] Linting checks passed
- [ ] Type checking passed
- [ ] Development environment functional
- [ ] Convex backend operational

### UAT Execution Checklist
- [ ] AC1: Console override functionality verified
- [ ] AC2: Convex HTTP Action integration verified
- [ ] AC3: Log correlation system verified
- [ ] AC4: Toggle mechanism verified
- [ ] AC5: Chrome debugging design verified
- [ ] Manual scenarios completed
- [ ] Performance impact assessed
- [ ] Error handling validated

### Sign-off Criteria
**Story is ready for production when:**
- All test cases pass
- No critical bugs identified
- Performance impact acceptable
- Documentation complete
- Stakeholder approval received

### Known Limitations
- Chrome remote debugging not implemented (future enhancement)
- Limited to browser-generated logs only
- Development mode only by default
- Uses Convex Actions instead of HTTP Actions due to deployment compatibility issues

---

**UAT Completion Date**: ___________  
**Tested By**: ___________  
**Approved By**: ___________  
**Notes**: ___________