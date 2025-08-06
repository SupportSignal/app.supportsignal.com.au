#!/usr/bin/env bun
/**
 * Generate Schema Manifest from Convex schema.ts
 * 
 * This script analyzes the Convex schema definition and generates a comprehensive
 * data model manifest for AI context injection and documentation.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TableField {
  name: string;
  type: string;
  optional: boolean;
  constraints: string[];
  description?: string;
  values?: string[];
  purpose?: string;
}

interface IndexDefinition {
  name: string;
  fields: string[];
}

interface TableDefinition {
  name: string;
  fields: TableField[];
  indexes: IndexDefinition[];
  comments: string[];
}

interface SchemaManifest {
  schema_manifest: {
    version: string;
    generated_at: string;
    source_file: string;
    generation_method: string;
    ai_context: {
      purpose: string;
      architecture: string;
      key_patterns: string[];
      design_philosophy: string;
    };
    table_categories: Record<string, {
      tables: string[];
      purpose: string;
      key_features: string[];
    }>;
    tables: any[];
    system_integrations: any;
    ai_development_patterns: any;
    query_patterns: any;
  };
}

// Table categorization based on business function
const TABLE_CATEGORIES = {
  'multi_tenancy': {
    tables: ['companies'],
    purpose: 'Company-based tenant isolation for multiple NDIS providers',
    key_features: [
      'Slug-based URL routing',
      'Status-based subscription management',
      'Audit trail creation tracking'
    ]
  },
  'authentication': {
    tables: ['users', 'sessions', 'accounts', 'password_reset_tokens'],
    purpose: 'BetterAuth-integrated user management with multi-tenant association',
    key_features: [
      'OAuth support',
      'Session persistence',
      'Multi-tenant user isolation',
      'Enhanced role hierarchy for support organizations'
    ]
  },
  'incident_management': {
    tables: [
      'incidents', 
      'incident_narratives', 
      'clarification_questions', 
      'clarification_answers', 
      'incident_analysis', 
      'incident_classifications'
    ],
    purpose: 'Comprehensive incident tracking, narrative collection, and AI-powered analysis',
    key_features: [
      'Multi-phase narrative capture',
      'AI-generated clarification questions',
      'Contributing conditions analysis',
      'Incident classification and severity assessment',
      'Multi-tenant company isolation'
    ]
  },
  'ai_prompts_system': {
    tables: ['ai_prompts'],
    purpose: 'Centralized AI prompt management with versioning and performance tracking',
    key_features: [
      'Version-controlled prompt templates',
      'Usage analytics and performance metrics',
      'Workflow-specific prompt organization',
      'Schema validation for inputs/outputs'
    ]
  },
  'knowledge_management': {
    tables: ['source_documents', 'document_chunks'],
    purpose: 'Document ingestion and vector-based knowledge retrieval',
    key_features: [
      'Content hash-based change detection',
      'Hybrid Convex/Vectorize storage',
      'Chunk-based document processing',
      'Metadata-driven retrieval'
    ]
  },
  'conversation_ai': {
    tables: ['chat_sessions', 'chat_messages'],
    purpose: 'Conversational AI interface with LLM access control',
    key_features: [
      'Session-based conversation tracking',
      'Token usage monitoring',
      'LLM access feature gating',
      'Model usage tracking'
    ]
  },
  'logging': {
    tables: ['debug_logs'],
    purpose: 'Application-wide debugging and audit logging',
    key_features: [
      'Cross-system correlation',
      'Cost-aware retention',
      'Multi-source log aggregation'
    ]
  },
  'development': {
    tables: ['test_messages'],
    purpose: 'Development and testing infrastructure validation',
    key_features: ['Connection validation', 'Development workflows']
  }
};

function parseSchemaFile(filePath: string): TableDefinition[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const tables: TableDefinition[] = [];
  
  let currentTable: TableDefinition | null = null;
  let inTableDefinition = false;
  let parenthesesDepth = 0;
  let braceDepth = 0;
  let currentComments: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Collect comments
    if (line.startsWith('//')) {
      currentComments.push(line.replace('//', '').trim());
      continue;
    }
    
    // Skip empty lines
    if (!line) {
      if (!inTableDefinition) currentComments = [];
      continue;
    }
    
    // Table definition start
    const tableMatch = line.match(/(\w+):\s*defineTable\(/);
    if (tableMatch && !inTableDefinition) {
      currentTable = {
        name: tableMatch[1],
        fields: [],
        indexes: [],
        comments: [...currentComments]
      };
      inTableDefinition = true;
      parenthesesDepth = 1; // Starting with the opening parenthesis
      braceDepth = 0;
      currentComments = [];
      
      // Check if the opening brace is on the same line
      const openBraceIndex = line.indexOf('{');
      if (openBraceIndex !== -1) {
        braceDepth = 1;
      }
      continue;
    }
    
    if (inTableDefinition && currentTable) {
      // Index definition - check before processing parentheses/braces
      const indexMatch = line.match(/\.index\(['"]([^'"]+)['"],\s*\[([^\]]+)\]\)/);
      if (indexMatch) {
        const [, indexName, fieldsStr] = indexMatch;
        const fields = fieldsStr.split(',').map(f => f.trim().replace(/['"]/g, ''));
        currentTable.indexes.push({ name: indexName, fields });
        // Don't continue here - also process parentheses/braces for this line
      }
      
      // Track parentheses and braces depth
      for (const char of line) {
        if (char === '(') parenthesesDepth++;
        else if (char === ')') parenthesesDepth--;
        else if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
      }
      
      // Field definition - look for field: v.type() pattern
      const fieldMatch = line.match(/(\w+):\s*v\.(.+?)(?:,\s*(?:\/\/\s*(.+))?)?$/);
      if (fieldMatch && braceDepth > 0) {
        const [, fieldName, typeDefinition, comment] = fieldMatch;
        const field = parseFieldDefinition(fieldName, typeDefinition, comment);
        currentTable.fields.push(field);
        continue;
      }
      
      // End of table definition - when we find a comma or closing brace after the complete table definition
      if (parenthesesDepth === 0 && (line.trim().endsWith(',') || line.trim() === '},' || line.trim() === '});') && currentTable.fields.length > 0) {
        tables.push(currentTable);
        currentTable = null;
        inTableDefinition = false;
        parenthesesDepth = 0;
        braceDepth = 0;
      }
    }
  }
  
  // Add any remaining table
  if (currentTable && currentTable.fields.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

function parseFieldDefinition(fieldName: string, typeDefinition: string, comment?: string): TableField {
  const field: TableField = {
    name: fieldName,
    type: '',
    optional: false,
    constraints: [],
    description: comment,
  };
  
  let cleanedType = typeDefinition.trim();
  
  // Handle optional fields
  if (cleanedType.includes('v.optional(')) {
    field.optional = true;
    // Extract the inner type from v.optional(innerType)
    const optionalMatch = cleanedType.match(/v\.optional\((.+)\)$/);
    if (optionalMatch) {
      cleanedType = optionalMatch[1];
    }
  }
  
  // Parse basic types
  if (cleanedType.includes('v.string()')) {
    field.type = 'string';
  } else if (cleanedType.includes('v.number()')) {
    field.type = 'number';
  } else if (cleanedType.includes('v.boolean()')) {
    field.type = 'boolean';
  } else if (cleanedType.includes('v.any()')) {
    field.type = 'any';
  } else if (cleanedType.match(/v\.id\(['"](\w+)['"]\)/)) {
    const match = cleanedType.match(/v\.id\(['"](\w+)['"]\)/);
    field.type = `id<${match?.[1]}>`;
    field.constraints.push('foreign_key');
  } else if (cleanedType.includes('v.object(')) {
    field.type = 'object';
  } else if (cleanedType.includes('v.union(')) {
    // Handle union types (enums)
    const unionContent = extractUnionContent(cleanedType);
    if (unionContent) {
      const values = unionContent
        .split(/,\s*/)
        .map(v => v.trim())
        .filter(v => v.includes('v.literal('))
        .map(v => {
          const literalMatch = v.match(/v\.literal\(['"]([^'"]+)['"]\)/);
          return literalMatch?.[1] || v;
        });
      field.type = 'enum';
      field.values = values;
    }
  } else {
    field.type = 'unknown';
  }
  
  return field;
}

function extractUnionContent(unionString: string): string | null {
  // Find v.union( and extract everything until the matching closing parenthesis
  const startIndex = unionString.indexOf('v.union(');
  if (startIndex === -1) return null;
  
  let depth = 0;
  let start = startIndex + 8; // Length of 'v.union('
  
  for (let i = start; i < unionString.length; i++) {
    if (unionString[i] === '(') depth++;
    else if (unionString[i] === ')') {
      if (depth === 0) {
        return unionString.slice(start, i);
      }
      depth--;
    }
  }
  
  return null;
}

function generateTableManifestEntry(table: TableDefinition): any {
  // Determine category
  let category = 'other';
  for (const [cat, config] of Object.entries(TABLE_CATEGORIES)) {
    if (config.tables.includes(table.name)) {
      category = cat;
      break;
    }
  }
  
  // Generate AI context based on table name and fields
  const aiContext = generateAIContext(table);
  
  // Generate relationships
  const relationships = generateRelationships(table);
  
  // Generate key fields analysis
  const keyFields = generateKeyFieldsAnalysis(table);
  
  // Generate access patterns
  const accessPatterns = generateAccessPatterns(table);
  
  return {
    name: table.name,
    category,
    purpose: aiContext.purpose,
    ai_context: aiContext,
    relationships,
    key_fields: keyFields,
    access_patterns: accessPatterns
  };
}

function generateAIContext(table: TableDefinition): any {
  const name = table.name;
  
  // Business meaning based on table name and structure
  let businessMeaning = '';
  let commonOperations: string[] = [];
  let securityModel = '';
  let integrationPoints: string[] = [];
  
  switch (name) {
    case 'companies':
      businessMeaning = 'Central tenant entity enabling data isolation for multiple NDIS support providers';
      commonOperations = ['company_onboarding', 'subscription_management', 'data_isolation_enforcement'];
      securityModel = 'Tenant boundary enforcement with status-based access control';
      integrationPoints = ['User association', 'Incident scoping', 'Analysis boundaries'];
      break;
      
    case 'incidents':
      businessMeaning = 'Support incidents requiring narrative capture, analysis, and structured response within NDIS provider context';
      commonOperations = ['incident_creation', 'narrative_collection', 'analysis_workflow', 'company_scoped_reporting'];
      securityModel = 'Company-scoped data isolation with workflow-based access control';
      integrationPoints = ['Multi-phase narratives', 'AI analysis pipeline', 'Clarification questions', 'Classifications'];
      break;
      
    case 'incident_narratives':
      businessMeaning = 'Multi-phase incident narratives with original user content and AI-enhanced versions';
      commonOperations = ['narrative_capture', 'ai_enhancement', 'consolidation', 'version_tracking'];
      securityModel = 'Incident-level access control with narrative versioning';
      integrationPoints = ['Incident workflow', 'AI analysis input', 'Clarification context'];
      break;
      
    case 'clarification_questions':
      businessMeaning = 'AI-generated questions to elicit additional narrative details from users';
      commonOperations = ['question_generation', 'phase_organization', 'active_management'];
      securityModel = 'Incident-scoped with AI generation tracking';
      integrationPoints = ['Narrative analysis', 'User responses', 'AI prompt system'];
      break;
      
    case 'clarification_answers':
      businessMeaning = 'User responses to AI-generated clarification questions for narrative enhancement';
      commonOperations = ['answer_collection', 'completeness_tracking', 'quality_metrics'];
      securityModel = 'Question-scoped with user attribution';
      integrationPoints = ['Clarification questions', 'Narrative enhancement', 'Analysis input'];
      break;
      
    case 'incident_analysis':
      businessMeaning = 'AI-powered analysis of incident contributing conditions with user review capability';
      commonOperations = ['ai_analysis_generation', 'user_review', 'content_editing', 'version_control'];
      securityModel = 'Incident-level with analysis workflow control';
      integrationPoints = ['Incident data', 'AI prompts', 'Classification system'];
      break;
      
    case 'incident_classifications':
      businessMeaning = 'Structured categorization and severity assessment of incidents';
      commonOperations = ['type_classification', 'severity_assessment', 'evidence_tracking', 'user_validation'];
      securityModel = 'Analysis-scoped with classification confidence tracking';
      integrationPoints = ['Analysis results', 'AI confidence scoring', 'User review workflow'];
      break;
      
    case 'ai_prompts':
      businessMeaning = 'Centralized repository of versioned AI prompts with usage analytics';
      commonOperations = ['prompt_versioning', 'performance_tracking', 'workflow_organization'];
      securityModel = 'System-wide with version control and usage monitoring';
      integrationPoints = ['All AI workflows', 'Performance analytics', 'Schema validation'];
      break;
      
    default:
      businessMeaning = `${name} data management and operations`;
      commonOperations = ['basic_crud', 'data_retrieval'];
      securityModel = 'Standard access control';
      integrationPoints = ['System integration'];
  }
  
  return {
    business_meaning: businessMeaning,
    common_operations: commonOperations,
    security_model: securityModel,
    integration_points: integrationPoints
  };
}

function generateRelationships(table: TableDefinition): any {
  const relationships: any = { incoming: [], outgoing: [] };
  
  for (const field of table.fields) {
    if (field.type.startsWith('id<') && field.type.endsWith('>')) {
      const referencedTable = field.type.slice(3, -1);
      relationships.incoming.push({
        table: referencedTable,
        type: 'many_to_one',
        field: field.name,
        purpose: `Reference to ${referencedTable} for ${field.name.replace('_id', '').replace('Id', '')} association`
      });
    }
  }
  
  return relationships;
}

function generateKeyFieldsAnalysis(table: TableDefinition): any[] {
  return table.fields.map(field => {
    const analysis: any = {
      name: field.name,
      type: field.type,
      optional: field.optional,
      constraints: field.constraints
    };
    
    if (field.description) {
      analysis.description = field.description;
    }
    
    if (field.values) {
      analysis.values = field.values;
    }
    
    // Add purpose based on field name patterns
    if (field.name.includes('_id') || field.name.endsWith('Id')) {
      analysis.purpose = 'Entity association and referential integrity';
    } else if (field.name === 'status') {
      analysis.purpose = 'Workflow state management and filtering';
    } else if (field.name === 'email') {
      analysis.purpose = 'User identification and authentication';
      analysis.security = 'PII - requires protection';
    } else if (field.name.includes('created') || field.name.includes('updated')) {
      analysis.purpose = 'Audit trail and temporal tracking';
    } else if (field.name.includes('hash')) {
      analysis.purpose = 'Content integrity and deduplication';
    }
    
    return analysis;
  });
}

function generateAccessPatterns(table: TableDefinition): any[] {
  const patterns = [];
  
  for (const index of table.indexes) {
    let frequency = 'medium';
    let description = `Query pattern using ${index.fields.join(', ')}`;
    
    // Determine frequency and description based on index name and fields
    if (index.name.includes('email') || index.name.includes('slug')) {
      frequency = 'high';
      description = 'Primary lookup pattern for authentication/routing';
    } else if (index.name.includes('company') || index.name.includes('incident')) {
      frequency = 'high';
      description = 'Multi-tenant data isolation and scoping';
    } else if (index.name.includes('status') || index.name.includes('created')) {
      frequency = 'medium';
      description = 'Workflow management and temporal queries';
    }
    
    patterns.push({
      pattern: index.name,
      index: index.name,
      frequency,
      description
    });
  }
  
  return patterns;
}

function generateManifest(tables: TableDefinition[]): SchemaManifest {
  const now = new Date().toISOString();
  
  const manifest: SchemaManifest = {
    schema_manifest: {
      version: '1.1.0',
      generated_at: now,
      source_file: 'apps/convex/schema.ts',
      generation_method: 'automated_typescript_analysis',
      ai_context: {
        purpose: 'Multi-tenant SupportSignal application for NDIS provider support and comprehensive incident management',
        architecture: 'Next.js frontend + Convex backend + multi-tenant company isolation + AI-powered analysis',
        key_patterns: [
          'BetterAuth integration for authentication',
          'Multi-tenant company-based data isolation',
          'Role-based access control (RBAC) for support organizations',
          'Multi-phase incident narrative collection',
          'AI-powered incident analysis and classification',
          'Centralized prompt management with versioning',
          'Hybrid Convex/Vectorize knowledge storage',
          'Real-time conversation tracking with LLM access control'
        ],
        design_philosophy: 'Multi-tenant SaaS with comprehensive incident management, AI-powered analysis, and robust data isolation for NDIS support providers'
      },
      table_categories: TABLE_CATEGORIES,
      tables: tables.map(generateTableManifestEntry),
      system_integrations: {
        authentication: {
          provider: 'BetterAuth',
          adapter: 'Convex adapter',
          features: [
            'Email/password authentication',
            'OAuth provider integration',
            'Session management',
            'Password reset workflows',
            'Multi-tenant user isolation'
          ]
        },
        multi_tenancy: {
          isolation_strategy: 'Company-based data boundaries',
          routing_pattern: 'Slug-based URL routing',
          access_control: 'Role-based permissions within company scope'
        },
        incident_management: {
          workflow_phases: ['capture', 'analysis', 'classification'],
          narrative_phases: ['before_event', 'during_event', 'end_event', 'post_event'],
          ai_integration: 'Multi-step analysis pipeline with clarification loops'
        },
        ai_system: {
          prompt_management: 'Centralized versioned prompts',
          knowledge_base: 'Hybrid Convex/Vectorize storage',
          conversation_tracking: 'Session-based with usage analytics'
        }
      },
      ai_development_patterns: {
        context_injection: {
          user_context: 'Authentication state, role, and company association from users table',
          company_context: 'Multi-tenant boundaries and company-specific data from companies table',
          incident_context: 'Multi-phase narratives and analysis pipeline state',
          ai_context: 'Prompt versioning and performance tracking',
          knowledge_context: 'Document chunks and vector metadata'
        },
        access_control: {
          company_isolation: 'All queries scoped by company_id for data isolation',
          role_based_permissions: 'Hierarchical role system with company-boundary enforcement',
          feature_gating: 'has_llm_access flag for AI feature control'
        },
        workflow_patterns: {
          incident_workflow: 'Multi-phase capture → AI analysis → human review cycle',
          ai_enhancement: 'Original content + AI suggestions + user edits pattern',
          prompt_evolution: 'Versioned prompts with performance tracking and replacement'
        }
      },
      query_patterns: {
        high_frequency: [
          {
            table: 'companies',
            pattern: 'Company resolution by slug for multi-tenant routing',
            index: 'by_slug',
            optimization: 'Essential for tenant identification'
          },
          {
            table: 'users',
            pattern: 'Authentication lookup by email',
            index: 'by_email',
            optimization: 'Critical for login performance'
          },
          {
            table: 'incidents',
            pattern: 'Company-scoped incident dashboard queries',
            index: 'by_company',
            optimization: 'Primary incident management interface'
          }
        ],
        medium_frequency: [
          {
            table: 'incident_narratives',
            pattern: 'Incident narrative retrieval and updates',
            index: 'by_incident',
            optimization: 'Narrative workflow management'
          },
          {
            table: 'clarification_questions',
            pattern: 'Phase-specific question generation and management',
            index: 'by_incident_phase',
            optimization: 'AI-driven clarification workflows'
          },
          {
            table: 'ai_prompts',
            pattern: 'Active prompt lookup by workflow step',
            index: 'by_workflow',
            optimization: 'AI system prompt resolution'
          }
        ]
      }
    }
  };
  
  return manifest;
}

// Main execution
async function main() {
  try {
    console.log('🔍 Analyzing Convex schema...');
    
    const schemaPath = join(process.cwd(), 'apps/convex/schema.ts');
    const tables = parseSchemaFile(schemaPath);
    
    console.log(`📊 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  • ${table.name} (${table.fields.length} fields, ${table.indexes.length} indexes)`);
    });
    
    console.log('\n🤖 Generating AI-optimized manifest...');
    const manifest = generateManifest(tables);
    
    // Write manifest file
    const manifestPath = join(process.cwd(), 'docs/architecture/data-models.manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated: ${manifestPath}`);
    
    // Generate summary for markdown file
    console.log('\n📝 Generating markdown summary...');
    generateMarkdownSummary(manifest, tables);
    
    console.log('\n✨ Schema manifest generation completed!');
    console.log(`\n📈 Statistics:`);
    console.log(`  • Tables analyzed: ${tables.length}`);
    console.log(`  • Categories: ${Object.keys(TABLE_CATEGORIES).length}`);
    console.log(`  • Total fields: ${tables.reduce((sum, t) => sum + t.fields.length, 0)}`);
    console.log(`  • Total indexes: ${tables.reduce((sum, t) => sum + t.indexes.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Error generating schema manifest:', error);
    process.exit(1);
  }
}

function generateMarkdownSummary(manifest: SchemaManifest, tables: TableDefinition[]) {
  const summary = `# Data Models Summary

*Auto-generated from schema.ts on ${manifest.schema_manifest.generated_at}*

## Architecture Overview

**Purpose**: ${manifest.schema_manifest.ai_context.purpose}

**Key Patterns**:
${manifest.schema_manifest.ai_context.key_patterns.map(p => `- ${p}`).join('\n')}

## Table Categories

${Object.entries(manifest.schema_manifest.table_categories).map(([category, config]) => 
  `### ${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
- **Tables**: ${config.tables.join(', ')}
- **Purpose**: ${config.purpose}
- **Features**: ${config.key_features.join(', ')}`
).join('\n\n')}

## Database Statistics

| Metric | Count |
|--------|-------|
| Total Tables | ${tables.length} |
| Total Fields | ${tables.reduce((sum, t) => sum + t.fields.length, 0)} |
| Total Indexes | ${tables.reduce((sum, t) => sum + t.indexes.length, 0)} |
| Table Categories | ${Object.keys(manifest.schema_manifest.table_categories).length} |

## Tables by Category

${Object.entries(manifest.schema_manifest.table_categories).map(([category, config]) => 
  `### ${category}
${config.tables.map(tableName => {
    const table = tables.find(t => t.name === tableName);
    return `- **${tableName}**: ${table?.fields.length || 0} fields, ${table?.indexes.length || 0} indexes`;
  }).join('\n')}`
).join('\n\n')}
`;

  const summaryPath = join(process.cwd(), 'docs/architecture/data-models-summary.md');
  writeFileSync(summaryPath, summary);
  console.log(`✅ Generated: ${summaryPath}`);
}

if (require.main === module) {
  main();
}