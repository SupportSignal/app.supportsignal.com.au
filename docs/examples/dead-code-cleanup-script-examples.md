# Dead Code Cleanup Script Examples

**Category**: Maintenance Scripts & Commands
**Last Updated**: October 6, 2025
**Source**: Story 0.3 - Systematic Dead Code Cleanup

---

## Example 1: Comprehensive Function Usage Search

### Use Case
Before deleting a Convex function, verify it has zero usages across the entire codebase.

### Script

```bash
#!/bin/bash
# Search for function usage across all layers

FUNCTION_NAME="generateNarrative"

echo "🔍 Searching for: $FUNCTION_NAME"
echo "================================="

# Search in Convex backend
echo -e "\n📦 Convex Backend:"
grep -r "$FUNCTION_NAME" apps/convex \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="_generated" \
  -n | head -20

# Search in Web app
echo -e "\n🌐 Web App:"
grep -r "$FUNCTION_NAME" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=".next" \
  --exclude-dir="node_modules" \
  -n | head -20

# Search in generated API
echo -e "\n🤖 Generated API:"
grep -r "$FUNCTION_NAME" apps/convex/_generated/api.d.ts -n

# Count total occurrences
TOTAL=$(grep -r "$FUNCTION_NAME" apps/convex apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="_generated" \
  --exclude-dir=".next" \
  --exclude-dir="node_modules" \
  | wc -l)

echo -e "\n📊 Total occurrences: $TOTAL"

if [ "$TOTAL" -eq 0 ]; then
  echo "✅ Safe to delete!"
else
  echo "⚠️  Function still in use - investigate before deleting"
fi
```

### Example Output

```
🔍 Searching for: generateNarrative
=================================

📦 Convex Backend:
(no results)

🌐 Web App:
(no results)

🤖 Generated API:
(no results)

📊 Total occurrences: 0
✅ Safe to delete!
```

---

## Example 2: Route Usage Search (Multiple Patterns)

### Use Case
Routes can be referenced in multiple formats - search for all variations.

### Script

```bash
#!/bin/bash
# Search for route usage with multiple patterns

ROUTE_PATH="/api/redis-stats"

echo "🔍 Searching for route: $ROUTE_PATH"
echo "===================================="

# Pattern 1: Object-based routes { url: '/path' }
echo -e "\n📋 Object-based routes:"
grep -r "url.*['\"]$ROUTE_PATH['\"]" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  -n

# Pattern 2: fetch() calls
echo -e "\n🌐 Fetch calls:"
grep -r "fetch.*['\"]$ROUTE_PATH['\"]" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  -n

# Pattern 3: Template literals
echo -e "\n📝 Template literals:"
grep -r "\`.*$ROUTE_PATH.*\`" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  -n

# Pattern 4: String concatenation
echo -e "\n➕ String concatenation:"
grep -r "'$ROUTE_PATH'" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  -n

grep -r "\"$ROUTE_PATH\"" apps/web \
  --include="*.ts" \
  --include="*.tsx" \
  -n
```

---

## Example 3: Backup Before Deletion

### Use Case
Create timestamped backup directory and move files before deletion.

### Script

```bash
#!/bin/bash
# Backup files before deletion

STORY="0.3"
PHASE="phase5"
DESCRIPTION="typecheck-fix"
FILES_TO_DELETE=(
  "apps/convex/knowledge.ts"
  "apps/convex/knowledgeActions.ts"
  "apps/convex/knowledgeMutations.ts"
)

# Create backup directory
BACKUP_DIR=".archived-code/$(date +%Y-%m-%d)-story-$STORY-$PHASE-$DESCRIPTION"
mkdir -p "$BACKUP_DIR"

echo "📦 Backup directory: $BACKUP_DIR"
echo "================================"

# Copy files to backup
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Backing up: $file"
    cp "$file" "$BACKUP_DIR/"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo -e "\n✅ Backup complete!"
echo "Files backed up to: $BACKUP_DIR"

# Optionally delete files (uncomment to enable)
# for file in "${FILES_TO_DELETE[@]}"; do
#   if [ -f "$file" ]; then
#     echo "🗑️  Deleting: $file"
#     rm "$file"
#   fi
# done
```

### Example Output

```
📦 Backup directory: .archived-code/2025-10-06-story-0.3-phase5-typecheck-fix
================================
📄 Backing up: apps/convex/knowledge.ts
📄 Backing up: apps/convex/knowledgeActions.ts
📄 Backing up: apps/convex/knowledgeMutations.ts

✅ Backup complete!
Files backed up to: .archived-code/2025-10-06-story-0.3-phase5-typecheck-fix
```

---

## Example 4: Cross-Layer Validation Suite

### Use Case
After code removal, run comprehensive validation to catch broken dependencies.

### Script

```bash
#!/bin/bash
# Comprehensive validation suite for dead code cleanup

echo "🧪 Starting Cross-Layer Validation"
echo "=================================="

# Store results
RESULTS_FILE="/tmp/validation-results-$(date +%Y%m%d-%H%M%S).txt"

# Function to run validation step
run_validation() {
  local step_name=$1
  local command=$2

  echo -e "\n📋 Step: $step_name"
  echo "Command: $command"
  echo "-----------------------------------"

  if eval "$command"; then
    echo "✅ $step_name: PASSED"
    echo "$step_name: PASSED" >> "$RESULTS_FILE"
    return 0
  else
    echo "❌ $step_name: FAILED"
    echo "$step_name: FAILED" >> "$RESULTS_FILE"
    return 1
  fi
}

# Step 1: TypeScript Compilation
run_validation "TypeScript Compilation" "bun run typecheck"
TYPECHECK_RESULT=$?

# Step 2: ESLint Validation
run_validation "ESLint Validation" "bun run lint"
LINT_RESULT=$?

# Step 3: Unit Tests
run_validation "Unit Tests" "bun test"
TEST_RESULT=$?

# Step 4: Production Build
run_validation "Production Build" "bun run build"
BUILD_RESULT=$?

# Summary
echo -e "\n📊 Validation Summary"
echo "=================================="
cat "$RESULTS_FILE"

# Calculate success rate
TOTAL_STEPS=4
PASSED_STEPS=$((4 - TYPECHECK_RESULT - LINT_RESULT - TEST_RESULT - BUILD_RESULT))
SUCCESS_RATE=$((PASSED_STEPS * 100 / TOTAL_STEPS))

echo -e "\nSuccess Rate: $SUCCESS_RATE% ($PASSED_STEPS/$TOTAL_STEPS)"

if [ "$SUCCESS_RATE" -eq 100 ]; then
  echo "✅ All validations passed!"
  exit 0
else
  echo "❌ Some validations failed - review errors above"
  exit 1
fi
```

---

## Example 5: Test Failure Categorization

### Use Case
After removing code, categorize test failures to identify orphaned tests vs pre-existing issues.

### Script

```bash
#!/bin/bash
# Categorize test failures after code removal

TEST_OUTPUT="/tmp/test-output.txt"

# Run tests and capture output
echo "🧪 Running test suite..."
bun test 2>&1 | tee "$TEST_OUTPUT"

# Extract statistics
TOTAL_TESTS=$(grep "Ran.*tests" "$TEST_OUTPUT" | grep -oE '[0-9]+ tests' | grep -oE '[0-9]+')
PASSED=$(grep -oE '[0-9]+ pass' "$TEST_OUTPUT" | grep -oE '[0-9]+')
FAILED=$(grep -oE '[0-9]+ fail' "$TEST_OUTPUT" | grep -oE '[0-9]+')
ERRORS=$(grep -oE '[0-9]+ errors' "$TEST_OUTPUT" | grep -oE '[0-9]+')

echo -e "\n📊 Test Summary"
echo "================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Errors: $ERRORS"

# Categorize failures
echo -e "\n🔍 Failure Categorization"
echo "================================"

# Category 1: Module not found (potential orphaned tests)
echo -e "\n1️⃣ Module Not Found Errors:"
grep "Cannot find module" "$TEST_OUTPUT" | cut -d"'" -f2 | sort -u

# Category 2: Export not found (deleted functions)
echo -e "\n2️⃣ Export Not Found Errors:"
grep "Export.*not found" "$TEST_OUTPUT" | head -10

# Category 3: Jest mocking issues (pre-existing)
echo -e "\n3️⃣ Jest Mocking Issues:"
grep "jest.mock is not a function" "$TEST_OUTPUT" | wc -l | \
  xargs -I {} echo "{} test files with jest.mock errors"

# Category 4: Missing dependencies (pre-existing)
echo -e "\n4️⃣ Missing Dependencies:"
grep "Cannot find package" "$TEST_OUTPUT" | cut -d"'" -f2 | sort -u
```

### Example Output

```
📊 Test Summary
================================
Total Tests: 986
Passed: 573
Failed: 413
Errors: 133

🔍 Failure Categorization
================================

1️⃣ Module Not Found Errors:
@/lib/sessionResolver
@/types/impersonation
@convex/knowledge

2️⃣ Export Not Found Errors:
Export named 'checkUserLLMAccess' not found in module '/apps/convex/auth.ts'
Export named 'enhanceIncidentNarrative' not found in module '/apps/convex/aiEnhancement.ts'

3️⃣ Jest Mocking Issues:
7 test files with jest.mock errors

4️⃣ Missing Dependencies:
convex-test
convex/testing
```

---

## Example 6: Component Usage Search

### Use Case
Search for React component usage across multiple import patterns.

### Script

```bash
#!/bin/bash
# Search for component usage with various import patterns

COMPONENT_NAME="NarrativeDisplay"

echo "🔍 Searching for component: $COMPONENT_NAME"
echo "=========================================="

# Pattern 1: Named import
echo -e "\n📦 Named imports:"
grep -r "import.*{.*$COMPONENT_NAME.*}" apps/web \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  -n

# Pattern 2: Default import
echo -e "\n📦 Default imports:"
grep -r "import $COMPONENT_NAME from" apps/web \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  -n

# Pattern 3: JSX usage
echo -e "\n🏷️  JSX usage:"
grep -r "<$COMPONENT_NAME" apps/web \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  -n

# Pattern 4: Dynamic imports
echo -e "\n⚡ Dynamic imports:"
grep -r "import.*['\"].*$COMPONENT_NAME['\"]" apps/web \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  -n

# Count total usages
TOTAL=$(grep -r "$COMPONENT_NAME" apps/web \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir="node_modules" \
  | wc -l)

echo -e "\n📊 Total usages: $TOTAL"
```

---

## Usage Tips

### Running Scripts

```bash
# Make script executable
chmod +x script-name.sh

# Run script
./script-name.sh

# Run with output logging
./script-name.sh 2>&1 | tee script-output.log
```

### Customization

Replace placeholder values:
- `FUNCTION_NAME` → Your function name
- `ROUTE_PATH` → Your route path
- `COMPONENT_NAME` → Your component name
- `STORY` → Your story number
- `PHASE` → Your phase identifier

### Integration with Workflows

Add to package.json:
```json
{
  "scripts": {
    "cleanup:search": "bash scripts/search-function-usage.sh",
    "cleanup:validate": "bash scripts/validate-cleanup.sh",
    "cleanup:backup": "bash scripts/backup-before-delete.sh"
  }
}
```

---

## Reference

**Source Story**: 0.3 - Systematic Dead Code Cleanup
**Pattern Guide**: `docs/patterns/dead-code-cleanup-patterns.md`
**Lessons Learned**: `docs/lessons-learned/dead-code-cleanup-lessons.md`
