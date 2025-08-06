# Dynamic Schema Documentation System

**Concept Design** - AI-First Schema Documentation Following Multi-Layer Manifest Architecture

## Problem Statement

Traditional database documentation faces critical challenges in AI-first development:

- **Schema-Documentation Drift**: Static docs become outdated immediately after schema changes
- **AI Context Gaps**: Schema files are machine-readable but not AI-friendly for analysis
- **Human Comprehension**: Raw schema lacks business context and usage patterns
- **Multi-Format Needs**: Different consumers need different representations (developers, AI agents, visual tools)

## Solution Architecture

### Dynamic Schema Documentation Generator

Following the successful **Multi-Layer Manifest Architecture** pattern, create a system that:

1. **Parses** the executable schema (`apps/convex/schema.ts`) as source of truth
2. **Extracts** rich annotations and structural information
3. **Generates** multiple consumption formats automatically
4. **Maintains** zero documentation drift through automation

### Core Components

#### 1. **Schema Parser & Analyzer**

```typescript
// Conceptual schema analysis engine
interface SchemaAnalyzer {
  parseSchema(schemaFile: string): ParsedSchema;
  extractAnnotations(schemaAST: any): AnnotationMap;
  analyzeRelationships(tables: TableDefinition[]): RelationshipGraph;
  generateMetadata(schema: ParsedSchema): SchemaMetadata;
}

interface ParsedSchema {
  tables: TableDefinition[];
  relationships: Relationship[];
  indexes: IndexDefinition[];
  annotations: AnnotationMap;
  metadata: SchemaMetadata;
}
```

#### 2. **Multi-Format Generator**

```typescript
// Multiple output format generation
interface SchemaGenerator {
  generateAIContext(schema: ParsedSchema): AIContextManifest;
  generateHumanDocs(schema: ParsedSchema): MarkdownDocumentation;
  generateDBML(schema: ParsedSchema): DBMLVisualization;
  generateManifest(schema: ParsedSchema): SchemaManifest;
}
```

#### 3. **AI-Optimized Schema Manifest Format**

```json
{
  "schema_manifest": {
    "version": "1.0.0",
    "generated_at": "2025-08-06T00:00:00Z",
    "source_file": "apps/convex/schema.ts",
    "source_hash": "sha256:abc123...",
    "ai_context": {
      "purpose": "Multi-tenant SupportSignal application for NDIS provider support",
      "key_patterns": [
        "Multi-tenant company-based data isolation",
        "Role-based access control (RBAC)",
        "Real-time incident tracking",
        "AI-powered analysis pipeline"
      ],
      "architecture_summary": "Next.js + Convex + Multi-tenant SaaS"
    },
    "tables": [
      {
        "name": "companies",
        "purpose": "Multi-tenant company management for NDIS providers",
        "category": "multi_tenancy",
        "relationships": {
          "outgoing": [
            { "table": "users", "type": "one_to_many", "key": "company_id" },
            { "table": "incidents", "type": "one_to_many", "key": "company_id" }
          ]
        },
        "access_patterns": [
          {
            "name": "slug_lookup",
            "description": "URL-based company resolution",
            "query_pattern": "by_slug index",
            "frequency": "high"
          },
          {
            "name": "status_management",
            "description": "Subscription and access control",
            "query_pattern": "by_status index",
            "frequency": "medium"
          }
        ],
        "fields": [
          {
            "name": "slug",
            "type": "string",
            "convex_type": "v.string()",
            "constraints": ["unique", "required"],
            "annotations": {
              "validation": "URL-safe format required",
              "security": "Primary tenant identifier",
              "purpose": "Multi-tenant URL routing"
            },
            "ai_context": {
              "business_meaning": "Company's unique identifier for URL-based routing",
              "data_sensitivity": "Public identifier",
              "validation_rules": ["url_safe", "uniqueness"]
            }
          }
        ],
        "indexes": [
          {
            "name": "by_slug",
            "fields": ["slug"],
            "purpose": "Fast multi-tenant URL routing",
            "performance_impact": "Critical for tenant resolution"
          }
        ],
        "ai_context": {
          "common_operations": [
            "tenant_resolution",
            "subscription_management", 
            "data_isolation_enforcement"
          ],
          "security_considerations": [
            "tenant_boundary_enforcement",
            "subscription_status_validation"
          ],
          "business_rules": ["unique_slug", "status_workflow"]
        }
      }
    ],
    "relationship_map": {
      "multi_tenant_core": {
        "tables": ["companies", "users", "incidents", "analysis"],
        "description": "Company-scoped data isolation and multi-tenant boundaries"
      },
      "authentication_flow": {
        "tables": ["users", "sessions", "password_reset_tokens"],
        "description": "User authentication with company association"
      },
      "incident_workflow": {
        "tables": ["incidents", "analysis", "users", "companies"],
        "description": "End-to-end incident management within company boundaries"
      }
    },
    "performance_insights": {
      "critical_indexes": ["companies.by_slug", "users.by_email", "users.by_company", "incidents.by_company"],
      "multi_tenant_patterns": [
        "All business queries scoped by company_id",
        "Slug-based tenant resolution for URL routing"
      ],
      "scaling_considerations": [
        "Company-scoped data partitioning strategy",
        "Index optimization for multi-tenant queries"
      ]
    }
  }
}
```

### Generation Workflow

#### Automated Schema Analysis Pipeline

```bash
# Conceptual generation workflow for SupportSignal
schema-analyzer apps/convex/schema.ts \
  --output-dir docs/architecture/schema/ \
  --formats ai-manifest,human-docs,dbml,relationship-map \
  --include-annotations \
  --analyze-performance \
  --multi-tenant-aware
```

**Generated Outputs**:

1. **`schema-ai-context.json`** - AI agent context injection format
2. **`schema-human-docs.md`** - Rich human documentation with SupportSignal examples
3. **`schema-visualization.dbml`** - DBML for visual diagram tools
4. **`schema-manifest.json`** - Complete machine-readable specification
5. **`relationship-analysis.md`** - Multi-tenant relationship patterns and access analysis

### Integration with Existing Systems

#### Following Multi-Layer Manifest Patterns

**Directory Structure**:

```
docs/architecture/schema/
├── README.md                 # Overview and generation instructions
├── generate-schema-docs.sh   # Automation script
├── schema-ai-context.json    # AI agent context
├── schema-manifest.json      # Complete machine-readable spec
├── human-documentation.md    # Rich developer documentation
├── visualization.dbml        # Visual diagram format
└── relationship-analysis.md  # Multi-tenant access patterns and performance
```

**Integration Points**:

1. **AI Agent Context** - Structured JSON for Claude Code and Gemini
2. **Dynamic Source Trees** - Schema views included in architecture context
3. **Feature Manifests** - Schema changes documented in feature descriptions
4. **CLAUDE.md Integration** - Reference to dynamic schema documentation

#### Automation & CI Integration

```yaml
# .github/workflows/schema-docs.yml
name: Update Schema Documentation

on:
  push:
    paths: ['apps/convex/schema.ts']

jobs:
  update-schema-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate Schema Documentation
        run: |
          cd docs/architecture/schema
          chmod +x generate-schema-docs.sh
          ./generate-schema-docs.sh

      - name: Commit Updates
        run: |
          git add docs/architecture/schema/
          git diff --staged --quiet || git commit -m "docs: update schema documentation"
          git push
```

### AI Context Optimization Features

#### Schema-Aware AI Assistance

**Context Assembly for Different Tasks**:

```typescript
// Conceptual AI context optimization for SupportSignal
interface SchemaAIContext {
  // For multi-tenant query writing
  getMultiTenantContext(operation: string): {
    company_scoping: CompanyScopingPattern[];
    role_permissions: RolePermissionRule[];
    data_isolation: DataIsolationRule[];
    performance_tips: string[];
  };

  // For incident management features
  getIncidentContext(feature: string): {
    workflow_states: WorkflowState[];
    company_boundaries: CompanyBoundary[];
    role_access_patterns: RoleAccessPattern[];
    integration_points: IntegrationPoint[];
  };

  // For debugging and troubleshooting
  getDebuggingContext(issue: string): {
    multi_tenant_considerations: MultiTenantDebugRule[];
    common_issues: KnownIssue[];
    investigation_queries: QueryExample[];
    trace_correlation: TracePattern[];
  };
}
```

#### Dynamic Context Selection

**Task-Aware Documentation**:

- **Authentication Work**: Focus on users, sessions, multi-tenant authentication patterns
- **Incident Management**: Emphasize incidents, analysis, company-scoped workflows
- **Multi-Tenant Features**: Highlight company isolation, role-based access control
- **Performance Optimization**: Surface index usage and company-scoped query patterns
- **Debugging**: Present logging tables and multi-tenant correlation patterns

### Implementation Phases

#### Phase 1: Schema Parser & Basic Generation

- Parse `schema.ts` AST for structure extraction
- Generate basic AI context JSON format for SupportSignal
- Update existing `data-models.md` with generated content
- Create automation script for manual generation

#### Phase 2: Rich Context & Multi-Format Output

- Enhance annotation extraction from comments
- Generate human documentation with SupportSignal examples
- Create DBML export for visual tools
- Implement relationship analysis and multi-tenant performance insights

#### Phase 3: AI Integration & Optimization

- Task-aware context assembly for different AI workflows
- Integration with existing manifest system
- Multi-tenant performance analysis and query pattern detection
- Advanced relationship mapping and business logic extraction

#### Phase 4: Automation & CI Integration

- Automated generation on schema changes
- CI workflow integration
- Cross-repository schema synchronization
- Advanced analytics and schema evolution tracking

## SupportSignal Specific Benefits

### Multi-Tenant Schema Awareness

- **Company-Scoped Queries**: AI assistance understands tenant boundary requirements
- **Role-Based Access**: Context includes hierarchical permission model
- **Data Isolation Patterns**: Automatic company_id scoping suggestions
- **URL Routing Logic**: Slug-based tenant resolution understanding

### Incident Management Context

- **Workflow States**: AI understands incident lifecycle and state transitions
- **Priority Management**: Context includes business rules for priority handling
- **Analysis Integration**: AI-powered incident analysis pattern awareness
- **Company Boundaries**: All incident operations respect multi-tenant isolation

### NDIS Provider Domain Knowledge

- **Support Organization Hierarchy**: Role structure reflects real-world support teams
- **Incident Types**: Schema context includes typical NDIS support scenarios  
- **Compliance Considerations**: Audit trail and accountability patterns
- **Scalability Patterns**: Multi-tenant architecture for provider growth

## Benefits & Value Proposition

### Immediate Benefits

- **Zero Documentation Drift**: Always reflects actual SupportSignal schema
- **AI-Optimized Context**: Better AI assistance for multi-tenant database work
- **Rich Human Documentation**: Business context with NDIS provider examples
- **Visual Integration**: DBML export for architecture diagram tools

### Strategic Value

- **Manifest Architecture Consistency**: Follows proven patterns
- **Cross-Repository Adoption**: Schema documentation as extractable pattern
- **AI-First Development**: Optimized for AI-assisted workflows
- **Knowledge Preservation**: Multi-tenant business logic and context preservation

### Development Experience

- **Faster Onboarding**: New developers understand SupportSignal schema quickly
- **Better AI Assistance**: Context-aware code generation and analysis
- **Reduced Maintenance**: Automated documentation generation
- **Enhanced Debugging**: Rich multi-tenant context for troubleshooting

---

**Status**: Concept Design Complete - SupportSignal Application Context
**Next Steps**: Implement Phase 1 - Basic Schema Parser and AI Context Generation
**Integration**: Follows Multi-Layer Manifest Architecture patterns
**Value**: AI-first database documentation that never goes stale, with multi-tenant awareness