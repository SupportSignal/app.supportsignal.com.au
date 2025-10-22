# Database Export Analysis Prompts

## Original Request (Cleaned)

The file `db-export.json` is a database export from my database. It's probably a little bit too large for you to read in one context stream, so I would suggest you analyze it using a multi-pass approach:

### Pass 1: Schema Discovery
- Use command-line tools (grep, jq, etc.) to examine the structure
- Get a feel for what the top-level nodes are in the document
- Develop a schema file in markdown format
- Place the schema documentation in the same location as the JSON file for future reference

### Pass 2: Data Exploration
- Once I understand the schema, I'll tell you what I want to extract
- I'll probably want to get records from the incidents table first
- But I might ask for other tables once I see the schema

### Pass 3: Filtering & Extraction
- Based on a preliminary pass of the data, suggest filtering options for the records
- Ultimately, create a subset of the JSON file based on what's been extracted

## Implementation Notes

This approach allows for:
1. **Systematic analysis** without overwhelming context limits
2. **Documentation** of database structure for reference
3. **Targeted extraction** based on specific needs
4. **Filtered outputs** to reduce data volume while preserving relevant information
