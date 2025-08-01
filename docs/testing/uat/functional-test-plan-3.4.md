# UAT Plan: Epic 3.4 - Specialized Worker Infrastructure & Redis Integration

## Test Overview

**Story**: Epic 3.4 - Specialized Worker Infrastructure & Redis Integration  
**Test Focus**: Cloudflare Worker + Upstash Redis logging system replacing Convex database logging  
**Test Environment**: Development/Staging with access to Worker and Redis endpoints  
**Estimated Duration**: 2-3 hours  

## Prerequisites

### Environment Setup
- [ ] Convex development environment running (`bunx convex dev`)
- [ ] Web application accessible (localhost:3000)
- [ ] Cloudflare Worker deployed and accessible
- [ ] Upstash Redis instance configured
- [ ] Environment variables configured:
  - `NEXT_PUBLIC_LOG_WORKER_URL`
  - `LOG_WORKER_URL` (for Convex)
  - Worker secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Test Data Requirements
- [ ] Browser with developer tools access
- [ ] Multiple browser tabs/windows for multi-user simulation
- [ ] Test user accounts (if authentication required)

## Test Cases

### TC-01: Cloudflare Worker Infrastructure
**Acceptance Criteria**: AC1 - Specialized Cloudflare Worker handles log ingestion

#### TC-01.1: Worker Deployment and Accessibility
- [ ] **Action**: Navigate to Worker health endpoint: `https://${WORKER_DOMAIN}.workers.dev/health` (set WORKER_DOMAIN env var)
- [ ] **Expected**: Returns JSON with status "healthy", service details, and component health
- [ ] **Verify**: Response includes endpoints, supported systems, and cost model information
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-01.2: Worker CORS Configuration
- [ ] **Action**: Make OPTIONS preflight request to `/log` endpoint from browser console
- [ ] **Expected**: Returns 200 status with proper CORS headers
- [ ] **Verify**: Headers include `Access-Control-Allow-Origin: *` and required methods
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-01.3: Worker Rate Limiting Response
- [ ] **Action**: Send 20+ rapid log requests to Worker `/log` endpoint
- [ ] **Expected**: After limit reached, returns 429 status with rate limit error
- [ ] **Verify**: Response includes remaining quota and clear error message
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-02: Upstash Redis Integration
**Acceptance Criteria**: AC2 - Redis provides cost-effective storage with 1-hour TTL

#### TC-02.1: Log Storage and Retrieval
- [ ] **Action**: Send a log entry via Worker, then retrieve using trace_id
- [ ] **Expected**: Log successfully stored and retrievable via GET `/logs?trace_id=xyz`
- [ ] **Verify**: Retrieved log matches sent data with proper timestamp and system tagging
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-02.2: TTL Verification (Extended Test)
- [ ] **Action**: Send a log entry and note the timestamp
- [ ] **Expected**: Log should automatically expire after 1 hour (Redis TTL)
- [ ] **Verify**: Log no longer retrievable after TTL expires
- [ ] **Note**: This is a long-running test - can be simulated with shorter TTL in test environment
- [ ] **Result**: ✅ Pass / ❌ Fail / 🕐 Pending
- [ ] **Notes**:

#### TC-02.3: Redis Error Handling
- [ ] **Action**: Temporarily disable Redis or use invalid credentials
- [ ] **Expected**: Worker returns graceful error response, not crash
- [ ] **Verify**: Health endpoint shows Redis as unhealthy but Worker still responds
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-03: Multi-System Log Ingestion
**Acceptance Criteria**: AC3 - Multi-system support with automatic detection

#### TC-03.1: Browser Console Override
- [ ] **Action**: Open browser dev tools, run `console.log("UAT Test Browser Log")`
- [ ] **Expected**: Log appears in browser console AND gets sent to Worker
- [ ] **Verify**: Can retrieve log via Worker endpoint with `system: "browser"`
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.2: Browser System Detection
- [ ] **Action**: Check network tab for log submission request headers
- [ ] **Expected**: Request includes proper Origin header and User-Agent
- [ ] **Verify**: Retrieved log shows `system: "browser"` classification
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.3: Convex Internal Logging
- [ ] **Action**: Run Convex function that generates internal logs
- [ ] **Expected**: Convex logs route through Worker bridge successfully
- [ ] **Verify**: Retrieved logs show `system: "convex"` classification
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.4: Convex Bridge Health Check
- [ ] **Action**: Run `bunx convex run internalLogging:checkWorkerHealth`
- [ ] **Expected**: Returns worker_healthy: true with connection details
- [ ] **Verify**: Shows Worker URL configured and components healthy
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-03.5: System Auto-Detection Accuracy
- [ ] **Action**: Send logs from different origins (localhost, different user agents)
- [ ] **Expected**: Worker correctly classifies each system type
- [ ] **Verify**: Logs tagged with appropriate system: browser/convex/worker/manual
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-04: Worker-Based Rate Limiting
**Acceptance Criteria**: AC4 - Rate limiting eliminates race conditions

#### TC-04.1: Global Rate Limiting
- [ ] **Action**: Send logs from multiple systems to exceed 1000/hour global limit
- [ ] **Expected**: After global limit reached, all systems get rate limited
- [ ] **Verify**: Returns proper error messages with remaining quota info
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.2: System-Specific Quotas
- [ ] **Action**: Send logs only from browser to exceed 40% quota (400/hour)
- [ ] **Expected**: Browser logs get rate limited while Convex/Worker logs still accepted
- [ ] **Verify**: Other systems maintain their quota allocation
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.3: Per-Trace Rate Limiting
- [ ] **Action**: Send 100+ logs with same trace_id within an hour
- [ ] **Expected**: After 100 logs per trace, additional logs for that trace rejected
- [ ] **Verify**: Other trace_ids continue to work normally
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.4: Trace Correlation Preservation
- [ ] **Action**: Send logs from browser and Convex with same trace_id
- [ ] **Expected**: Both logs retrievable together using same trace_id
- [ ] **Verify**: Retrieved logs maintain correlation across systems
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-04.5: Rate Limit Reset Behavior
- [ ] **Action**: Hit rate limits, then wait for reset window
- [ ] **Expected**: After reset period, logging resumes normally
- [ ] **Verify**: Counters reset and quota restored
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-05: Monorepo Integration & Deployment
**Acceptance Criteria**: AC5 - Monorepo deployment patterns with Turbo

#### TC-05.1: Development Scripts
- [ ] **Action**: Run `bun run worker:dev` from project root
- [ ] **Expected**: Worker development server starts successfully
- [ ] **Verify**: Local Worker accessible and logs development changes
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.2: Build Process
- [ ] **Action**: Run `bun run build` from project root
- [ ] **Expected**: All packages build successfully including Worker
- [ ] **Verify**: Worker dist files generated without errors
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.3: Testing Integration
- [ ] **Action**: Run `bun run worker:test` from project root
- [ ] **Expected**: Worker tests execute with high coverage
- [ ] **Verify**: Tests cover rate limiting, Redis integration, and API endpoints
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-05.4: Deployment Commands
- [ ] **Action**: Run `bun run worker:deploy:production` (dry run or staging)
- [ ] **Expected**: Worker deploys successfully to Cloudflare
- [ ] **Verify**: Deployment completes without errors and Worker accessible
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### TC-06: Convex System Migration & Cleanup
**Acceptance Criteria**: AC6 - Complete removal of old logging system

#### TC-06.1: Old Tables Removed from Schema
- [ ] **Action**: Check Convex dashboard for orphaned tables with `*`
- [ ] **Expected**: No logging tables show `*` indicator (orphaned data)
- [ ] **Verify**: Tables `log_queue`, `recent_log_entries`, `rate_limit_state`, `message_fingerprints` not present
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.2: Data Migration Verification
- [ ] **Action**: Run `bun run migrate:logging-verify`
- [ ] **Expected**: Returns "cleanup_complete": true with zero remaining data
- [ ] **Verify**: All old logging data successfully removed
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.3: Backward Compatibility
- [ ] **Action**: Call old Convex logging functions (if any remain)
- [ ] **Expected**: Functions redirect to Worker or return deprecation notices
- [ ] **Verify**: No broken functionality from legacy code paths
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

#### TC-06.4: Admin Interface Update
- [ ] **Action**: Check admin logging interfaces (if they exist)
- [ ] **Expected**: Admin interfaces work with new Worker system or show appropriate migration messages
- [ ] **Verify**: No broken admin functionality referencing old tables
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

## Performance & Load Testing

### Load Test: High-Frequency Logging
- [ ] **Action**: Send 1000 logs rapidly from multiple sources simultaneously
- [ ] **Expected**: Worker handles load without timeouts or data loss
- [ ] **Verify**: Rate limiting engages properly, no race conditions occur
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### Cost Verification
- [ ] **Action**: Monitor Redis usage and Worker request counts during testing
- [ ] **Expected**: Costs align with projected ~$2/month vs ~$10/month savings
- [ ] **Verify**: Usage metrics show significant cost reduction achieved
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

## Security Testing

### Data Redaction Verification
- [ ] **Action**: Send logs containing sensitive patterns (tokens, passwords, etc.)
- [ ] **Expected**: Sensitive data redacted before storage
- [ ] **Verify**: Retrieved logs show "[REDACTED]" for sensitive patterns
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### Input Validation
- [ ] **Action**: Send malformed requests (missing fields, invalid data types)
- [ ] **Expected**: Worker returns proper validation errors, doesn't crash
- [ ] **Verify**: Error responses include helpful information without exposing internals
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

## Integration Testing

### End-to-End Workflow
- [ ] **Action**: Complete user journey: Browse app → Generate logs → Retrieve via API
- [ ] **Expected**: Logs flow seamlessly through entire system
- [ ] **Verify**: User actions captured and retrievable with proper correlation
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

### Error Scenarios
- [ ] **Action**: Test various failure conditions (network issues, service unavailable)
- [ ] **Expected**: System degrades gracefully without losing core functionality
- [ ] **Verify**: Appropriate fallbacks and error messages displayed
- [ ] **Result**: ✅ Pass / ❌ Fail
- [ ] **Notes**:

## Acceptance Sign-off

### Business Requirements Verification
- [ ] **Cost Reduction**: Confirmed ~80% cost reduction from ~$10/month to ~$2/month
- [ ] **Reliability**: No race conditions or database conflicts observed
- [ ] **Performance**: High-frequency logging handled without bottlenecks
- [ ] **Multi-System**: All system types (browser, Convex, Worker) logging successfully
- [ ] **Development**: Monorepo integration supports coordinated development

### Technical Requirements Verification
- [ ] **Worker Infrastructure**: Cloudflare Worker deployed and operational
- [ ] **Redis Integration**: Upstash Redis storing logs with TTL
- [ ] **Rate Limiting**: Proper limits enforced without race conditions
- [ ] **System Detection**: Automatic classification working correctly
- [ ] **Migration**: Old Convex logging system completely removed

## Test Summary

**Total Test Cases**: ___/___  
**Passed**: ___  
**Failed**: ___  
**Pending**: ___  

### Critical Issues Identified
- [ ] Issue 1: _________________________________
- [ ] Issue 2: _________________________________
- [ ] Issue 3: _________________________________

### Recommendations
- [ ] Recommendation 1: _________________________________
- [ ] Recommendation 2: _________________________________
- [ ] Recommendation 3: _________________________________

### Final Acceptance Decision
- [ ] ✅ **ACCEPT** - All critical requirements met, ready for production
- [ ] ⚠️ **ACCEPT WITH CONDITIONS** - Minor issues identified, acceptable for production with noted limitations
- [ ] ❌ **REJECT** - Critical issues found, requires development changes before acceptance

**Tester Signature**: _________________ **Date**: _________  
**Business Stakeholder Signature**: _________________ **Date**: _________