# generate-user-uat

Generate a User Acceptance Testing (UAT) plan focused purely on user interactions and visual validation - no command line operations.

## Prerequisites

- Story must be in "Review" or "Done" status
- Developer has completed implementation
- All acceptance criteria are clearly defined in the story
- Application is running and accessible

## UAT Generation Process

1. **Read the Complete Story**
   - Review all acceptance criteria
   - Understand the user story (As a... I want... So that...)
   - Note any specific functionality implemented
   - Identify user-facing features and interfaces

2. **Analyze User-Facing Changes**
   - Focus ONLY on what users will interact with
   - Identify URLs, pages, and UI components affected
   - Note any forms, buttons, or interactive elements
   - Consider visual changes and responsive behavior

3. **Create User-Focused Test Cases**
   - Map each acceptance criteria to user actions
   - Define clear navigation steps (URLs to visit)
   - Specify user interactions (clicks, form inputs, etc.)
   - Describe expected visual results
   - Exclude all command-line operations

4. **Generate UAT Plan Using Template**
   - Use the uat-simple-tmpl.yaml template
   - Populate with story-specific information
   - Create test cases for each acceptance criteria
   - Include browser compatibility and responsive design checks

## UAT Plan Structure

The generated UAT plan should include:

### Test Overview

- Story number and title
- Testing environment (local development)
- Prerequisites for testing

### Setup Instructions

- Simple browser-based setup only
- Navigation to application URL
- Basic environment preparation

### UAT Test Cases

For each acceptance criteria:

```markdown
### ✅ **AC1: [Acceptance Criteria Title]**

**Acceptance Criteria:** [Description from story]

#### Test Steps:

1. **Navigate to:** http://localhost:3000/[specific-page]
2. **Action:** [Specific user action - click button, fill form, etc.]
3. **Verify:** [Expected visual result]

#### Expected Results:

- [ ] [Visual checkpoint 1]
- [ ] [Visual checkpoint 2]
- [ ] [Visual checkpoint 3]

#### Pass/Fail Criteria:

- ✅ **PASS**: [Clear success criteria based on user experience]
- ❌ **FAIL**: [Clear failure criteria based on user experience]
```

### Browser Compatibility Testing

- Chrome, Firefox, Safari
- Mobile browser testing

### Responsive Design Testing

- Desktop, tablet, mobile viewports
- Layout and readability checks

### Final Completion Checklist

- All acceptance criteria validated
- No console errors
- User experience is smooth
- Visual design is acceptable

## Key Principles

- **User-Centric**: Focus only on what users see and do
- **Visual Validation**: Emphasis on UI appearance and behavior
- **No Technical Operations**: Zero command-line instructions
- **Story-Specific**: Test only what was implemented in this story
- **Practical**: Easy for non-technical stakeholders to execute

## Output File

Generate the UAT plan as:
`docs/testing/uat-plan-{epic}.{story}.md`

## Template Variables

When using the template, populate:

- `epic_num`: Story epic number
- `story_num`: Story number
- `story_title_short`: Short story title
- `acceptance_criteria`: List from story
- `prerequisites`: Any setup requirements
- `url`: Specific URLs to test
- `user_action`: Specific user interactions
- `expected_result`: Visual results to verify

## Example UAT Test Case

```markdown
### ✅ **AC2: User Registration Form**

**Acceptance Criteria:** Users can register with email and password

#### Test Steps:

1. **Navigate to:** http://localhost:3000/register
2. **Action:** Fill registration form with valid email and password
3. **Action:** Click "Register" button
4. **Verify:** Success message appears and user is redirected to dashboard

#### Expected Results:

- [ ] Registration form is clearly visible
- [ ] Form accepts valid email and password
- [ ] Submit button is functional
- [ ] Success message displays after registration
- [ ] User is redirected to dashboard page

#### Pass/Fail Criteria:

- ✅ **PASS**: Registration completes successfully with proper feedback
- ❌ **FAIL**: Form doesn't work, errors occur, or user isn't redirected
```

## Completion

After generating the UAT plan:

1. Save the file to the correct location
2. Inform the user that UAT plan is ready
3. Provide the file path for easy access
4. Suggest next steps for UAT execution
