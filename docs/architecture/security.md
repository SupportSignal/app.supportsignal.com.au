# Security Architecture

## Overview

SupportSignal implements a comprehensive, multi-layered security strategy designed to protect sensitive NDIS data while maintaining usability and compliance. Our security architecture includes enhanced Convex authentication, role-based access control, comprehensive audit logging, and proactive security monitoring.

## Authentication & Authorization

### Enhanced Convex Authentication System

**Implementation**: Story 1.3 - User Authentication & Permissions
**Status**: ✅ Deployed

Our authentication system extends Convex's native authentication with enterprise-grade security features:

#### Session Management
- **Cryptographically Secure Tokens**: 256-bit random session tokens using `crypto.getRandomValues()`
- **Session Limits**: Maximum 5 concurrent sessions per user to prevent resource exhaustion
- **Automatic Expiration**: 24-hour session lifetime with automatic cleanup
- **Workflow State Persistence**: Session recovery maintains user workflow progress
- **Device Tracking**: Session metadata includes device information for audit trails

#### Password Security
- **Bcrypt Hashing**: 12-round bcrypt for password storage (increased from default 10)
- **Strength Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **Account Lockout**: 5 failed attempts trigger temporary account lockout
- **Password Change Validation**: Current password required for password updates

### Permission-Based Access Control (PBAC)

**Access control is permission-driven, not role-driven. Roles are convenient groupings of permissions.**

**Core Permissions**:
- `CREATE_INCIDENT` - Create new incidents
- `EDIT_OWN_INCIDENT_CAPTURE` - Edit own incident capture data
- `VIEW_MY_INCIDENTS` - View personal incidents within company
- `VIEW_ALL_COMPANY_INCIDENTS` - View all incidents within company
- `PERFORM_ANALYSIS` - Perform incident analysis workflows
- `MANAGE_USERS` - User management within company
- `SYSTEM_CONFIGURATION` - System-level configuration

**Role Groupings (for convenience)**:
- **System Admin**: All permissions + cross-company access
- **Company Admin**: Company-level management permissions
- **Team Lead**: Analysis and oversight permissions
- **Frontline Worker**: Incident creation and personal access permissions

**Permission Matrix**: [See Backend Patterns - Permission-Based Access System](../patterns/backend-patterns.md#permission-based-access-system-pattern)

**Business Rule**: "Democratic Creation, Controlled Editing"
- Anyone can CREATE incidents (encourages reporting)
- Once created, incidents become READ-ONLY for most users (prevents accidental changes)
- Only administrative roles can EDIT incidents (maintains audit integrity)

### Multi-Tenant Security

**Company Scoping**: All data access is scoped to user's company context
**Permission Validation**: Every operation validates specific permissions and company boundaries
**Data Isolation**: Database queries include company filtering to prevent cross-tenant access
**Permission-First Design**: Features check specific permissions, not role names

## Input Validation & Data Protection

### Zod Validation Strategy
- **Function Boundaries**: All Convex function inputs validated with Zod schemas
- **Type Safety**: Runtime validation ensures TypeScript types match actual data
- **Error Messages**: Clear, user-friendly validation error responses
- **Edge Case Handling**: Comprehensive validation for all input scenarios

### Data Sanitization
- **SQL Injection Prevention**: Convex's query system prevents SQL injection by design
- **XSS Prevention**: All user inputs sanitized before storage and display
- **File Upload Validation**: Type and size validation for any file uploads

## Audit & Monitoring

### Comprehensive Audit Logging
**Authentication Events**:
- Login/logout activities with IP addresses and device information
- Password changes and reset requests
- Session creation, expiration, and invalidation
- Failed authentication attempts and lockout events

**Authorization Events**:
- Permission check results (granted/denied) with context
- Role changes and permission modifications
- Administrative actions (user management, system configuration)

**Security Events**:
- Suspicious activity patterns (multiple failed logins, unusual access patterns)
- System configuration changes
- Data access patterns and unusual queries

**Correlation IDs**: All events include correlation IDs for cross-system tracing

### Real-Time Security Monitoring
- **Session Anomaly Detection**: Multiple concurrent sessions from different locations
- **Permission Boundary Testing**: Attempts to access unauthorized resources
- **Rate Limiting**: API rate limits prevent abuse and DoS attacks

## Secret Management

### Platform Dashboard Strategy
- **No Hardcoded Secrets**: All secrets managed through platform dashboards (Convex, Cloudflare)
- **Environment Variables**: Secrets injected as environment variables at runtime
- **Rotation Support**: Easy secret rotation without code deployment
- **Audit Trail**: Secret access and changes logged in platform dashboards

### API Key Security
- **AI Service Keys**: OpenRouter and Anthropic API keys stored in Convex dashboard
- **Database Credentials**: Convex manages database authentication internally
- **Service Integration**: Third-party service credentials managed through respective platforms

## Dependency & Code Security

### Automated Security Scanning
- **Dependency Scanning**: `bun audit` and GitHub Dependabot for vulnerability detection
- **Static Analysis**: GitHub CodeQL for code security analysis
- **Regular Updates**: Automated dependency updates with security patch prioritization

### Development Security
- **AI Security Review**: Automated security review on all pull requests
- **Pre-commit Hooks**: Gitleaks scanning prevents secret commits
- **Branch Protection**: Main branch requires security review approval

## Compliance & Standards

### NDIS Compliance Considerations
- **Data Minimization**: Only collect and store necessary personal information
- **Audit Requirements**: Complete audit trail for all data access and modifications
- **Access Controls**: Role-based access aligned with organizational structures
- **Data Retention**: Configurable retention policies for compliance requirements

### Security Testing
- **Permission Boundary Testing**: Comprehensive testing of role-based access controls
- **Authentication Testing**: Systematic validation of all authentication workflows
- **Dashboard Testing Interface**: Real-time permission validation at `/dashboard`
- **Penetration Testing**: Regular security assessments of deployed systems

## Incident Response

### Security Event Response
- **Automated Alerts**: Real-time alerting for suspicious activities
- **Account Lockout**: Automatic account lockout for security violations
- **Session Invalidation**: Immediate session termination for compromised accounts
- **Audit Trail Preservation**: Immutable security event logs for forensic analysis

### Recovery Procedures
- **Password Reset**: Secure password reset workflow with email verification
- **Account Recovery**: Administrator-initiated account recovery procedures
- **Session Recovery**: Workflow state recovery after security-related interruptions

## Future Security Enhancements

### Planned Improvements
- **Multi-Factor Authentication (MFA)**: Additional authentication factors for high-privilege accounts
- **Advanced Threat Detection**: Machine learning-based anomaly detection
- **Zero-Trust Architecture**: Enhanced identity verification for all system interactions
- **Compliance Automation**: Automated compliance reporting and validation

This security architecture provides robust protection while maintaining the usability required for effective incident management workflows.
