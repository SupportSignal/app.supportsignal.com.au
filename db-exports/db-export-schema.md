# Database Export Schema

**Export File**: db-export.json
**Total Size**: 42,947 lines
**Export Structure**: `{status, value: {data: {table_name: [records]}}}`

## Table Summary

| Table Name | Record Count | Description |
|------------|--------------|-------------|
| **incidents** | 80 | Core incident records |
| **incident_narratives** | 80 | Multi-phase narratives for incidents |
| clarification_questions | 1,683 | AI-generated clarification questions |
| clarification_answers | 1,183 | Human-provided answers to questions |
| participants | 9 | NDIS participants involved in incidents |
| companies | 35 | Organizations managing incidents |
| sites | 36 | Physical locations where incidents occur |
| users | 39 | System users (reporters, reviewers) |
| ai_prompts | 12 | AI prompt templates for various workflows |
| workflow_handoffs | 4 | Workflow transition records |
| user_invitations | 5 | Pending user invitations |
| impersonation_sessions | 4 | Admin impersonation audit trail |
| accounts | 2 | OAuth provider accounts |
| ai_request_logs | 1 | AI API usage logs |
| incident_analysis | 0 | Empty - incident analysis data |
| incident_classifications | 0 | Empty - incident classification data |

---

## Core Tables

### incidents (80 records)

**Purpose**: Primary incident records tracking events involving participants

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "analysis_generated": boolean,
  "analysis_status": string,
  "capture_status": string,
  "company_id": string,
  "created_at": number,
  "created_by": string,
  "event_date_time": string,
  "location": string,
  "narrative_enhanced": boolean,
  "overall_status": string,
  "participant_id": string,
  "participant_name": string,
  "questions_generated": boolean,
  "reporter_name": string,
  "updated_at": number,
  "updated_by": string
}
```

**Key Relationships**:
- `company_id` → companies._id
- `participant_id` → participants._id
- `created_by` / `updated_by` → users._id

**Status Fields**:
- `capture_status`: Incident capture workflow state
- `analysis_status`: Analysis workflow state
- `overall_status`: Combined status indicator

**Filter Suggestions**:
- By company: `company_id`
- By participant: `participant_id`, `participant_name`
- By status: `capture_status`, `analysis_status`, `overall_status`
- By date range: `event_date_time`, `created_at`
- By location: `location`
- By reporter: `reporter_name`, `created_by`
- Feature flags: `analysis_generated`, `narrative_enhanced`, `questions_generated`

---

### incident_narratives (80 records)

**Purpose**: Multi-phase narrative text for each incident (before/during/post event)

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "before_event": string,
  "created_at": number,
  "during_event": string,
  "end_event": string,
  "incident_id": string,
  "narrative_hash": string,
  "post_event": string,
  "updated_at": number,
  "version": number
}
```

**Key Relationships**:
- `incident_id` → incidents._id (one-to-one)

**Narrative Phases**:
- `before_event`: Events leading up to incident
- `during_event`: Active incident description
- `end_event`: Resolution and immediate actions
- `post_event`: Follow-up and aftermath

**Filter Suggestions**:
- By incident: `incident_id`
- By version: `version` (narrative revision tracking)
- By content: Search within phase fields

---

### clarification_questions (1,683 records)

**Purpose**: AI-generated questions to gather additional incident details

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "ai_model": string,
  "generated_at": number,
  "incident_id": string,
  "is_active": boolean,
  "phase": string,
  "prompt_version": string,
  "question_id": string,
  "question_order": number,
  "question_text": string
}
```

**Key Relationships**:
- `incident_id` → incidents._id
- `question_id` → Used to link with clarification_answers

**Filter Suggestions**:
- By incident: `incident_id`
- By phase: `phase`
- Active only: `is_active = true`
- By AI model: `ai_model`, `prompt_version`

---

### clarification_answers (1,183 records)

**Purpose**: Human-provided answers to clarification questions

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "answer_text": string,
  "answered_at": number,
  "answered_by": string,
  "character_count": number,
  "incident_id": string,
  "is_complete": boolean,
  "phase": string,
  "question_id": string,
  "updated_at": number,
  "word_count": number
}
```

**Key Relationships**:
- `incident_id` → incidents._id
- `question_id` → clarification_questions.question_id
- `answered_by` → users._id

**Filter Suggestions**:
- By incident: `incident_id`
- By phase: `phase`
- By question: `question_id`
- Complete answers: `is_complete = true`
- By author: `answered_by`

---

## Supporting Tables

### participants (9 records)

**Purpose**: NDIS participants who are subjects of incident reports

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "care_notes": string,
  "company_id": string,
  "contact_phone": string,
  "created_at": number,
  "created_by": string,
  "date_of_birth": string,
  "emergency_contact": string,
  "first_name": string,
  "last_name": string,
  "ndis_number": string,
  "site_id": string,
  "status": string,
  "support_level": string,
  "updated_at": number,
  "updated_by": string
}
```

**Key Relationships**:
- `company_id` → companies._id
- `site_id` → sites._id

---

### companies (35 records)

**Purpose**: Organizations that manage participants and incidents

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "contact_email": string,
  "created_at": number,
  "name": string,
  "slug": string,
  "status": string
}
```

---

### sites (36 records)

**Purpose**: Physical locations where incidents occur

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "company_id": string,
  "created_at": number,
  "created_by": string,
  "name": string
}
```

**Key Relationships**:
- `company_id` → companies._id

---

### users (39 records)

**Purpose**: System users who create/review incidents

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "company_id": string,
  "created_at": number,
  "email": string,
  "name": string,
  "role": string
}
```

**Key Relationships**:
- `company_id` → companies._id

---

## AI/Workflow Tables

### ai_prompts (12 records)

**Purpose**: Template prompts for AI-powered features

**Schema**: Complex template structure with metadata for prompt management

---

### workflow_handoffs (4 records)

**Purpose**: Track transitions between workflow stages

**Schema**:
```json
{
  "_creationTime": number,
  "_id": string,
  "created_at": number,
  "from_workflow": string,
  "handoff_accepted": boolean,
  "handoff_data": object,
  "incident_id": string,
  "team_leader_notified": boolean,
  "to_workflow": string
}
```

---

## Common Query Patterns

### Get Full Incident Details
```javascript
// Combines: incidents + incident_narratives + clarification Q&A
{
  incident: incidents[_id],
  narrative: incident_narratives[incident_id],
  questions: clarification_questions[incident_id],
  answers: clarification_answers[incident_id],
  participant: participants[participant_id],
  company: companies[company_id]
}
```

### Filter by Date Range
```javascript
// Use created_at or event_date_time timestamps
created_at >= start_timestamp && created_at <= end_timestamp
```

### Filter by Status
```javascript
// Common status values to explore:
capture_status: ["draft", "in_review", "completed"]
analysis_status: ["pending", "in_progress", "completed"]
overall_status: ["active", "closed", "archived"]
```

---

## Data Relationships

```
companies (1) ──< (many) sites
companies (1) ──< (many) participants
companies (1) ──< (many) users
companies (1) ──< (many) incidents

sites (1) ──< (many) participants

participants (1) ──< (many) incidents

incidents (1) ──< (1) incident_narratives
incidents (1) ──< (many) clarification_questions
incidents (1) ──< (many) clarification_answers
incidents (1) ──< (many) workflow_handoffs

users (1) ──< (many) incidents (as creator/updater)
users (1) ──< (many) clarification_answers (as answerer)
```
