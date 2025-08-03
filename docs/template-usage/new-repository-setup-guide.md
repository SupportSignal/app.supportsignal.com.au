# New Repository Setup Guide

> **Goal**: Get a new repository based on this template up and running in the cloud with everything configured.

## Overview

This guide takes you from zero to a fully functional, deployed AI application with authentication, AI services, and CI/CD - all running in the cloud for under $10/month.

**Time Investment**: 2-3 hours for complete setup  
**Skill Level**: Intermediate (requires creating accounts and configuring services)  
**End Result**: Live application with GitHub authentication, AI chat, and automated deployments

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with admin access to your new repository
- [ ] Credit card (for Convex, Cloudflare, and LLM API accounts - all have generous free tiers)
- [ ] Domain name (optional - you can use provided URLs)

## Setup Checklist

**Phase 1: Foundation** ⏱️ ~30 minutes

- [ ] [Clone and configure repository](#step-1-repository-and-dependencies-setup)
- [ ] [Initialize Convex backend](#step-2-convex-backend-setup)
- [ ] [Set up environment management system](#step-3-environment-system-setup)

**Phase 2: Authentication** ⏱️ ~45 minutes

- [ ] [Configure GitHub OAuth](#step-4-github-oauth-setup)
- [ ] [Configure Google OAuth (optional)](#step-5-google-oauth-setup-optional)

**Phase 3: AI Services** ⏱️ ~30 minutes

- [ ] [Set up OpenRouter or OpenAI](#step-6-ai-services-setup)
- [ ] [Configure Cloudflare Vectorize for knowledge base](#step-7-vectorize-setup-optional)

**Phase 4: Deployment** ⏱️ ~45 minutes

- [ ] [Configure Cloudflare Pages](#step-8-cloudflare-pages-deployment)
- [ ] [Set up Log Ingestion Worker](#step-8b-log-ingestion-worker-setup)
- [ ] [Set up GitHub Actions CI/CD](#step-9-cicd-pipeline-setup)

**Phase 5: Verification** ⏱️ ~15 minutes

- [ ] [Verify everything works](#step-10-verification)

---

## Phase 1: Foundation

### Step 1: Repository and Dependencies Setup

**Goal**: Set up your repository and install dependencies.

1. **Create your new project**:

   **Option A: From blank folder (Recommended)**

   ```bash
   # Navigate to your blank project folder
   cd /path/to/your/blank/project

   # Initialize fresh git repository
   git init
   git add .
   git commit -m "feat: initial project setup"

   # Create GitHub repository first (using GitHub CLI or web interface)
   gh repo create your-org/your-repo-name --public

   # Connect to your GitHub repository
   git remote add origin https://github.com/your-org/your-repo-name.git
   git push -u origin main

   # Pull in template files (install degit if not already installed)
   npm install -g degit
   degit appydave-templates/starter-nextjs-convex-ai .

   # Commit template files
   git add .
   git commit -m "feat: add template files"
   git push

   bun install
   ```

   **Option B: Traditional git clone**

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   bun install
   ```

2. **Verify project structure**:

   **Hidden Files Verification**:

   ```bash
   # Verify critical hidden files are present
   ls -la | grep -E "\.(git|husky|prettier)"
   ls -la .github/
   ls -la apps/web/.eslintrc.json
   ```

   **Post-Degit Setup Checklist**:

   After using degit, verify these components are working:
   - [ ] Git repository initialized (`git status` works)
   - [ ] GitHub Actions workflows present (`.github/workflows/`)
   - [ ] Husky git hooks configured (`.husky/` directory)
   - [ ] ESLint configurations present (`.eslintrc.json` files)
   - [ ] Environment examples exist (`.env.source-of-truth.example`)
   - [ ] Package manager lockfile appropriate for your setup

✅ **Success Check**: All files and directories are present, dependencies installed successfully.

### Step 2: Convex Backend Setup

**Goal**: Get your backend database and API running.

1. **Create Convex account**: Go to [convex.dev](https://convex.dev) and sign up

2. **Initialize Convex project**:

   ```bash
   cd apps/convex
   bunx convex dev
   ```

   - Follow prompts to create new project
   - Copy the deployment URL shown

3. **Update environment source**:
   Edit `.env.source-of-truth.local` and update the Convex section:

   ```
   | true   | true   | Convex            | CONVEX_DEPLOYMENT         | dev:your-deployment-name |
   | true   | true   | Convex            | NEXT_PUBLIC_CONVEX_URL    | https://your-deployment.convex.cloud |
   ```

4. **Sync environment variables**:

   ```bash
   bun run sync-env --deployment=dev
   ```

   **📝 Note**: The `--deployment=dev` parameter is required.

✅ **Success Check**: Convex dashboard opens and shows your deployed functions.

**📖 Detailed Guide**: [Convex Components Guide](./technical-guides/convex-components-guide.md)

### Step 3: Environment System Setup

**Goal**: Set up the centralized environment variable management system now that we have Convex values.

1. **Create environment source file**:

   ```bash
   cp .env.source-of-truth.example .env.source-of-truth.local
   ```

2. **Update environment source file**:
   Edit `.env.source-of-truth.local` and update the Convex section with values from Step 2:

   ```
   | true   | true   | Convex            | CONVEX_DEPLOYMENT         | dev:your-deployment-name |
   | true   | true   | Convex            | NEXT_PUBLIC_CONVEX_URL    | https://your-deployment.convex.cloud |
   ```

3. **Understand the table format**:
   The `.env.source-of-truth.local` file uses a human-readable table where:
   - **TARGET**: Which systems need this variable (NEXTJS, CONVEX, LOG_WORKER)
   - **GROUP**: Logical grouping for organization
   - **KEY**: Environment variable name
   - **VALUE**: Your actual value

4. **Test the sync system**:

   ```bash
   bun run sync-env --deployment=dev --dry-run
   ```

   **⚠️ WARNING**: This will show placeholder values for services not yet configured. This is expected.

5. **Apply basic configuration** (optional):

   ```bash
   bun run sync-env --deployment=dev
   ```

   **Note**: This syncs placeholder values. You'll do a final sync after all services are configured.

✅ **Success Check**: Environment file created with real Convex values.

**📖 Detailed Guide**: [Environment Sync Workflow](./technical-guides/environment-sync-workflow.md)

---

## Phase 2: Authentication

### Step 4: GitHub OAuth Setup

**Goal**: Enable "Continue with GitHub" authentication.

**⚠️ Port Configuration Note**: Update your environment file first to avoid port conflicts with template development:

1. **Update ports in `.env.source-of-truth.local`**:

   ```
   | NEXTJS              | Local Development           | NEXT_PUBLIC_APP_URL       | http://localhost:3200     |
   | NEXTJS              | Local Development           | PORT                      | 3200                      |
   ```

2. **Create GitHub OAuth App**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "OAuth Apps" → "New OAuth App"
   - Fill in:
     ```
     Application name: Your App Name (Dev)
     Homepage URL: https://supportsignal.com (or http://localhost:3200 for dev only)
     Authorization callback URL: http://localhost:3200/auth/github/callback
     ```

   **📝 Callback URL Notes**:
   - GitHub's creation form accepts **one callback URL initially**
   - After creation, edit the app to add additional URLs (one per line):
     ```
     http://localhost:3200/auth/github/callback
     http://localhost:3300/auth/github/callback
     https://app.supportsignal.com.au/auth/github/callback
     ```

3. **Get OAuth credentials**:
   - Copy the **Client ID** (starts with `Ov...`)
   - Click **"Generate a new client secret"** and copy immediately (shown only once)

4. **Update environment source file**:

   ```
   | CONVEX  | GitHub OAuth      | GITHUB_CLIENT_ID          | your_actual_client_id     |
   | CONVEX  | GitHub OAuth      | GITHUB_CLIENT_SECRET      | your_actual_client_secret |
   ```

5. **Sync and test**:

   ```bash
   bun run sync-env --deployment=dev
   bun dev
   ```

   - Visit `http://localhost:3200/login`
   - Test GitHub authentication

✅ **Success Check**: You can log in with GitHub and see user information.

**📖 Detailed Guide**: [GitHub OAuth Setup](./technical-guides/github-oauth-setup.md)

### Step 5: Google OAuth Setup (Optional)

**Goal**: Add "Continue with Google" as additional authentication option.

**Skip this step if you only want GitHub authentication.**

1. **Create Google Cloud Project**: [Google Cloud Console](https://console.cloud.google.com/)

2. **Set up OAuth consent screen and credentials**

3. **Update environment source file** with Google credentials

✅ **Success Check**: You can log in with both GitHub and Google.

**📖 Detailed Guide**: [Google OAuth Setup](./technical-guides/google-oauth-setup.md)

---

## Phase 3: AI Services

### Step 6: AI Services Setup

**Goal**: Enable AI chat functionality with OpenRouter (recommended) or OpenAI.

**Option A: OpenRouter (Recommended - cheaper, more models)**

1. **Create OpenRouter account**: Go to [openrouter.ai](https://openrouter.ai)

2. **Add credits**: Add $5-10 for development

3. **Create API key**: Copy the API key

4. **Update environment source file**:
   ```
   | false  | true   | LLM Config        | OPENROUTER_API_KEY        | sk-or-v1-your-key-here   |
   | false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o-mini       |
   | false  | true   | LLM Config        | LLM_FALLBACK_MODEL        | openai/gpt-4o-mini       |
   ```

**Option B: OpenAI Direct**

1. **Create OpenAI account**: [platform.openai.com](https://platform.openai.com)

2. **Add payment method and create API key**

3. **Update environment source file** with OpenAI credentials

4. **Sync and test**:

   ```bash
   bun run sync-env
   bun dev
   ```

   - Navigate to chat interface
   - Send test message

✅ **Success Check**: AI responds to your chat messages.

**📖 Detailed Guide**: [LLM API Setup](./technical-guides/llm-api-setup.md)

### Step 7: Vectorize Setup (Optional)

**Goal**: Enable AI knowledge base with vector similarity search for enhanced responses.

**Skip this step if you only need basic AI chat without knowledge base functionality.**

1. **Create Cloudflare Vectorize database**:

   ```bash
   # Install Wrangler CLI (if not already installed)
   npm install -g wrangler

   # Authenticate with Cloudflare
   wrangler login

   # Create vector database (use your project name)
   wrangler vectorize create your-project-name-knowledge \
     --dimensions=1536 --metric=cosine
   ```

2. **Create Cloudflare API token**:
   - Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Create Custom token with:
     - **Permissions**: `Cloudflare Workers:Edit`, `Zone:Read`
     - **Account resources**: Include your account
     - **Zone resources**: All zones

3. **Get your Account ID**:
   - Found in Cloudflare dashboard right sidebar

4. **Update environment source file**:

   ```
   | false  | true   | Cloudflare Vector | CLOUDFLARE_ACCOUNT_ID     | your_account_id_here     |
   | false  | true   | Cloudflare Vector | VECTORIZE_DATABASE_ID     | your-project-name-knowledge |
   | false  | true   | Cloudflare Vector | CLOUDFLARE_API_TOKEN      | your_api_token_here      |
   | false  | true   | LLM Config        | OPENAI_API_KEY            | sk-proj-your-key-here    |
   ```

   **Note**: You need OpenAI API key for embeddings generation even if using OpenRouter for chat.

5. **Sync and test**:

   ```bash
   bun run sync-env

   # Test the knowledge ingestion system
   ./scripts/test-uat-4.2.sh tc4.2
   ```

6. **Seed your knowledge base** (optional):

   ```bash
   # Dry run to see what would be processed
   bun run seed:knowledge:dry

   # Actually process and store documents
   bun run seed:knowledge
   ```

✅ **Success Check**:

- Test command shows successful vector insertion
- Knowledge seeding processes your project documents
- AI responses can include relevant context from your knowledge base

**📖 Detailed Guide**: [Cloudflare Vectorize Setup](./technical-guides/cloudflare-vectorize-setup.md)

### Step 7.5: Final Environment Sync

**Goal**: Sync all real environment values now that services are configured.

**⚠️ CRITICAL**: Only run this after completing the service setup steps you need.

1. **Review your environment file**:

   ```bash
   head -10 .env.source-of-truth.local
   ```

2. **Update any remaining placeholder values** with real values from the services you've set up.

3. **Perform final sync**:
   ```bash
   bun run sync-env --deployment=dev --dry-run  # Review changes
   bun run sync-env --deployment=dev           # Apply changes
   ```

✅ **Success Check**: All configured services have real values, placeholders only for unused services.

---

## Phase 4: Deployment

### Step 8: Cloudflare Pages Deployment

**Goal**: Deploy your application to the web with a public URL.

1. **Create Cloudflare account**: Go to [cloudflare.com](https://cloudflare.com)

2. **Create Pages project**:
   - Workers & Pages → Pages → Connect to Git
   - Select your repository
   - Configure build settings:
     ```
     Framework preset: None
     Build command: bun run build && bun run pages:build
     Build output directory: .vercel/output/static
     Root directory: apps/web
     ```

3. **Add environment variables in Cloudflare**:
   - `HUSKY=0`
   - `NEXT_PUBLIC_CONVEX_URL=your-convex-url`

4. **Enable Node.js compatibility**:
   - Settings → Functions → Compatibility flags
   - Add `nodejs_compat` to both Production and Preview

5. **Test deployment**:
   - Trigger deploy and visit the provided URL

✅ **Success Check**: Your application loads at the Cloudflare Pages URL and basic functionality works.

**📖 Detailed Guide**: [Cloudflare Pages Setup](./technical-guides/cloudflare-pages-setup.md)

### Step 8a: Convex Production Environment Configuration

**Goal**: Configure environment variables for your Convex production deployment to enable OAuth and other services.

⚠️ **Critical**: This step is **MANDATORY** for OAuth authentication to work in production. Skipping this will cause "redirect_uri is not associated" errors.

**The Issue**: Convex has separate environment variables for each deployment (dev vs production). Your production deployment needs production URLs, not localhost values.

#### Quick Setup

1. **Access Convex Dashboard**: Go to [convex.dev](https://convex.dev) → Your Project
2. **Find Production Deployment**: Look for `production:your-deployment-name`
3. **Configure Environment Variables**: Click on production deployment → Environment Variables

#### Required Production Environment Variables

**Copy and paste these values** (update URLs to match your deployment):

```
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CONVEX_DEPLOYMENT=production:your-deployment-name
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
LLM_FALLBACK_MODEL=openai/gpt-4o-mini
LLM_MODEL=openai/gpt-4o-mini
LOG_WORKER_URL=https://your-worker.workers.dev
NEXT_PUBLIC_APP_URL=https://your-site.pages.dev
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_LOG_WORKER_URL=https://your-worker.workers.dev
OAUTH_SECRET=your-generated-oauth-secret
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
VECTORIZE_DATABASE_ID=your-vectorize-database-id
```

#### Critical Variables for OAuth

**Minimum required for authentication**:

- `NEXT_PUBLIC_APP_URL` = `https://your-site.pages.dev` (your production URL)
- `GITHUB_CLIENT_ID` = Your GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` = Your GitHub OAuth app client secret

#### Common Mistakes

❌ **DON'T**: Set variables in "Default Environment Variables" only  
✅ **DO**: Set variables on the specific production deployment

❌ **DON'T**: Use localhost URLs in production environment variables  
✅ **DO**: Use your actual production domain URLs

#### Verification

1. **Test OAuth**: Try signing in with GitHub on your production site
2. **Check Callback URL**: Should redirect to `https://your-site.pages.dev/auth/github/callback`
3. **No Errors**: Should not see "redirect_uri is not associated" error

⚠️ **Environment Variable Scope**: Setting these variables only affects your production deployment. Your local development will continue using the dev deployment with localhost values.

✅ **Success Check**: OAuth authentication works correctly on your production site.

**📖 Detailed Guide**: [OAuth Environment Variable Configuration KDD](../lessons-learned/oauth-environment-variable-configuration-kdd.md)

### Step 8b: Log Ingestion Worker Setup

**Goal**: Deploy cost-effective logging infrastructure using Cloudflare Workers + Redis.

**Benefits**:

- 🔹 ~80% cost reduction ($2/month vs $10/month)
- 🔹 High-frequency logging without database conflicts
- 🔹 Automatic log correlation across systems

**Quick Setup** (5 minutes):

```bash
# 1. Configure all environment variables
bun run sync-env --dry-run    # Review changes
bun run sync-env              # Apply configuration

# 2. Deploy worker with validation
./scripts/deploy-worker.sh            # Automated deployment
```

**Prerequisites**:

- Upstash Redis account (free tier: 10K commands/day)
- Your environment variables already configured in `.env.source-of-truth.local`

**Manual Setup** (if automated fails):

1. Create Upstash Redis database at [upstash.com](https://upstash.com)
2. Update `.env.source-of-truth.local` with Redis credentials
3. Run sync: `bun run sync-env`
4. Deploy: `./scripts/deploy-worker.sh`

✅ **Success Check**: `curl https://your-worker.workers.dev/health` returns healthy status.

**📖 Detailed Guide**: [Worker Deployment Setup](./technical-guides/worker-deployment-setup.md)

### Step 9: CI/CD Pipeline Setup

**Goal**: Automate deployments when you push code to GitHub.

1. **Get required information**:
   - Cloudflare Account ID (from Cloudflare dashboard)
   - Cloudflare API Token (create with Pages:Edit permission)
   - Cloudflare Project Name (from Pages dashboard)

2. **Add GitHub Secrets**:
   - Repository Settings → Secrets and variables → Actions
   - Add these secrets:
     ```
     CLOUDFLARE_API_TOKEN=your-api-token
     CLOUDFLARE_ACCOUNT_ID=your-account-id
     CLOUDFLARE_PROJECT_NAME=your-project-name
     NEXT_PUBLIC_CONVEX_URL=your-convex-url
     ```

3. **Test CI/CD pipeline**:
   ```bash
   echo "# CI/CD Test - $(date)" >> README.md
   git add README.md
   git commit -m "test: verify CI/CD pipeline"
   bun run push
   ```

✅ **Success Check**: GitHub Actions runs successfully and your changes appear on the live site.

**📖 Detailed Guide**: [CI/CD Pipeline Setup](./technical-guides/cicd-pipeline-setup.md)

---

## Phase 5: Verification

### Step 10: Verification

**Goal**: Confirm everything works together correctly.

**Quick Verification**:

1. **Visit your live site** and confirm it loads
2. **Test authentication** (GitHub login works)
3. **Test AI chat** (sends messages and gets responses)
4. **Test deployment** (push a small change and see it go live)

**Comprehensive Verification**:
Use the [Setup Verification Checklist](./setup-verification-checklist.md) for systematic testing of all components.

✅ **Success Check**: All core functionality works in production.

---

## Completion

🎉 **Congratulations!** You now have:

- ✅ **Live application** running on Cloudflare Pages
- ✅ **Authentication** with GitHub (and optionally Google)
- ✅ **AI chat functionality** powered by OpenRouter/OpenAI
- ✅ **Knowledge base** with Cloudflare Vectorize (optional)
- ✅ **Automated deployments** via GitHub Actions
- ✅ **Real-time backend** with Convex
- ✅ **Cost-effective setup** under $15/month

## Next Steps

**For Development**:

- Review [Development Guide](./development-guide.md) for daily workflow
- Understand [Scripts and Commands Reference](./technical-guides/scripts-and-commands-reference.md)

**For Customization**:

- Explore [Architecture Documentation](./architecture/) for system design
- Check [Technical Guides](./technical-guides/) for advanced configuration

**For Team Setup**:

- Share your `.env.source-of-truth.local` file securely with team members
- Document any custom configuration in your project README

## Troubleshooting

### Common Issues

**Environment Variables Not Working**:

```bash
# Check your source file format
head -5 .env.source-of-truth.local

# Test sync process
bun run sync-env --dry-run --verbose
```

**Authentication Redirects Failing**:

- Verify callback URLs in OAuth app settings match exactly
- Check that environment variables synced correctly

**AI Chat Not Working**:

- Test API key directly: see [LLM API Setup](./technical-guides/llm-api-setup.md#test-api-access)
- Check API credits/billing

**Knowledge Base/Vectorize Issues**:

- Test Vectorize connection: `./scripts/test-uat-4.2.sh tc4.2`
- Verify API token has Vectorize permissions
- Check vector database exists with correct dimensions (1536)

**Deployment Failures**:

- Check GitHub Actions logs for specific errors
- Verify all required secrets are set in GitHub

### Getting Help

- **Technical Issues**: Use the specific guide linked in each section
- **Detailed Verification**: Run the [Setup Verification Checklist](./setup-verification-checklist.md)
- **Complex Problems**: Check [CI Debugging Methodology](./technical-guides/ci-debugging-methodology.md)

---

**Created**: Dedicated guide for new repository setup  
**Goal**: Complete cloud deployment with all services configured  
**Maintenance**: Update when service setup procedures change
