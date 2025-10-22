# Database Export Query Tools

This directory contains the database export and tools for querying it.

## Files

- **db-export.json** - Full database export (42,947 lines, 16 tables)
- **db-export-schema.md** - Complete database schema documentation
- **ronnie.ts** - Command-line query tool for extracting data
- **prompts.md** - Original analysis prompts and approach
- **sample-incident-sarah-williams.json** - Sample extracted incident with full relationships

**Note**: Export files are ignored by git (see .gitignore).

---

## Ronnie - Database Query Tool

Ronnie is a TypeScript CLI tool for querying and extracting data from the database export.

### Quick Start

```bash
# List all available tables
bun ronnie.ts --list-tables

# Get table schema
bun ronnie.ts --describe incidents

# Query 10 incidents
bun ronnie.ts --table incidents --limit 10

# Get specific incident with all related data
bun ronnie.ts --table incidents --id "m97ekabjbwpddakh57k93x352n7qpj4z" --include-related --pretty
```

---

## Command Reference

### Utility Commands

```bash
# List all tables with record counts
bun ronnie.ts --list-tables

# Show table schema
bun ronnie.ts --describe <table>

# Show table statistics
bun ronnie.ts --stats <table>

# Help
bun ronnie.ts --help
```

### Query Commands

**Basic Query:**
```bash
bun ronnie.ts --table <table-name> --limit <n>
```

**Filter by Field:**
```bash
# Single filter
bun ronnie.ts --table incidents --filter "participant_name=Sarah Williams"

# Multiple filters
bun ronnie.ts --table incidents \
  --filter "capture_status=completed" \
  --filter "participant_name=Sarah Williams"
```

**Get Specific Record:**
```bash
bun ronnie.ts --table incidents --id "m97ekabjbwpddakh57k93x352n7qpj4z"
```

**Date Range:**
```bash
bun ronnie.ts --table incidents \
  --date-from "2025-01-01" \
  --date-to "2025-12-31"
```

**Select Specific Fields:**
```bash
bun ronnie.ts --table incidents \
  --fields "_id,participant_name,event_date_time,location" \
  --limit 10
```

**Include Related Data:**
```bash
# Automatically joins related tables
bun ronnie.ts --table incidents \
  --id "m97ekabjbwpddakh57k93x352n7qpj4z" \
  --include-related \
  --pretty
```

### Output Options

**Console Output (default):**
```bash
# Compact JSON
bun ronnie.ts --table incidents --limit 5

# Pretty-printed JSON
bun ronnie.ts --table incidents --limit 5 --pretty

# CSV format
bun ronnie.ts --table incidents --limit 5 --output csv

# Summary only
bun ronnie.ts --table incidents --limit 100 --output summary
```

**File Output:**
```bash
# Save to file
bun ronnie.ts --table incidents \
  --filter "capture_status=completed" \
  --output results.json

# Pretty-printed file
bun ronnie.ts --table incidents \
  --filter "capture_status=completed" \
  --output results.json \
  --pretty
```

---

## Common Query Patterns

### Get Completed Incidents

```bash
bun ronnie.ts --table incidents \
  --filter "capture_status=completed" \
  --limit 20 \
  --pretty
```

### Get All Incidents for a Participant

```bash
bun ronnie.ts --table incidents \
  --filter "participant_name=Sarah Williams" \
  --include-related \
  --output sarah-williams-incidents.json
```

### Get Recent Incidents (2025)

```bash
bun ronnie.ts --table incidents \
  --date-from "2025-01-01" \
  --date-to "2025-12-31" \
  --output 2025-incidents.json
```

### Get Full Incident with All Related Data

```bash
bun ronnie.ts --table incidents \
  --id "m97ekabjbwpddakh57k93x352n7qpj4z" \
  --include-related \
  --pretty \
  --output full-incident-details.json
```

### Export All Participants

```bash
bun ronnie.ts --table participants \
  --limit 999 \
  --output all-participants.json
```

### Get Unanswered Questions

```bash
bun ronnie.ts --table clarification_answers \
  --filter "is_complete=false" \
  --output unanswered-questions.json
```

### Get Incident Summary Data

```bash
bun ronnie.ts --table incidents \
  --fields "_id,participant_name,event_date_time,location,capture_status" \
  --limit 100 \
  --output incident-summary.json
```

---

## Database Schema Quick Reference

### Main Tables

| Table | Records | Description |
|-------|---------|-------------|
| incidents | 80 | Core incident records |
| incident_narratives | 80 | Multi-phase narratives |
| clarification_questions | 1,683 | AI-generated questions |
| clarification_answers | 1,183 | Human-provided answers |
| participants | 9 | NDIS participants |
| companies | 35 | Organizations |
| sites | 36 | Physical locations |
| users | 39 | System users |

### Relationships

When using `--include-related`, Ronnie automatically fetches:

**For incidents:**
- `participant` - The participant involved
- `company` - The managing organization
- `users` - Creator and updater
- `narrative` - Full incident narrative
- `questions` - All clarification questions
- `answers` - All provided answers

**For participants:**
- `company` - Organization
- `site` - Location
- `users` - Creator

**For sites:**
- `company` - Organization
- `users` - Creator

---

## Available Filters

### Incidents Table

**Status Filters:**
- `capture_status`: "completed", "in_progress", "draft"
- `analysis_status`: "not_started", "in_progress", "completed"
- `overall_status`: "capture_pending", etc.

**Identity Filters:**
- `participant_name`: Full name (e.g., "Sarah Williams")
- `participant_id`: ID reference
- `company_id`: Organization ID
- `reporter_name`: Reporter's name
- `created_by`: User ID

**Feature Flags:**
- `narrative_enhanced`: true/false
- `questions_generated`: true/false
- `analysis_generated`: true/false

**Location & Time:**
- `location`: Physical location text
- `event_date_time`: Event timestamp
- `created_at`: Record creation timestamp

### Other Tables

See `db-export-schema.md` for complete field listings for all tables.

---

## Examples with Real Data

### Example 1: Get Sarah Williams' Completed Incidents

```bash
bun ronnie.ts --table incidents \
  --filter "participant_name=Sarah Williams" \
  --filter "capture_status=completed" \
  --include-related \
  --pretty \
  --output sarah-williams-completed.json
```

**Result:** All completed incidents for Sarah Williams with participant details, narratives, Q&A, and company information.

### Example 2: Get Incident Statistics

```bash
# First, see the overall stats
bun ronnie.ts --stats incidents

# Then get a summary of all incidents
bun ronnie.ts --table incidents \
  --fields "_id,participant_name,capture_status,event_date_time" \
  --limit 999 \
  --output incident-statistics.json
```

### Example 3: Get All Clarification Q&A for an Incident

```bash
# Get the questions
bun ronnie.ts --table clarification_questions \
  --filter "incident_id=m97ekabjbwpddakh57k93x352n7qpj4z" \
  --pretty

# Get the answers
bun ronnie.ts --table clarification_answers \
  --filter "incident_id=m97ekabjbwpddakh57k93x352n7qpj4z" \
  --pretty
```

### Example 4: Export All Data for a Specific Company

```bash
# Get company ID first
bun ronnie.ts --table companies --limit 1

# Then export all related data
bun ronnie.ts --table incidents \
  --filter "company_id=kd7d55ekvja3322na7trhs6g257p3s2e" \
  --include-related \
  --output company-incidents.json
```

---

## Tips & Best Practices

1. **Start with utilities**: Use `--list-tables` and `--describe` to explore the data structure

2. **Use `--pretty` for exploration**: Makes JSON output readable when testing queries

3. **Use `--output summary` for quick checks**: Shows record count without outputting all data

4. **Combine filters**: Multiple `--filter` options work together (AND logic)

5. **Save complex queries**: Use `--output filename.json` to save results for later analysis

6. **Include related data judiciously**: `--include-related` can produce large outputs for incidents

7. **Use field selection for large datasets**: `--fields` reduces output size when you only need specific fields

8. **Date filtering is flexible**: Accepts both ISO format and YYYY-MM-DD format

---

## Troubleshooting

**Table not found:**
```bash
# List all tables to see available options
bun ronnie.ts --list-tables
```

**No results returned:**
```bash
# Check if table has data
bun ronnie.ts --stats <table>

# Try without filters first
bun ronnie.ts --table <table> --limit 5
```

**Filter not working:**
```bash
# Make sure field name is correct
bun ronnie.ts --describe <table>

# Check for exact value match or partial match
# Ronnie does case-insensitive partial matching
```

**Related data not showing:**
```bash
# Make sure you're using --include-related flag
# Some tables may not have relationships defined
```

---

## Future Enhancements

Potential additions to Ronnie:

- [ ] Sort by field (`--sort-by`)
- [ ] Aggregate functions (count, sum, avg)
- [ ] Complex filters (OR logic, ranges, regex)
- [ ] Export to Excel/XLSX format
- [ ] Interactive mode for exploration
- [ ] Query builder interface
- [ ] Custom relationship definitions
- [ ] Query history and favorites

---

## Technical Details

**Built with:**
- TypeScript
- Bun runtime
- Native JSON parsing
- File system operations

**Relationship handling:**
- Predefined relationship mappings in code
- Automatic foreign key resolution
- Special handling for one-to-many relationships
- Reverse relationship support (e.g., narratives → incidents)

**Filter logic:**
- Case-insensitive partial matching
- Multiple filters use AND logic
- Date comparisons support both timestamps and ISO strings
- Field selection happens after filtering

---

## Original Analysis Tools

Use these exports with:
- Story 10.2: Export Slicer CLI tool (future)
- Story 10.1: Claude Analysis Server (future)
- External analysis tools (Claude Code, etc.)

