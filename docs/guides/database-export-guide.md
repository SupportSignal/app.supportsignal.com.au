# Database Export Guide

## Overview

The Database Export System provides full database snapshots in JSON format for external analysis using Claude Code and other AI-powered tools. This guide covers export workflows, security considerations, and analysis examples.

## Access Requirements

- **Role**: System Administrator only
- **Authentication**: Active session required
- **Location**: `/admin/developer-tools/export`

## Export Specification

### Included Data

The export includes all tables except debug logs:

**Multi-tenant & User Management**:
- `companies` - Organization records
- `users` - User accounts (password field excluded)
- `user_invitations` - Pending invitations
- `sites` - Physical locations

**Authentication & Sessions**:
- `sessions` - Active user sessions
- `accounts` - OAuth provider accounts
- `password_reset_tokens` - Password reset requests
- `impersonation_sessions` - Admin impersonation records

**Incident Management**:
- `participants` - NDIS participants
- `incidents` - Core incident records
- `incident_narratives` - Multi-phase narratives
- `clarification_questions` - AI-generated questions
- `clarification_answers` - User responses
- `incident_analysis` - Team lead analysis
- `incident_classifications` - Categorization data

**AI & Workflows**:
- `ai_prompts` - Prompt templates
- `ai_request_logs` - AI API usage logs
- `workflow_handoffs` - Workflow transitions

### Excluded Data

- `debug_logs` - System debug logs (excluded for performance)
- `users.password` - Password hashes (excluded for security)

### Export Format

```json
{
  "metadata": {
    "exportedAt": "2025-10-10T14:30:00.000Z",
    "exportType": "full",
    "version": "1.0",
    "recordCounts": {
      "companies": 10,
      "users": 30,
      "incidents": 500,
      // ... counts for each table
    },
    "totalRecords": 2500,
    "exportedBy": "j9abc123..."
  },
  "data": {
    "companies": [ /* array of company records */ ],
    "users": [ /* array of user records (no passwords) */ ],
    // ... all other tables
  }
}
```

## Export Workflow

### Step 1: Navigate to Export Tool

1. Log in as system administrator
2. Navigate to `/admin`
3. Click "Admin Tools"
4. Click "Database Export"

### Step 2: Review Export Details

Before exporting, review:
- List of included tables
- Security notices
- Export format information

### Step 3: Export Database

1. Click "Export Full Database" button
2. Wait for export to complete (may take 10-30 seconds for large datasets)
3. File downloads automatically with timestamp in filename
4. Example filename: `supportsignal-db-export-2025-10-10T14-30-00.json`

### Step 4: Verify Export

1. Check file size (typical: 500KB - 5MB depending on data volume)
2. Open in text editor to verify JSON structure
3. Confirm metadata section shows expected record counts

## Claude Code Analysis Workflows

### Basic Analysis Workflow

1. Export database using steps above
2. Save JSON file to your project directory
3. Open Claude Code terminal
4. Reference exported file in analysis prompts

### Example Analysis Prompts

**Pattern Discovery**:
```
Analyze incident patterns in supportsignal-db-export-2025-10-10.json:
- What are the most common incident types?
- Which participants have the highest incident frequency?
- What time patterns emerge from event timestamps?
```

**Data Quality Analysis**:
```
Review data quality in the exported database:
- Which incidents have incomplete narratives?
- How many clarification questions go unanswered?
- What percentage of incidents complete the full workflow?
```

**Relationship Mapping**:
```
Map relationships in the database export:
- Show company → sites → participants → incidents hierarchy
- Identify orphaned records (no parent relationships)
- Find circular or unusual relationship patterns
```

**AI Performance Analysis**:
```
Analyze AI request logs from the export:
- What's the average AI response time by operation type?
- Which operations have the highest success rate?
- How many tokens are consumed per incident workflow?
```

### Advanced Workflows

**Prompt Engineering**:
1. Export full database
2. Extract narrative samples from incidents
3. Test prompt variations with Claude Code
4. Measure quality improvements

**Test Data Generation**:
1. Export database from development environment
2. Use Claude Code to generate synthetic test data
3. Maintain realistic data distributions
4. Preserve referential integrity

**Migration Planning**:
1. Export current schema
2. Analyze data patterns with Claude Code
3. Design schema migrations
4. Generate migration scripts

## Security Considerations

### Data Handling

- **Sensitive Data**: Exports contain business-critical information
- **Access Control**: System admin only - never share exports with unauthorized users
- **Storage**: Store exports securely, delete when no longer needed
- **Transmission**: Do not email exports or upload to public repositories

### What's Protected

✅ **Excluded from export**:
- Password hashes (security)
- Debug logs (contains system internals)

⚠️ **Included in export** (handle carefully):
- Session tokens (can be used for authentication)
- OAuth tokens (can access external services)
- User personal information (names, emails, DOB)
- Participant care notes (sensitive health data)
- Incident details (potentially sensitive events)

### Best Practices

1. **Immediate Use**: Export → Analyze → Delete (don't keep old exports)
2. **Local Only**: Keep exports on local machine, never cloud storage
3. **Encryption**: Consider encrypting exports at rest
4. **Audit Trail**: System logs all export operations with admin ID and timestamp
5. **Access Review**: Regularly review who has system admin access

## Performance Considerations

### Expected Performance

- **Small datasets** (<100 incidents): 2-5 seconds
- **Medium datasets** (100-500 incidents): 5-15 seconds
- **Large datasets** (500+ incidents): 15-30 seconds

### Optimization

The export function uses:
- Parallel queries (`Promise.all`) for all tables
- Streaming JSON serialization
- Browser-native download API (no server intermediary)

### Troubleshooting

**Export takes longer than 30 seconds**:
- Check browser console for errors
- Verify network connectivity
- Consider exporting outside peak usage hours

**Browser crashes or freezes**:
- Dataset may be too large for browser memory
- Contact development team for CLI export tool
- Consider segmented exports (future enhancement)

**Download doesn't start**:
- Check browser pop-up blocker settings
- Verify sufficient disk space
- Try different browser (Chrome/Firefox recommended)

## Future Enhancements

### Planned Features

- **Segmented Exports**: Filter by company, site, date range, or entity type
- **Scheduled Exports**: Automated daily/weekly exports
- **Export History**: Track previous exports and download again
- **Anonymization**: Option to mask sensitive data for sharing
- **CLI Tool**: Command-line export for large datasets
- **Compression**: Gzip compression for large exports

### Current Limitations

- No segmentation (full export only)
- No scheduling (manual export only)
- No export history (download immediately)
- No anonymization (full data export)
- Browser-only (no CLI option)

## Support

### Getting Help

- **Documentation Issues**: Report in project documentation
- **Export Errors**: Check browser console and contact system admin
- **Feature Requests**: Submit via project management system

### Common Issues

**"Unauthorized Access" error**:
- Verify you're logged in as system admin
- Check user role in profile settings
- Contact system admin to verify permissions

**Export file empty or invalid**:
- Check metadata section for error messages
- Verify browser console for JavaScript errors
- Retry export after clearing browser cache

**Analysis workflow questions**:
- Reference Claude Code documentation
- Review example prompts in this guide
- Experiment with different analysis approaches

---

**Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team
