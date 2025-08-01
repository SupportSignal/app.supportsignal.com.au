# API Security and Secret Management Guide

## 🔒 Security Status Overview

**Last Audit:** 2025-07-26  
**Git History Status:** ✅ **CLEAN** - No real secrets found in git history  
**Local Files Status:** ⚠️ **CONTAINS REAL SECRETS** - Properly protected by .gitignore  
**Prevention Status:** ✅ **ACTIVE** - Git hooks and monitoring in place  

## 🚨 Current Secret Inventory

### Real Secrets in Local Files (Protected by .gitignore)

**Location:** `.env.source-of-truth.local` (and synced copies)

- **GitHub OAuth:** `GITHUB_CLIENT_SECRET` (40 chars)
- **Google OAuth:** `GOOGLE_CLIENT_SECRET` (28 chars, GOCSPX- format)  
- **OpenAI API:** `OPENAI_API_KEY` (164 chars, sk-proj- format)
- **OpenRouter API:** `OPENROUTER_API_KEY` (72 chars, sk-or-v1- format)
- **OAuth Session:** `OAUTH_SECRET` (44 chars, base64 encoded)

### Protection Status
✅ All files with real secrets are git-ignored  
✅ Pre-commit hook active to prevent accidental commits  
✅ Environment sync system prevents manual file management  

## 🛡️ Security Architecture

### Environment File Hierarchy

```
├── .env.source-of-truth.local    # ← REAL SECRETS (git-ignored)
├── .env.*.example                # ← SAFE TEMPLATES (committed)
├── apps/web/.env.local           # ← AUTO-SYNCED (git-ignored)
├── apps/convex/.env.local        # ← AUTO-SYNCED (git-ignored)
└── .old-env/                     # ← BACKUP FOLDER (git-ignored)
```

### Key Security Principles

1. **Single Source of Truth:** All real secrets in `.env.source-of-truth.local`
2. **Auto-Sync Distribution:** `npm run sync-env` distributes to apps
3. **Example Templates:** Committed files use redacted placeholders
4. **Git Protection:** Comprehensive `.gitignore` coverage
5. **Hook Validation:** Pre-commit scanning for accidental secrets

## 🔧 Prevention Tools

### 1. Git Pre-Commit Hook

**Location:** `.git/hooks/pre-commit`  
**Purpose:** Scans staged files for API key patterns before commit

**Patterns Detected:**
- OpenAI/OpenRouter: `sk-[a-zA-Z0-9-]{20,}`
- GitHub Tokens: `ghp_`, `gho_`, `ghs_`, `ghr_`, `ghu_` + 36 chars
- AWS Keys: `AKIA[0-9A-Z]{16}`
- Google APIs: `AIza[0-9A-Za-z\\-_]{35}`
- Google OAuth: `GOCSPX-[A-Za-z0-9_-]{28}`

**Testing the Hook:**
```bash
echo "OPENAI_API_KEY=sk-real-key-would-be-blocked" > test-secret.txt
git add test-secret.txt
git commit -m "test"  # Should be blocked
rm test-secret.txt
```

### 2. Environment File Protection

**Gitignore Coverage:**
```gitignore
# Environment variables
.old-env
.env
.env*.local
.env.development.local
.env.test.local
.env.production.local
```

**Verification Command:**
```bash
git check-ignore .env.source-of-truth.local  # Should return the filename
```

### 3. Automated Environment Sync

**Script:** `scripts/sync-env.js`  
**Usage:** `npm run sync-env` or `bun run sync-env`

**Benefits:**
- Prevents manual copying of secrets
- Ensures consistent distribution
- Reduces human error in secret management

## 📋 Security Checklist

### Before Each Commit
- [ ] Run `git status` to verify no `.env*` files are staged
- [ ] Pre-commit hook runs automatically (don't bypass with `--no-verify`)
- [ ] Review any hook warnings before proceeding

### Monthly Security Review
- [ ] Audit `.env.source-of-truth.local` for unused secrets
- [ ] Rotate any secrets that may have been exposed
- [ ] Update example templates if new environment variables added
- [ ] Test pre-commit hook with sample secret patterns

### When Adding New Secrets
- [ ] Add to `.env.source-of-truth.local` only
- [ ] Run `npm run sync-env` to distribute
- [ ] Update example templates with redacted placeholders
- [ ] Verify new patterns are caught by pre-commit hook

## 🚨 Incident Response

### If Real Secrets Are Accidentally Committed

**Immediate Actions:**
1. **Stop pushing:** Don't push the commit to remote
2. **Remove from history:** `git reset --soft HEAD~1` (if not pushed)
3. **Rotate compromised secrets:** Change all exposed API keys immediately
4. **Clean working directory:** Ensure no secrets in tracked files

**If Already Pushed to Remote:**
1. **Assume compromise:** Rotate all secrets immediately
2. **Rewrite history:** Use `git filter-branch` or `git filter-repo`
3. **Force push:** Update remote history (coordinate with team)
4. **Monitor for misuse:** Check API usage for unusual activity

### Secret Rotation Checklist

**GitHub OAuth:**
- [ ] Generate new client secret in GitHub App settings
- [ ] Update `.env.source-of-truth.local` 
- [ ] Run `npm run sync-env`
- [ ] Test OAuth login flow

**OpenAI API:**
- [ ] Revoke old key in OpenAI dashboard
- [ ] Generate new API key  
- [ ] Update `.env.source-of-truth.local`
- [ ] Test embedding/AI functionality

**OpenRouter API:**
- [ ] Revoke old key in OpenRouter dashboard
- [ ] Generate new API key
- [ ] Update `.env.source-of-truth.local`
- [ ] Test LLM chat functionality

## 🔍 Additional Security Tools

### Recommended Tools for Enhanced Security

1. **git-secrets** (AWS tool for preventing secrets)
   ```bash
   brew install git-secrets
   git secrets --install
   git secrets --register-aws
   ```

2. **TruffleHog** (Comprehensive secret scanning)
   ```bash
   pip install trufflesecurity
   trufflehog git file://. --only-verified
   ```

3. **GitHub Secret Scanning** (Automatic detection)
   - Enabled automatically for public repos
   - Configure push protection for private repos

4. **Environment Variable Validation**
   ```bash
   # Add to package.json scripts
   "validate-env": "node -e \"if(!process.env.OPENAI_API_KEY?.startsWith('sk-')) throw new Error('Invalid API key format')\""
   ```

## 📚 References and Best Practices

### Documentation Standards
- Always use redacted examples in committed files
- Document secret rotation procedures
- Maintain inventory of all secrets and their purposes

### Development Workflow
- Use `.env.local` files for development secrets
- Never commit actual API keys to version control
- Use environment-specific configuration for different deployment stages

### Team Collaboration
- Share secret management procedures with all team members
- Use secure channels (not email/Slack) for sharing sensitive information
- Implement code review processes that check for potential secret exposure

---

**⚠️ Remember:** This guide should be reviewed and updated whenever new secrets are added or security practices change.