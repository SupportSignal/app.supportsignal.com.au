# SupportSignal - Product Requirements Document

## Executive Summary

**SupportSignal** is an AI-powered incident reporting and analysis platform designed specifically for NDIS service providers. The system transforms fragmented, manual incident reporting processes (Slack messages, Excel spreadsheets, paper forms) into a structured, comprehensive digital workflow that ensures compliance, improves safety outcomes, and enables data-driven operational improvements.

**Vision**: Empower frontline disability support workers and team leaders to capture, analyze, and learn from incidents through intelligent, guided workflows that reduce cognitive load while increasing data quality and compliance consistency.

---

## Project Overview

### Core Problem Statement

NDIS service providers currently struggle with inconsistent incident reporting methods that fail to capture sufficient detail for regulatory compliance, safety analysis, and operational improvement. Critical incident information is often lost in informal communication channels or incomplete manual forms, creating compliance risks and missed opportunities for preventive measures.

### Solution Approach

SupportSignal provides a guided, AI-enhanced incident reporting system featuring:

- **Intelligent Capture Workflow**: 7-step wizard that guides frontline workers through comprehensive incident documentation
- **AI-Powered Clarification**: Context-aware follow-up questions generated from initial narratives
- **Structured Analysis Process**: Team leader workflow for analyzing contributing conditions and classifying incidents
- **Real-time Collaboration**: Convex-powered real-time updates and team coordination
- **Compliance-Ready Outputs**: Structured reports suitable for regulatory requirements and organizational learning

---

## Key Features & Capabilities

### 🔄 Incident Capture Workflow (Frontline Workers)
- Multi-phase narrative collection (Before/During/End/Post-Event)
- AI-generated clarification questions for each phase
- Progressive disclosure with validation-guided navigation
- Real-time auto-save and recovery
- Mobile-responsive design for on-the-go reporting

### 📊 Incident Analysis Workflow (Team Leaders)
- Consolidated narrative review interface
- AI-powered contributing conditions analysis
- Incident classification and severity assessment
- Export capabilities for compliance reporting
- Audit trail and change tracking

### 🤖 AI Integration
- Context-aware question generation based on narrative content
- Narrative enhancement using clarification responses
- Contributing conditions analysis for pattern identification
- Classification suggestions with confidence scoring

### 👥 User Management & Collaboration
- Role-based access control (Frontline Workers, Team Leaders, Administrators)
- Real-time workflow handoffs between capture and analysis phases
- User attribution and audit logging
- Session management with workflow state persistence

---

## Target Users

### Primary User: Frontline Support Worker
- **Role**: Direct care provider, first responder to incidents
- **Technical Skills**: Basic computer literacy, mobile-device comfort
- **Goals**: Quick, accurate incident reporting with minimal complexity
- **Pain Points**: Time pressure, unclear requirements, complex forms

### Secondary User: Team Lead/Manager
- **Role**: Incident analysis, compliance oversight, quality improvement
- **Technical Skills**: Moderate computer literacy, analytical mindset  
- **Goals**: Comprehensive analysis, pattern identification, compliance reporting
- **Pain Points**: Incomplete data, time-consuming analysis, inconsistent quality

### Tertiary User: Administrator/Compliance Officer
- **Role**: System oversight, compliance monitoring, reporting
- **Technical Skills**: Advanced computer literacy, regulatory knowledge
- **Goals**: System configuration, compliance assurance, trend analysis
- **Pain Points**: Manual report compilation, audit preparation, data quality issues

---

## Technical Architecture

### Platform Foundation
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + ShadCN UI
- **Backend**: Convex (serverless functions + real-time database)
- **AI Integration**: Direct OpenAI/Anthropic API integration
- **Authentication**: Convex Auth with role-based access control
- **Deployment**: Cloudflare Pages + Edge Workers

### Key Architectural Decisions
- **Real-time by Default**: Convex subscriptions for live workflow coordination
- **Serverless-First**: Leveraging Convex actions for AI processing
- **Type-Safe**: End-to-end TypeScript with Convex validators
- **Mobile-Responsive**: Progressive web app capabilities
- **Audit-Compliant**: Comprehensive change tracking and data retention

---

## Success Metrics

### User Adoption
- **Incident Reporting Completion Rate**: >90% of started incidents completed
- **Time to Complete Capture**: <15 minutes average for incident capture
- **User Satisfaction**: >4.5/5 rating from frontline workers
- **Analysis Turnaround**: <2 hours from capture completion to analysis start

### Data Quality
- **Narrative Completeness**: >95% of incidents with all narrative phases completed
- **Clarification Response Rate**: >80% of generated questions answered
- **Analysis Detail Score**: Measurable improvement in analysis depth vs. manual process
- **Export Utilization**: >70% of completed analyses exported for official records

### Business Impact
- **Compliance Audit Readiness**: 100% of incidents meet regulatory documentation requirements
- **Incident Learning**: Measurable improvement in preventive measure implementation
- **Cost Reduction**: 50%+ reduction in time spent on incident documentation and analysis
- **Risk Mitigation**: Earlier identification of patterns and systemic issues

---

## Epic Structure

This PRD is organized into three focused epics that build upon each other:

### Epic 1: Data Foundation & Backend Setup
Establish the complete data infrastructure, AI integration services, and authentication system that powers both capture and analysis workflows.

### Epic 2: Incident Capture Workflow  
Implement the comprehensive 7-step incident capture workflow for frontline workers, including AI-powered clarification and narrative enhancement.

### Epic 3: Incident Analysis Workflow
Build the 4-step analysis workflow for team leaders, featuring AI-powered contributing conditions analysis and incident classification.

---

## Navigation

📋 **[Complete PRD Documentation](./prd/)**
- **[PRD Index & Navigation](./prd/index.md)** - Comprehensive overview and navigation hub
- **[Epic 1: Data Foundation & Backend Setup](./prd/epic-1.md)** - Infrastructure and API layer
- **[Epic 2: Incident Capture Workflow](./prd/epic-2.md)** - Frontline worker experience
- **[Epic 3: Incident Analysis Workflow](./prd/epic-3.md)** - Team leader analysis tools

🏗️ **[Architecture Documentation](../architecture/)** - Technical implementation details  
📚 **[Implementation Guides](../guides/)** - Development methodology and patterns  
🧪 **[Testing Strategy](../testing/)** - Quality assurance and validation approach

---

## Project Status

**Phase**: Requirements Definition Complete  
**Next Steps**: Epic 1 implementation planning and database schema finalization  
**Dependencies**: Convex environment setup, AI API credentials, authentication provider configuration

This PRD represents the complete requirements specification for SupportSignal v1.0, designed to deliver a production-ready NDIS incident reporting platform that transforms how disability service providers capture, analyze, and learn from critical incidents.