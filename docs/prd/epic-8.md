# Epic 8: Environment Architecture & Deployment Separation

## Epic Overview

**Goal**: Establish proper development and production environment separation with correct deployment architecture, eliminating shared database issues and hardcoded localhost URLs in production systems.

**Duration**: 1-2 weeks
**Team Size**: 1-2 developers (backend, DevOps focus)
**Dependencies**: All previous epics (affects core infrastructure)
**Primary Users**: System administrators, developers, end users
**Requirements Source**: Critical infrastructure issues discovered during Story 7.1 implementation

---

## Business Context

Epic 8 addresses **critical production infrastructure failures** discovered during Story 7.1 implementation. The current system has fundamental environment separation problems that cause production emails to contain localhost URLs and both environments to share the same database.

**Key Business Drivers**:
- **Production Reliability**: Eliminate localhost URLs in production emails and authentication
- **Data Integrity**: Separate development and production data to prevent accidental corruption
- **Security Compliance**: Proper OAuth configuration for production vs development
- **Operational Excellence**: Reliable deployment pipelines with environment-specific configuration

**Critical Issues Requiring Immediate Resolution**:
- 🚨 **Shared Database**: Both dev and production using same Convex deployment (`beaming-gull-639`)
- 🚨 **Production Email Bug**: Production emails contain `localhost:3200` URLs instead of `app.supportsignal.com.au`
- 🚨 **OAuth Failures**: Authentication callbacks fail in production due to domain mismatches
- 🚨 **Configuration Chaos**: 7 server functions accessing wrong environment variables

**Success Metrics**:
- **Environment Separation**: 100% data isolation between dev and production
- **URL Correctness**: 100% of production emails contain correct domain URLs
- **Authentication Success**: 100% OAuth success rate in production
- **Deployment Reliability**: Zero environment configuration errors in CI/CD

---

## Current State Analysis

### **Deployment Architecture Issues**

```mermaid
graph TD
    A[Local Dev localhost:3200] --> C[beaming-gull-639.convex.cloud]
    B[Production app.supportsignal.com.au] --> C
    C --> D[SHARED DATABASE ❌]

    E[Server Functions] --> F[process.env.NEXT_PUBLIC_APP_URL]
    F --> G[localhost:3200 in Production ❌]
```

### **Environment Variable Problems**

**Current Configuration**:
- `NEXT_PUBLIC_APP_URL=http://localhost:3200` (dev value used everywhere)
- Server functions incorrectly accessing client-side `NEXT_PUBLIC_*` variables
- No environment detection in Convex functions
- Cloudflare Pages using dev environment configuration

**Affected Components**:
1. **Email System** (`apps/convex/email.ts:14`) - Hardcoded localhost fallback
2. **OAuth Callbacks** (`apps/convex/auth.ts`) - 4 instances of wrong URLs
3. **Worker Communication** (`apps/convex/workerSync.ts`) - Wrong worker URLs
4. **Password Reset** - Wrong domain in reset links

---

## Target Architecture

### **Proper Environment Separation**

```mermaid
graph TD
    A[Local Dev localhost:3200] --> B[dev:beaming-gull-639.convex.cloud]
    C[Production app.supportsignal.com.au] --> D[prod:graceful-shrimp-355.convex.cloud]

    E[Environment-Aware Config] --> F[Dynamic URL Generation]
    F --> G[Correct URLs in All Environments ✅]
```

### **Configuration Strategy**

**Environment Detection Approach**:
- **Server-side**: Use Convex deployment context for environment detection
- **Client-side**: Use `NEXT_PUBLIC_*` variables properly
- **Hybrid config**: Centralized configuration module with multiple detection strategies

---

## Story Breakdown

### **8.1: Convex Environment Separation & Production Connection**
**Goal**: Connect production to correct Convex deployment and establish data separation
- Verify `graceful-shrimp-355` production deployment exists and is accessible
- Update Cloudflare Pages environment variables to use production Convex
- Test data isolation between environments
- Migrate essential production data if needed

### **8.2: Environment-Aware URL Configuration System**
**Goal**: Fix hardcoded localhost URLs with dynamic environment-aware configuration
- Create centralized configuration module for URL generation
- Fix 7 server functions using wrong environment variables
- Implement proper environment detection in Convex functions
- Test email URLs in both environments

### **8.3: OAuth Production Application Setup**
**Goal**: Create separate OAuth applications for production environment
- Create production GitHub OAuth app with correct callback URLs
- Create production Google OAuth app with correct callback URLs
- Update production environment variables with new OAuth credentials
- Test authentication flows in both environments

### **8.4: Deployment Pipeline & Configuration Management**
**Goal**: Establish reliable deployment procedures with environment-specific config
- Document proper deployment procedures for both environments
- Create environment-specific configuration management
- Implement deployment verification procedures
- Create rollback procedures for configuration issues

---

## Technical Requirements

### **Environment Variables Strategy**

**Development Environment**:
```
NEXT_PUBLIC_APP_URL=http://localhost:3200
NEXT_PUBLIC_CONVEX_URL=https://beaming-gull-639.convex.cloud
CONVEX_DEPLOYMENT=dev:beaming-gull-639
```

**Production Environment**:
```
NEXT_PUBLIC_APP_URL=https://app.supportsignal.com.au
NEXT_PUBLIC_CONVEX_URL=https://graceful-shrimp-355.convex.cloud
CONVEX_DEPLOYMENT=prod:graceful-shrimp-355
```

### **OAuth Configuration Requirements**

**Development OAuth Apps**:
- GitHub callback: `http://localhost:3200/auth/github/callback`
- Google callback: `http://localhost:3200/auth/google/callback`

**Production OAuth Apps**:
- GitHub callback: `https://app.supportsignal.com.au/auth/github/callback`
- Google callback: `https://app.supportsignal.com.au/auth/google/callback`

### **Critical Functions to Fix**

1. **Email System** - `apps/convex/email.ts:14`
2. **Auth Callbacks** - `apps/convex/auth.ts:611,1153,1266,1270,1299`
3. **Worker Sync** - `apps/convex/workerSync.ts:9`

---

## Environment Management System Operations

**🚨 ARCHITECTURAL ISSUE IDENTIFIED AND FIXED**: The sync-env.js script had a critical architectural flaw where local files could be overwritten with production values. This has been corrected.

**Key Principle**: **Local `.env.local` files NEVER contain production values.**

### **Primary Documentation**

For complete sync-env.js operational details, see:
- **[Environment Management Technical Guide](../technical-guides/environment-management.md)** - Complete operational documentation
- **[Configuration Management Protocols](../technical-guides/configuration-management-protocols.md)** - Usage best practices

### **Critical Architecture Summary**

```
LOCAL MODE (Default):
~/.env-configs/[project].env → Local files (ALWAYS dev values)
                             → apps/web/.env.local
                             → apps/convex/.env.local

DEPLOYMENT MODE:
~/.env-configs/[project].env → Cloud platforms (dev/prod values)
                             → Convex deployment
                             → Cloudflare Pages dashboard
                             → Workers via wrangler
```

### **Required Manual Source-of-Truth Updates**

**Status**: ✅ **COMPLETED** - User has updated `~/.env-configs/app.supportsignal.com.au.env` with correct production values.

**Key Changes Made**:
- `CONVEX_DEPLOYMENT`: `dev:beaming-gull-639` → `prod:graceful-shrimp-355`
- `NEXT_PUBLIC_CONVEX_URL`: `beaming-gull-639.convex.cloud` → `graceful-shrimp-355.convex.cloud`
- `ALLOWED_ORIGINS`: Updated for production URLs

### **Quick Commands Reference**

```bash
# LOCAL (Most Common - Always dev values)
bun run sync-env                    # Generate local dev files

# DEPLOYMENT (Cloud platforms only)
bun run sync-env:deploy-dev         # Deploy to dev Convex
bun run sync-env:deploy-prod        # BLOCKED (security)
```

For detailed commands, features, troubleshooting, and verification procedures, see the **[Environment Management Technical Guide](../technical-guides/environment-management.md)**.

---

## Risk Assessment

### **High Risk Items**
- **Data Migration**: Risk of data loss during environment separation
- **Production Downtime**: Risk during Convex deployment switching
- **OAuth Disruption**: Risk of authentication failures during OAuth app transition

### **Mitigation Strategies**
- **Staged Rollout**: Implement changes incrementally with testing at each stage
- **Backup Strategy**: Full data backup before any production changes
- **Rollback Plan**: Documented rollback procedures for each component
- **Testing Strategy**: Comprehensive testing in staging environment first

---

## Dependencies & Prerequisites

### **External Dependencies**
- **Convex Account Access**: Ability to manage `graceful-shrimp-355` deployment
- **OAuth Providers**: GitHub and Google developer account access
- **Cloudflare Access**: Ability to modify Pages environment variables
- **DNS Management**: Verify domain configuration if needed

### **Technical Prerequisites**
- Backup current production data
- Verify `graceful-shrimp-355` deployment accessibility
- Document current OAuth app configurations
- Create staging environment for testing

---

## Success Criteria

### **Functional Success**
- ✅ Production emails contain `https://app.supportsignal.com.au` URLs
- ✅ Development emails contain `http://localhost:3200` URLs
- ✅ Complete data separation between environments
- ✅ OAuth authentication works in both environments
- ✅ No server functions access wrong environment variables

### **Technical Success**
- ✅ All 7 hardcoded URL instances fixed
- ✅ Environment-aware configuration system implemented
- ✅ Proper Convex deployment separation established
- ✅ Deployment procedures documented and tested

### **Operational Success**
- ✅ Zero configuration-related production incidents
- ✅ Reliable deployment pipeline with environment validation
- ✅ Clear documentation for future environment management
- ✅ Monitoring and alerting for environment configuration issues

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-28 | 1.0 | Initial epic creation based on critical infrastructure issues discovered in Story 7.1 | Bob (SM Agent) |