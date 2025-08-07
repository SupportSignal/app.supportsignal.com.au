# Story Acceptance Test 1.2: AI Service Integration

## Overview
Story Acceptance Testing plan to verify Story 1.2 implementation of SupportSignal's AI service integration layer with four core AI operations for incident management.

**Story**: AI Service Integration  
**Test Environment**: Development/Convex Dashboard  
**Tester**: David Cruwys  
**Date**: 2025-08-06

## Prerequisites

### Setup Steps
1. **Start Convex Development Server**:
   ```bash
   cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
   bunx convex dev
   ```

2. **Access Convex Dashboard**:
   - Open browser to Convex dashboard (URL displayed in terminal)
   - Navigate to "Functions" tab to execute test queries

3. **Verify API Keys Configuration**:
   - Confirm OPENROUTER_API_KEY is configured in Convex environment variables
   - Optionally verify ANTHROPIC_API_KEY (fallback provider)
   - OpenRouter provides access to multiple models (GPT-4.1-nano, GPT-4, etc.)

4. **Seed Test Data** (if needed):
   - Create test incident using functions from UAT Plan 1.1
   - Ensure incident has basic narrative content for AI operations

## Test Scenarios

### Test Group 1: Core AI Operations

#### UAT-1.1: Generate Clarification Questions
**Objective**: Verify AI-powered clarification question generation

**Test Steps**:
1. **Generate Questions for Incident**:
   - Function: `aiOperations:generateClarificationQuestions`
   - Arguments:
     ```json
     {
       "participantName": "Michael Smith",
       "reporterName": "Sarah Johnson", 
       "location": "Community Center - Activity Room",
       "eventDateTime": "2025-01-15T10:30:00",
       "beforeEvent": "Michael was participating in art therapy session.",
       "duringEvent": "Michael became agitated when asked to clean up materials.",
       "endOfEvent": "Staff provided calm support and Michael settled down.",
       "postEventSupport": "Discussed coping strategies with Michael."
     }
     ```
   - **Expected**: Returns JSON with questions organized by phase (before_event, during_event, end_of_event, post_event_support)

2. **Verify Question Quality**:
   - Questions should be relevant to each narrative phase
   - Each phase should have 2-4 open-ended questions
   - Questions should encourage clarification of actions, timing, environment

**Pass Criteria**: ✅ AI generates relevant, well-structured clarification questions

#### UAT-1.2: Enhance Narrative Content
**Objective**: Verify narrative enhancement using Q&A answers

**Test Steps**:
1. **Prepare Test Q&A Data**:
   - Use sample answers for questions from UAT-1.1
   - Format as question/answer pairs for specific phase

2. **Enhance Narrative Phase**:
   - Function: `aiOperations:enhanceNarrativeContent`
   - Arguments:
     ```json
     {
       "phase": "duringEvent",
       "instruction": "Enhance the narrative with additional details from answered questions",
       "answers": [
         {
           "question": "What specific trigger caused Michael's agitation?",
           "answer": "Michael was asked to put away materials before he felt ready to stop."
         }
       ]
     }
     ```
   - **Expected**: Returns enhanced narrative text incorporating Q&A details

3. **Verify Enhancement Quality**:
   - Original tone and phrasing preserved
   - Q&A content naturally integrated
   - Grammar lightly cleaned up without changing meaning

**Pass Criteria**: ✅ Narrative enhancement maintains tone while incorporating new details

#### UAT-1.3: Analyze Contributing Conditions
**Objective**: Verify AI-powered contributing conditions analysis

**Test Steps**:
1. **Generate Contributing Conditions Analysis**:
   - Function: `aiOperations:analyzeContributingConditions`
   - Arguments:
     ```json
     {
       "reporterName": "Sarah Johnson",
       "participantName": "Michael Smith",
       "eventDateTime": "2025-01-15T10:30:00",
       "location": "Community Center - Activity Room",
       "beforeEvent": "Michael was participating in art therapy session.",
       "duringEvent": "Michael became agitated when asked to clean up materials.",
       "endOfEvent": "Staff provided calm support and Michael settled down.",
       "postEventSupport": "Discussed coping strategies with Michael."
     }
     ```
   - **Expected**: Returns markdown-formatted analysis with structured conditions

2. **Verify Analysis Structure**:
   - Format: `**Immediate Contributing Conditions**`
   - Sections: `### [Condition Name]` with bullet points
   - Content based on evidence from narrative
   - Focus on immediate, specific contributing factors

**Pass Criteria**: ✅ Analysis identifies relevant contributing conditions with supporting evidence

#### UAT-1.4: Generate Mock Answers
**Objective**: Verify testing utility for mock answer generation

**Test Steps**:
1. **Generate Mock Answers for Testing**:
   - Function: `aiOperations:generateMockAnswers`
   - Arguments:
     ```json
     {
       "participantName": "Michael Smith",
       "reporterName": "Sarah Johnson",
       "location": "Community Center - Activity Room", 
       "phase": "duringEvent",
       "phaseNarrative": "Michael became agitated when asked to clean up materials.",
       "questions": "[\"What specific trigger caused the agitation?\", \"How did staff initially respond?\"]"
     }
     ```
   - **Expected**: Returns realistic mock answers for testing/demo purposes

2. **Verify Mock Answer Quality**:
   - Answers should be contextually appropriate
   - Consistent with participant and scenario details
   - Suitable for testing and demonstration

**Pass Criteria**: ✅ Mock answers are realistic and contextually appropriate

### Test Group 2: Multi-Provider Integration

#### UAT-2.1: OpenRouter Multi-Model Support
**Objective**: Verify OpenRouter provides access to multiple AI models

**Test Steps**:
1. **Test OpenRouter with GPT-4.1-nano** (primary model):
   - Use generateClarificationQuestions operation
   - Monitor Convex dashboard logs for model used
   - **Expected**: OpenRouter successfully uses GPT-4.1-nano model

2. **Verify Model Selection**:
   - Check that operations use intended models
   - Verify cost tracking reflects model usage
   - **Expected**: Correct model selection and cost calculation

**Pass Criteria**: ✅ OpenRouter provides access to specified models (GPT-4.1-nano, etc.)

#### UAT-2.2: Provider Fallback System
**Objective**: Verify multi-provider fallback functionality

**Test Steps**:
1. **Test Primary Provider Success**:
   - Execute AI operations with OpenRouter available
   - **Expected**: OpenRouter used as primary provider

2. **Test Fallback Scenario** (Optional):
   - If Anthropic API key configured, test fallback behavior
   - **Expected**: Graceful fallback to secondary provider when primary fails

**Pass Criteria**: ✅ Multi-provider system handles provider failures gracefully

### Test Group 3: Resilience and Error Handling

#### UAT-3.1: Rate Limiting
**Objective**: Verify rate limiting functionality

**Test Steps**:
1. **Test Normal Rate Limits**:
   - Execute multiple AI operations in quick succession
   - Stay within configured limits (20 requests/minute)
   - **Expected**: All requests processed successfully

2. **Monitor Rate Limit Tracking**:
   - Check Convex dashboard for rate limit metrics
   - **Expected**: Request counts tracked accurately

**Pass Criteria**: ✅ Rate limiting works within configured bounds

#### UAT-3.2: Error Handling and Retry Logic
**Objective**: Verify error handling and resilience features

**Test Steps**:
1. **Test Malformed Input Handling**:
   - Submit AI operation with invalid/missing parameters
   - **Expected**: Clear error messages, no system crashes

2. **Verify Graceful Degradation**:
   - During AI service issues, system should provide fallback responses
   - **Expected**: Meaningful error messages or fallback content

**Pass Criteria**: ✅ System handles errors gracefully with appropriate responses

### Test Group 4: Performance and Cost Tracking

#### UAT-4.1: Response Time Monitoring
**Objective**: Verify AI operations complete within reasonable time

**Test Steps**:
1. **Measure Response Times**:
   - Execute each of the four core AI operations
   - Monitor completion times in Convex dashboard
   - **Expected**: Operations complete within 30 seconds

2. **Verify Performance Logging**:
   - Check logs for performance metrics
   - **Expected**: Response times logged for monitoring

**Pass Criteria**: ✅ AI operations perform within acceptable time limits

#### UAT-4.2: Cost Tracking
**Objective**: Verify cost monitoring functionality

**Test Steps**:
1. **Monitor Cost Tracking**:
   - Execute several AI operations
   - Check cost tracking logs/metrics
   - **Expected**: API costs tracked accurately

2. **Verify Cost Controls**:
   - Ensure daily cost limits are respected
   - **Expected**: System prevents excessive API usage

**Pass Criteria**: ✅ Cost tracking and controls function properly

### Test Group 5: Integration with Incident Workflow

#### UAT-5.1: End-to-End Incident AI Workflow
**Objective**: Verify AI operations integrate with incident management

**Test Steps**:
1. **Complete AI Workflow for Test Incident**:
   - Generate clarification questions for test incident
   - Use mock answers to enhance narrative
   - Generate contributing conditions analysis
   - **Expected**: AI operations work together coherently

2. **Verify Data Integration**:
   - AI results should be compatible with incident data structure
   - Results can be stored and retrieved appropriately
   - **Expected**: Seamless integration with existing incident system

**Pass Criteria**: ✅ AI operations integrate smoothly with incident workflow

## Test Results Template

### Test Execution Summary
- **Test Date**: _________
- **Environment**: Development/Convex
- **Tester**: David Cruwys

| Test Group | Test Case | Status | Notes |
|------------|-----------|---------|-------|
| 1.1 | Generate Clarification Questions | ⏳ | |
| 1.2 | Enhance Narrative Content | ⏳ | |
| 1.3 | Analyze Contributing Conditions | ⏳ | |
| 1.4 | Generate Mock Answers | ⏳ | |
| 2.1 | OpenRouter Primary Provider | ⏳ | |
| 2.2 | Anthropic Fallback Provider | ⏳ | |
| 3.1 | Rate Limiting | ⏳ | |
| 3.2 | Error Handling and Retry Logic | ⏳ | |
| 4.1 | Response Time Monitoring | ⏳ | |
| 4.2 | Cost Tracking | ⏳ | |
| 5.1 | End-to-End Incident AI Workflow | ⏳ | |

### Overall Status
- ⏳ **Pending**: Ready for execution
- Target: ✅ **All tests passing**

## Notes for Tester

### Common Issues to Watch For:
1. **API Keys**: Ensure OPENROUTER_API_KEY is properly configured (Anthropic is optional fallback)
2. **Model Access**: Verify OpenRouter provides access to required models (GPT-4.1-nano)
3. **Response Formats**: Verify AI responses match expected JSON schemas
4. **Error Messages**: Check that error handling provides clear, actionable feedback
5. **Performance**: Monitor response times and resource usage
6. **Integration**: Ensure AI results integrate properly with existing incident data

### Success Criteria:
- All 11 test cases pass
- AI operations generate high-quality, relevant results
- Multi-provider system works reliably
- Error handling is robust and user-friendly
- Performance meets acceptable standards

### Next Steps After Story Acceptance Testing:
- If all tests pass: Story 1.2 ready for production deployment
- If issues found: Document specific problems and prioritize fixes
- Begin planning for frontend integration of AI services

### API Reference:
Core AI operations available via Convex actions:
- `api.aiOperations.generateClarificationQuestions`
- `api.aiOperations.enhanceNarrativeContent`
- `api.aiOperations.analyzeContributingConditions`
- `api.aiOperations.generateMockAnswers`

Usage in React components:
```typescript
const generateQuestions = useAction(api.aiOperations.generateClarificationQuestions);
// Call with: await generateQuestions({ participantName, reporterName, ... });
```