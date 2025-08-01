# Epic 2: UI Toolkit & Component Showcase

**Goal:** To integrate the full UI toolkit (ShadCN, Tailwind) and Storybook. This epic focuses on building out the component showcase page with a functional light/dark mode theme toggle, creating a living library for all future UI development.

---
## Story 2.1: Integrate ShadCN/UI Library
*As a developer, I want the ShadCN/UI library fully integrated into the Next.js application, so that I have a set of accessible, themeable components to build with.*

**Acceptance Criteria:**
1.  The ShadCN/UI CLI is used to initialize the library in the `apps/web` project.
2.  Core dependencies like Tailwind CSS and Radix UI are correctly configured.
3.  A handful of basic components (e.g., `Button`, `Card`, `Input`) are added to the `packages/ui` directory.
4.  The components can be successfully imported and rendered on the homepage.

---
## Story 2.2: Set Up Storybook Environment
*As a developer, I want a Storybook environment set up for our shared UI package, so that I can develop, test, and document components in isolation.*

**Acceptance Criteria:**
1.  Storybook is initialized in a new `packages/storybook` directory.
2.  It is configured to find and display components from the `packages/ui` directory.
3.  A sample story is created for the `Button` component.
4.  The Storybook instance can be run locally using a dedicated script (e.g., `bun run storybook`).

---
## Story 2.3: Build the Component Showcase Page
*As a user, I want to view a page that showcases all available UI components, so that I can understand the visual language and capabilities of the starter template.*

**Acceptance Criteria:**
1.  A new page is created at `/showcase` in the Next.js application.
2.  This page imports and displays an instance of every component from the `packages/ui` library.
3.  The page is linked in the main navigation.
4.  The page layout is clean, responsive, and easy to navigate.

---
## Story 2.4: Implement Theme & Dark Mode Toggler
*As a user, I want to be able to switch between light and dark modes, so that I can use the application comfortably in different lighting conditions.*

**Acceptance Criteria:**
1.  A theme provider is configured at the root of the Next.js application.
2.  A UI control (e.g., a button with a sun/moon icon) is added to the main layout.
3.  Clicking the control instantly toggles the application's color scheme between light and dark mode.
4.  The user's theme preference is persisted across sessions (e.g., using local storage).
5.  All components on the `/showcase` page render correctly in both light and dark modes.