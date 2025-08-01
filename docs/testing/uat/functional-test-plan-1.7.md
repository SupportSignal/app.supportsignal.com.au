# User Acceptance Tests (UAT) - Story 1.7: Port Management Documentation

## Test Environment Setup

**Prerequisites:**

- Development environment with Next.js and Convex setup
- Bun package manager installed
- Chrome browser installed
- Terminal access with multiple tabs/windows capability
- Story 1.7 development guide available at `docs/development-guide.md`

**Testing Notes:**

- This UAT focuses on validating the port management documentation and procedures
- Tests will verify both human and AI port separation strategies work correctly
- All port configuration examples should be tested for accuracy

## UAT Test Cases

### UAT-1.7.1: Development Guide Accessibility

**Acceptance Criteria:** Development guide is accessible and properly integrated with project documentation

**Test Steps:**

1. Navigate to project root directory
2. Open `docs/development-guide.md` in your preferred editor
3. Verify the document loads without errors
4. Check that all sections are present:
   - Table of Contents
   - Port Management Strategy
   - Local vs Hosted Services
   - Reserved Network Ports
   - Port Configuration
   - Troubleshooting
   - Development Workflow Integration
5. Open `docs/index.md` and verify development guide is referenced in Quick Links
6. Confirm the link to development guide works correctly

**Expected Result:** ✅ Development guide is accessible and properly integrated into project documentation

---

### UAT-1.7.2: Human Port Allocation Testing

**Acceptance Criteria:** Human-controlled ports work as documented with default configurations

**Test Steps:**

1. **Test Next.js Development Server (Port 3000):**

   ```bash
   # Terminal 1: Start Next.js on default human port
   bun dev
   ```

   - Verify server starts on port 3000
   - Open browser to `http://localhost:3000`
   - Confirm application loads correctly

2. **Test Convex Development Server (Port 3210):**

   ```bash
   # Terminal 2: Start Convex development server
   bunx convex dev
   ```

   - Verify Convex starts on port 3210
   - Check that Next.js app can connect to Convex backend
   - Verify no port conflicts between services

3. **Test Chrome Debug Port (Port 9222):**

   ```bash
   # Terminal 3: Start Chrome with debug port
   open -a 'Google Chrome' --args --remote-debugging-port=9222
   ```

   - Verify Chrome starts with debug port enabled
   - Test that `http://localhost:9222` shows debug interface
   - Confirm no conflicts with other services

4. **Test Port Availability Commands:**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :3210
   lsof -i :9222
   ```

   - Verify commands show correct processes using each port
   - Confirm port detection works as documented

**Expected Result:** ✅ All human-controlled ports work correctly with default configurations

---

### UAT-1.7.3: AI Port Allocation Testing

**Acceptance Criteria:** AI-controlled ports work as documented with offset configurations

**Test Steps:**

1. **Test AI Next.js Development Server (Port 3100):**

   ```bash
   # Terminal 4: Start Next.js on AI port (while human version still running)
   PORT=3100 bun dev
   ```

   - Verify server starts on port 3100
   - Open browser to `http://localhost:3100`
   - Confirm application loads correctly
   - Verify both human (3000) and AI (3100) servers run simultaneously

2. **Test AI Chrome Debug Port (Port 9322):**

   ```bash
   # Terminal 5: Start Chrome with AI debug port
   open -a 'Google Chrome' --args --remote-debugging-port=9322
   ```

   - Verify Chrome starts with AI debug port enabled
   - Test that `http://localhost:9322` shows debug interface
   - Confirm no conflicts with human debug port (9222)

3. **Test Simultaneous Human + AI Development:**
   ```bash
   # Verify all services running simultaneously
   lsof -i :3000  # Human Next.js
   lsof -i :3100  # AI Next.js
   lsof -i :3210  # Convex (shared)
   lsof -i :9222  # Human Chrome debug
   lsof -i :9322  # AI Chrome debug
   ```

   - Confirm all services are running on their assigned ports
   - Test that both versions of the application work correctly
   - Verify no port conflicts between human and AI services

**Expected Result:** ✅ AI-controlled ports work correctly alongside human ports without conflicts

---

### UAT-1.7.4: Environment Variable Configuration

**Acceptance Criteria:** Environment variable configuration works as documented

**Test Steps:**

1. **Create Environment Configuration Files:**

   ```bash
   # Create .env.local for human development
   echo "PORT=3000
   STORYBOOK_PORT=6006
   CHROME_DEBUG_PORT=9222
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud" > .env.local

   # Create .env.ai for AI development
   echo "PORT=3100
   STORYBOOK_PORT=6106
   CHROME_DEBUG_PORT=9322
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud" > .env.ai
   ```

2. **Test Environment Variable Loading:**

   ```bash
   # Test human configuration
   source .env.local
   echo $PORT  # Should show 3000

   # Test AI configuration
   source .env.ai
   echo $PORT  # Should show 3100
   ```

3. **Test Port Override Commands:**
   ```bash
   # Test custom port override
   PORT=3001 bun dev
   ```

   - Verify Next.js starts on port 3001
   - Confirm port override works correctly
   - Test that custom ports don't conflict with documented ranges

**Expected Result:** ✅ Environment variable configuration works as documented

---

### UAT-1.7.5: Port Conflict Resolution

**Acceptance Criteria:** Port conflict resolution procedures work as documented

**Test Steps:**

1. **Create Port Conflict Scenario:**

   ```bash
   # Terminal 1: Start service on port 3000
   bun dev

   # Terminal 2: Try to start another service on same port
   PORT=3000 bun dev
   ```

   - Verify second service shows port conflict error
   - Confirm error message is clear and helpful

2. **Test Port Conflict Detection:**

   ```bash
   # Use netstat to detect port usage
   netstat -an | grep :3000

   # Use lsof to identify process using port
   lsof -i :3000
   ```

   - Verify commands show correct port usage information
   - Confirm detection methods work as documented

3. **Test Port Conflict Resolution:**

   ```bash
   # Method 1: Use different port
   PORT=3001 bun dev

   # Method 2: Kill conflicting process
   lsof -ti :3000 | xargs kill -9
   bun dev
   ```

   - Verify both resolution methods work correctly
   - Confirm services start successfully after conflict resolution

4. **Test Conflict Resolution Workflow:**
   - Follow the documented 5-step conflict resolution process
   - Verify each step works as described
   - Confirm resolution is successful and documented

**Expected Result:** ✅ Port conflict resolution procedures work correctly and provide clear guidance

---

### UAT-1.7.6: Troubleshooting Procedures

**Acceptance Criteria:** All troubleshooting procedures work as documented

**Test Steps:**

1. **Test Port Availability Checking:**

   ```bash
   # Test netstat commands (macOS/Linux)
   netstat -an | grep :3000
   netstat -an | grep LISTEN

   # Test lsof commands
   lsof -i :3000
   lsof -ti :3000
   ```

   - Verify all commands work correctly
   - Confirm output matches documented examples

2. **Test Common Troubleshooting Scenarios:**

   **Scenario A: Next.js Port 3000 Conflict**
   - Create port conflict on 3000
   - Follow documented resolution steps
   - Verify resolution works correctly

   **Scenario B: Chrome Debug Port 9222 Conflict**
   - Create port conflict on 9222
   - Follow documented resolution steps
   - Verify resolution works correctly

3. **Test Multi-Process Development Setup:**

   ```bash
   # Terminal 1: Start Convex
   bunx convex dev

   # Terminal 2: Start Next.js (human)
   bun dev

   # Terminal 3: Start Next.js (AI)
   PORT=3100 bun dev

   # Terminal 4: Start Chrome debug (human)
   open -a 'Google Chrome' --args --remote-debugging-port=9222

   # Terminal 5: Start Chrome debug (AI)
   open -a 'Google Chrome' --args --remote-debugging-port=9322
   ```

   - Verify all services start without conflicts
   - Confirm multi-process development works as documented

**Expected Result:** ✅ All troubleshooting procedures work correctly and provide accurate guidance

---

### UAT-1.7.7: Development Workflow Integration

**Acceptance Criteria:** Development guide integrates correctly with existing development workflow

**Test Steps:**

1. **Test Integration with CLAUDE.md Commands:**

   ```bash
   # Test commands referenced in CLAUDE.md
   bun dev              # Should work with port 3000
   bunx convex dev      # Should work with port 3210
   ```

   - Verify commands work as documented
   - Confirm consistency between CLAUDE.md and development guide

2. **Test Integration with Package.json Scripts:**

   ```bash
   # Test root package.json scripts
   bun build
   bun lint
   bun test
   bun typecheck

   # Test web app package.json scripts
   cd apps/web
   bun dev
   bun build
   bun lint
   ```

   - Verify all scripts work correctly
   - Confirm no conflicts with documented port management

3. **Test Documentation Navigation:**
   - Navigate from `docs/index.md` to `docs/development-guide.md`
   - Verify all internal links work correctly
   - Confirm cross-references between documents are accurate

**Expected Result:** ✅ Development guide integrates seamlessly with existing development workflow

---

### UAT-1.7.8: Local vs Hosted Services Understanding

**Acceptance Criteria:** Documentation correctly distinguishes between local and hosted services

**Test Steps:**

1. **Test Local Services Port Management:**
   - Start Next.js development server (local)
   - Verify port management applies correctly
   - Confirm local services use documented ports

2. **Test Hosted Services Access:**
   - Access Convex backend (hosted service)
   - Verify no port management needed
   - Confirm same URL works for both human and AI development

3. **Test Service Classification:**
   - Review documentation categorization of services
   - Verify local vs hosted classification is accurate
   - Confirm understanding of which services need port management

**Expected Result:** ✅ Clear distinction between local and hosted services with correct port management application

---

### UAT-1.7.9: Documentation Quality and Usability

**Acceptance Criteria:** Documentation is clear, accurate, and easy to follow

**Test Steps:**

1. **Test Documentation Structure:**
   - Review table of contents for completeness
   - Verify all sections are logically organized
   - Confirm navigation is intuitive

2. **Test Example Accuracy:**
   - Follow all code examples exactly as written
   - Verify all examples work correctly
   - Confirm no typos or errors in examples

3. **Test Troubleshooting Effectiveness:**
   - Intentionally create common problems
   - Follow troubleshooting procedures
   - Verify solutions work as documented

4. **Test Best Practices Application:**
   - Follow documented best practices
   - Verify practices lead to successful outcomes
   - Confirm recommendations are practical

**Expected Result:** ✅ Documentation is clear, accurate, and provides effective guidance

---

### UAT-1.7.10: Port Range Strategy Validation

**Acceptance Criteria:** Port range allocation strategy works effectively for future expansion

**Test Steps:**

1. **Test Current Port Range Usage:**

   ```bash
   # Test human range
   PORT=3000 bun dev &
   STORYBOOK_PORT=6006 bun storybook &

   # Test AI range
   PORT=3100 bun dev &
   STORYBOOK_PORT=6106 bun storybook &
   ```

   - Verify current ranges work without conflicts
   - Confirm separation strategy is effective

2. **Test Future Expansion Capability:**
   - Review documented port range allocation
   - Verify sufficient ports available for future services
   - Confirm expansion strategy is scalable

3. **Test Port Range Documentation:**
   - Review port range allocation table
   - Verify ranges are clearly documented
   - Confirm no overlaps between human and AI ranges

**Expected Result:** ✅ Port range strategy is effective and scalable for future development needs

---

## UAT Sign-off Criteria

**All test cases must pass for Story 1.7 to be considered complete:**

- [ ] UAT-1.7.1: Development Guide Accessibility
- [ ] UAT-1.7.2: Human Port Allocation Testing
- [ ] UAT-1.7.3: AI Port Allocation Testing
- [ ] UAT-1.7.4: Environment Variable Configuration
- [ ] UAT-1.7.5: Port Conflict Resolution
- [ ] UAT-1.7.6: Troubleshooting Procedures
- [ ] UAT-1.7.7: Development Workflow Integration
- [ ] UAT-1.7.8: Local vs Hosted Services Understanding
- [ ] UAT-1.7.9: Documentation Quality and Usability
- [ ] UAT-1.7.10: Port Range Strategy Validation

**UAT Completion Status:** 🟡 Pending Execution

**Notes:**

- Test both successful scenarios and failure/conflict scenarios
- Verify documentation accuracy by following all examples exactly
- Test simultaneous human and AI development workflows
- Ensure port separation strategy works in practice
- Validate troubleshooting procedures with real conflict scenarios

**Critical Requirements:**

- All documented port configurations must work correctly
- Human and AI services must be able to run simultaneously without conflicts
- All troubleshooting procedures must resolve conflicts effectively
- Documentation must be clear and actionable for developers

**UAT Executed By:** [Name]  
**UAT Date:** [Date]  
**Environment:** [Environment Details]  
**Testing Platform:** [macOS/Linux/Windows]  
**Sign-off:** [Signature]
