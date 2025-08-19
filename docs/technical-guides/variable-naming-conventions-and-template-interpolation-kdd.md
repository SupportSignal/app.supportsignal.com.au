# Variable Naming Conventions and Template Interpolation KDD

## Problem Discovery

### Critical Issue Identified
During stress testing of the AI-powered clarification system, we discovered that **template interpolation was failing silently**, causing AI-generated questions to ignore narrative content entirely. The stress test scenario contained edge case phrases like "watermelon", "frying pan", "toes", and "aliens" that should have appeared in generated questions, but none were present.

### Root Cause Analysis
Investigation revealed a **systemic variable naming convention mismatch** between:
- **Prompt templates**: Using `camelCase` (e.g., `{{participantName}}`, `{{narrativeText}}`)
- **Data variables**: Using `snake_case` (e.g., `participant_name`, `narrative_content`)

This caused template interpolation to fail silently, replacing variables with empty strings and producing generic questions instead of narrative-specific ones.

## System-Wide Naming Convention Analysis

### Current State by Layer

#### 1. Database Schema (Convex)
- **Pattern**: Predominantly `snake_case`
- **Examples**: `reporter_name`, `participant_name`, `event_date_time`, `created_at`
- **Consistency**: Very consistent across all 25+ tables
- **Rationale**: SQL compatibility, cross-platform consistency, accessibility

#### 2. Frontend Layer (React/TypeScript)
- **Pattern**: Predominantly `camelCase`
- **Examples**: `sessionToken`, `userId`, `participantName`
- **Consistency**: Generally consistent with React/TypeScript best practices
- **Rationale**: JavaScript/TypeScript standard, ESLint defaults

#### 3. AI Prompt Templates
- **Pattern**: `camelCase` (in seed.ts)
- **Examples**: `{{reporterName}}`, `{{participantName}}`, `{{narrativeText}}`
- **Critical Issue**: Interpolation expects camelCase but receives snake_case variables

#### 4. API Boundaries (Mixed Patterns)
- **Problem**: Inconsistent transformation between layers
- **Impact**: Silent failures in data transfer between frontend and backend

## Framework Best Practices Research

### React/TypeScript Standards
- **Variables/Functions**: `camelCase` (industry standard)
- **Components**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE` for compile-time, `camelCase` for runtime

### Database Best Practices
- **Preference**: `snake_case` for SQL compatibility
- **Benefits**: Better readability, accessibility, cross-platform consistency
- **Industry Usage**: PostgreSQL, MySQL prefer snake_case

### Template Engine Patterns
- **Handlebars/Mustache**: Support both conventions but require consistency
- **Best Practice**: Choose one convention and stick with it
- **Common Solution**: Use transformation helpers or dual variable support

## Zod-Based Solution Architecture

### Why Zod?
Our codebase already uses Zod extensively (`apps/convex/validation.ts`) for schema validation. Zod provides:
- **Built-in transformation capabilities** via `.transform()` method
- **Type safety** across transformations
- **Schema-driven approach** that aligns with our existing patterns
- **Conditional mapping** support

### Zod Transformation Capabilities

#### 1. Native Transform Method
```typescript
const transformSchema = z.object({
  reporter_name: z.string(),
  participant_name: z.string(),
}).transform(({ reporter_name, participant_name }) => ({
  reporterName: reporter_name,      // Transform to camelCase
  participantName: participant_name
}));
```

#### 2. Preprocessing for Input Transformation
```typescript
const preprocessSchema = z.preprocess((data) => {
  return transformKeysToExpectedFormat(data);
}, existingSchema);
```

#### 3. Community Package Integration
The `@pyncz/zod-key-mapper` package provides schema-based field mapping:
```typescript
import { mapped } from '@pyncz/zod-key-mapper';

const schema = mapped(z.object({
  reporter_name: z.string(),
  participant_name: z.string(),
}), {
  reporter_name: 'reporterName',
  participant_name: 'participantName'
});
```

## Recommended Implementation Strategy

### 1. Layered Convention Approach
- **Database Schema**: Keep `snake_case` (aligns with SQL best practices)
- **Frontend Code**: Keep `camelCase` (aligns with React/TypeScript standards)
- **Template Variables**: Standardize on `camelCase` (for consistency across contexts)
- **API Boundaries**: Transform between conventions at boundaries

### 2. Zod-Based Transformation Utilities

#### Create Reusable Transformation Schemas
```typescript
// packages/validation/src/transformers.ts
export const templateVariableTransformer = z.object({
  reporter_name: z.string(),
  participant_name: z.string(),
  event_date_time: z.string(),
  narrative_content: z.string(),
}).transform(data => ({
  reporterName: data.reporter_name,
  participantName: data.participant_name,
  eventDateTime: data.event_date_time,
  narrativeText: data.narrative_content,
}));
```

#### Template Interpolation Safety
```typescript
// lib/template-utils.ts
export function safeTemplateInterpolation(
  template: string, 
  data: Record<string, any>
): string {
  // Transform data using appropriate Zod schema
  const templateVars = templateVariableTransformer.parse(data);
  return interpolateTemplate(template, templateVars);
}
```

### 3. Conditional Mapping Pattern
Only apply transformation when naming conventions don't match:
```typescript
export function createConditionalMapper<TInput, TOutput>(
  sourceSchema: z.ZodSchema<TInput>,
  mappingConfig?: Record<string, string>
): z.ZodSchema<TOutput> {
  if (!mappingConfig) {
    return sourceSchema; // No transformation needed
  }
  
  return sourceSchema.transform(data => 
    applyFieldMapping(data, mappingConfig)
  );
}
```

## Implementation Plan

### Phase 1: Immediate Fix (Current Issue)
1. **Fix template interpolation in questionGenerator.ts**
   - Update variable names to match template expectations
   - Use camelCase variables for template interpolation
2. **Test with stress scenario** to verify keywords appear
3. **Document the pattern** for team reference

### Phase 2: Systematic Infrastructure
1. **Create transformation utilities** in `packages/` folder
2. **Establish API boundary transformation** using Zod schemas
3. **Implement template interpolation safety** wrapper
4. **Add validation** to catch future mismatches

### Phase 3: Team Standards
1. **Document naming conventions** by system layer
2. **Create ESLint rules** to enforce conventions
3. **Add CI validation** for boundary mapping consistency
4. **Team training** on transformation patterns

## Benefits of This Approach

### 1. Type Safety
- **Compile-time validation** of field mappings
- **IntelliSense support** for transformed schemas
- **Prevention** of runtime mapping errors

### 2. Maintainability
- **Schema-driven** transformations are self-documenting
- **Reusable** patterns across different boundaries
- **Consistent** approach throughout the codebase

### 3. Flexibility
- **Conditional** transformations only when needed
- **Gradual migration** without breaking existing code
- **Framework agnostic** - works with both frontend and backend

### 4. Developer Experience
- **Clear separation** of concerns by layer
- **Predictable** transformation patterns
- **IDE support** for field mapping

## Lessons Learned

### 1. Template Interpolation is Reflection-Based
Unlike type-safe API calls, template interpolation happens at runtime without TypeScript validation. This makes naming convention mismatches particularly dangerous as they fail silently.

### 2. Boundary Mapping is Critical
Data crosses multiple boundaries in our system:
- Frontend ↔ Backend (API boundary)
- Backend ↔ Database (ORM boundary)
- Data ↔ Templates (interpolation boundary)

Each boundary needs explicit transformation handling.

### 3. Framework Conventions Matter
Different frameworks have different naming convention preferences. Fighting against framework conventions increases cognitive load and development friction.

### 4. Zod is a Powerful Transformation Tool
Beyond validation, Zod's transformation capabilities provide a type-safe, schema-driven approach to data mapping that aligns perfectly with our existing architecture.

## Future Architecture Vision

### 1. Convention by Context
- **Database**: `snake_case` (SQL compatibility)
- **Frontend**: `camelCase` (JavaScript standard)
- **Templates**: `camelCase` (consistency across contexts)
- **APIs**: Transform at boundaries using Zod

### 2. Transformation Infrastructure
- **Centralized** transformation schemas in `packages/`
- **Reusable** across client and server
- **Type-safe** boundary mapping
- **Runtime validation** of transformations

### 3. Quality Assurance
- **Automated testing** of transformation schemas
- **CI validation** of boundary consistency
- **Specialized agents** for pattern enforcement
- **Documentation** of transformation patterns

## References

- [Zod Transform Documentation](https://zod.dev/api?id=transforms)
- [@pyncz/zod-key-mapper Package](https://www.npmjs.com/package/@pyncz/zod-key-mapper)
- [TypeScript Naming Conventions](https://typescript-eslint.io/rules/naming-convention/)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Database Naming Conventions](https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-cdk-typescript-iac/typescript-best-practices.html)

---

**Date**: 2025-08-19  
**Context**: Template interpolation failure investigation  
**Impact**: Critical - Silent failure of AI question generation system  
**Solution**: Zod-based transformation infrastructure with layered naming conventions