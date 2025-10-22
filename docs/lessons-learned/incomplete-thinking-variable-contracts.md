# Incomplete Thinking: Variable Contract Changes

**Created**: 2025-10-22
**Category**: Lessons Learned / Development Methodology
**Related Stories**: Story 6.4 (Phase-Specific Narrative Enhancement)
**Severity**: High - Led to production bugs and incomplete implementation

---

## Problem Context

**Discovery**: When changing variable contracts (inputs/outputs of a system), developer failed to trace changes through entire architecture, resulting in:

1. Missing template variables in developer testing interface
2. Broken prompt interpolation preview
3. Incomplete system integration
4. User frustration with half-finished feature

---

## The Issue

**What Happened:**

During Story 6.4, changed AI prompt variable contract from:
- **Old**: Generic variables (`{{originalNarrative}}`, `{{investigationQA}}`)
- **New**: Phase-specific variables (`{{beforeEvent}}`, `{{beforeEventQA}}`, `{{duringEvent}}`, `{{duringEventQA}}`, etc.)

**What Was Updated:** ✅
- Templates in `promptManager.ts` - Added 4 phase-specific prompts
- Controllers in `aiOperations.ts` - Dynamic prompt selection by phase

**What Was Missed:** ❌
- Views → Developer Prompt Testing Panel - Missing 4 new Q&A variables
- Views → Variable visualization - Showed "Missing: {{postEventQA}}"
- Testing workflow - Couldn't test prompts properly

---

## Root Cause: Incomplete Thinking

**The Pattern:**

```
Variable Contract Change Made
    ↓
✅ Templates Updated (promptManager.ts)
    ↓
✅ Controllers Updated (aiOperations.ts)
    ↓
❌ Views Partially Updated (forgot variable additions)
    ↓
❌ Testing Infrastructure Not Updated
    ↓
Result: System works but developer tooling broken
```

**Why It Happened:**

> "You didn't think fully when you're making changes. You don't see that this is a unified system. The variables go through controllers that go through views which need to be updated in alignment."
>
> — User feedback during Story 6.4

**Developer mindset:**
- ❌ Isolated fix thinking: "I updated the prompt template, done!"
- ❌ Local reasoning: "The AI operation works, ship it"
- ❌ Component-level thinking: "Fixed the backend, next task"

**Professional mindset:**
- ✅ **Systematic thinking**: "What are ALL the places this variable is used?"
- ✅ **End-to-end reasoning**: "How does this flow through the entire system?"
- ✅ **Architecture-level thinking**: "Templates → Controllers → Views → Testing - update all layers"

---

## Correct Mental Model

**When changing variable contracts, trace through:**

### 1. **Templates** (Data Definition)
- Where are variables defined?
- What are the new variable names?
- What values do they expect?

### 2. **Controllers** (Data Processing)
- Where are variables populated?
- What business logic uses these variables?
- Are variable mappings updated?

### 3. **Views** (Data Display)
- Where are variables rendered?
- What UI shows variable values?
- Are validation/preview tools updated?

### 4. **Testing** (Data Verification)
- How are variables tested?
- What developer tools need these variables?
- Are test data fixtures updated?

---

## Story 6.4 Example

**Variable Contract Change:**

```diff
// OLD CONTRACT
- originalNarrative: string
- investigationQA: string
- narrative_phase: "before_event" | "during_event" | "end_event" | "post_event"

// NEW CONTRACT
+ beforeEvent: string
+ beforeEventQA: string
+ duringEvent: string
+ duringEventQA: string
+ endEvent: string
+ endEventQA: string
+ postEvent: string
+ postEventQA: string
```

**What Should Have Been Updated:**

| Layer | File | Status | Impact |
|-------|------|--------|--------|
| **Templates** | `promptManager.ts` | ✅ Updated | 4 new prompts created |
| **Templates** | `default_prompts.ts` | ✅ Updated | Default prompts seeded |
| **Controllers** | `aiOperations.ts` | ✅ Updated | Dynamic prompt selection |
| **Views** | `enhanced-review-step-new.tsx` | ⚠️ Partial | Auto-trigger works |
| **Views** | `prompt-testing-panel.tsx` | ❌ Missing | **4 Q&A variables not added** |
| **Testing** | Developer workflow | ❌ Broken | **Can't test new prompts** |

**Fix Applied:**

```typescript
// apps/web/components/developer/prompt-testing-panel.tsx
// Lines 187-191 & 223-227

// ✅ ADDED: Phase-specific Q&A variables
beforeEventQA: 'Q: Sample before event clarification question?\nA: Sample answer...',
duringEventQA: 'Q: Sample during event clarification question?\nA: Sample answer...',
endEventQA: 'Q: Sample end event clarification question?\nA: Sample answer...',
postEventQA: 'Q: Sample post event clarification question?\nA: Sample answer...',
```

---

## Prevention Strategy

### Before Making Variable Contract Changes

**1. Map All Consumers** (5 minutes thinking > 30 minutes debugging)

```markdown
# Variable Contract Change Checklist

Variable changing: `{{oldVar}}` → `{{newVar1}}`, `{{newVar2}}`

**Template Layer:**
- [ ] promptManager.ts - Prompt definitions
- [ ] default_prompts.ts - Default values
- [ ] Seeding scripts - Database initialization

**Controller Layer:**
- [ ] AI operations - Variable population logic
- [ ] API endpoints - Variable extraction
- [ ] Business logic - Variable transformations

**View Layer:**
- [ ] User-facing UI - Variable display
- [ ] Developer tools - Variable testing/preview
- [ ] Admin interfaces - Variable configuration

**Testing Layer:**
- [ ] Unit tests - Mock data with new variables
- [ ] Integration tests - End-to-end variable flow
- [ ] Developer workflows - Testing infrastructure
```

### During Implementation

**2. Think in Layers, Not Files**

```
❌ Bad: "I'm updating aiOperations.ts"
✅ Good: "I'm updating the controller layer - what views depend on this?"

❌ Bad: "Prompt template changed, next task"
✅ Good: "Prompt template changed - which testing tools render these variables?"

❌ Bad: "Fix works locally, commit it"
✅ Good: "Fix works - did I update developer experience tools too?"
```

### After Implementation

**3. Validate End-to-End**

- [ ] **Template**: Variables defined with correct names/types
- [ ] **Controller**: Variables populated with real data
- [ ] **View**: Variables rendered in ALL UIs (user-facing AND developer tools)
- [ ] **Testing**: Variables testable in developer workflows

---

## Real-World Impact

**User Experience:**

```
Developer loads Developer Prompt Testing Panel
→ Sees "Missing: {{postEventQA}}"
→ Cannot test new phase-specific prompts
→ Cannot verify prompt improvements
→ Loses confidence in feature completeness
```

**Developer Credibility:**

> "Well this goes back to the problem. I mentioned earlier if you're going to change the input providers for a prompt then the underlying prompt probably has a mistake...It's like you only did half the job?"
>
> — User feedback

**Time Impact:**
- **Incomplete thinking**: 10 minutes implementing + 20 minutes fixing later
- **Systematic thinking**: 15 minutes upfront + 0 minutes fixing
- **Net savings**: 15 minutes + preserved user trust

---

## Pattern Recognition

**Red Flags That Indicate Incomplete Thinking:**

1. ✅ "Backend works" but ❌ "Developer tools broken"
2. ✅ "Tests pass" but ❌ "Manual testing shows issues"
3. ✅ "Feature complete" but ❌ "UI still shows old variables"
4. ✅ "Code compiles" but ❌ "TypeScript has type mismatches"

**Green Flags Of Systematic Thinking:**

1. ✅ "Updated templates, controllers, views, and testing tools"
2. ✅ "Verified end-to-end flow from database to UI"
3. ✅ "All layers use new variable contract consistently"
4. ✅ "Developer experience tools updated alongside production code"

---

## Systematic Thinking Template

**Use this checklist for ANY contract changes:**

```markdown
## Variable Contract Change: [Description]

**Old Contract:**
- [List old variables]

**New Contract:**
- [List new variables]

**Impact Analysis:**

### Templates (Data Definition)
- [ ] File: _______________ - Status: _______________
- [ ] File: _______________ - Status: _______________

### Controllers (Data Processing)
- [ ] File: _______________ - Status: _______________
- [ ] File: _______________ - Status: _______________

### Views (Data Display)
- [ ] User UI: _______________ - Status: _______________
- [ ] Developer Tools: _______________ - Status: _______________
- [ ] Admin Interfaces: _______________ - Status: _______________

### Testing (Data Verification)
- [ ] Unit Tests: _______________ - Status: _______________
- [ ] Integration Tests: _______________ - Status: _______________
- [ ] Developer Workflows: _______________ - Status: _______________

**End-to-End Verification:**
- [ ] Data flows correctly from templates through all layers
- [ ] All UIs display new variables without errors
- [ ] Developer tools can test new variable contract
- [ ] No "Missing: {{variable}}" errors anywhere
```

---

## Related Documentation

- [Permission Predicate Pattern](../patterns/permission-predicate-pattern.md) - Another lesson from Story 6.4
- [BMAD Methodology](../methodology/bmad-method.md) - After phase emphasizes completeness
- [Testing Infrastructure](../testing/technical/test-strategy-and-standards.md) - Validation practices

---

## Key Takeaways

1. **Variable contracts are system-wide** - Not isolated to one file or layer
2. **Think in architecture, not files** - Templates → Controllers → Views → Testing
3. **Developer tools are first-class citizens** - Update them alongside production code
4. **Incomplete thinking breaks trust** - Users notice half-finished features
5. **15 minutes upfront > 20 minutes fixing later** - Systematic thinking saves time

---

## Action Items for Future Development

**Before starting ANY task involving variable changes:**

1. ☑️ Map all consumers of the variable (use grep/search)
2. ☑️ Create checklist of files to update (templates, controllers, views, testing)
3. ☑️ Update all layers systematically (not just the "main" file)
4. ☑️ Verify end-to-end with developer tools (not just user-facing UI)
5. ☑️ Ask: "What did I forget?" (check testing, admin UIs, developer panels)

**When receiving code review feedback:**

- ❌ Defensive: "But the backend works!"
- ✅ Learning: "You're right, I only updated half the system. Let me trace through the full architecture."

---

## Professional Growth

**This lesson teaches the difference between:**

- **Junior thinking**: "My code works"
- **Professional thinking**: "My code works AND all dependent systems are updated AND developer experience is maintained"

**Remember:** The system is more than just the code you touched - it's all the places that code flows through.
