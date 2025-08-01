# UAT Plan 2.1: Integrate ShadCN/UI Library

## Test Overview

**Story:** 2.1 - Integrate ShadCN/UI Library  
**Epic:** Epic 2 - UI Toolkit & Component Showcase  
**Date Created:** July 22, 2025  
**Status:** Ready for Testing

## Prerequisites

- Development environment running (`bun dev`)
- Web application accessible at `http://localhost:3000`
- Browser with developer tools available

## Test Scenarios

### AC 1: ShadCN/UI CLI Initialization

**Test ID:** UAT-2.1-1  
**Acceptance Criteria:** The ShadCN/UI CLI is used to initialize the library in the `apps/web` project.

**Test Steps:**
1. Verify `apps/web/components.json` exists and contains proper configuration
2. Check `apps/web/lib/utils.ts` contains the `cn` utility function
3. Confirm `apps/web/tailwind.config.js` includes ShadCN theme configuration
4. Validate `apps/web/app/globals.css` contains CSS variables for theming

**Expected Results:**
- [ ] `components.json` exists with correct paths pointing to `../../packages/ui`
- [ ] `utils.ts` exports `cn` function using `clsx` and `tailwind-merge`
- [ ] Tailwind config includes dark mode, extended colors, and ShadCN theme
- [ ] Global CSS includes comprehensive CSS variable definitions for light/dark themes

**Pass Criteria:** All configuration files present and properly structured

---

### AC 2: Core Dependencies Configuration

**Test ID:** UAT-2.1-2  
**Acceptance Criteria:** Core dependencies like Tailwind CSS and Radix UI are correctly configured.

**Test Steps:**
1. Check `apps/web/package.json` for required dependencies
2. Verify `packages/ui/package.json` includes Radix UI dependencies
3. Confirm workspace dependency linking works
4. Test TypeScript compilation passes

**Expected Results:**
- [ ] Web app includes: `clsx`, `tailwind-merge`, `tailwindcss-animate`
- [ ] UI package includes: `@radix-ui/react-slot`, `class-variance-authority`
- [ ] Workspace dependency `@starter/ui: "workspace:*"` configured
- [ ] TypeScript compilation successful with `bun run type-check`

**Pass Criteria:** All dependencies installed and properly configured

---

### AC 3: Basic Components in Shared Package

**Test ID:** UAT-2.1-3  
**Acceptance Criteria:** A handful of basic components (Button, Card, Input) are added to the `packages/ui` directory.

**Test Steps:**
1. Verify component files exist in `packages/ui/src/`
2. Check component exports in `packages/ui/index.ts`
3. Confirm components follow ShadCN patterns
4. Validate TypeScript interfaces are properly defined

**Expected Results:**
- [ ] `button.tsx` - Button component with variants (default, secondary, outline, ghost, destructive) and sizes
- [ ] `card.tsx` - Card family components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [ ] `input.tsx` - Input component with proper styling and ref forwarding
- [ ] All components exported from `index.ts` with proper TypeScript types

**Pass Criteria:** All three component families implemented with proper ShadCN styling

---

### AC 4: Homepage Integration & Rendering

**Test ID:** UAT-2.1-4  
**Acceptance Criteria:** The components can be successfully imported and rendered on the homepage.

**Test Steps:**
1. Navigate to `http://localhost:3000`
2. Locate "🎨 ShadCN Components Showcase" section
3. Test all button variants render and are clickable
4. Test input component accepts text and shows feedback
5. Verify card component displays properly with all sub-components
6. Test responsive behavior across different screen sizes
7. Verify dark/light theme compatibility (if theme toggle available)

**Expected Results:**

**Button Testing:**
- [ ] **Default Button**: Blue primary button renders correctly
- [ ] **Secondary Button**: Gray secondary button renders correctly  
- [ ] **Outline Button**: Outlined button with hover effects
- [ ] **Ghost Button**: Transparent button with hover background
- [ ] **Destructive Button**: Red destructive button (smaller size)
- [ ] All buttons respond to hover and click events

**Input Testing:**
- [ ] Input field renders with placeholder "Type something..."
- [ ] Typing in input displays "You typed: [text]" feedback below
- [ ] Input styling matches ShadCN design patterns
- [ ] Focus states and accessibility features work properly

**Card Testing:**
- [ ] Card container renders with proper border and shadow
- [ ] Card Header displays "Example Card" title
- [ ] Card Description shows descriptive text
- [ ] Card Content displays informational paragraph
- [ ] Card Action button ("Card Action") renders and functions
- [ ] Overall card layout is visually appealing and properly spaced

**Pass Criteria:** All components render correctly and function as expected

---

## Component-Specific Functional Tests

### Button Component Detailed Testing

**Test Steps:**
1. Click each button variant and verify visual feedback
2. Test keyboard navigation (Tab, Enter, Space)
3. Verify button states (normal, hover, focus, active)
4. Check button sizing and spacing consistency

**Expected Results:**
- [ ] Visual feedback on hover (color changes)
- [ ] Keyboard accessibility fully functional
- [ ] Consistent sizing and proper spacing
- [ ] All variant styles distinct and appropriate

### Input Component Detailed Testing

**Test Steps:**
1. Test typing various characters (letters, numbers, symbols)
2. Test copy/paste functionality
3. Verify placeholder behavior
4. Test form validation compatibility
5. Check accessibility features (screen reader compatibility)

**Expected Results:**
- [ ] Accepts all standard input characters
- [ ] Copy/paste works correctly
- [ ] Placeholder displays when empty
- [ ] Proper focus indicators and accessibility attributes
- [ ] Real-time feedback updates correctly

### Card Component Layout Testing

**Test Steps:**
1. Verify card hierarchy (header → content → footer structure)
2. Test content overflow handling
3. Check responsive behavior on different screen sizes
4. Verify nested component styling consistency

**Expected Results:**
- [ ] Proper visual hierarchy maintained
- [ ] Content wraps appropriately
- [ ] Responsive across mobile, tablet, desktop
- [ ] All nested components styled consistently

---

## Technical Validation

### Performance Testing

**Test Steps:**
1. Check page load time with components
2. Verify no console errors in browser developer tools
3. Test component re-rendering performance
4. Validate CSS bundle size impact

**Expected Results:**
- [ ] Page loads without noticeable delay
- [ ] No JavaScript errors in console
- [ ] Components re-render smoothly during interactions
- [ ] CSS bundle size remains reasonable

### Cross-Browser Compatibility

**Test Steps:**
1. Test in Chrome (primary browser)
2. Test in Firefox
3. Test in Safari (if on macOS)
4. Verify mobile browser compatibility

**Expected Results:**
- [ ] Components render identically across browsers
- [ ] Interactive features work consistently
- [ ] CSS styling appears correctly
- [ ] No browser-specific issues observed

---

## Unit Test Validation

**Test Steps:**
1. Run UI component tests: `cd packages/ui && bun run test`
2. Verify test coverage meets requirements
3. Confirm all test assertions pass

**Expected Results:**
- [ ] All 30 component tests pass
- [ ] Test coverage at 100% (exceeds 85% requirement)
- [ ] No test failures or warnings

---

## Build & Integration Testing

**Test Steps:**
1. Run production build: `cd apps/web && bun run build`
2. Verify build completes successfully
3. Test static export functionality
4. Confirm no build warnings related to components

**Expected Results:**
- [ ] Build completes without errors
- [ ] Components properly included in production bundle
- [ ] No build warnings or optimization issues
- [ ] Static export works correctly

---

## Sign-off Criteria

**Story 2.1 is considered complete when:**

✅ **All Acceptance Criteria Verified:**
- [ ] AC 1: ShadCN/UI properly initialized
- [ ] AC 2: Dependencies correctly configured  
- [ ] AC 3: Components implemented in shared package
- [ ] AC 4: Components successfully integrated on homepage

✅ **Quality Standards Met:**
- [ ] All component tests pass with high coverage
- [ ] Visual design matches ShadCN standards
- [ ] Accessibility requirements satisfied
- [ ] Performance benchmarks achieved

✅ **Technical Requirements Satisfied:**
- [ ] TypeScript compilation successful
- [ ] Production build completes
- [ ] No critical console errors
- [ ] Cross-browser compatibility confirmed

---

## Notes for Testers

**Quick Start Testing:**
1. `bun dev` - Start development server
2. Visit `http://localhost:3000`
3. Scroll to "🎨 ShadCN Components Showcase" section
4. Interact with each component type

**Key Areas of Focus:**
- Component visual consistency with ShadCN design system
- Interactive functionality (clicks, typing, hover effects)
- Responsive behavior across screen sizes
- Integration with existing application styling

**Known Limitations:**
- ESLint configuration may show warnings (doesn't affect functionality)
- Components use mock interactivity for demonstration purposes
- Full theme switching integration planned for future stories

---

## UAT Execution Record

**Tested By:** _[To be filled during UAT execution]_  
**Test Date:** _[To be filled during UAT execution]_  
**Test Environment:** _[To be filled during UAT execution]_  
**Overall Result:** _[PASS/FAIL/CONDITIONAL]_

**Comments:**
_[To be filled during UAT execution]_