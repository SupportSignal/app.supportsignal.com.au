# Project Environment Variable Management

This document outlines the required environment variables for deployment and explains the different environments where they must be managed.

## The Three Environments: Local, CI, and Production

A key insight is that our project operates in **three isolated environments**. Each has its own separate configuration, and they do not share variables.

### 1. Local Development (Your Computer)

This is your day-to-day coding environment. It uses local files for configuration that should **never** be committed to git.

- **`apps/web/.env.local`**: Used by the Next.js frontend and Convex client.
- **`apps/workers/log-ingestion/.dev.vars`**: Used by the logging worker when running locally with Wrangler.

### 2. Continuous Integration (CI) (GitHub Actions)

This is a temporary server that runs tests and validates your code every time you push to GitHub. It **does not deploy** your website.

- **Variable Source**: It gets its variables exclusively from **GitHub Repository Secrets & Variables**. If these are outdated, your CI logs will show errors or use old data, which can be misleading.

### 3. Production Deployment (Cloudflare Pages)

This is the live environment that builds and hosts your public website. This is the most important environment for your users.

- **Variable Source**: It _only_ uses variables set in the **Cloudflare Pages Dashboard** under **Settings > Environment variables**.

---

## The Golden Rule of Environment Variables

Because these three environments are completely separate, you must follow this rule:

> If you add a new environment variable for local development (in `.env.local` or `.dev.vars`), you **must** also add it to **both** GitHub (for CI tests) and Cloudflare Pages (for the live deployment).

---

## Cloudflare Pages Variable Checklist

For a successful production deployment, the following variables **must** be set in your Cloudflare Pages project's **Settings > Environment variables** section.

| Variable Name                    | Example Value / Description         | Reason                                                                                                                                 |
| :------------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **`NEXT_PUBLIC_APP_URL`**        | `https://your-site.pages.dev`       | The public URL of your Next.js application.                                                                                            |
| **`NEXT_PUBLIC_CONVEX_URL`**     | `https://your-project.convex.cloud` | The URL of your Convex backend.                                                                                                        |
| **`NEXT_PUBLIC_LOG_WORKER_URL`** | `https://your-worker.workers.dev`   | The URL of your deployed log ingestion worker.                                                                                         |
| **`NODE_VERSION`**               | `20`                                | Guarantees a stable and predictable Node.js version for every build.                                                                   |
| **`NPM_FLAGS`**                  | `--version`                         | **Critical Fix:** Bypasses Cloudflare's faulty automatic `npm install` step, allowing our custom build command to use `bun` correctly. |

## GitHub Actions Variable Checklist

For CI/CD pipeline to work properly, these variables must be set in your GitHub repository's **Settings > Secrets and variables > Actions**.

### Secrets (Sensitive Values)

| Secret Name                 | Example Value / Description | Why Required                                        |
| :-------------------------- | :-------------------------- | :-------------------------------------------------- |
| **`CLOUDFLARE_API_TOKEN`**  | `your-api-token`            | Allows GitHub Actions to deploy to Cloudflare Pages |
| **`CLOUDFLARE_ACCOUNT_ID`** | `your-account-id`           | Identifies your Cloudflare account for deployment   |

### Variables (Non-Sensitive Values)

| Variable Name                 | Example Value / Description         | Why Required                                |
| :---------------------------- | :---------------------------------- | :------------------------------------------ |
| **`CLOUDFLARE_PROJECT_NAME`** | `your-project-name`                 | Identifies which Pages project to deploy to |
| **`NEXT_PUBLIC_CONVEX_URL`**  | `https://your-project.convex.cloud` | Used during CI build process                |

## Common Environment Variable Mistakes

### ❌ Mistake 1: Updating Only Local Variables

```bash
# Wrong: Only updating local development
echo "NEW_API_KEY=sk-xyz" >> apps/web/.env.local
```

### ✅ Correct: Update All Three Environments

```bash
# 1. Update local development
echo "NEW_API_KEY=sk-xyz" >> apps/web/.env.local

# 2. Add to GitHub repository secrets
# (Via GitHub web interface: Settings > Secrets and variables > Actions)

# 3. Add to Cloudflare Pages environment variables
# (Via Cloudflare dashboard: Pages project > Settings > Environment variables)
```

### ❌ Mistake 2: Assuming Variables Sync Automatically

Variables **never** sync between environments. Each must be configured independently.

### ❌ Mistake 3: Using Wrong Variable Names

```bash
# Wrong: Inconsistent naming between environments
# Local: NEXT_PUBLIC_API_URL
# Cloudflare: NEXT_PUBLIC_APP_URL
# GitHub: API_BASE_URL
```

### ✅ Correct: Consistent Naming

Use identical variable names across all three environments.

## Environment-Specific Configuration Patterns

### Local Development Configuration

```bash
# apps/web/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONVEX_URL=https://dev-123.convex.cloud
CONVEX_DEPLOYMENT=dev:local-branch
```

### CI/CD Configuration (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
env:
  NEXT_PUBLIC_CONVEX_URL: ${{ vars.NEXT_PUBLIC_CONVEX_URL }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Production Configuration (Cloudflare Pages)

```bash
# Set via Cloudflare Pages Dashboard
NEXT_PUBLIC_APP_URL=https://your-app.pages.dev
NEXT_PUBLIC_CONVEX_URL=https://prod-456.convex.cloud
NODE_VERSION=20
NPM_FLAGS=--version
```

## Troubleshooting Environment Variable Issues

### Issue: "Function not found" in production

**Cause**: `NEXT_PUBLIC_CONVEX_URL` not set in Cloudflare Pages  
**Solution**: Add the variable to Cloudflare Pages environment variables

### Issue: CI builds failing with authentication errors

**Cause**: GitHub repository secrets missing or incorrect  
**Solution**: Verify all required secrets are set in GitHub Actions

### Issue: Local development works but production doesn't

**Cause**: Variables exist locally but not in Cloudflare Pages  
**Solution**: Copy all required variables to Cloudflare Pages dashboard

### Issue: Environment variable changes not taking effect

**Cause**: Need to redeploy after changing variables  
**Solution**: Trigger new deployment to pick up variable changes

## Best Practices

### 1. Document Your Variables

Maintain a table of all environment variables and which environments need them.

### 2. Use Consistent Naming

Use the same variable name across all three environments.

### 3. Test in All Environments

- ✅ Test locally: `bun dev`
- ✅ Test CI: Push to GitHub and check Actions
- ✅ Test production: Verify live deployment works

### 4. Secure Sensitive Variables

- Use GitHub Secrets for API keys, tokens, passwords
- Use GitHub Variables for non-sensitive configuration
- Never commit secrets to repository

### 5. Validate Variable Presence

```bash
# Add validation to your application startup
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is required');
}
```

## Integration with Template Environment Sync

This project includes an advanced environment synchronization system via `.env.source-of-truth.local`. However, this system only manages **local development** and **Convex deployment** variables.

**Important**: The sync system does **not** automatically configure Cloudflare Pages or GitHub Actions. You must still manually configure those environments.

**📖 See Also**: [Advanced Environment Management Workflow](./environment-management.md) for details on the local sync system.

## Quick Reference Commands

```bash
# Check local environment variables
cat apps/web/.env.local

# Test local development
bun dev

# Check if variables are working in production
curl https://your-site.pages.dev/api/health

# View Cloudflare Pages environment variables
# (No CLI command - use Cloudflare dashboard)

# View GitHub Actions environment
# (Check repository Settings > Secrets and variables > Actions)
```

---

**Key Takeaway**: The Three Environments are completely isolated. Success requires manually configuring variables in all three places: local files, GitHub repository settings, and Cloudflare Pages dashboard.

**Created**: KDD analysis of environment variable management challenges  
**Purpose**: Single source of truth for Three Environments problem  
**Related**: [Repository Setup Guide](../template-usage/new-repository-setup-guide.md)
