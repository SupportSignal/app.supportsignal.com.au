# Epic 10: Claude Analysis Server

> **Quick Navigation:** [10.1](#story-101-agent-sdk-server-setup) · [10.2](#story-102-database-export-slicer-cli)

## Epic Overview

**Goal**: Build a local Claude Code analysis server using Anthropic's Agent SDK to enable LLM-powered data analysis, dynamic insights, and report generation without consuming API credits.

**Duration**: 2-3 sprints
**Team Size**: 1 developer
**Dependencies**:
- Story 0.6 (Database Export & Analysis System) - Complete ✅
- Anthropic Agent SDK access
- Claude Pro subscription

**Enables**:
- Dynamic tag generation for incidents
- Pattern analysis across database exports
- Prompt engineering experimentation
- Automated report generation
- AI-powered data insights without API costs

---

## Business Context

The Claude Analysis Server enables SupportSignal to leverage AI for advanced data analysis without incurring per-request API costs. By using Claude Pro subscription with the Agent SDK, the system can:

**Key Business Drivers**:
- **Cost Efficiency**: Use Claude Pro subscription instead of expensive API credits
- **Dynamic Insights**: Generate tags, patterns, and classifications on-demand rather than hard-coded dropdowns
- **Prompt Engineering**: Rapidly experiment with and improve AI prompts using real data
- **Developer Productivity**: Analyze database exports with LLM assistance for debugging and optimization
- **Future-Proof Analysis**: Re-analyze historical data with improved prompts as techniques evolve

**Use Cases**:
1. **Dynamic Tag Generation**: Analyze incidents and generate classification tags without pre-defined taxonomies
2. **Pattern Discovery**: Identify trends across participants, sites, or time periods
3. **Prompt Optimization**: Test prompt variations against real incident data
4. **Report Automation**: Generate narrative summaries and insights for stakeholders
5. **Data Quality Analysis**: Identify gaps, inconsistencies, or improvement opportunities

**Strategic Value**:
Rather than building rigid dropdown fields and static classifications, the Claude Analysis Server enables flexible, evolving analysis that improves over time as prompts are refined and new techniques emerge.

---

## Technical Architecture

### System Components

**1. Claude Code Agent SDK Server**
- Local server running Anthropic's Agent SDK
- MCP (Model Context Protocol) integration
- Codebase access for context-aware analysis
- Uses Claude Pro subscription (no API costs)

**2. Database Export Slicer CLI**
- Command-line tool for segmenting large database exports
- Generates LLM-friendly context documents
- Creates focused data slices for analysis
- Multiple slice strategies (incident, participant, worker, site, prompt)

**3. Analysis Workflows** (Future)
- Dynamic tag generation pipelines
- Pattern analysis across datasets
- Report generation templates
- Prompt testing and comparison

### Data Flow

```
Database Export (2.7MB, 18 tables)
    ↓
Export Slicer CLI
    ↓
Focused Data Slices (incident-xyz-data.json + context.md + schema.json)
    ↓
Claude Analysis Server (Agent SDK)
    ↓
Insights, Tags, Reports, Patterns
```

### Architecture Decisions

**Why Agent SDK vs Direct API?**
- ✅ Uses Claude Pro subscription (no per-request costs)
- ✅ MCP integration provides codebase context
- ✅ Supports complex, multi-turn analysis workflows
- ✅ Local execution with full control

**Why CLI Slicer vs UI?**
- ✅ Better for automation and scripting
- ✅ Easier to integrate with analysis pipelines
- ✅ Separates concerns: web UI for export, CLI for slicing/analysis
- ✅ Command-line composition with other tools

**Why Context Documents?**
- ✅ LLMs need context about data structure and purpose
- ✅ Self-documenting datasets for future analysis
- ✅ Includes use case guidance and statistics
- ✅ Enables better prompt engineering

---

## Quick Navigation

**Stories in this Epic:**
- [10.1](#story-101-agent-sdk-server-setup)
- [10.2](#story-102-database-export-slicer-cli)

**Stories in this Epic:**
- [Story 10.1: Agent SDK Server Setup](#story-101-agent-sdk-server-setup) - 📋 **Planned**
- [Story 10.2: Database Export Slicer CLI](#story-102-database-export-slicer-cli) - 📋 **Planned**

---

## Story Breakdown

### Story 10.1: Agent SDK Server Setup

**Estimated Effort**: Medium (1-2 days)
**Category**: Infrastructure & Integration
**Priority**: High (enables all analysis workflows)

#### Objective

Set up a local Claude Code analysis server using Anthropic's Agent SDK with MCP integration to enable LLM-powered data analysis without consuming API credits.

#### Key Requirements

1. **Agent SDK Installation & Configuration**
   - Install Anthropic Agent SDK
   - Configure Claude Pro subscription access
   - Set up MCP (Model Context Protocol) server
   - Verify codebase access and context loading

2. **Server Architecture**
   - Standalone server or integrated into codebase (to be decided during implementation)
   - Configuration management for API keys and settings
   - Basic request/response handling
   - Error handling and logging

3. **Testing & Validation**
   - Verify Claude Pro subscription usage (no API costs)
   - Test codebase access and context awareness
   - Validate MCP integration
   - Basic analysis workflow test

4. **Documentation**
   - Setup guide for local development
   - Configuration reference
   - Architecture overview
   - Usage examples

#### Success Criteria

- [ ] Agent SDK server running locally
- [ ] Claude Pro subscription verified (no API charges)
- [ ] MCP integration functional with codebase access
- [ ] Basic analysis request/response working
- [ ] Documentation complete for setup and usage

#### Technical Notes

**Agent SDK Resources**:
- Anthropic Agent SDK documentation
- MCP integration guide
- Claude Code MCP server setup

**Configuration Considerations**:
- API key management (environment variables vs config file)
- Server location (standalone vs integrated into monorepo)
- Port configuration and networking
- Logging and monitoring

**Open Questions**:
- Standalone server or integrated into existing codebase?
- What port should the server run on?
- How should we handle multi-turn conversations vs one-shot analysis?
- What logging/monitoring do we need?

---

### Story 10.2: Database Export Slicer CLI

**Estimated Effort**: Large (2-3 days)
**Category**: Developer Tooling
**Priority**: High (required for efficient LLM analysis)

#### Objective

Build a command-line tool that segments large database exports into focused, LLM-friendly data slices with comprehensive context documentation for efficient Claude analysis.

#### Key Requirements

1. **Core Slicer Implementation**
   - Read full database export JSON (2.7MB+, 18 tables)
   - Implement multiple slice strategies
   - Generate output files (data.json, context.md, schema.json)
   - Data sanitization (remove sensitive fields)

2. **Slice Strategies**
   - **Incident Context Bundle**: Single incident + all relationships + AI prompts
   - **Participant Timeline**: All incidents for a participant + context
   - **Worker History**: All incidents reported by a frontline worker
   - **Site Snapshot**: All data for a specific site/location
   - **Prompt Testing Bundle**: AI prompt + sample incidents + input/output
   - **Workflow Analysis**: Workflow handoffs + status transitions

3. **LLM-Friendly Output**
   - **context.md**: Overview, use cases, statistics, schema summary, relationships
   - **data.json**: Focused data slice with all relationships resolved
   - **schema.json**: Field definitions, types, relationships, indexes

4. **CLI Interface**
   - Multiple output strategies (single slice, batch mode, all slices)
   - Configurable output directory
   - Format options (JSON, YAML)
   - Sanitization controls
   - Compression options

5. **Documentation**
   - CLI usage guide
   - Slice strategy reference
   - Context document format
   - Integration with Claude Analysis Server

#### Success Criteria

- [ ] CLI tool generates all slice types from full export
- [ ] Context documents include comprehensive overview and statistics
- [ ] Schema documents accurately describe data structure
- [ ] Data slices preserve all relationships correctly
- [ ] Sanitization removes sensitive fields (tokens, passwords)
- [ ] Batch mode generates all slices efficiently
- [ ] Documentation complete with usage examples

#### Technical Design

**CLI Tool Structure**:
```
scripts/slice-export/
├── index.ts                 # CLI entry point
├── slicers/
│   ├── incident-slicer.ts   # Single incident context
│   ├── participant-slicer.ts # Participant timeline
│   ├── worker-slicer.ts     # Worker history
│   ├── site-slicer.ts       # Site snapshot
│   ├── prompt-slicer.ts     # AI prompt samples
│   └── workflow-slicer.ts   # Workflow visualization data
├── generators/
│   ├── context-generator.ts # Generate .md context docs
│   ├── schema-generator.ts  # Generate .schema.json files
│   └── stats-calculator.ts  # Calculate data statistics
├── sanitizers/
│   └── field-sanitizer.ts   # Remove sensitive fields
└── utils/
    ├── relationship-resolver.ts  # Follow foreign keys
    ├── data-validator.ts         # Validate slice integrity
    └── output-writer.ts          # Write files with formatting
```

**Example CLI Usage**:
```bash
# Basic usage - single incident slice
bun run slice-export input.json --type incident --id j574abc123

# Generate all incident slices
bun run slice-export input.json --type incident --all

# Participant timeline
bun run slice-export input.json --type participant --id k177abc

# AI Prompt testing bundle
bun run slice-export input.json --type prompt --name generate_clarification_questions_before_event --samples 10

# Batch mode - generate all slice types
bun run slice-export input.json --batch-all --output-dir exports/

# Options
--sanitize           # Remove sensitive fields (tokens, session data)
--include-schema     # Generate schema.json files
--include-context    # Generate context.md files (default: true)
--format json|yaml   # Output format
--compress           # Gzip output files
```

**Context Document Template**:
```markdown
# Database Export Slice: [Type] [ID]

**Generated**: [Timestamp]
**Slice Type**: [Strategy Name]
**Source Export**: [Filename]

## Overview
[Human-readable summary of what this slice contains]

**Data Scope**:
- [Record counts by table]
- [Key relationships]

## Use Cases
This slice is optimized for:
- [Specific LLM analysis tasks]
- [Prompt engineering scenarios]
- [UI mocking or testing]

## Schema Overview
### Tables Included
[Table names with record counts and field summaries]

### Relationships
[ASCII diagram showing data relationships]

## Data Statistics
[Word counts, completion rates, timeline information]

## Prompt Engineering Opportunities
[Suggestions for analysis based on data patterns]

## Related Slices
[Cross-references to related data slices]

## File References
- **Data**: [data.json filename and size]
- **Schema**: [schema.json filename and size]
```

#### Open Questions

**Implementation Details**:
- Should the tool be TypeScript or a bash script wrapper?
- What's the performance target for batch mode (time to process 2.7MB export)?
- Should we support incremental updates or always full regeneration?
- How should we handle large exports (10MB+)?

**Output Organization**:
- Where should slices be written? `exports/` directory?
- Should we organize by slice type (e.g., `exports/incidents/`, `exports/participants/`)?
- Naming convention: `{type}-{id}-{timestamp}` or simpler?

**Sanitization Strategy**:
- What fields should be removed by default?
- Should sanitization be opt-in or opt-out?
- How do we handle fields that might be sensitive in some contexts but not others?

---

## Dependencies & Integration

### Prerequisites
- Story 0.6: Database Export & Analysis System (Complete ✅)
- Anthropic Agent SDK access
- Claude Pro subscription
- Node.js/Bun runtime environment

### Future Enhancements (Not in Scope)
- Story 10.3: LLM Analysis Workflows (dynamic tag generation, pattern analysis)
- Story 10.4: Automation & Integration (scheduled analysis, export → slice → analyze pipelines)

### Integration Points
- **Database Export** (Story 0.6): Provides input data
- **Claude Analysis Server** (Story 10.1): Consumes sliced data
- **Prompt Engineering Workflows**: Uses sliced data for testing
- **Reporting Systems**: Leverages generated insights

---

## Success Metrics

**Story 10.1: Agent SDK Server**
- Server setup time < 30 minutes
- Zero API costs (Claude Pro subscription only)
- MCP integration functional

**Story 10.2: Export Slicer CLI**
- Slice generation time < 30 seconds for 2.7MB export
- Context documents rated "helpful" by developers
- All 6 slice strategies implemented and tested

**Epic 10 Overall**
- Enables prompt engineering workflows
- Reduces analysis time by 50%+ vs manual data review
- Zero incremental costs for LLM analysis
- Foundation for dynamic insights features

---

## Technical Guides

Detailed implementation documentation will be created in:
- `docs/technical-guides/agent-sdk-server-setup.md` - Server installation and configuration
- `docs/technical-guides/export-slicer-cli-usage.md` - CLI tool reference and examples
- `docs/technical-guides/llm-analysis-workflows.md` - Analysis patterns and best practices

---

## Revision History

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-13 | 1.0 | Initial epic creation | Claude (SM Agent) |
