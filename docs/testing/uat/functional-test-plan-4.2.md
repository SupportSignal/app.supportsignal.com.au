# UAT Plan 4.2: Knowledge Ingestion Service

**Story**: 4.2 - Implement the Knowledge Ingestion Service  
**Epic**: 4 - AI-Powered Chat Interface  
**Date Created**: 2025-01-26  
**Last Updated**: 2025-01-26  
**Status**: Ready for Testing

## Implementation Notes
- **Cloudflare Vectorize Integration**: Vector storage and similarity search capabilities implemented
- **Document Seeding**: Automated processing of 300+ project files (docs, apps, packages)
- **OpenAI Embeddings**: Text-embedding-3-small model for cost-effective embedding generation
- **Jest Testing Suite**: Comprehensive unit, integration, and performance tests implemented
- **Environment Configuration**: Production-ready configuration with API key management

## Quick Testing Guide

### Prerequisites
1. Start Convex dev server: `bunx convex dev` (in separate terminal)
2. Ensure you're in project root directory

### Individual Test Cases
All test cases can now be run with simple commands:

```bash
# Basic functionality
./scripts/test-uat-4.2.sh tc1.1    # Document processing
./scripts/test-uat-4.2.sh tc1.2    # Input validation  
./scripts/test-uat-4.2.sh tc1.3    # Deduplication

# Content processing
./scripts/test-uat-4.2.sh tc2.1    # Different content types
./scripts/test-uat-4.2.sh tc2.2    # Large documents

# Embedding & vector storage
./scripts/test-uat-4.2.sh tc3.1    # Text chunking
./scripts/test-uat-4.2.sh tc3.2    # Embedding generation
./scripts/test-uat-4.2.sh tc4.2    # Vector storage

# Seeding script
./scripts/test-uat-4.2.sh tc5.1    # Script availability
./scripts/test-uat-4.2.sh tc5.2    # File filtering

# Vector search
./scripts/test-uat-4.2.sh tc6.1    # Similarity search with content
./scripts/test-uat-4.2.sh tc6.2    # Similarity search without content
```

### Run All Tests
```bash
./scripts/test-uat-4.2.sh all
```

### Custom Document Testing
Add any file to knowledge base:
```bash
./scripts/add-knowledge.sh path/to/your/file.md
```

---

## Acceptance Criteria Validation

### AC1: A Convex action `knowledge:addDocument` is created

**Test Cases:**

#### TC1.1: Document Processing Action Exists
**Objective**: Verify the knowledge:addDocument action is accessible
**Steps**:
1. Start Convex dev server: `bunx convex dev`
2. Check Convex dashboard for `knowledgeActions.addDocument` function
3. Test direct action call:
   ```bash
   ./scripts/test-uat-4.2.sh tc1.1
   ```

**Expected Results**:
- Action appears in Convex dashboard function list
- Direct action call succeeds and returns: `{"documentId": "...", "chunksCreated": N, "status": "completed"}`
- Document stored in `source_documents` table
- Text chunks stored in `document_chunks` table

#### TC1.2: Input Validation
**Objective**: Verify proper validation of document input
**Steps**:
1. Run all validation tests:
   ```bash
   ./scripts/test-uat-4.2.sh tc1.2
   ```

**Expected Results**:
- Empty content throws ConvexError: "Content cannot be empty"
- Empty source throws ConvexError: "Source cannot be empty"
- Valid input processes successfully

#### TC1.3: Document Deduplication
**Objective**: Verify duplicate content handling
**Steps**:
1. Run deduplication test:
   ```bash
   ./scripts/test-uat-4.2.sh tc1.3
   ```

**Expected Results**:
- First call: `"status": "completed"` with chunks created
- Second call: `"status": "already_exists"` with existing document ID
- No duplicate chunks created in database

---

### AC2: This action takes text content as input

**Test Cases:**

#### TC2.1: Text Content Processing
**Objective**: Verify various text content types are accepted
**Steps**:
1. Test all content types:
   ```bash
   ./scripts/test-uat-4.2.sh tc2.1
   ```

**Expected Results**:
- All content types processed successfully
- Content stored without modification
- Appropriate file_type metadata preserved

#### TC2.2: Large Document Handling
**Objective**: Verify handling of large documents
**Steps**:
1. Test large document processing:
   ```bash
   ./scripts/test-uat-4.2.sh tc2.2
   ```

**Expected Results**:
- Large documents processed without errors
- Multiple chunks created (chunksCreated > 1)
- Processing completes within reasonable time (<30 seconds)

---

### AC3: It uses a library to generate vector embeddings for chunks of the document text

**Test Cases:**

#### TC3.1: Text Chunking Verification
**Objective**: Verify text is properly chunked before embedding
**Steps**:
1. Test text chunking:
   ```bash
   ./scripts/test-uat-4.2.sh tc3.1
   ```
2. Check Convex data browser for `document_chunks` table
3. Verify multiple chunks created
4. Check chunk content overlap

**Expected Results**:
- Multiple chunks created for longer text
- Each chunk has `chunk_index` starting from 0
- Chunks have appropriate overlap for context preservation
- Each chunk has `chunk_size` metadata

#### TC3.2: Embedding Generation (with OpenAI API key)
**Objective**: Verify embeddings are generated when API key is available
**Prerequisites**: Set `OPENAI_API_KEY` in environment
**Steps**:
1. Ensure OpenAI API key is configured in Convex environment
2. Test embedding generation:
   ```bash
   ./scripts/test-uat-4.2.sh tc3.2
   ```
3. Check Convex logs for embedding generation messages
4. Check if vectors were inserted into Vectorize (if configured)

**Expected Results**:
- Console logs show: "Generating embeddings for N chunks..."
- Console logs show: "Successfully generated embeddings for all chunks"
- If Vectorize configured: "Inserting N vectors into Vectorize..."

#### TC3.3: Embedding Generation Fallback (without OpenAI API key)
**Objective**: Verify graceful handling when OpenAI API key is missing
**Prerequisites**: Remove or invalidate `OPENAI_API_KEY`
**Steps**:
1. Ensure OpenAI API key is not set or invalid
2. Test embedding fallback:
   ```bash
   ./scripts/test-uat-4.2.sh tc3.3
   ```
3. Check processing still completes
4. Check warning messages in logs

**Expected Results**:
- Document processing completes successfully
- Console warning: "OpenAI API key not configured - skipping embedding generation"
- Status still shows "completed"
- Chunks created with placeholder embeddings

---

### AC4: The text chunks and their embeddings are successfully stored in our Cloudflare Vectorize DB

**Test Cases:**

#### TC4.1: Vectorize Configuration Test
**Objective**: Verify Vectorize client configuration
**Prerequisites**: Set Vectorize environment variables
**Steps**:
1. Ensure Vectorize environment variables are set:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN` 
   - `VECTORIZE_DATABASE_ID`
2. Process document with embeddings enabled
3. Check console logs for Vectorize operations

**Expected Results**:
- Console logs show: "Inserting N vectors into Vectorize..."
- Console logs show: "Successfully inserted vectors: mutation [ID], count: N"
- No Vectorize configuration warnings

#### TC4.2: Vector Storage Verification
**Objective**: Verify vectors are stored in Vectorize database
**Prerequisites**: Valid Vectorize configuration and OpenAI API key
**Steps**:
1. Use Cloudflare API to check vector count before processing
2. Test vector storage:
   ```bash
   ./scripts/test-uat-4.2.sh tc4.2
   ```
3. Check console logs for successful insertion
4. Use Cloudflare API to verify vector count increased

**Expected Results**:
- Vector count in Vectorize database increases
- Each chunk gets unique vectorize_id
- Metadata stored includes source document and chunk information

#### TC4.3: Vectorize Fallback Handling
**Objective**: Verify handling when Vectorize is not configured
**Prerequisites**: Remove Vectorize environment variables
**Steps**:
1. Ensure Vectorize configuration is incomplete
2. Process document
3. Check that processing still completes

**Expected Results**:
- Console warning: "Vectorize client not available"
- Document processing completes successfully
- Chunks stored in Convex with placeholder vectorize_id

---

### AC5: The seeding script is configured to process all key project documents in `/docs` and key source code files in `apps/` and `packages/`

**Test Cases:**

#### TC5.1: Seeding Script Availability
**Objective**: Verify seeding script exists and is executable
**Steps**:
1. Test seeding script availability:
   ```bash
   ./scripts/test-uat-4.2.sh tc5.1
   ```

**Expected Results**:
- Script file exists and is executable
- Dry run shows ~300 files found
- Files include documents from docs/, apps/, and packages/
- Breakdown shows: Documentation: ~130, Applications: ~130, Packages: ~40

#### TC5.2: File Type Filtering
**Objective**: Verify correct file types are included/excluded
**Steps**:
1. Test file type filtering:
   ```bash
   ./scripts/test-uat-4.2.sh tc5.2
   ```

**Expected Results**:
- Includes: .md, .ts, .tsx, .js, .jsx files
- Excludes: node_modules, .next, .turbo, build, dist directories
- Excludes: package-lock.json, .DS_Store, binary files
- File size filtering excludes files >1MB

#### TC5.3: Seeding Script Execution (Test Mode)
**Objective**: Test actual document processing with small subset
**Prerequisites**: Valid Convex environment
**Steps**:
1. Create test subset of files
2. Run seeding on small test set
3. Monitor processing progress
4. Check Convex database for results

**Expected Results**:
- Script processes files without errors
- Progress tracking shows file-by-file processing
- Documents stored in `source_documents` table
- Chunks created in `document_chunks` table
- Success rate reported at completion

---

### AC6-9: OpenRouter LLM Integration, Environment Configuration, User Access Control, Model Selection

**Note**: These acceptance criteria were completed in previous development iterations. Tests for these can be found in existing UAT plans and the working system.

---

## Vector Similarity Search Testing

### TC6.1: Vector Query Functionality
**Objective**: Test similarity search capabilities
**Prerequisites**: Documents processed with embeddings and Vectorize configured
**Steps**:
1. Process test documents with known content
2. Test similarity search:
   ```bash
   ./scripts/test-uat-4.2.sh tc6.1
   ```
3. Verify relevant results returned

**Expected Results**:
- Query returns matches with similarity scores
- Results include chunk content and metadata
- Higher scores for more relevant content
- Query statistics include processing time

### TC6.2: Similarity Search Without Content
**Objective**: Test similarity search metadata-only mode
**Steps**:
1. Test similarity search without content:
   ```bash
   ./scripts/test-uat-4.2.sh tc6.2
   ```

**Expected Results**:
- Query returns matches with scores
- Chunk content is null (not fetched)
- Faster processing due to reduced data transfer

---

## Manual Testing Scenarios

### Scenario 1: Complete Knowledge Ingestion Workflow
**Objective**: Test end-to-end document processing
**Steps**:
1. Start development environment with all services
2. Run document seeding script on subset of files
3. Monitor processing in Convex dashboard
4. Test vector similarity search
5. Verify data consistency across all tables

**Expected Results**:
- Seamless processing from document to searchable chunks
- Consistent data across source_documents and document_chunks
- Effective similarity search results
- No data corruption or missing entries

### Scenario 2: Error Handling and Resilience
**Objective**: Test system resilience under various failure conditions
**Steps**:
1. Test with invalid API keys
2. Test with network interruptions
3. Test with malformed documents
4. Test with extremely large documents
5. Test concurrent processing

**Expected Results**:
- Graceful degradation when services unavailable
- Clear error messages for configuration issues
- Robust handling of edge cases
- No system crashes or data corruption

### Scenario 3: Performance and Scalability
**Objective**: Assess system performance under load
**Steps**:
1. Process large number of documents (50+)
2. Monitor memory usage and processing time
3. Test concurrent similarity searches
4. Monitor database performance
5. Check for memory leaks or resource exhaustion

**Expected Results**:
- Reasonable processing time per document (<10 seconds)
- Memory usage remains stable
- Concurrent operations don't block system
- Database queries remain performant

---

## Environment Setup Instructions

### Development Environment Setup
1. **Install Dependencies**:
   ```bash
   bun install
   cd apps/convex && bun install
   ```

2. **Start Services**:
   ```bash
   # Terminal 1: Convex backend
   bunx convex dev
   
   # Terminal 2: Next.js frontend
   bun dev
   ```

3. **Configure Environment Variables** (in `apps/convex/.env.local`):
   ```bash
   # Required for embedding generation
   OPENAI_API_KEY=sk-...
   
   # Required for LLM responses (already configured)
   OPENROUTER_API_KEY=sk-or-...
   
   # Optional: Vectorize configuration
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   VECTORIZE_DATABASE_ID=your-database-id
   ```

### Vectorize Database Setup (Optional)
1. Create Vectorize database in Cloudflare dashboard
2. Set dimensions to 1536 (for OpenAI embeddings)
3. Choose cosine similarity metric
4. Configure API token with Vectorize permissions

---

## Acceptance Sign-off

### Pre-UAT Checklist
- [ ] All unit tests passing (Jest test suite)
- [ ] Linting checks passed (`bun run lint`)
- [ ] Type checking passed (`bun run typecheck`)
- [ ] Development environment functional
- [ ] Convex backend operational
- [ ] Environment variables configured

### UAT Execution Checklist
**Core Functionality**:
- [ ] AC1: knowledge:addDocument action verified
- [ ] AC2: Text content processing verified
- [ ] AC3: Vector embedding generation verified
- [ ] AC4: Vectorize DB storage verified
- [ ] AC5: Document seeding script verified

**Advanced Features**:
- [ ] Vector similarity search functionality
- [ ] Error handling and edge cases
- [ ] Performance under normal load
- [ ] Configuration flexibility

**Integration Testing**:
- [ ] End-to-end workflow completed
- [ ] Error recovery scenarios tested
- [ ] Performance benchmarking completed
- [ ] Data consistency verified

### Sign-off Criteria
**Story is ready for production when:**
- All test cases pass without critical issues
- Performance meets acceptability criteria (<10s per document)
- Error handling is robust and provides clear feedback
- Documentation is complete and accessible
- Configuration is flexible and well-documented
- Data integrity is maintained across all operations

### Known Limitations
- **Vectorize Configuration Optional**: System works without Vectorize but with reduced search capabilities
- **OpenAI API Dependency**: Embedding generation requires valid OpenAI API key
- **Large Document Processing**: Very large documents (>1MB) are filtered out by seeding script
- **Development Environment**: Full testing requires multiple environment variables configured

### Success Metrics
- **Document Processing**: Successfully process 300+ project files
- **Chunk Generation**: Average 2-5 chunks per document
- **Embedding Success**: 95%+ embedding generation success rate (when API key available)
- **Search Relevance**: Similarity search returns contextually relevant results
- **Performance**: <10 seconds processing time per average document

---

**UAT Completion Date**: ___________  
**Tested By**: ___________  
**Approved By**: ___________  
**Notes**: ___________