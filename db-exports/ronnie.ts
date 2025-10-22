#!/usr/bin/env bun
/**
 * Ronnie - Database Export Query Tool
 *
 * A simple CLI tool for querying and extracting data from db-export.json
 *
 * Usage:
 *   bun ronnie.ts --table incidents --limit 10
 *   bun ronnie.ts --table incidents --filter "participant_name=Sarah Williams"
 *   bun ronnie.ts --table incidents --id "m97ekabjbwpddakh57k93x352n7qpj4z" --include-related
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for database structure
interface DatabaseExport {
  status: string;
  value: {
    data: {
      [tableName: string]: any[];
    };
  };
}

interface QueryOptions {
  table?: string;
  id?: string;
  filters: Record<string, string>;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  fields?: string[];
  includeRelated: boolean;
  output: string;
  pretty: boolean;
  listTables: boolean;
  describe?: string;
  stats?: string;
}

// Relationship mappings
const RELATIONSHIPS = {
  incidents: {
    participant_id: 'participants',
    company_id: 'companies',
    created_by: 'users',
    updated_by: 'users',
  },
  incident_narratives: {
    incident_id: 'incidents',
  },
  clarification_questions: {
    incident_id: 'incidents',
  },
  clarification_answers: {
    incident_id: 'incidents',
    answered_by: 'users',
  },
  participants: {
    company_id: 'companies',
    site_id: 'sites',
    created_by: 'users',
  },
  sites: {
    company_id: 'companies',
    created_by: 'users',
  },
  users: {
    company_id: 'companies',
  },
};

class Ronnie {
  private dbPath: string;
  private db: DatabaseExport | null = null;

  constructor(dbPath: string = './db-export.json') {
    this.dbPath = dbPath;
  }

  /**
   * Load database from file
   */
  loadDatabase(): void {
    if (!fs.existsSync(this.dbPath)) {
      console.error(`❌ Database file not found: ${this.dbPath}`);
      process.exit(1);
    }

    try {
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      this.db = JSON.parse(content);

      if (!this.db?.value?.data) {
        console.error('❌ Invalid database structure');
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Failed to load database: ${error}`);
      process.exit(1);
    }
  }

  /**
   * List all available tables
   */
  listTables(): void {
    if (!this.db) return;

    const tables = Object.keys(this.db.value.data);
    console.log('\n📋 Available Tables:\n');

    tables.forEach(table => {
      const count = this.db!.value.data[table].length;
      console.log(`  ${table.padEnd(30)} ${count.toString().padStart(6)} records`);
    });

    console.log(`\n  Total: ${tables.length} tables`);
  }

  /**
   * Describe table schema
   */
  describeTable(tableName: string): void {
    if (!this.db) return;

    const table = this.db.value.data[tableName];
    if (!table || table.length === 0) {
      console.error(`❌ Table '${tableName}' not found or empty`);
      return;
    }

    console.log(`\n📊 Schema for '${tableName}' (${table.length} records):\n`);

    const sample = table[0];
    const fields = Object.keys(sample);

    fields.forEach(field => {
      const value = sample[field];
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(`  ${field.padEnd(30)} ${type}`);
    });
  }

  /**
   * Show table statistics
   */
  showStats(tableName: string): void {
    if (!this.db) return;

    const table = this.db.value.data[tableName];
    if (!table) {
      console.error(`❌ Table '${tableName}' not found`);
      return;
    }

    console.log(`\n📈 Statistics for '${tableName}':\n`);
    console.log(`  Total records: ${table.length}`);

    if (table.length > 0) {
      const sample = table[0];
      const fields = Object.keys(sample);

      console.log(`  Fields: ${fields.length}`);
      console.log(`\n  Field distribution:`);

      // Count unique values for key fields
      fields.slice(0, 10).forEach(field => {
        const uniqueValues = new Set(table.map((r: any) => r[field])).size;
        console.log(`    ${field.padEnd(25)} ${uniqueValues} unique values`);
      });
    }
  }

  /**
   * Query table with filters
   */
  query(options: QueryOptions): any[] {
    if (!this.db) return [];

    const tableName = options.table!;
    let records = this.db.value.data[tableName];

    if (!records) {
      console.error(`❌ Table '${tableName}' not found`);
      return [];
    }

    // Filter by ID
    if (options.id) {
      records = records.filter((r: any) => r._id === options.id);
    }

    // Apply filters
    Object.entries(options.filters).forEach(([key, value]) => {
      records = records.filter((r: any) => {
        const fieldValue = String(r[key]).toLowerCase();
        const filterValue = value.toLowerCase();
        return fieldValue === filterValue || fieldValue.includes(filterValue);
      });
    });

    // Date range filtering
    if (options.dateFrom || options.dateTo) {
      records = records.filter((r: any) => {
        const dateField = r.event_date_time || r.created_at;
        if (!dateField) return true;

        const recordDate = typeof dateField === 'number'
          ? new Date(dateField)
          : new Date(dateField);

        if (options.dateFrom) {
          const fromDate = new Date(options.dateFrom);
          if (recordDate < fromDate) return false;
        }

        if (options.dateTo) {
          const toDate = new Date(options.dateTo);
          if (recordDate > toDate) return false;
        }

        return true;
      });
    }

    // Apply limit
    if (options.limit > 0) {
      records = records.slice(0, options.limit);
    }

    // Select specific fields
    if (options.fields && options.fields.length > 0) {
      records = records.map((r: any) => {
        const filtered: any = {};
        options.fields!.forEach(field => {
          if (field in r) {
            filtered[field] = r[field];
          }
        });
        return filtered;
      });
    }

    return records;
  }

  /**
   * Get related records for a given record
   */
  getRelatedRecords(tableName: string, record: any): any {
    if (!this.db) return {};

    const relationships = RELATIONSHIPS[tableName as keyof typeof RELATIONSHIPS];
    if (!relationships) return {};

    const related: any = {};

    Object.entries(relationships).forEach(([foreignKey, relatedTable]) => {
      const foreignId = record[foreignKey];
      if (!foreignId) return;

      const relatedRecords = this.db!.value.data[relatedTable];
      if (!relatedRecords) return;

      // Handle special cases
      if (relatedTable === 'incidents') {
        // For reverse relationships (e.g., incident_narratives -> incidents)
        related[relatedTable] = relatedRecords.find((r: any) => r._id === foreignId);
      } else if (foreignKey === 'incident_id') {
        // For one-to-many relationships from incident
        if (!related[relatedTable]) {
          related[relatedTable] = [];
        }
        related[relatedTable] = relatedRecords.filter((r: any) => r.incident_id === record._id);
      } else {
        // For direct foreign key relationships
        related[relatedTable] = relatedRecords.find((r: any) => r._id === foreignId);
      }
    });

    // Special handling for incidents - get all related data
    if (tableName === 'incidents') {
      related.narrative = this.db.value.data.incident_narratives?.find(
        (r: any) => r.incident_id === record._id
      );
      related.questions = this.db.value.data.clarification_questions?.filter(
        (r: any) => r.incident_id === record._id
      ) || [];
      related.answers = this.db.value.data.clarification_answers?.filter(
        (r: any) => r.incident_id === record._id
      ) || [];
    }

    return related;
  }

  /**
   * Execute query with options
   */
  execute(options: QueryOptions): void {
    this.loadDatabase();

    // Handle utility commands
    if (options.listTables) {
      this.listTables();
      return;
    }

    if (options.describe) {
      this.describeTable(options.describe);
      return;
    }

    if (options.stats) {
      this.showStats(options.stats);
      return;
    }

    // Validate table option
    if (!options.table) {
      console.error('❌ --table is required for queries');
      process.exit(1);
    }

    // Execute query
    let results = this.query(options);

    // Include related records if requested
    if (options.includeRelated && results.length > 0) {
      results = results.map(record => ({
        ...record,
        _related: this.getRelatedRecords(options.table!, record),
      }));
    }

    // Output results
    this.outputResults(results, options);
  }

  /**
   * Output results in specified format
   */
  outputResults(results: any[], options: QueryOptions): void {
    const outputFormat = options.output.toLowerCase();

    if (outputFormat === 'summary') {
      console.log(`\n✅ Found ${results.length} record(s)\n`);
      if (results.length > 0) {
        console.log('Sample record keys:', Object.keys(results[0]).join(', '));
      }
      return;
    }

    if (outputFormat === 'csv') {
      if (results.length === 0) {
        console.log('No results found');
        return;
      }

      const keys = Object.keys(results[0]);
      console.log(keys.join(','));
      results.forEach(record => {
        const values = keys.map(key => {
          const value = record[key];
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        });
        console.log(values.join(','));
      });
      return;
    }

    // JSON output (default)
    const output = options.pretty
      ? JSON.stringify(results, null, 2)
      : JSON.stringify(results);

    // Check if output is a filename
    if (outputFormat.endsWith('.json')) {
      fs.writeFileSync(outputFormat, output);
      console.log(`✅ Wrote ${results.length} record(s) to ${outputFormat}`);
    } else {
      console.log(output);
    }
  }
}

// Parse command line arguments
function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {
    filters: {},
    limit: 10,
    includeRelated: false,
    output: 'json',
    pretty: false,
    listTables: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--table':
        options.table = nextArg;
        i++;
        break;
      case '--id':
        options.id = nextArg;
        i++;
        break;
      case '--filter':
        const [key, value] = nextArg.split('=');
        options.filters[key] = value;
        i++;
        break;
      case '--date-from':
        options.dateFrom = nextArg;
        i++;
        break;
      case '--date-to':
        options.dateTo = nextArg;
        i++;
        break;
      case '--limit':
        options.limit = parseInt(nextArg, 10);
        i++;
        break;
      case '--fields':
        options.fields = nextArg.split(',');
        i++;
        break;
      case '--include-related':
        options.includeRelated = true;
        break;
      case '--output':
        options.output = nextArg;
        i++;
        break;
      case '--pretty':
        options.pretty = true;
        break;
      case '--list-tables':
        options.listTables = true;
        break;
      case '--describe':
        options.describe = nextArg;
        i++;
        break;
      case '--stats':
        options.stats = nextArg;
        i++;
        break;
      case '--help':
        showHelp();
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Unknown option: ${arg}`);
          console.error('Run with --help for usage information');
          process.exit(1);
        }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🔍 Ronnie - Database Export Query Tool

Usage:
  bun ronnie.ts [options]

Query Options:
  --table <name>              Table to query (required for queries)
  --id <id>                   Get specific record by _id
  --filter <key=value>        Filter by field (can be repeated)
  --date-from <date>          Start date (ISO format or YYYY-MM-DD)
  --date-to <date>            End date (ISO format or YYYY-MM-DD)
  --limit <n>                 Max records to return (default: 10)
  --fields <list>             Comma-separated field names to include

Relations:
  --include-related           Include related records (auto-join)

Output:
  --output <format|file>      json, csv, summary, or filename (default: json)
  --pretty                    Pretty-print JSON output

Utilities:
  --list-tables               Show all available tables
  --describe <table>          Show table schema
  --stats <table>             Show table statistics
  --help                      Show this help message

Examples:
  # List all tables
  bun ronnie.ts --list-tables

  # Describe a table
  bun ronnie.ts --describe incidents

  # Get 10 incidents
  bun ronnie.ts --table incidents --limit 10

  # Filter by participant
  bun ronnie.ts --table incidents --filter "participant_name=Sarah Williams"

  # Get incident with related data
  bun ronnie.ts --table incidents --id "m97ekabjbwpddakh57k93x352n7qpj4z" --include-related --pretty

  # Export to file
  bun ronnie.ts --table incidents --filter "capture_status=completed" --output results.json

  # Date range query
  bun ronnie.ts --table incidents --date-from "2025-01-01" --date-to "2025-12-31"
`);
}

// Main execution
const options = parseArgs();
const ronnie = new Ronnie(path.join(__dirname, 'db-export.json'));
ronnie.execute(options);
