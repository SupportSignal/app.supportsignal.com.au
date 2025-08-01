# User Acceptance Tests (UAT) - Story 3.2: Multi-System Log Ingestion & Correlation

## Test Environment Setup

**Prerequisites:**

- Development environment with all services running:
  - Next.js development server (`bun dev`)
  - Convex development server (`bunx convex dev`)
  - Cloudflare Workers environment configured
- Browser DevTools console access
- Convex dashboard access for data verification
- Network connectivity for cross-system testing
- Clean test data state (no previous logs interfering)

**Story Background:**

Story 3.2 implements centralized multi-system logging with sophisticated rate limiting and correlation across:
- **Browser Console Logs** → Convex via HTTP Action
- **Cloudflare Workers** → Convex via logging utilities  
- **Convex Backend** → Convex via Log Streams webhook

Critical features include:
- Centralized rate limiting with distributed quota management (40% browser, 30% worker, 30% backend)
- Multi-system log correlation by trace_id
- Database protection enforcing <$10/month cost constraint
- Cross-system duplicate detection and message suppression
- Trace correlation integrity preservation during rate limiting

## UAT Test Cases

### UAT-3.2.1: Centralized Rate Limiting Across Systems

**Acceptance Criteria:** Centralized rate limiting prevents database overload while maintaining trace correlation integrity across browser, worker, and backend systems

**Test Steps:**

1. **Setup Test Environment:**
   ```bash
   # Start all services
   bun dev
   bunx convex dev
   ```

2. **Verify Rate Limiting Service:**
   ```javascript
   // In browser console
   console.log('Test rate limit initialization');
   ConsoleLogger.getStatus(); // Should show rate limiting enabled
   ```

3. **Test Cross-System Quota Management:**
   - Generate high-volume logs from browser:
     ```javascript
     // Generate sustained browser logs
     for(let i = 0; i < 100; i++) {
       console.log(`Browser test log ${i}`);
     }
     ```
   - Simultaneously trigger worker logs (if available)
   - Monitor Convex dashboard for quota enforcement
   - Verify logs stop when browser quota (40% of total) is reached
   - Confirm other systems can still log when browser quota exhausted

4. **Verify Distributed Quota Allocation:**
   - Check rate limiter state in Convex dashboard
   - Verify quota distribution: Browser 40%, Worker 30%, Backend 30%
   - Confirm unused quota from one system can be borrowed by others
   - Test quota reset behavior (time-based windows)

**Expected Result:** ✅ Centralized rate limiting coordinates across all systems with proper quota distribution and prevents database overload

---

### UAT-3.2.2: Multi-System Log Correlation by Trace ID

**Acceptance Criteria:** Logs from browser, Cloudflare Workers, and Convex backend can be correlated using trace_id to follow complete request flows

**Test Steps:**

1. **Initialize Trace Context:**
   ```javascript
   // Set specific trace ID for testing
   ConsoleLogger.setTraceId('uat-test-trace-3.2.2');
   console.log('Browser: Starting multi-system test flow');
   ```

2. **Generate Cross-System Logs:**
   - Generate browser console logs with set trace ID
   - Trigger worker operations (if worker endpoints available) with same trace
   - Execute Convex functions that generate backend logs
   - Ensure all systems use the same trace_id: `uat-test-trace-3.2.2`

3. **Verify Trace Correlation:**
   - Check Convex dashboard for log entries
   - Filter logs by trace_id: `uat-test-trace-3.2.2`
   - Verify logs from different systems (browser, worker, backend) share same trace
   - Confirm system_area field correctly identifies log source:
     - `system_area: 'browser'` for console logs
     - `system_area: 'worker'` for Cloudflare Worker logs  
     - `system_area: 'backend'` for Convex function logs

4. **Test Trace Flow Reconstruction:**
   - Use log correlation engine to reconstruct complete request flow
   - Verify chronological ordering across systems
   - Confirm trace timeline shows complete multi-system interaction
   - Check that correlation works even under rate limiting conditions

**Expected Result:** ✅ All logs with same trace_id can be retrieved and correlated regardless of originating system, providing complete request flow visibility

---

### UAT-3.2.3: Database Protection Cost Constraint Enforcement

**Acceptance Criteria:** Database protection mechanisms enforce <$10/month budget constraint while maintaining system functionality

**Test Steps:**

1. **Verify Cost Tracking System:**
   - Check Convex dashboard for cost tracker data
   - Verify monthly write counters for each system
   - Confirm budget allocation totals to realistic $10/month limit
   - Check estimated cost calculations are accurate

2. **Test Budget Enforcement:**
   ```javascript
   // Generate high volume to test budget limits
   ConsoleLogger.newTrace();
   for(let i = 0; i < 1000; i++) {
     console.log(`Budget test log ${i} - checking enforcement`);
     if(i % 100 === 0) {
       console.log('Checking rate limit status...');
     }
   }
   ```

3. **Verify Protection Activation:**
   - Monitor when rate limiting kicks in (should be before budget exhaustion)
   - Verify system degrades gracefully to essential-only logging at 95% budget
   - Confirm critical traces still work even when budget approaching limit
   - Test that system recovers when usage drops below thresholds

4. **Cost Alert Testing:**
   - Verify warning alerts at 80% budget consumption
   - Confirm critical alerts at 95% budget consumption  
   - Test daily cost reports functionality
   - Check that cost monitoring provides clear budget status

**Expected Result:** ✅ System enforces budget constraints, provides clear cost visibility, and maintains critical functionality even when approaching limits

---

### UAT-3.2.4: Cross-System Duplicate Detection and Suppression

**Acceptance Criteria:** Duplicate messages are detected and suppressed across different systems while preserving unique trace information

**Test Steps:**

1. **Test Cross-System Duplicate Detection:**
   ```javascript
   // Generate identical messages from browser
   const testTrace = 'uat-duplicate-test-trace';
   ConsoleLogger.setTraceId(testTrace);
   
   for(let i = 0; i < 10; i++) {
     console.log('Identical duplicate message for testing');
   }
   ```

2. **Verify Message Fingerprinting:**
   - Check Convex dashboard for message_fingerprints table entries
   - Verify duplicate messages are identified by content hash
   - Confirm only first instance of duplicate is stored
   - Test that different trace_ids with same message are handled correctly

3. **Test Suppression Logic:**
   - Generate rapid duplicate messages from multiple sources
   - Verify suppression prevents message flooding
   - Confirm suppression count tracking works correctly
   - Test that suppression resets after time windows

4. **Trace Integrity During Suppression:**
   - Verify trace correlation remains intact during duplicate suppression
   - Confirm essential debugging information is preserved
   - Test that trace timeline accuracy is maintained
   - Check that suppressed messages don't break correlation chains

**Expected Result:** ✅ Duplicate detection works across systems, prevents message flooding, while maintaining trace correlation integrity

---

### UAT-3.2.5: CORS Functionality for Browser→Convex Logging

**Acceptance Criteria:** Browser console logs can be sent directly to Convex HTTP Action with proper CORS configuration

**Test Steps:**

1. **Verify CORS Configuration:**
   - Check Convex HTTP Action has proper CORS headers
   - Test cross-origin requests from different domains (if applicable)
   - Verify preflight OPTIONS requests are handled correctly
   - Confirm secure headers are properly configured

2. **Test Direct Browser→Convex Communication:**
   ```javascript
   // Test direct browser logging
   console.log('Testing direct CORS communication');
   console.error('Testing error logging with CORS');
   console.warn('Testing warning logging with CORS');
   ```

3. **Network Request Validation:**
   - Open browser Network tab
   - Generate console logs
   - Verify HTTP requests are sent to Convex endpoint
   - Confirm proper HTTP methods and headers
   - Check response status codes (should be 200 for success)

4. **Error Handling Testing:**
   - Test with network connectivity issues
   - Verify graceful fallback when Convex is unavailable
   - Test error responses are handled properly
   - Confirm console continues functioning during CORS failures

**Expected Result:** ✅ Browser console logs successfully reach Convex via direct HTTP Action with proper CORS handling and error resilience

---

### UAT-3.2.6: Convex Log Streams Webhook Integration

**Acceptance Criteria:** Convex Log Streams webhook captures backend function execution logs with proper trace correlation

**Test Steps:**

1. **Verify Webhook Endpoint:**
   - Check Convex dashboard for logStreamsWebhook function
   - Test webhook endpoint accessibility
   - Verify proper authentication/authorization if configured
   - Confirm webhook can receive POST requests

2. **Test Backend Log Capture:**
   - Execute Convex functions that generate logs
   - Trigger backend operations with trace context
   - Verify webhook receives function execution logs
   - Check that backend logs are properly parsed and stored

3. **Trace Correlation for Backend Logs:**
   ```javascript
   // Set trace context before triggering backend operations
   ConsoleLogger.setTraceId('uat-backend-webhook-test');
   // Trigger operations that call Convex functions
   // (Implementation depends on available backend operations)
   ```

4. **Webhook Data Validation:**
   - Verify webhook receives properly formatted log data
   - Check trace ID extraction from backend logs
   - Confirm system_area is set to 'backend' for webhook logs
   - Test that correlation with browser/worker logs works correctly

**Expected Result:** ✅ Convex Log Streams webhook successfully captures backend logs and maintains trace correlation with other systems

---

### UAT-3.2.7: Trace Correlation Integrity Under High Load

**Acceptance Criteria:** Cross-system trace correlation maintains integrity even during high-volume logging and rate limiting scenarios

**Test Steps:**

1. **High-Volume Multi-System Test:**
   ```javascript
   // Generate sustained high-volume logs across systems
   const testTrace = 'uat-high-volume-trace-test';
   ConsoleLogger.setTraceId(testTrace);
   
   const generateLoad = () => {
     for(let i = 0; i < 500; i++) {
       console.log(`High volume test ${i}`);
       console.error(`High volume error ${i}`);
       if(i % 50 === 0) {
         ConsoleLogger.newTrace(); // Mix in trace changes
         ConsoleLogger.setTraceId(testTrace); // Return to test trace
       }
     }
   };
   
   generateLoad();
   ```

2. **Rate Limiting Impact Testing:**
   - Generate load until rate limiting activates
   - Verify trace correlation still works for logs that get through
   - Test that essential traces bypass rate limiting when needed
   - Confirm no corruption of trace data during rate limiting

3. **Cross-System Timing Validation:**
   - Generate simultaneous logs from multiple systems
   - Verify timestamp synchronization across systems
   - Check that trace timeline reconstruction is accurate
   - Test correlation under various timing conditions

4. **Integrity Verification:**
   - Query logs by trace ID after high-volume test
   - Verify all systems' logs are properly correlated
   - Check for missing correlation data or broken chains
   - Confirm no data corruption occurred during stress testing

**Expected Result:** ✅ Trace correlation integrity is maintained even under high load and rate limiting conditions

---

### UAT-3.2.8: Multi-System Error Handling and Resilience

**Acceptance Criteria:** System handles failures gracefully across all logging sources without affecting core application functionality

**Test Steps:**

1. **Individual System Failure Testing:**

   **a) Convex Backend Unavailable:**
   - Simulate Convex backend failure
   - Generate browser console logs
   - Verify graceful fallback behavior
   - Confirm application continues functioning

   **b) Network Connectivity Issues:**
   - Disable network temporarily
   - Generate logs from all systems
   - Re-enable network
   - Verify log buffering and replay if implemented

   **c) Rate Limiting Service Failure:**
   - Test behavior when rate limiting service is unavailable
   - Verify fallback to local rate limiting
   - Confirm system doesn't crash or become unresponsive

2. **Partial System Degradation:**
   - Test with some systems working, others failing
   - Verify remaining systems continue logging
   - Check that trace correlation works for available systems
   - Confirm no cascading failures occur

3. **Recovery Testing:**
   - Test system recovery after failures
   - Verify logs resume properly after service restoration
   - Check that correlation integrity is maintained post-recovery
   - Test that rate limiting state is properly restored

4. **Error Reporting:**
   - Verify clear error messages for logging failures
   - Check that errors don't spam console or logs
   - Confirm error recovery mechanisms work as expected
   - Test that debugging information is preserved during failures

**Expected Result:** ✅ System handles all failure scenarios gracefully without affecting core application functionality

---

## Advanced Testing Scenarios

### Scenario 1: End-to-End Multi-System Request Flow

**Objective:** Test complete request flow across all systems with full trace correlation

**Steps:**
1. Start a new trace for a specific user journey
2. Trigger browser interactions that generate console logs
3. Execute operations that call Cloudflare Workers (if available)
4. Trigger Convex backend functions
5. Follow the complete trace across all systems
6. Verify correlation timeline and request flow reconstruction

**Expected Results:**
- Complete trace visibility across all systems
- Accurate timing and sequencing information
- Clear system boundary identification
- Functional correlation and analysis tools

### Scenario 2: Budget Constraint Stress Testing

**Objective:** Validate system behavior approaching and at budget limits

**Steps:**
1. Generate sustained logging across all systems
2. Monitor cost tracking and budget consumption
3. Test behavior at 80%, 95%, and 100% budget usage
4. Verify degradation modes and recovery
5. Test quota borrowing between systems
6. Validate cost alert and reporting functionality

**Expected Results:**
- Smooth degradation without system crashes
- Clear budget status and alert notifications
- Proper quota management and borrowing
- Essential functionality preserved at limits

### Scenario 3: Real-World Development Workflow

**Objective:** Test integration with typical development activities

**Steps:**
1. Simulate normal development workflow with debugging
2. Test trace correlation during page navigation
3. Verify logging during component interactions
4. Test behavior during development server restarts
5. Validate trace persistence across browser refreshes
6. Test integration with development tools and debugging

**Expected Results:**
- Seamless integration with development workflow
- No performance impact on development experience
- Reliable trace correlation during typical activities
- Clear visibility into multi-system interactions

---

## UAT Sign-off Criteria

**All test cases must pass for Story 3.2 to be considered complete:**

- [ ] UAT-3.2.1: Centralized Rate Limiting Across Systems
- [ ] UAT-3.2.2: Multi-System Log Correlation by Trace ID
- [ ] UAT-3.2.3: Database Protection Cost Constraint Enforcement
- [ ] UAT-3.2.4: Cross-System Duplicate Detection and Suppression
- [ ] UAT-3.2.5: CORS Functionality for Browser→Convex Logging
- [ ] UAT-3.2.6: Convex Log Streams Webhook Integration
- [ ] UAT-3.2.7: Trace Correlation Integrity Under High Load
- [ ] UAT-3.2.8: Multi-System Error Handling and Resilience

**Advanced Scenarios:**
- [ ] End-to-End Multi-System Request Flow
- [ ] Budget Constraint Stress Testing  
- [ ] Real-World Development Workflow Integration

**UAT Completion Status:** 🟡 Pending Execution

**Critical Requirements:**

- Centralized rate limiting must prevent database overload while maintaining functionality
- Multi-system trace correlation must work reliably under all conditions
- Cost must stay under $10/month budget with realistic usage patterns
- System must degrade gracefully and recover from failures
- No impact on core application performance or development workflow
- All logging sources must be properly coordinated and protected

**Performance Benchmarks:**

- Rate limiting response time: < 100ms for quota checks
- Trace correlation queries: < 500ms for complex traces
- Database write operations: Must stay within monthly budget constraints
- System recovery time: < 30 seconds after service restoration

**Security Requirements:**

- CORS configuration must be secure and properly validated
- Webhook endpoints must handle authentication appropriately
- No sensitive data should be exposed in logs or error messages
- Rate limiting must prevent abuse while allowing legitimate use

**UAT Executed By:** [Name]  
**UAT Date:** [Date]  
**Environment:** [Environment Details]  
**Convex Project:** [Project Name]  
**Services Tested:** Browser Console Override, Cloudflare Workers, Convex Backend, Log Streams Webhook  
**Sign-off:** [Signature]

---

## Notes for QA Execution

**Before Starting UAT:**
- Ensure all services are properly configured and running
- Verify test data is clean (no previous logs interfering)
- Check that all required environment variables are set
- Confirm access to Convex dashboard for data verification

**During Testing:**
- Monitor Convex dashboard consistently for data verification
- Pay attention to rate limiting activation and recovery
- Document any unexpected behavior or edge cases
- Test both success and failure scenarios thoroughly

**Common Issues to Watch:**
- Rate limiting may prevent high-volume testing - use appropriate delays
- Trace correlation depends on proper trace ID propagation
- CORS issues may manifest differently across browsers
- Network timing can affect correlation accuracy

**Testing Tools:**
- Browser DevTools Console for log generation and network monitoring
- Convex Dashboard for data verification and monitoring
- Network tab for HTTP request validation
- Multiple browser tabs/windows for concurrent testing