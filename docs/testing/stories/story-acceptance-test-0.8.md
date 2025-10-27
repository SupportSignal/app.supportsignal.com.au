# UAT Checklist: Story 0.8 - Loading State Pattern Implementation

## Status
**Story Status**: ✅ Implementation Complete | 🔄 Awaiting UAT

## Pre-UAT Verification

### ✅ Automated Tests Status (Completed by Dev Agent)
- [x] `bun run typecheck` - ✅ **PASSES** (confirmed in implementation)
- [x] `bun run lint` - ⚠️ **Pre-existing warnings only** (112 errors, none introduced)
- [ ] `bun test` - 🔄 **Needs verification**
- [ ] `bun run build` - 🔄 **Needs verification**
- [ ] `bun run ci:status` - 🔄 **Awaiting CI completion**

### Test Coverage Analysis
**From Story Tasks**:
- ✅ Pattern documentation created (750+ lines)
- ✅ Codebase audit completed (4 AI operations identified)
- ✅ 2 HIGH PRIORITY Page-Level Loaders implemented:
  1. Fill Q&A button
  2. Step 2→3 transition
- ✅ Idempotency guard added for duplicate question generation bug
- ⚠️ **Manual testing deferred** - AC #17, #18 require live testing

---

## UAT Test Plan

### Test Group 1: Pattern Documentation Verification (AC: 1-4)

**UAT-1.1: Verify Pattern Document Exists**
- [ ] Navigate to `docs/patterns/loading-states.md`
- [ ] Verify file exists and is readable
- [ ] Confirm document is comprehensive (750+ lines)
- [ ] **Expected**: Complete pattern documentation available

**UAT-1.2: Verify Three-Tier Pattern Documentation**
- [ ] Open `docs/patterns/loading-states.md`
- [ ] Verify all three tiers documented:
  - **Inline Spinner** (< 2 seconds)
  - **Card-Level Loader** (2-5 seconds)
  - **Page-Level Loader** (> 5 seconds OR mutations)
- [ ] Confirm code examples provided for each tier
- [ ] **Expected**: Complete tier documentation with examples

**UAT-1.3: Verify Decision Criteria**
- [ ] Locate "Quick Decision Guide" section in pattern doc
- [ ] Verify decision criteria clearly stated
- [ ] Confirm "Any mutation → Page-Level Loader" rule documented
- [ ] **Expected**: Clear decision criteria for tier selection

**UAT-1.4: Verify Implementation Examples**
- [ ] Check pattern doc for implementation examples
- [ ] Verify state management patterns (try/finally)
- [ ] Confirm accessibility guidelines included
- [ ] **Expected**: Complete implementation examples with best practices

---

### Test Group 2: Codebase Audit Verification (AC: 5-8)

**UAT-2.1: Verify Audit Completion**
- [ ] Open `docs/stories/0.8.story.md`
- [ ] Locate "Codebase Audit Results" section
- [ ] Verify all async operations identified
- [ ] **Expected**: Complete audit with 4 AI operations documented

**UAT-2.2: Verify Operation Categorization**
- [ ] Check audit report for tier assignments
- [ ] Verify each operation has duration estimate
- [ ] Confirm tier justification provided
- [ ] **Expected**: All operations categorized by duration tier

**UAT-2.3: Verify Current vs Required State**
- [ ] Review audit tables in story document
- [ ] Verify "Current State" and "Required State" columns
- [ ] Confirm 2 HIGH PRIORITY operations identified
- [ ] **Expected**: Clear documentation of implementation needs

**UAT-2.4: Verify Priority Order**
- [ ] Check audit for priority classification
- [ ] Verify HIGH PRIORITY operations clearly marked
- [ ] Confirm MEDIUM/LOW priorities deferred
- [ ] **Expected**: Clear priority order established

---

### Test Group 3: Implementation Verification (AC: 9-12)

**UAT-3.1: Verify Fill Q&A Button Loader**
- [ ] Navigate to incident capture workflow
- [ ] Progress to Questions & Answers step (Step 2-5)
- [ ] Click "Fill Q&A" button
- [ ] **Expected**:
  - Page-Level Loader appears immediately
  - Message: "Generating answers for current phase..."
  - Duration estimate: "This may take up to 30 seconds"
  - Loader disappears when operation completes
  - UI blocked during operation

**UAT-3.2: Verify Step 2→3 Transition Loader**
- [ ] Navigate to incident capture workflow
- [ ] Enter events and narrative in Step 2
- [ ] Click "Complete Narrative" or navigate to Step 3
- [ ] **Expected**:
  - Page-Level Loader appears immediately
  - Message: "Preparing questions for next step..."
  - Duration estimate: "This may take a few moments"
  - Loader disappears when questions generated
  - UI blocked during operation

**UAT-3.3: Verify Visual Consistency**
- [ ] Compare Fill Q&A loader with Step 2→3 loader
- [ ] Verify both use same:
  - Spinner size (h-12 w-12, ~96px)
  - Spinner color (text-blue-500, #3b82f6)
  - Overlay opacity (bg-black/20)
  - Card styling (white background, shadow)
  - z-index (50)
- [ ] **Expected**: Visual consistency across all loaders

**UAT-3.4: Verify Idempotency Guard**
- [ ] Navigate to Step 2 (events/narrative)
- [ ] Complete narrative and trigger Step 2→3 transition
- [ ] Try to trigger multiple times (if possible)
- [ ] Check browser console for warning
- [ ] **Expected**:
  - Multiple clicks during loading ignored
  - Console warning: "⚠️ Question generation already in progress"
  - No duplicate questions generated (should see ~3, not 9)

**UAT-3.5: Test Loader Timeout/Failure Handling**
- [ ] Trigger Fill Q&A operation
- [ ] Wait for completion or timeout
- [ ] Verify loader disappears on success OR failure
- [ ] **Expected**: Loader ALWAYS disappears (try/finally ensures cleanup)

---

### Test Group 4: Accessibility Verification (AC: 12)

**UAT-4.1: Verify ARIA Attributes**
- [ ] Inspect Page-Level Loader HTML in browser DevTools
- [ ] Verify container has:
  - `role="status"`
  - `aria-live="polite"`
  - `aria-label="Generating answers, please wait"` (or similar)
- [ ] Verify spinner icon has `aria-hidden="true"`
- [ ] **Expected**: Complete ARIA attribute implementation

**UAT-4.2: Test with Screen Reader** (if available)
- [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
- [ ] Trigger Fill Q&A operation
- [ ] Listen for screen reader announcement
- [ ] **Expected**: Screen reader announces "Generating answers, please wait" or similar

---

### Test Group 5: Build & CI Validation (AC: 16)

**UAT-5.1: TypeScript Compilation** ✅ **VERIFIED**
- [x] Run: `bun run typecheck`
- [x] **Result**: ✅ **PASSES** (confirmed in implementation)

**UAT-5.2: Linting** ⚠️ **PRE-EXISTING ISSUES**
- [x] Run: `bun run lint`
- [x] **Result**: ⚠️ **112 pre-existing errors** (none introduced by Story 0.8)
- [ ] **Action**: Review pre-existing lint issues (separate from this story)

**UAT-5.3: Test Suite**
- [ ] Run: `bun test`
- [ ] Verify no NEW test failures from loading state implementation
- [ ] **Expected**: All tests pass OR only pre-existing failures

**UAT-5.4: Production Build**
- [ ] Run: `bun run build`
- [ ] Verify successful build completion
- [ ] Check for any warnings related to loading states
- [ ] **Expected**: Successful build with no new warnings

**UAT-5.5: CI Pipeline** 🔄 **IN PROGRESS**
- [ ] Check: `bun run ci:status`
- [ ] Verify CI pipeline status is SUCCESS
- [ ] Confirm all CI checks passed
- [ ] **Expected**: Green CI with no failures

---

### Test Group 6: User Experience Validation (AC: 17, 18)

**UAT-6.1: Verify No Silent Operations**
- [ ] Test all AI operations in incident workflow:
  1. Fill Q&A button (Steps 2-5)
  2. Step 2→3 transition (automatic question generation)
  3. Regenerate Questions button (if available)
  4. AI Diagnosis (POST-EVENT phase)
- [ ] Verify each operation shows Page-Level Loader
- [ ] **Expected**: ZERO operations with > 2s delay lacking visual feedback

**UAT-6.2: Verify User Feedback Clarity**
- [ ] For each loader, verify:
  - Clear message describing what's happening
  - Duration estimate provided
  - Spinner animation visible
  - UI clearly blocked (cannot interact)
- [ ] **Expected**: User always knows system is working

**UAT-6.3: Test Loading States Under Real Conditions**
- [ ] Test with slow network (DevTools throttling)
- [ ] Test with large narratives (long AI processing time)
- [ ] Test with multiple questions (stress test)
- [ ] **Expected**: Loaders remain visible for entire operation duration

---

## Known Issues & Limitations

### Implementation Scope
- ✅ **Implemented**: 2 HIGH PRIORITY Page-Level Loaders
- 🔄 **Deferred**: 2 MEDIUM priority operations (Regenerate Questions, AI Diagnosis)
  - Status: Already have loaders (implemented in previous stories)
  - Action: No changes needed
- 🔄 **Optional**: Reusable loader components
  - Status: Current inline implementation works perfectly
  - Action: Only create if explicitly requested

### Pre-Existing Issues
- ⚠️ **Lint warnings**: 112 pre-existing errors (not caused by Story 0.8)
- ⚠️ **Test failures**: Any pre-existing test failures unrelated to loading states

---

## Acceptance Criteria Mapping

| AC # | Criteria | Verification Method | Status |
|------|----------|---------------------|--------|
| AC-1 | Pattern document created | UAT-1.1 | ✅ |
| AC-2 | Three-tier pattern documented | UAT-1.2 | ✅ |
| AC-3 | Decision criteria documented | UAT-1.3 | ✅ |
| AC-4 | Implementation examples provided | UAT-1.4 | ✅ |
| AC-5 | Audit complete | UAT-2.1 | ✅ |
| AC-6 | Operations categorized | UAT-2.2 | ✅ |
| AC-7 | Current vs required documented | UAT-2.3 | ✅ |
| AC-8 | Priority order established | UAT-2.4 | ✅ |
| AC-9 | Loading states implemented | UAT-3.1, UAT-3.2 | 🔄 |
| AC-10 | Visual consistency achieved | UAT-3.3 | 🔄 |
| AC-11 | Testing completed | UAT-3.5, UAT-6.3 | 🔄 |
| AC-12 | User feedback clear | UAT-3.1, UAT-3.2, UAT-6.2 | 🔄 |
| AC-13 | Reusable components (if needed) | N/A (optional, skipped) | ⏭️ |
| AC-14 | Component docs (if created) | N/A (optional, skipped) | ⏭️ |
| AC-15 | Examples added (if created) | N/A (optional, skipped) | ⏭️ |
| AC-16 | TypeScript/lint/tests/build/CI pass | UAT-5.1-5.5 | 🔄 |
| AC-17 | Manual testing complete | UAT-6.1-6.3 | 🔄 |
| AC-18 | No operations > 2s lack feedback | UAT-6.1 | 🔄 |

**Legend**:
- ✅ Verified during implementation
- 🔄 Requires UAT verification
- ⏭️ Optional/Deferred

---

## Sign-Off

### Development Team
- [ ] **Developer**: Implementation complete, all dev tasks verified
- [ ] **Code Review**: Pattern implementation reviewed
- [ ] **Technical Lead**: Pattern approved for project use

### QA Team
- [ ] **QA Engineer**: All UAT tests executed and documented
- [ ] **Accessibility Tester**: ARIA attributes and screen reader tested
- [ ] **UAT Results**: All test groups passed or issues documented

### Product Owner
- [ ] **Acceptance**: Story meets all acceptance criteria
- [ ] **User Experience**: Loading states provide clear feedback
- [ ] **Production Ready**: Approved for deployment

---

## Notes & Observations

### Testing Environment
- **URL**: `https://app.supportsignal.com.au`
- **Test Date**: [To be filled during UAT]
- **Tester**: [To be filled during UAT]
- **Browser**: [To be filled during UAT]

### Issues Discovered During UAT
[Document any issues found during testing]

### Follow-up Actions Required
[Document any follow-up work needed]

---

## References

- **Story Document**: `docs/stories/0.8.story.md`
- **Pattern Documentation**: `docs/patterns/loading-states.md`
- **Implementation File**: `apps/web/components/incidents/incident-capture-workflow.tsx`
- **Epic**: Epic 0 (Technical Debt & Continuous Improvement) in `docs/prd/epic-0.md`
