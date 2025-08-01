# User Acceptance Testing (UAT) Plan

## Story 1.2: Basic Next.js App Shell

### Test Overview

**Story:** 1.2 - Basic Next.js App Shell  
**Status:** Ready for UAT  
**Tester:** Product Owner / Context Engineer  
**Environment:** Local Development  
**Prerequisites:** Story 1.1 (Monorepo & Tooling) completed

---

## Pre-Test Setup

### 1. Environment Verification

Before starting UAT, verify your environment:

```bash
# Navigate to project root
cd /path/to/starter-nextjs-convex-ai

# Verify Bun is available
bun --version  # Should show >= 1.1.0

# Verify dependencies are installed
bun install

# Verify project structure
ls -la apps/web/  # Should show Next.js app files
```

### 2. Clean State

Start with a clean development environment:

```bash
# Stop any running servers
# Kill any processes on port 3000

# Clean build artifacts
rm -rf apps/web/.next/
rm -rf apps/web/out/
```

---

## UAT Test Cases

### ✅ **AC1: Next.js Application Directory Structure**

**Acceptance Criteria:** A new Next.js application is created within the `apps/web` directory.

#### Test Steps:

1. **Navigate to project root**
2. **Verify directory structure exists:**
   ```bash
   ls -la apps/web/
   ```

#### Expected Results:

- [ ] `apps/web/` directory exists
- [ ] `apps/web/package.json` exists with Next.js dependencies
- [ ] `apps/web/next.config.js` exists
- [ ] `apps/web/tsconfig.json` exists
- [ ] `apps/web/app/` directory exists (App Router structure)
- [ ] `apps/web/app/page.tsx` exists (homepage)
- [ ] `apps/web/app/layout.tsx` exists (root layout)
- [ ] `apps/web/app/globals.css` exists (global styles)

#### Pass/Fail Criteria:

- ✅ **PASS**: All files and directories are present
- ❌ **FAIL**: Any required file/directory is missing

---

### ✅ **AC2: Homepage Welcome Message**

**Acceptance Criteria:** The application includes a single homepage (`/`) that displays a "Welcome" message.

#### Test Steps:

1. **Start the development server:**
   ```bash
   bun run dev --filter=web
   ```
2. **Wait for server to start** (should show "Ready" message)

3. **Open browser and navigate to:**

   ```
   http://localhost:3000
   ```

4. **Verify homepage content**

#### Expected Results:

- [ ] Browser loads page without errors
- [ ] Page displays "Welcome" prominently
- [ ] Page shows "to the Agentic Starter Template" subtitle
- [ ] Page has professional styling with gradient background
- [ ] Page shows "🚀 Next.js App Router + TypeScript + Tailwind CSS" badge
- [ ] Page is responsive (test mobile and desktop views)
- [ ] No console errors in browser developer tools

#### Pass/Fail Criteria:

- ✅ **PASS**: Welcome message is clearly displayed with proper styling
- ❌ **FAIL**: Missing welcome message, styling issues, or console errors

---

### ✅ **AC3: Local Development Server**

**Acceptance Criteria:** The application successfully runs locally using the `bun run dev` command.

#### Test Steps:

1. **Stop any existing servers**

2. **Run development command:**

   ```bash
   cd /path/to/starter-nextjs-convex-ai
   bun run dev --filter=web
   ```

3. **Verify server startup**

4. **Test server functionality**

#### Expected Results:

- [ ] Command starts without errors
- [ ] Server shows "Next.js 14.2.x" in startup message
- [ ] Server shows "Local: http://localhost:3000"
- [ ] Server shows "Ready in" message with startup time
- [ ] Server starts within 5 seconds
- [ ] Port 3000 is accessible
- [ ] Hot reload works (test by editing `apps/web/app/page.tsx`)

#### Pass/Fail Criteria:

- ✅ **PASS**: Server starts successfully and is accessible
- ❌ **FAIL**: Server fails to start, errors occur, or port conflicts

---

### ✅ **AC4: TypeScript Strict Mode & Tailwind CSS**

**Acceptance Criteria:** The application is configured with TypeScript (Strict Mode) and Tailwind CSS.

#### Test Steps:

**TypeScript Strict Mode Testing:**

1. **Verify TypeScript configuration:**

   ```bash
   cat apps/web/tsconfig.json
   ```

2. **Run type checking:**

   ```bash
   cd apps/web
   bun run type-check
   ```

3. **Test strict mode by introducing type error:**
   ```bash
   # Edit apps/web/app/page.tsx
   # Add: const test: string = 123;
   bun run type-check
   ```

**Tailwind CSS Testing:**

1. **Verify Tailwind configuration:**

   ```bash
   cat apps/web/tailwind.config.js
   cat apps/web/postcss.config.js
   ```

2. **Test Tailwind styles on homepage:**
   - Check gradient background
   - Check responsive classes
   - Check hover effects

3. **Test Tailwind build process:**
   ```bash
   bun run build --filter=web
   ```

#### Expected Results:

**TypeScript:**

- [ ] `tsconfig.json` has `"strict": true`
- [ ] Type checking passes without errors
- [ ] Strict mode catches type errors when introduced
- [ ] Components are properly typed with React.ReactNode etc.

**Tailwind CSS:**

- [ ] `tailwind.config.js` exists with proper content paths
- [ ] `postcss.config.js` exists with tailwindcss and autoprefixer
- [ ] Global CSS includes Tailwind directives
- [ ] Tailwind classes are applied and working
- [ ] Responsive design works (test different screen sizes)
- [ ] Build process includes Tailwind CSS compilation

#### Pass/Fail Criteria:

- ✅ **PASS**: TypeScript strict mode functional, Tailwind CSS working
- ❌ **FAIL**: Type errors, missing configurations, or styling issues

---

## Additional Quality Checks

### 🔍 **Code Quality Verification**

1. **Build Process:**

   ```bash
   bun run build --filter=web
   ```

   - [ ] Build completes without errors
   - [ ] Static pages generated
   - [ ] No TypeScript compilation errors

2. **Formatting:**

   ```bash
   bun run format --filter=web
   ```

   - [ ] Prettier formatting works
   - [ ] Code style is consistent

3. **Development Experience:**
   ```bash
   bun run dev --filter=web
   ```

   - [ ] Server starts quickly
   - [ ] Hot reload works
   - [ ] No unnecessary warnings

### 🌐 **Browser Compatibility**

Test the application in:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Mobile browsers (responsive design)

### 📱 **Responsive Design**

- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Text remains readable at all sizes
- [ ] Layout doesn't break at different screen sizes

---

## UAT Completion Checklist

### ✅ **Final Acceptance Criteria Review**

- [ ] **AC1**: Next.js application exists in `apps/web` directory
- [ ] **AC2**: Homepage displays "Welcome" message
- [ ] **AC3**: Application runs with `bun run dev` command
- [ ] **AC4**: TypeScript strict mode and Tailwind CSS configured

### ✅ **Quality Gates**

- [ ] No console errors or warnings
- [ ] Build process completes successfully
- [ ] Code is properly formatted
- [ ] Development experience is smooth
- [ ] Browser compatibility verified
- [ ] Responsive design works

### ✅ **Documentation**

- [ ] All files are properly documented
- [ ] README instructions are accurate
- [ ] Development setup is straightforward

---

## UAT Results Template

```
## UAT Results - Story 1.2
**Date:** [Fill in date]
**Tester:** [Your name]
**Environment:** Local Development

### Test Results:
- AC1 (Directory Structure): ✅ PASS / ❌ FAIL
- AC2 (Welcome Message): ✅ PASS / ❌ FAIL
- AC3 (Development Server): ✅ PASS / ❌ FAIL
- AC4 (TypeScript + Tailwind): ✅ PASS / ❌ FAIL

### Issues Found:
[List any issues discovered during testing]

### Overall Status:
✅ APPROVED - Ready for next story
❌ REJECTED - Needs fixes

### Notes:
[Additional observations or recommendations]
```

---

## Troubleshooting Guide

### Common Issues & Solutions:

**Issue:** Server won't start on port 3000
**Solution:** Check if port is in use: `lsof -i :3000`, kill process or use different port

**Issue:** TypeScript errors
**Solution:** Run `bun run type-check` to see specific errors, verify tsconfig.json

**Issue:** Tailwind styles not applying
**Solution:** Verify tailwind.config.js content paths, check postcss.config.js

**Issue:** Build fails
**Solution:** Check for TypeScript errors, verify all dependencies installed

**Issue:** Hot reload not working
**Solution:** Restart development server, check file watching permissions

---

## Next Steps After UAT

1. **If UAT PASSES:** Story 1.2 is ready for Story 1.3 (Cloudflare Pages Deployment)
2. **If UAT FAILS:** Document issues and return to development for fixes
3. **Documentation:** Update any learnings or issues found during UAT

This UAT plan ensures comprehensive testing of Story 1.2 while being practical for a Context Engineer to execute without deep technical knowledge.
