# Story 11.0: AI Prompt Admin UI Refactor - Acceptance Test Plan

**Story**: AI Prompt Admin UI Refactor
**Test Date**: TBD
**Tester**: Angela (AI Prompt Administrator)
**Environment**: Development
**Prerequisites**: Story 11.0 deployed to development environment with migration script executed

## Test Setup

### Required Test Data
- **Minimum**: 10 existing AI prompts across different workflow steps
- **Recommended**: 20+ prompts to test performance and visual organization
- **Test Groups**: Default groups should exist (Question Generation, Narrative Enhancement, Contributing Analysis, Ungrouped)

### Access Requirements
- Developer/Admin role access to AI Prompts admin page
- Ability to execute Convex migration script
- Access to browser DevTools (for responsive testing)

---

## Acceptance Criteria Tests

### AC1: Grouped UI with Collapsible Sections

**Test 1.1: View Grouped Prompts**
- [ ] Navigate to `/admin/ai-prompts`
- [ ] Verify prompts are organized into collapsible groups
- [ ] Verify groups appear in correct display order:
  - [ ] Question Generation (order: 1)
  - [ ] Narrative Enhancement (order: 2)
  - [ ] Contributing Analysis (order: 3)
  - [ ] Ungrouped (order: 999)
- [ ] Verify each group shows prompt count (e.g., "5 prompts")

**Test 1.2: Expand/Collapse Functionality**
- [ ] Click accordion trigger to expand a group
- [ ] Verify prompts display within expanded section
- [ ] Click accordion trigger again to collapse
- [ ] Verify prompts hide when collapsed
- [ ] Expand multiple groups simultaneously
- [ ] Verify all expanded groups remain visible

**Test 1.3: Empty Groups**
- [ ] Create new group with no prompts
- [ ] Verify message: "No prompts in this group"
- [ ] Verify empty state is visually clear

**Expected Result**: Prompts display in organized, collapsible groups sorted by display_order

---

### AC2: Create/Rename/Delete Groups

**Test 2.1: Create New Group**
- [ ] Click "Create Group" button
- [ ] Verify group creation dialog appears (Story 11.1 feature)
- [ ] Enter group name: "Test Group"
- [ ] Enter description: "Test Description"
- [ ] Set display_order: 50
- [ ] Click "Save"
- [ ] Verify new group appears in correct sort position
- [ ] Verify group appears with default settings (collapsible: true, default_collapsed: false)

**Status**: ⏳ **Deferred to Story 11.1** - Placeholder handler in place

**Test 2.2: Rename Group**
- [ ] Click "Edit" button on existing group
- [ ] Verify group edit dialog appears (Story 11.1 feature)
- [ ] Change name to "Renamed Group"
- [ ] Click "Save"
- [ ] Verify group displays new name
- [ ] Verify prompts remain in group after rename

**Status**: ⏳ **Deferred to Story 11.1** - Placeholder handler in place

**Test 2.3: Delete Empty Group**
- [ ] Create group with no prompts
- [ ] Click "Delete" button on empty group
- [ ] Verify deletion confirmation dialog (Story 11.1 feature)
- [ ] Confirm deletion
- [ ] Verify group is removed from list

**Status**: ⏳ **Deferred to Story 11.1** - Placeholder handler in place

**Test 2.4: Prevent Deleting Groups with Prompts**
- [ ] Attempt to delete group containing prompts
- [ ] Verify error message: "Cannot delete group with active prompts"
- [ ] Verify group is NOT deleted
- [ ] Verify prompts remain intact

**Status**: ⏳ **Deferred to Story 11.1** - Backend validation exists, UI confirmation needed

**Test 2.5: Group Name Validation**
- [ ] Attempt to create group with empty name
- [ ] Verify error: "Group name is required"
- [ ] Attempt to create group with whitespace-only name
- [ ] Verify error: "Group name is required"
- [ ] Attempt to create duplicate group name
- [ ] Verify error: "Group name already exists"

**Status**: ⏳ **Deferred to Story 11.1** - Backend validation exists, UI validation needed

**Expected Result**: Full group lifecycle management with validation preventing data loss

---

### AC3: Drag-Drop Reordering

**Test 3.1: Reorder Prompts Within Group**
- [ ] Open group with 3+ prompts
- [ ] Note initial prompt order (e.g., A, B, C)
- [ ] Drag prompt C above prompt A
- [ ] Verify order updates to: C, A, B
- [ ] Refresh page
- [ ] Verify new order persists

**Status**: ✅ **Backend Complete** - `reorderPrompts` mutation implemented
**Status**: ⏳ **UI Testing Deferred** - Full drag-drop testing in Story 11.1

**Test 3.2: Move Prompt Between Groups**
- [ ] Open two different groups
- [ ] Drag prompt from Group A
- [ ] Drop prompt into Group B
- [ ] Verify prompt appears in Group B
- [ ] Verify prompt removed from Group A
- [ ] Refresh page
- [ ] Verify change persists

**Status**: ✅ **Backend Complete** - `movePromptToGroup` mutation implemented
**Status**: ⏳ **UI Testing Deferred** - Full drag-drop testing in Story 11.1

**Test 3.3: Drag Handle Visibility**
- [ ] Hover over prompt card
- [ ] Verify drag handle (grip icon) is visible
- [ ] Verify cursor changes to "grab" on hover
- [ ] Verify cursor changes to "grabbing" while dragging

**Status**: ✅ **Complete** - UI implemented with GripVertical icon

**Test 3.4: Drag-Drop Error Handling**
- [ ] Simulate network error during reorder
- [ ] Verify error state displayed
- [ ] Verify prompts return to original positions
- [ ] Verify user can retry operation

**Status**: ✅ **Error Handling Implemented** - Catch block handles mutation errors

**Expected Result**: Smooth drag-drop reordering with persistence and error handling

---

### AC4: Model Selector Shows Cost Estimates

**Test 4.1: View Model Costs**
- [ ] Open any prompt for editing
- [ ] Locate model selector dropdown
- [ ] Verify each model option displays:
  - [ ] Model name (e.g., "GPT-5")
  - [ ] Cost per 1M tokens (e.g., "$15.00")
  - [ ] "Recommended" badge on preferred models

**Status**: ✅ **Complete** - Enhanced ModelSelector component

**Test 4.2: Cost Calculation Display**
- [ ] Select model: gpt-5
- [ ] Verify estimated cost displays: ~$0.015/prompt (assuming 1000 tokens average)
- [ ] Change model to gpt-4o-mini
- [ ] Verify cost updates to: ~$0.00015/prompt
- [ ] Verify cost tooltip explains: "Based on estimated token usage"

**Status**: ✅ **Complete** - Cost calculation in `lib/ai-models.ts`

**Test 4.3: Model Comparison**
- [ ] Compare costs across models:
  - [ ] gpt-5: $15.00 per 1M tokens
  - [ ] gpt-4o: $5.00 per 1M tokens
  - [ ] gpt-4o-mini: $0.15 per 1M tokens
  - [ ] claude-3.5-sonnet: $3.00 per 1M tokens
  - [ ] claude-3-haiku: $0.25 per 1M tokens
- [ ] Verify calculations are accurate
- [ ] Verify tooltips provide context

**Status**: ✅ **Complete** - All 5 models configured with correct pricing

**Expected Result**: Clear cost visibility helps administrators make informed model selections

---

### AC5: Template Library

**Test 5.1: Access Template Library**
- [ ] Click "Template Library" button on admin page
- [ ] Verify library displays 3 starter templates:
  - [ ] Predicate Template
  - [ ] Classification Template
  - [ ] Observation Template
- [ ] Verify each template shows:
  - [ ] Template name
  - [ ] Description
  - [ ] Use case examples
  - [ ] Template variables
  - [ ] Recommended model

**Status**: ✅ **Complete** - TemplateLibrary component created

**Test 5.2: Template Details**
- [ ] **Predicate Template**:
  - [ ] Prompt structure: "Answer with Yes/No based on {{context}}"
  - [ ] Variables: {{context}}
  - [ ] Use case: Binary decision making
  - [ ] Recommended: gpt-4o-mini

- [ ] **Classification Template**:
  - [ ] Prompt structure: "Classify {{input}} as one of: {{categories}}"
  - [ ] Variables: {{input}}, {{categories}}
  - [ ] Use case: Multi-class categorization
  - [ ] Recommended: claude-3-haiku

- [ ] **Observation Template**:
  - [ ] Prompt structure: "Provide brief insight about {{data}}"
  - [ ] Variables: {{data}}
  - [ ] Use case: Quick analysis and insights
  - [ ] Recommended: gpt-4o

**Status**: ✅ **Complete** - All template metadata defined

**Test 5.3: Use Template Action**
- [ ] Click "Use Template" button on any template
- [ ] Verify alert: "Create prompt from template: [Template Name]"
- [ ] Verify message: "This will be implemented in Story 11.1"

**Status**: ⏳ **Deferred to Story 11.1** - Placeholder handler in place

**Expected Result**: Template library provides starting points for new prompt creation

---

### AC6: DX Toolbar Components Extracted

**Test 6.1: PromptVariablePreview Component**
- [ ] Verify component exists at: `apps/web/components/developer/PromptVariablePreview.tsx`
- [ ] Verify displays template variables with syntax: {{variable_name}}
- [ ] Verify shows variable values with source indicators
- [ ] Verify supports single mode (one prompt)
- [ ] Verify supports batch mode (multiple prompts)
- [ ] Verify highlights missing variables in red/destructive color

**Status**: ✅ **Complete** - Foundation component created

**Test 6.2: PromptPerformanceMetrics Component**
- [ ] Verify component exists at: `apps/web/components/developer/PromptPerformanceMetrics.tsx`
- [ ] Verify displays:
  - [ ] Execution timing (ms)
  - [ ] Token usage (input/output/total)
  - [ ] Cost per execution
- [ ] Verify comparison mode for batch results
- [ ] Verify visual formatting (Badge components for metrics)

**Status**: ✅ **Complete** - Foundation component created

**Test 6.3: Component Reusability**
- [ ] Verify components use TypeScript interfaces
- [ ] Verify components accept props for customization
- [ ] Verify components are framework-agnostic (no direct Convex dependencies)
- [ ] Verify components can be used in Story 11.2 batch testing

**Status**: ✅ **Complete** - Designed for reusability

**Expected Result**: Reusable DX components ready for batch testing integration in Story 11.2

---

### AC7: Migration Script

**Test 7.1: Seed Default Groups**
- [ ] Execute migration: `bunx convex run migrations.assignPromptsToGroups.seedDefaultGroups`
- [ ] Verify 4 groups created:
  - [ ] "Question Generation" (display_order: 1)
  - [ ] "Narrative Enhancement" (display_order: 2)
  - [ ] "Contributing Analysis" (display_order: 3)
  - [ ] "Ungrouped" (display_order: 999)
- [ ] Verify all groups have:
  - [ ] is_collapsible: true
  - [ ] default_collapsed: false
- [ ] Verify groups have descriptions

**Status**: ✅ **Complete** - Migration script implemented

**Test 7.2: Migration Idempotency**
- [ ] Run migration script first time
- [ ] Verify result.created contains 4 group names
- [ ] Verify result.existing is empty
- [ ] Run migration script second time
- [ ] Verify result.created is empty
- [ ] Verify result.existing contains 4 group names
- [ ] Verify no duplicate groups created

**Status**: ✅ **Tested** - Unit tests confirm idempotency

**Test 7.3: Assign Prompts to Groups**
- [ ] Create test prompts with workflow_step values:
  - [ ] workflow_step: "generate_questions" → Group: "Question Generation"
  - [ ] workflow_step: "enhance_narrative" → Group: "Narrative Enhancement"
  - [ ] workflow_step: "analyze_contributing" → Group: "Contributing Analysis"
  - [ ] workflow_step: undefined → Group: "Ungrouped"
- [ ] Execute assignment logic (Note: Auto-assignment deferred to Story 11.2)
- [ ] Verify prompts appear in correct groups

**Status**: ⏳ **Deferred to Story 11.2** - Manual assignment possible, auto-assignment deferred

**Test 7.4: Migration Rollback**
- [ ] Document rollback procedure:
  - [ ] Backup prompt_groups table
  - [ ] Remove group_id from all ai_prompts
  - [ ] Delete all records from prompt_groups
  - [ ] Restore from backup if needed
- [ ] Test rollback on dev environment

**Status**: ✅ **Documented** - Rollback procedure in migration file comments

**Expected Result**: Safe, idempotent migration with clear rollback path

---

### AC8: Preserve Epic 6 Functionality

**Test 8.1: Existing Prompt Management**
- [ ] Navigate to AI Prompts admin page
- [ ] Verify all Epic 6 features still work:
  - [ ] View all prompts
  - [ ] Create new prompt (if implemented)
  - [ ] Edit existing prompt (if implemented)
  - [ ] Delete prompt (if implemented)
  - [ ] Toggle prompt active status (if implemented)
  - [ ] View prompt statistics (usage count, success rate)

**Status**: ✅ **Complete** - Admin page enhanced with tabs, existing features preserved

**Test 8.2: Prompt Template Seeder**
- [ ] Verify "System Templates" button exists
- [ ] Click button to access TemplateSeederInterface
- [ ] Verify can still seed default incident processing prompts
- [ ] Verify seeding functionality unchanged
- [ ] Navigate back to main groups view

**Status**: ✅ **Complete** - System Templates button preserved

**Test 8.3: Backward Compatibility**
- [ ] Verify prompts without group_id display in "Ungrouped"
- [ ] Verify prompts with group_id display in correct group
- [ ] Verify no existing functionality is broken
- [ ] Verify no data loss occurred

**Status**: ✅ **Complete** - Schema changes backward compatible (group_id optional)

**Expected Result**: Zero regression - all existing Epic 6 features continue to work

---

### AC9: Responsive Design

**Test 9.1: Tablet Viewport (768px-1024px)**
- [ ] Open DevTools, set viewport to 768px width
- [ ] Verify prompt groups display properly
- [ ] Verify accordion triggers are tappable
- [ ] Verify prompt cards are readable
- [ ] Verify buttons and actions are accessible
- [ ] Test at 800px, 900px, 1024px widths

**Status**: ✅ **Complete** - Components use responsive Tailwind classes

**Test 9.2: Desktop Viewport (1024px+)**
- [ ] Set viewport to 1280px width
- [ ] Verify TemplateLibrary uses 3-column grid (lg:grid-cols-3)
- [ ] Verify group layout optimizes for wider screens
- [ ] Verify all UI elements properly spaced
- [ ] Test at 1440px, 1920px widths

**Status**: ✅ **Complete** - Responsive grid implemented

**Test 9.3: Responsive Drag-Drop**
- [ ] Test drag-drop on tablet viewport
- [ ] Verify drag handles are touch-friendly (if touch supported)
- [ ] Verify drag preview displays correctly
- [ ] Verify drop zones are visually clear

**Status**: ⏳ **UI Testing Deferred** - Drag-drop uses pointer sensor (touch may need enhancement)

**Test 9.4: Mobile Viewport (<768px)**
- [ ] Set viewport to 375px width (iPhone SE)
- [ ] Verify groups stack vertically
- [ ] Verify accordion works on small screens
- [ ] Verify buttons don't overflow
- [ ] Note: Full mobile optimization may be Story 11.3 scope

**Status**: ✅ **Basic Responsive Complete** - Should work but may need optimization

**Expected Result**: Interface works well on tablet and desktop, acceptable on mobile

---

## Integration Tests (Deferred to Story 11.1)

### UI Workflow Tests
- [ ] End-to-end: Create group → Add prompts → Reorder → Delete group
- [ ] End-to-end: Use template → Customize → Save → Test
- [ ] End-to-end: Migration → Verify groups → Reorder prompts

### Performance Tests (Deferred to Story 11.3)
- [ ] Load 50+ prompts with groups in <1 second
- [ ] Drag-drop feels responsive (<100ms feedback)
- [ ] Accordion expand/collapse is smooth

---

## Summary

### Completed in Story 11.0 ✅
1. ✅ Grouped UI with collapsible sections (Accordion component)
2. ✅ Model selector with cost estimates (5 models configured)
3. ✅ Template library (3 starter templates)
4. ✅ DX toolbar components extracted (PromptVariablePreview, PromptPerformanceMetrics)
5. ✅ Migration script (idempotent seeding, 4 default groups)
6. ✅ Drag-drop backend (reorderPrompts, movePromptToGroup mutations)
7. ✅ Responsive design (Tailwind breakpoints)
8. ✅ Epic 6 functionality preserved (backward compatible)
9. ✅ 28 passing unit tests (validation logic, migration)

### Deferred to Story 11.1 🔄
- Group creation/editing/deletion UI (placeholder handlers in place)
- Prompt creation from templates UI
- Full drag-drop UI testing with real interactions
- Integration tests requiring UI testing framework

### Deferred to Story 11.2 🔄
- Batch testing integration
- Auto-assignment of prompts to groups based on workflow_step

### Deferred to Story 11.3 🔄
- Performance testing with 50+ prompts
- Mobile optimization (if needed beyond basic responsive design)

---

## Test Sign-Off

**Tester Name**: _______________
**Test Date**: _______________
**Test Result**: PASS / FAIL / PARTIAL
**Notes**: _______________

**Acceptance Decision**: ACCEPT / REJECT / ACCEPT WITH KNOWN ISSUES

**Known Issues for Story 11.1**:
1. Group CRUD operations have placeholder handlers - full implementation in Story 11.1
2. Template library "Use Template" has placeholder - full implementation in Story 11.1
3. Drag-drop UI testing deferred - full testing in Story 11.1
4. Some AC tests marked as "Deferred" - these are tracked for Story 11.1 completion
