# User Acceptance Tests (UAT) - Story 1.6: Automated CI/CD Pipeline

## Test Environment Setup

**Prerequisites:**

- GitHub repository with main branch access
- Cloudflare Pages project configured
- GitHub Secrets properly configured:
  - `CLOUDFLARE_API_TOKEN`: API token with Pages:Edit permission
  - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - `CLOUDFLARE_PROJECT_NAME`: Name of your Cloudflare Pages project
- Clean Git working directory
- GitHub Actions enabled for the repository

**Workflow Notes:**

- Testing will be done primarily on `main` branch (single developer workflow)
- Optional: Create feature branches later if you want to test PR behavior
- All tests can be performed with direct commits to main

## UAT Test Cases

### UAT-1.6.1: GitHub Actions Workflow Triggers

**Acceptance Criteria:** Workflow triggers automatically on push to main branch

**Test Steps (Single Developer - Main Branch Workflow):**

1. Make a minor change to README.md (e.g., add a line "Testing CI/CD pipeline")
2. Commit and push directly to main: `git add . && git commit -m "Test workflow trigger" && git push origin main`
3. Navigate to GitHub repository → Actions tab
4. Verify GitHub Actions workflow starts automatically
5. Check that all jobs execute in the correct order:
   - `lint` and `test` jobs run in parallel
   - `test-e2e` runs in parallel with lint/test
   - `build` job waits for lint and test to complete
   - `deploy` job waits for build and test-e2e to complete
6. Verify deploy job executes (since this is main branch)
7. Check that deployment completes successfully

**Optional PR Testing (if you want to test branch behavior later):**

- Create a test branch, push changes, create PR
- Verify workflow runs but deploy job is skipped for non-main branches

**Expected Result:** ✅ Workflow triggers on main branch push and completes full pipeline including deployment

---

### UAT-1.6.2: Linting Job Validation

**Acceptance Criteria:** Pipeline includes proper linting checks that catch code quality issues

**Test Steps (Single Developer - Main Branch):**

1. Introduce a linting error in `apps/web/app/page.tsx`:
   ```typescript
   // Add unused variable at the top of the file
   const unusedVariable = 'test';
   ```
2. Commit and push to main: `git add . && git commit -m "Test lint failure" && git push origin main`
3. Navigate to GitHub Actions and verify lint job fails
4. Check job logs for ESLint error details (should show unused variable warning)
5. Fix the linting error by removing the unused variable
6. Commit and push fix: `git add . && git commit -m "Fix lint error" && git push origin main`
7. Verify lint job now passes in the new workflow run
8. Verify build and deploy jobs execute successfully after lint passes

**Note:** This tests failure → fix → success cycle on main branch

**Expected Result:** ✅ Lint job catches errors, provides clear feedback, and blocks pipeline progression

---

### UAT-1.6.3: Testing Job Validation

**Acceptance Criteria:** Pipeline executes unit tests and type checking correctly

**Test Steps:**

1. Create a new branch: `git checkout -b test/unit-tests`
2. Verify current test command behavior:
   - Run `bun run test` locally
   - Check if tests exist or if command gracefully handles missing tests
3. Introduce a TypeScript error in `apps/web/lib/config.ts`:
   ```typescript
   // Add type error
   export const invalidType: string = 123;
   ```
4. Commit and push: `git add . && git commit -m "Test type checking" && git push -u origin test/unit-tests`
5. Create PR and verify test job fails due to type error
6. Check job logs for TypeScript error details
7. Fix the type error
8. Commit and push fix: `git add . && git commit -m "Fix type error" && git push`
9. Verify test job passes

**Expected Result:** ✅ Test job validates TypeScript compilation and executes available tests

---

### UAT-1.6.4: E2E Testing Job Validation

**Acceptance Criteria:** Pipeline handles E2E tests gracefully whether they exist or not

**Test Steps:**

1. Create a new branch: `git checkout -b test/e2e-validation`
2. Verify E2E test detection logic:
   - Check if `tests/` directory exists
   - Verify conditional execution in workflow
3. Create a minimal E2E test directory and file:
   ```bash
   mkdir -p tests
   echo 'console.log("Mock E2E test");' > tests/example.spec.js
   ```
4. Commit and push: `git add . && git commit -m "Add mock E2E test" && git push -u origin test/e2e-validation`
5. Create PR and verify E2E job:
   - Installs Playwright browsers
   - Attempts to run E2E tests
   - Check behavior with mock test file
6. Remove the test directory: `rm -rf tests`
7. Commit and push: `git add . && git commit -m "Remove mock E2E test" && git push`
8. Verify E2E job skips gracefully with "No E2E tests found" message

**Expected Result:** ✅ E2E job handles both scenarios correctly without blocking pipeline

---

### UAT-1.6.5: Build Job Validation

**Acceptance Criteria:** Pipeline builds applications correctly and generates proper artifacts

**Test Steps:**

1. Create a new branch: `git checkout -b test/build-validation`
2. Verify build job dependencies:
   - Check that build job waits for lint and test jobs
   - Verify it does not run if lint or test fails
3. Monitor build job execution:
   - Verify `bun run build` executes successfully
   - Verify `bun run build:pages` generates Cloudflare-compatible output
   - Check build artifacts are uploaded to GitHub Actions
4. Introduce a build error by adding invalid import:
   ```typescript
   // In apps/web/app/page.tsx
   import { NonExistentComponent } from './non-existent-file';
   ```
5. Commit and push: `git add . && git commit -m "Test build failure" && git push -u origin test/build-validation`
6. Verify build job fails and deployment is blocked
7. Fix the build error and verify build succeeds
8. Check build artifacts are properly generated in `.vercel/output/static`

**Expected Result:** ✅ Build job creates proper artifacts and fails appropriately on build errors

---

### UAT-1.6.6: Deployment Job Validation

**Acceptance Criteria:** Deployment occurs only on successful main branch pushes

**Test Steps:**

1. Ensure all previous tests are cleaned up and main branch is stable
2. Create a successful change on a feature branch
3. Create PR and verify:
   - All CI jobs pass
   - Deploy job is skipped (not main branch)
4. Merge PR to main branch
5. Monitor main branch pipeline execution:
   - Verify all jobs execute and pass
   - Verify deploy job downloads build artifacts
   - Verify Cloudflare Pages deployment executes
   - Check deployment logs for success confirmation
6. Access the deployed application via Cloudflare Pages URL
7. Verify the deployed application functions correctly:
   - Homepage loads
   - Authentication flows work
   - Protected routes function

**Expected Result:** ✅ Application deploys only on main branch and functions correctly

---

### UAT-1.6.7: Pipeline Failure Scenarios

**Acceptance Criteria:** Pipeline blocks deployment when any job fails

**Test Steps:**

1. Create a branch with multiple types of failures: `git checkout -b test/failure-scenarios`
2. **Scenario A - Lint Failure Blocks Build:**
   - Introduce lint error
   - Verify build job does not execute
   - Verify deployment is blocked
3. **Scenario B - Test Failure Blocks Build:**
   - Fix lint error, introduce type error
   - Verify build job does not execute
   - Verify deployment is blocked
4. **Scenario C - Build Failure Blocks Deployment:**
   - Fix type error, introduce build error
   - Verify build job fails
   - Verify deployment job does not execute
5. **Scenario D - Deployment Failure Handling:**
   - Create invalid Cloudflare configuration (if possible in test environment)
   - Verify deployment job fails gracefully
   - Verify error reporting is clear

**Expected Result:** ✅ Pipeline fails fast and provides clear error feedback at each stage

---

### UAT-1.6.8: Branch-Specific Behavior

**Acceptance Criteria:** Pipeline behaves differently for different branch types

**Test Steps:**

1. **Feature Branch Testing:**
   - Create feature branch: `git checkout -b feature/test-branch-behavior`
   - Make clean changes and push
   - Verify CI jobs run but deployment is skipped
   - Check job logs confirm "deployment skipped - not main branch"
2. **Main Branch Testing:**
   - Merge feature branch to main
   - Verify all jobs run including deployment
   - Confirm deployment job executes successfully
3. **Direct Push to Main:**
   - Make a direct commit to main (if allowed by branch protection)
   - Verify full pipeline including deployment executes
4. **Production Environment Protection:**
   - Verify deployment job requires "production" environment
   - Check that environment protection rules apply (if configured)

**Expected Result:** ✅ Pipeline respects branch-specific rules and environment protection

---

### UAT-1.6.9: Environment Variables and Security

**Acceptance Criteria:** Pipeline handles environment variables and secrets securely

**Test Steps:**

1. **Environment Variable Validation:**
   - Verify `HUSKY=0` is set in CI environment
   - Verify `NODE_ENV=production` is set correctly
   - Check build logs confirm environment variables are applied
2. **Secrets Management:**
   - Verify Cloudflare secrets are properly masked in logs
   - Check that sensitive information is not exposed
   - Confirm secrets are only available in deployment job
3. **Security Best Practices:**
   - Verify dependencies are installed with `--frozen-lockfile`
   - Check that build artifacts are cleaned up after deployment
   - Confirm no sensitive data in uploaded artifacts

**Expected Result:** ✅ Environment variables are properly configured and secrets are secure

---

### UAT-1.6.10: Performance and Reliability

**Acceptance Criteria:** Pipeline executes efficiently and reliably

**Test Steps:**

1. **Pipeline Performance:**
   - Measure total pipeline execution time
   - Verify parallel job execution (lint, test, test-e2e run simultaneously)
   - Check that build waits for lint and test completion
   - Verify deployment waits for all prerequisite jobs
2. **Artifact Management:**
   - Verify build artifacts are properly uploaded and downloaded
   - Check artifact retention settings (1 day)
   - Confirm artifact size is reasonable for static site
3. **Caching Efficiency:**
   - Monitor dependency installation time
   - Verify Bun lockfile caching
   - Check for opportunities to cache build artifacts
4. **Error Recovery:**
   - Test pipeline behavior after temporary failures
   - Verify retrying failed jobs works correctly
   - Check pipeline resilience to network issues

**Expected Result:** ✅ Pipeline executes efficiently with proper resource management

---

## UAT Sign-off Criteria

**All test cases must pass for Story 1.6 to be considered complete:**

- [ ] UAT-1.6.1: GitHub Actions Workflow Triggers
- [ ] UAT-1.6.2: Linting Job Validation
- [ ] UAT-1.6.3: Testing Job Validation
- [ ] UAT-1.6.4: E2E Testing Job Validation
- [ ] UAT-1.6.5: Build Job Validation
- [ ] UAT-1.6.6: Deployment Job Validation
- [ ] UAT-1.6.7: Pipeline Failure Scenarios
- [ ] UAT-1.6.8: Branch-Specific Behavior
- [ ] UAT-1.6.9: Environment Variables and Security
- [ ] UAT-1.6.10: Performance and Reliability

**UAT Completion Status:** 🟡 Pending Execution

**Notes:**

- Test both successful and failure scenarios for complete validation
- Verify pipeline behavior in different network conditions
- Test with different commit types (normal commits, merge commits, squash merges)
- Validate pipeline behavior during high-traffic periods
- Ensure pipeline works with both small and large changesets

**Critical Requirements:**

- Cloudflare Pages must be accessible after deployment
- No sensitive information should be exposed in logs
- Pipeline must complete within reasonable time limits (< 10 minutes)
- All build artifacts must be properly generated and deployed

**UAT Executed By:** [Name]  
**UAT Date:** [Date]  
**Environment:** [Environment Details]  
**Cloudflare Project:** [Project Name]  
**GitHub Repository:** [Repository URL]  
**Sign-off:** [Signature]
