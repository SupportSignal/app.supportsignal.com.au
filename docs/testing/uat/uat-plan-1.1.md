# UAT Plan 1.1: Multi-Tenant Database Implementation

## Overview
User Acceptance Testing plan to verify Story 1.1 implementation of SupportSignal's multi-tenant incident management database foundation.

**Story**: Multi-Tenant Database Implementation  
**Test Environment**: Development/Convex Dashboard  
**Tester**: David Cruwys  
**Date**: 2025-01-15

## Prerequisites

### Setup Steps
1. **Start Convex Development Server**:
   ```bash
   cd /path/to/supportsignal/app.supportsignal.com.au
   bunx convex dev
   ```

2. **Access Convex Dashboard**:
   - Open browser to Convex dashboard (URL displayed in terminal)
   - Navigate to "Functions" tab to execute test queries

3. **Seed Initial Data**:
   - In Convex dashboard, go to Functions
   - Run `seed:seedInitialData` mutation with no arguments
   - Verify success message includes Support Signal company and David user IDs

## Test Scenarios

### Test Group 1: Multi-Tenant Foundation

#### UAT-1.1: Company Management
**Objective**: Verify multi-tenant company functionality

**Test Steps**:
1. **Create Test Company**:
   - Function: `companies:createCompany`
   - Arguments:
     ```json
     {
       "name": "Test NDIS Provider",
       "slug": "test-ndis-provider",
       "contactEmail": "test@provider.com.au"
     }
     ```
   - **Expected**: Returns company ID, status "active"

2. **Verify Company Retrieval**:
   - Function: `companies:getCompanyBySlug`
   - Arguments: `{ "slug": "test-ndis-provider" }`
   - **Expected**: Returns company details matching created data

3. **List Active Companies**:
   - Function: `companies:listActiveCompanies`
   - **Expected**: Returns both "Support Signal" and "Test NDIS Provider"

**Pass Criteria**: ✅ All companies created, retrieved, and listed correctly

#### UAT-1.2: User Role Management  
**Objective**: Verify snake_case role hierarchy and company association

**Test Steps**:
1. **Verify System Admin Exists**:
   - Check seeded david@ideasmen.com.au user has:
     - Role: `system_admin`
     - CompanyId: Support Signal company ID
     - hasLLMAccess: `true`

2. **Test Role Hierarchy**:
   - Verify all expected roles exist in schema:
     - `system_admin`, `company_admin`, `team_lead`
     - `frontline_worker`, `viewer`, `support`

**Pass Criteria**: ✅ User roles and company associations work correctly

### Test Group 2: Incident Management Workflow

#### UAT-2.1: Basic Incident Creation
**Objective**: Verify incident creation and retrieval

**Test Steps**:
1. **Create Test Incident**:
   - Function: `incidents:createIncident`
   - Arguments:
     ```json
     {
       "companyId": "[Support Signal Company ID]",
       "reporterName": "Sarah Johnson",
       "participantName": "Michael Smith", 
       "eventDateTime": "2025-01-15T10:30:00",
       "location": "Community Center - Activity Room",
       "correlationId": "test-incident-001"
     }
     ```
   - **Expected**: Returns incident ID, status "capture_pending"

2. **Retrieve Incident**:
   - Function: `incidents:getIncidentById`
   - Arguments: `{ "incidentId": "[Incident ID from step 1]" }`
   - **Expected**: Returns incident with initial workflow status

3. **List Company Incidents**:
   - Function: `incidents:getIncidentsByCompany` 
   - Arguments: `{ "companyId": "[Support Signal Company ID]" }`
   - **Expected**: Returns list including new test incident

**Pass Criteria**: ✅ Incident created, retrieved, and filtered by company correctly

#### UAT-2.2: Incident Workflow Status
**Objective**: Verify workflow status transitions

**Test Steps**:
1. **Update Capture Status**:
   - Function: `incidents:updateIncidentStatus`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "captureStatus": "completed"
     }
     ```
   - **Expected**: overallStatus changes to "analysis_pending"

2. **Update Analysis Status**:
   - Function: `incidents:updateIncidentStatus`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]", 
       "analysisStatus": "completed"
     }
     ```
   - **Expected**: overallStatus changes to "completed"

**Pass Criteria**: ✅ Workflow status transitions work as designed

### Test Group 3: Incident Narratives and Questions

#### UAT-3.1: Incident Narrative Management
**Objective**: Verify narrative creation and updates

**Test Steps**:
1. **Create Incident Narrative**:
   - Function: `incidents:upsertIncidentNarrative`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "beforeEvent": "Michael was participating in art therapy session.",
       "duringEvent": "Michael became agitated when asked to clean up materials.",
       "endEvent": "Staff provided calm support and Michael settled down.",
       "postEvent": "Discussed coping strategies with Michael.",
       "correlationId": "test-narrative-001"
     }
     ```
   - **Expected**: Returns narrative ID, version 1

2. **Retrieve Narrative**:
   - Function: `incidents:getIncidentNarrative`
   - Arguments: `{ "incidentId": "[Test Incident ID]" }`
   - **Expected**: Returns narrative with all four phases

**Pass Criteria**: ✅ Narratives created and retrieved correctly

#### UAT-3.2: Clarification Questions
**Objective**: Verify question and answer functionality

**Test Steps**:
1. **Add Clarification Question**:
   - Function: `incidents:addClarificationQuestion`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "questionId": "test-q-001",
       "phase": "duringEvent",
       "questionText": "What specific trigger caused Michael's agitation?",
       "questionOrder": 1,
       "correlationId": "test-question-001"
     }
     ```

2. **Submit Answer**:
   - Function: `incidents:submitClarificationAnswer`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "questionId": "test-q-001",
       "answerText": "Michael was asked to put away materials before he felt ready to stop.",
       "phase": "duringEvent",
       "correlationId": "test-answer-001"
     }
     ```

3. **Retrieve Questions and Answers**:
   - Function: `incidents:getClarificationQuestions`
   - Arguments: `{ "incidentId": "[Test Incident ID]", "phase": "duringEvent" }`
   - **Expected**: Returns question with isActive: true

**Pass Criteria**: ✅ Questions and answers flow works correctly

### Test Group 4: Analysis and Classification

#### UAT-4.1: Incident Analysis
**Objective**: Verify analysis workflow

**Test Steps**:
1. **Create Analysis**:
   - Function: `analysis:createIncidentAnalysis`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "contributingConditions": "Contributing factors include: 1) Transition difficulties - participant needed more time to process activity change, 2) Communication - request was made without sufficient warning or preparation time",
       "correlationId": "test-analysis-001"
     }
     ```

2. **Retrieve Analysis**:
   - Function: `analysis:getIncidentAnalysis`
   - Arguments: `{ "incidentId": "[Test Incident ID]" }`
   - **Expected**: Returns analysis with status "ai_generated"

**Pass Criteria**: ✅ Analysis creation and retrieval works

#### UAT-4.2: Incident Classification
**Objective**: Verify classification system

**Test Steps**:
1. **Create Classification**:
   - Function: `analysis:createIncidentClassification`
   - Arguments:
     ```json
     {
       "incidentId": "[Test Incident ID]",
       "analysisId": "[Analysis ID from UAT-4.1]",
       "classificationId": "test-class-001",
       "incidentType": "Behavioural",
       "supportingEvidence": "Participant showed behavioral response to transition request",
       "severity": "Low",
       "confidenceScore": 0.8,
       "correlationId": "test-classification-001"
     }
     ```

2. **Retrieve Classifications**:
   - Function: `analysis:getClassificationsByIncident`
   - Arguments: `{ "incidentId": "[Test Incident ID]" }`
   - **Expected**: Returns classification with specified details

**Pass Criteria**: ✅ Classification system works correctly

### Test Group 5: AI Prompts Subsystem

#### UAT-5.1: Prompt Management
**Objective**: Verify AI prompts functionality

**Test Steps**:
1. **Retrieve Active Prompts**:
   - Function: `prompts:getPromptsBySubsystem`
   - Arguments: `{ "subsystem": "incidents" }`
   - **Expected**: Returns seeded prompts for incidents subsystem

2. **Get Specific Prompt**:
   - Function: `prompts:getActivePrompt`
   - Arguments: `{ "promptName": "generate_clarification_questions" }`
   - **Expected**: Returns active version of prompt with template

**Pass Criteria**: ✅ Prompts system accessible and functional

### Test Group 6: Multi-Tenant Data Isolation

#### UAT-6.1: Company Data Isolation
**Objective**: Verify data isolation between companies

**Test Steps**:
1. **Create Second Company and Incident**:
   - Create another test company: "ABC NDIS Services" 
   - Create incident for ABC NDIS Services
   - Use different reporter/participant names

2. **Verify Data Isolation**:
   - Query incidents for Support Signal company ID
   - Query incidents for ABC NDIS Services company ID
   - **Expected**: Each query returns only incidents for that company

3. **Test Cross-Company Access**:
   - Try to retrieve Support Signal incident using ABC company filter
   - **Expected**: Incident not returned (proper isolation)

**Pass Criteria**: ✅ Multi-tenant data isolation works correctly

## Test Results Template

### Test Execution Summary
- **Test Date**: _________
- **Environment**: Development/Convex
- **Tester**: David Cruwys

| Test Group | Test Case | Status | Notes |
|------------|-----------|---------|-------|
| 1.1 | Company Management | ⏳ | |
| 1.2 | User Role Management | ⏳ | |
| 2.1 | Basic Incident Creation | ⏳ | |
| 2.2 | Incident Workflow Status | ⏳ | |
| 3.1 | Incident Narrative Management | ⏳ | |
| 3.2 | Clarification Questions | ⏳ | |
| 4.1 | Incident Analysis | ⏳ | |
| 4.2 | Incident Classification | ⏳ | |
| 5.1 | Prompt Management | ⏳ | |
| 6.1 | Company Data Isolation | ⏳ | |

### Overall Status
- ⏳ **Pending**: Ready for execution
- Target: ✅ **All tests passing**

## Notes for Tester

### Common Issues to Watch For:
1. **Company IDs**: Copy actual IDs from seed results - don't use placeholders
2. **Correlation IDs**: Use unique values for each test to avoid conflicts
3. **Status Transitions**: Verify overallStatus updates automatically
4. **Data Isolation**: Pay special attention to multi-tenant separation

### Success Criteria:
- All 10 test cases pass
- No data leakage between companies
- Workflow status transitions work correctly
- All CRUD operations function properly

### Next Steps After UAT:
- If all tests pass: Story 1.1 ready for production
- If issues found: Document and prioritize fixes
- Begin Story 1.2 planning (incident capture UI)