#!/bin/bash
# Cloudflare Worker health check and verification script
# Usage: ./scripts/verify-worker-health.sh [worker-url] [--verbose]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKER_URL="${1:-}"
VERBOSE=false

if [ "$2" = "--verbose" ] || [ "$1" = "--verbose" ]; then
    VERBOSE=true
fi

# Display help if no URL provided
if [ -z "$WORKER_URL" ]; then
    echo -e "${BLUE}Cloudflare Worker Health Check${NC}"
    echo ""
    echo "Usage: $0 <worker-url> [--verbose]"
    echo ""
    echo "Examples:"
    echo "  $0 https://log-ingestion-worker.workers.dev"
    echo "  $0 https://log-ingestion-worker.workers.dev --verbose"
    echo ""
    echo "The script will verify:"
    echo "  • Worker availability and response time"
    echo "  • Redis backend connectivity"
    echo "  • Rate limiter Durable Object status"
    echo "  • Log processor functionality"
    echo "  • CORS configuration"
    echo "  • All worker endpoints"
    exit 1
fi

echo -e "${BLUE}🔍 Cloudflare Worker Health Verification${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Worker URL: ${WORKER_URL}${NC}"
echo ""

# Verification results tracking
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Helper functions
check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_CHECKS++))
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG] $1${NC}"
    fi
}

# ============================================================================
# Test 1: Worker Availability
# ============================================================================

echo -e "${BLUE}📡 Testing Worker Availability${NC}"

# macOS-compatible timing (using seconds, not milliseconds)
START_TIME=$(date +%s)
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$WORKER_URL/" 2>&1 || echo -e "\nERROR")
END_TIME=$(date +%s)
RESPONSE_TIME=$((END_TIME - START_TIME))

HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n 1)
BODY=$(echo "$ROOT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    check_passed "Worker accessible (${RESPONSE_TIME}s response time)"

    SERVICE_NAME=$(echo "$BODY" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
    if [ "$SERVICE_NAME" = "supportsignal-log-ingestion-worker" ]; then
        check_passed "Worker identity confirmed: $SERVICE_NAME"
    else
        check_warning "Unexpected service name: $SERVICE_NAME"
    fi

    verbose_log "Root endpoint response: $BODY"
elif [ "$HTTP_CODE" = "ERROR" ]; then
    check_failed "Worker not accessible - connection failed"
    echo -e "${RED}Cannot proceed with further checks${NC}"
    exit 1
else
    check_failed "Worker returned HTTP $HTTP_CODE"
    exit 1
fi

echo ""

# ============================================================================
# Test 2: Health Endpoint Full Check
# ============================================================================

echo -e "${BLUE}🏥 Testing Health Endpoint${NC}"

HEALTH_RESPONSE=$(curl -s "$WORKER_URL/health" 2>&1 || echo "ERROR")

if [[ "$HEALTH_RESPONSE" != "ERROR" ]]; then
    verbose_log "Health endpoint response: $HEALTH_RESPONSE"

    # Overall status
    OVERALL_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | head -n1 | cut -d'"' -f4)

    if [ "$OVERALL_STATUS" = "healthy" ]; then
        check_passed "Overall health status: healthy"
    elif [ "$OVERALL_STATUS" = "degraded" ]; then
        check_warning "Overall health status: degraded"
    else
        check_failed "Overall health status: $OVERALL_STATUS"
    fi

    # Redis component
    REDIS_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"redis":{"status":"[^"]*"' | cut -d'"' -f6)
    REDIS_URL=$(echo "$HEALTH_RESPONSE" | grep -o '"url":"[^"]*"' | head -n1 | cut -d'"' -f4)

    if [ "$REDIS_STATUS" = "healthy" ]; then
        check_passed "Redis backend: healthy"
        verbose_log "Redis configured: $REDIS_URL"
    elif [ "$REDIS_STATUS" = "unhealthy" ]; then
        check_failed "Redis backend: unhealthy"
    else
        check_warning "Redis backend: $REDIS_STATUS (configuration: $REDIS_URL)"
    fi

    # Rate limiter component
    RATE_LIMITER_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"rate_limiter":{"status":"[^"]*"' | cut -d'"' -f6)

    if [ "$RATE_LIMITER_STATUS" = "healthy" ]; then
        check_passed "Rate limiter (Durable Object): healthy"

        # Extract rate limit details
        ACTIVE_SYSTEMS=$(echo "$HEALTH_RESPONSE" | grep -o '"active_systems":[0-9]*' | cut -d':' -f2)
        ACTIVE_TRACES=$(echo "$HEALTH_RESPONSE" | grep -o '"active_traces":[0-9]*' | cut -d':' -f2)

        if [ -n "$ACTIVE_SYSTEMS" ]; then
            verbose_log "Active rate limit systems: $ACTIVE_SYSTEMS"
        fi
        if [ -n "$ACTIVE_TRACES" ]; then
            verbose_log "Active rate limit traces: $ACTIVE_TRACES"
        fi
    else
        check_warning "Rate limiter: $RATE_LIMITER_STATUS"
    fi

    # Log processor component
    LOG_PROCESSOR_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"log_processor":{"status":"[^"]*"' | cut -d'"' -f6)

    if [ "$LOG_PROCESSOR_STATUS" = "healthy" ]; then
        check_passed "Log processor: healthy"
    else
        check_warning "Log processor: $LOG_PROCESSOR_STATUS"
    fi

else
    check_failed "Health endpoint not accessible"
fi

echo ""

# ============================================================================
# Test 3: CORS Configuration
# ============================================================================

echo -e "${BLUE}🌐 Testing CORS Configuration${NC}"

CORS_RESPONSE=$(curl -s -X OPTIONS "$WORKER_URL/log" -H "Origin: https://example.com" -i 2>&1 || echo "ERROR")

if [[ "$CORS_RESPONSE" != "ERROR" ]]; then
    # Check CORS headers
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
        CORS_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | cut -d':' -f2- | tr -d '[:space:]')
        check_passed "CORS headers present: $CORS_ORIGIN"
    else
        check_failed "CORS headers missing"
    fi

    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-methods"; then
        CORS_METHODS=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-methods" | cut -d':' -f2- | tr -d '[:space:]')
        verbose_log "Allowed methods: $CORS_METHODS"
        check_passed "CORS methods configured"
    else
        check_warning "CORS methods header missing"
    fi
else
    check_failed "CORS preflight request failed"
fi

echo ""

# ============================================================================
# Test 4: Log Ingestion Endpoint
# ============================================================================

echo -e "${BLUE}📝 Testing Log Ingestion Endpoint${NC}"

# Test with minimal valid payload
TEST_PAYLOAD='{"trace_id":"health-check-test","level":"info","message":"Health check test","system":"health-check"}'

LOG_RESPONSE=$(curl -s -X POST "$WORKER_URL/log" \
    -H "Content-Type: application/json" \
    -H "Origin: https://example.com" \
    -d "$TEST_PAYLOAD" \
    -w "\n%{http_code}" 2>&1 || echo -e "\nERROR")

HTTP_CODE=$(echo "$LOG_RESPONSE" | tail -n1)
BODY=$(echo "$LOG_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    check_passed "Log ingestion endpoint: accepting logs"

    SUCCESS=$(echo "$BODY" | grep -o '"success":true')
    if [ -n "$SUCCESS" ]; then
        check_passed "Log processing: successful"
        verbose_log "Log response: $BODY"
    else
        check_warning "Log processing returned success=false"
    fi
elif [ "$HTTP_CODE" = "429" ]; then
    check_warning "Log ingestion: rate limit triggered (expected behavior)"
elif [ "$HTTP_CODE" = "400" ]; then
    check_warning "Log ingestion: validation error (check payload format)"
else
    check_failed "Log ingestion returned HTTP $HTTP_CODE"
fi

echo ""

# ============================================================================
# Test 5: Log Retrieval Endpoint
# ============================================================================

echo -e "${BLUE}📊 Testing Log Retrieval Endpoint${NC}"

RETRIEVAL_RESPONSE=$(curl -s "$WORKER_URL/logs?trace_id=health-check-test" -w "\n%{http_code}" 2>&1 || echo -e "\nERROR")

HTTP_CODE=$(echo "$RETRIEVAL_RESPONSE" | tail -n1)
BODY=$(echo "$RETRIEVAL_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    check_passed "Log retrieval endpoint: operational"

    LOG_COUNT=$(echo "$BODY" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    if [ -n "$LOG_COUNT" ]; then
        verbose_log "Retrieved $LOG_COUNT log(s) for test trace"
    fi
else
    check_warning "Log retrieval returned HTTP $HTTP_CODE"
fi

echo ""

# ============================================================================
# Test 6: Recent Traces Endpoint
# ============================================================================

echo -e "${BLUE}🔍 Testing Recent Traces Endpoint${NC}"

TRACES_RESPONSE=$(curl -s "$WORKER_URL/traces/recent?limit=5" -w "\n%{http_code}" 2>&1 || echo -e "\nERROR")

HTTP_CODE=$(echo "$TRACES_RESPONSE" | tail -n1)
BODY=$(echo "$TRACES_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    check_passed "Recent traces endpoint: operational"

    TRACE_COUNT=$(echo "$BODY" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    if [ -n "$TRACE_COUNT" ]; then
        verbose_log "Found $TRACE_COUNT recent trace(s)"
    fi
else
    check_warning "Recent traces returned HTTP $HTTP_CODE"
fi

echo ""

# ============================================================================
# Test 7: Rate Limiter Verification
# ============================================================================

echo -e "${BLUE}⏱️  Testing Rate Limiter Functionality${NC}"

echo -e "${BLUE}Sending rapid test requests...${NC}"

RATE_LIMIT_TRIGGERED=false
for i in {1..5}; do
    TEST_PAYLOAD="{\"trace_id\":\"rate-limit-test-$i\",\"level\":\"info\",\"message\":\"Rate limit test $i\",\"system\":\"health-check\"}"

    RESPONSE=$(curl -s -X POST "$WORKER_URL/log" \
        -H "Content-Type: application/json" \
        -d "$TEST_PAYLOAD" \
        -w "\n%{http_code}" 2>&1 || echo -e "\nERROR")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_TRIGGERED=true
        break
    fi

    verbose_log "Request $i: HTTP $HTTP_CODE"
done

if [ "$RATE_LIMIT_TRIGGERED" = true ]; then
    check_passed "Rate limiter: enforcing limits correctly"
else
    check_warning "Rate limiter: no limit triggered (may need more requests)"
fi

echo ""

# ============================================================================
# Summary Report
# ============================================================================

echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}======================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

# Exit code determination
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}❌ Worker health check FAILED${NC}"
    echo -e "${YELLOW}Review failed checks above${NC}"
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Worker health check PASSED with warnings${NC}"
    echo -e "${YELLOW}Worker is operational but review warnings${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Worker health check PASSED${NC}"
    echo -e "${GREEN}All worker systems fully operational${NC}"
    exit 0
fi
