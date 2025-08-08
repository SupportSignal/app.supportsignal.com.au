# Story 1.4 Acceptance Test: Core API Layer

**Story**: [Core API Layer](../../stories/1.4.story.md)  
**Status**: Ready for Testing  
**Test Environment**: Development  

## Test Overview

This acceptance test validates the comprehensive Core API Layer implementation with normalized schemas, real-time collaboration features, comprehensive validation, and multi-tenant security.

## Prerequisites

### Test User Accounts

All test accounts use the password: **`testpass123`**

| Role | Email | Primary Function |
|------|-------|-----------------|
| **System Admin** | `system_admin@ndis.com.au` | Full API access |
| **Company Admin** | `company_admin@ndis.com.au` | Company-scoped API access |
| **Team Lead** | `team_lead@ndis.com.au` | Analysis capabilities |
| **Frontline Worker** | `frontline_worker@ndis.com.au` | Incident creation and capture |

### Test Data Setup

Run the automated test script to set up test data:
```bash
bun scripts/story-1.4-integration-tests.ts
```

Or manually verify these test companies exist:
- **SupportSignal** (slug: `support-signal`) - Base company
- **Test NDIS Provider** - Integration test company

## Acceptance Criteria Testing

### AC1: Schema Normalization with Data Migration

**Objective**: Verify enum values are normalized to lowercase snake_case

**Test Steps**:
1. Open Convex Dashboard → Data → `incident_classifications`
2. Verify all records use normalized enum values:
   - `incident_type`: "behavioural", "environmental", "medical", "communication", "other"
   - `severity`: "low", "medium", "high"
3. Run migration if needed: `bunx convex run migrations:normalizeClassificationEnums`

**Expected Results**:
- ✅ All existing classification records use lowercase snake_case enums
- ✅ Migration completes successfully with detailed reporting
- ✅ No data loss during normalization process

**API Testing**:
```bash
# Run the automated test
bun scripts/story-1.4-integration-tests.ts --test-group=schema
```

---

### AC2: Complete Incident Management API Surface

**Objective**: Validate all incident management operations with proper authentication and validation

#### 2.1 Incident Creation with Validation

**Test Steps**:
1. Login as **Frontline Worker**: `frontline_worker@ndis.com.au`
2. Navigate to incident creation interface
3. Test incident creation with valid data:
   - Reporter Name: "John Doe"
   - Participant Name: "Jane Smith"
   - Event Date/Time: Today's date
   - Location: "Main Cafeteria"

**Expected Results**:
- ✅ Incident created successfully with proper validation
- ✅ Input sanitization removes potential XSS content
- ✅ Business rules enforced (date within 30 days past to 24 hours future)
- ✅ Multi-tenant isolation applied (incident assigned to user's company)

**Validation Testing**:
Test these validation scenarios:
- Empty reporter name → Should fail with clear error
- Event date > 24 hours future → Should fail with business rule error
- Event date > 30 days past → Should fail with business rule error
- Invalid date format → Should fail with validation error

#### 2.2 Incident Retrieval and Access Control

**Test Steps**:
1. Login as **Team Lead**: `team_lead@ndis.com.au`
2. Verify can view all company incidents
3. Login as **Frontline Worker**: `frontline_worker@ndis.com.au`
4. Verify can only view own incidents

**Expected Results**:
- ✅ Team leads see all company incidents
- ✅ Frontline workers see only their own incidents  
- ✅ Cross-company access denied (multi-tenant isolation)
- ✅ Proper error messages for access denials

#### 2.3 Status Workflow Management

**Test Steps**:
1. Create incident as **Frontline Worker**
2. Update capture status: draft → in_progress → completed
3. Try invalid transitions (e.g., completed → draft)
4. Login as **Team Lead** and try to start analysis before capture complete

**Expected Results**:
- ✅ Valid status transitions work correctly
- ✅ Invalid transitions blocked with clear error messages
- ✅ Business rules enforced (cannot start analysis until capture complete)
- ✅ Overall status calculated automatically based on capture + analysis status

**API Testing**:
```bash
# Run incident management tests
bun scripts/story-1.4-integration-tests.ts --test-group=incidents
```

---

### AC3: Narrative Management with Real-time Collaboration

**Objective**: Validate collaborative narrative editing with live updates and version tracking

#### 3.1 Narrative Creation and Updates

**Test Steps**:
1. Create incident as **Frontline Worker**
2. Create narrative for incident
3. Update narrative phases:
   - Before Event: "Before the incident occurred..."
   - During Event: "During the incident..."
   - End Event: "How the incident ended..."
   - Post Event: "Follow-up actions taken..."

**Expected Results**:
- ✅ Narrative created and linked to incident
- ✅ Partial updates work (can update individual phases)
- ✅ Version tracking increments with each update
- ✅ Input validation enforces minimum 10 characters per phase when provided

#### 3.2 Real-time Collaborative Editing

**Test Steps**:
1. Open narrative in two browser tabs (or different browsers)
2. Login as same user in both tabs
3. Make changes in Tab 1, observe updates in Tab 2
4. Test simultaneous editing scenarios

**Expected Results**:
- ✅ Changes in one tab immediately appear in other tab
- ✅ Version numbers update in real-time
- ✅ No data conflicts or overwrites
- ✅ Consolidated narrative view updates automatically

#### 3.3 AI Enhancement Features

**Test Steps** (Requires LLM access):
1. Login as **Team Lead**: `team_lead@ndis.com.au` (has LLM access)
2. Create and update basic narrative
3. Use AI enhancement feature to improve narrative content
4. Verify enhanced content is stored separately from original

**Expected Results**:
- ✅ AI enhancement available for users with LLM access
- ✅ Original narrative preserved alongside enhanced version
- ✅ Enhanced content properly attributed to AI generation
- ✅ Access denied for users without LLM permissions

**API Testing**:
```bash
# Run narrative management tests
bun scripts/story-1.4-integration-tests.ts --test-group=narratives
```

---

### AC4: Analysis APIs with AI Classification Generation

**Objective**: Validate incident analysis workflow with AI-powered classification using normalized enums

#### 4.1 Analysis Workflow Creation

**Test Steps**:
1. Login as **Team Lead**: `team_lead@ndis.com.au`
2. Complete incident capture phase (status = "completed")
3. Create analysis for the incident
4. Add contributing conditions (minimum 10 characters)

**Expected Results**:
- ✅ Analysis creation requires completed capture phase
- ✅ Cannot create duplicate analysis for same incident
- ✅ Contributing conditions validation enforced
- ✅ Analysis status tracking works correctly

#### 4.2 AI Classification Generation

**Test Steps**:
1. With analysis containing contributing conditions
2. Generate AI classifications
3. Verify generated classifications use normalized enum values
4. Check classification confidence scores and supporting evidence

**Expected Results**:
- ✅ AI generates multiple classifications with normalized enums
- ✅ Classifications include: incident_type ("behavioural", "environmental", etc.)
- ✅ Severity levels use: "low", "medium", "high" 
- ✅ Confidence scores between 0.0-1.0
- ✅ Supporting evidence provided for each classification

#### 4.3 Analysis Completion Workflow

**Test Steps**:
1. Complete analysis with contributing conditions and classifications
2. Verify incident overall status becomes "completed"
3. Try to edit completed analysis (should fail)

**Expected Results**:
- ✅ Analysis completion requires contributing conditions + classifications
- ✅ Incident overall_status updates to "completed"
- ✅ Completed analysis cannot be further edited
- ✅ Audit trail tracks analysis completion

**API Testing**:
```bash
# Run analysis workflow tests
bun scripts/story-1.4-integration-tests.ts --test-group=analysis
```

---

### AC5: User & Session Management APIs

**Objective**: Validate user profile access and session workflow state management

#### 5.1 User Profile Management

**Test Steps**:
1. Login with each test account
2. Access user profile via `users.getCurrent()` API
3. Verify role-based information returned
4. Test profile updates

**Expected Results**:
- ✅ Current user profile returned with proper authentication
- ✅ Role, company, and permissions correctly identified
- ✅ LLM access flag accurate for each role
- ✅ Unauthenticated requests return null (not error)

#### 5.2 Workflow State Persistence

**Test Steps**:
1. Start incident creation workflow
2. Save workflow state at each step
3. Close browser/tab and reopen
4. Recover workflow state and continue where left off

**Expected Results**:
- ✅ Workflow state persists across sessions
- ✅ Can recover partial incident creation
- ✅ Form data and completed steps tracked
- ✅ Different workflow types (incident_capture, analysis, etc.) managed separately

**API Testing**:
```bash
# Run user and session tests
bun scripts/story-1.4-integration-tests.ts --test-group=users-sessions
```

---

### AC6: Real-time Subscription Features

**Objective**: Validate all real-time collaboration features work across different user sessions

#### 6.1 Incident Dashboard Subscriptions

**Test Steps**:
1. Open dashboard in two browser windows
2. Login as **Company Admin** in both
3. Create new incident in Window 1
4. Verify incident appears in dashboard in Window 2 immediately

**Expected Results**:
- ✅ New incidents appear in real-time across all subscribed dashboards
- ✅ Status changes propagate immediately
- ✅ Company-scoped filtering works correctly
- ✅ Subscription includes proper metadata (timestamp, correlation ID)

#### 6.2 Collaborative Incident Editing

**Test Steps**:
1. Open same incident in multiple browser sessions
2. Different users make simultaneous changes
3. Verify all changes propagate in real-time
4. Test narrative editing collaboration

**Expected Results**:
- ✅ Changes by one user immediately visible to others
- ✅ No data conflicts or overwrites
- ✅ Real-time activity indicators show active editors
- ✅ Version tracking handles concurrent edits

#### 6.3 Analysis Collaboration

**Test Steps**:
1. Multiple team leads work on same incident analysis
2. One generates AI classifications, others see updates immediately
3. Test collaborative analysis review and completion

**Expected Results**:
- ✅ Classification updates appear in real-time
- ✅ Analysis status changes propagate immediately  
- ✅ Multiple users can collaborate on analysis review
- ✅ Analysis completion visible to all subscribers

**API Testing**:
```bash
# Run real-time subscription tests
bun scripts/story-1.4-integration-tests.ts --test-group=realtime
```

---

### AC7: Comprehensive Error Handling & Validation

**Objective**: Validate error handling system provides clear, actionable feedback

#### 7.1 Validation Error Handling

**Test Steps**:
1. Test various invalid inputs across all APIs:
   - Empty required fields
   - Invalid date formats
   - Text too long/short
   - Invalid enum values
2. Verify error responses include:
   - Clear error messages
   - Error type classification
   - Correlation IDs for tracking
   - Validation details

**Expected Results**:
- ✅ All validation errors return structured error responses
- ✅ Error messages are user-friendly and actionable
- ✅ Correlation IDs provided for debugging
- ✅ Input sanitization prevents XSS attacks

#### 7.2 Business Logic Error Handling

**Test Steps**:
1. Test business rule violations:
   - Invalid state transitions
   - Permission boundaries
   - Resource dependencies
2. Verify errors are logged appropriately
3. Test error recovery scenarios

**Expected Results**:
- ✅ Business logic errors clearly explained
- ✅ Audit trail includes all error occurrences
- ✅ Users can understand and fix issues
- ✅ System remains stable during error conditions

**API Testing**:
```bash
# Run comprehensive error handling tests
bun scripts/story-1.4-integration-tests.ts --test-group=validation
```

---

### AC8: Multi-tenant Security & Isolation

**Objective**: Validate complete multi-tenant isolation and security

#### 8.1 Company Data Isolation

**Test Steps**:
1. Create incidents in Company A
2. Login as Company B user
3. Verify cannot access Company A incidents
4. Test all APIs respect company boundaries

**Expected Results**:
- ✅ Cross-company data access completely blocked
- ✅ All queries filtered by user's company_id
- ✅ Clear error messages for unauthorized access
- ✅ No data leakage between companies

#### 8.2 Role-based Permission Enforcement

**Test Steps**:
1. Test each role's permission boundaries
2. Verify frontline workers cannot perform analysis
3. Verify team leads cannot manage users
4. Test LLM access restrictions

**Expected Results**:
- ✅ All role restrictions properly enforced
- ✅ Permission errors are clear and helpful
- ✅ Users can see what they're allowed to access
- ✅ LLM features restricted to appropriate roles

**API Testing**:
```bash
# Run security and isolation tests  
bun scripts/story-1.4-integration-tests.ts --test-group=security
```

---

## Integration Testing

### Automated Test Suite

Run the complete automated test suite:

```bash
# Run all Story 1.4 tests
bun scripts/story-1.4-integration-tests.ts

# Run specific test groups
bun scripts/story-1.4-integration-tests.ts --test-group=incidents
bun scripts/story-1.4-integration-tests.ts --test-group=narratives  
bun scripts/story-1.4-integration-tests.ts --test-group=analysis
bun scripts/story-1.4-integration-tests.ts --test-group=realtime

# Run with cleanup disabled for debugging
TEST_CLEANUP=false bun scripts/story-1.4-integration-tests.ts
```

### Performance Testing

Test real-time performance with multiple concurrent users:

```bash
# Run with multiple simultaneous sessions
CONCURRENT_USERS=5 bun scripts/story-1.4-integration-tests.ts --test-group=realtime
```

## Test Data Cleanup

After testing, clean up test data:

```bash
# The test script automatically cleans up, but you can also run manually
bun scripts/story-1.4-integration-tests.ts --cleanup-only
```

Or manually delete test records created with naming pattern:
- Companies with "Test" in name
- Incidents with reporter/participant names containing "Test"
- Correlation IDs starting with "integration-test-"

## Success Criteria

**Story 1.4 is considered PASSED when:**

- ✅ All automated tests pass (100% success rate)
- ✅ All manual acceptance criteria validated
- ✅ Real-time features work across multiple sessions
- ✅ Multi-tenant isolation verified  
- ✅ Error handling provides actionable feedback
- ✅ Performance meets expectations for typical usage
- ✅ Schema normalization completed without data loss
- ✅ API documentation examples work as shown

## Known Limitations

1. **Mock AI Services**: Classification generation uses mock data pending full AI integration
2. **Workflow State Storage**: Uses session-based storage pending dedicated workflow_states table
3. **Advanced Collaboration**: User presence indicators and conflict resolution planned for future stories

## Next Steps

Upon successful completion:
1. Deploy to staging environment
2. Update frontend applications to use new API structure
3. Train users on new real-time collaboration features
4. Monitor production performance and error rates