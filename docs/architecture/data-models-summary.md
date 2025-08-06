# Data Models Summary

*Auto-generated from schema.ts on 2025-08-06T16:07:23.625Z*

## Architecture Overview

**Purpose**: Multi-tenant SupportSignal application for NDIS provider support and comprehensive incident management

**Key Patterns**:
- BetterAuth integration for authentication
- Multi-tenant company-based data isolation
- Role-based access control (RBAC) for support organizations
- Multi-phase incident narrative collection
- AI-powered incident analysis and classification
- Centralized prompt management with versioning
- Hybrid Convex/Vectorize knowledge storage
- Real-time conversation tracking with LLM access control

## Table Categories

### Multi Tenancy
- **Tables**: companies
- **Purpose**: Company-based tenant isolation for multiple NDIS providers
- **Features**: Slug-based URL routing, Status-based subscription management, Audit trail creation tracking

### Authentication
- **Tables**: users, sessions, accounts, password_reset_tokens
- **Purpose**: BetterAuth-integrated user management with multi-tenant association
- **Features**: OAuth support, Session persistence, Multi-tenant user isolation, Enhanced role hierarchy for support organizations

### Incident Management
- **Tables**: incidents, incident_narratives, clarification_questions, clarification_answers, incident_analysis, incident_classifications
- **Purpose**: Comprehensive incident tracking, narrative collection, and AI-powered analysis
- **Features**: Multi-phase narrative capture, AI-generated clarification questions, Contributing conditions analysis, Incident classification and severity assessment, Multi-tenant company isolation

### Ai Prompts_system
- **Tables**: ai_prompts
- **Purpose**: Centralized AI prompt management with versioning and performance tracking
- **Features**: Version-controlled prompt templates, Usage analytics and performance metrics, Workflow-specific prompt organization, Schema validation for inputs/outputs

### Knowledge Management
- **Tables**: source_documents, document_chunks
- **Purpose**: Document ingestion and vector-based knowledge retrieval
- **Features**: Content hash-based change detection, Hybrid Convex/Vectorize storage, Chunk-based document processing, Metadata-driven retrieval

### Conversation Ai
- **Tables**: chat_sessions, chat_messages
- **Purpose**: Conversational AI interface with LLM access control
- **Features**: Session-based conversation tracking, Token usage monitoring, LLM access feature gating, Model usage tracking

### Logging
- **Tables**: debug_logs
- **Purpose**: Application-wide debugging and audit logging
- **Features**: Cross-system correlation, Cost-aware retention, Multi-source log aggregation

### Development
- **Tables**: test_messages
- **Purpose**: Development and testing infrastructure validation
- **Features**: Connection validation, Development workflows

## Database Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 18 |
| Total Fields | 170 |
| Total Indexes | 49 |
| Table Categories | 8 |

## Tables by Category

### multi_tenancy
- **companies**: 6 fields, 2 indexes

### authentication
- **users**: 7 fields, 2 indexes
- **sessions**: 4 fields, 2 indexes
- **accounts**: 10 fields, 2 indexes
- **password_reset_tokens**: 3 fields, 2 indexes

### incident_management
- **incidents**: 15 fields, 3 indexes
- **incident_narratives**: 14 fields, 2 indexes
- **clarification_questions**: 9 fields, 3 indexes
- **clarification_answers**: 10 fields, 4 indexes
- **incident_analysis**: 14 fields, 4 indexes
- **incident_classifications**: 16 fields, 5 indexes

### ai_prompts_system
- **ai_prompts**: 19 fields, 5 indexes

### knowledge_management
- **source_documents**: 7 fields, 3 indexes
- **document_chunks**: 11 fields, 3 indexes

### conversation_ai
- **chat_sessions**: 4 fields, 1 indexes
- **chat_messages**: 8 fields, 1 indexes

### logging
- **debug_logs**: 11 fields, 5 indexes

### development
- **test_messages**: 2 fields, 0 indexes
