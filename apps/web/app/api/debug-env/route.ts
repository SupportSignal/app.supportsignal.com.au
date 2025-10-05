import { NextResponse } from 'next/server';

/**
 * Debug Environment Variables API Route
 * Shows NEXT_PUBLIC_ environment variables for troubleshooting
 */
export async function GET() {
  // Get all NEXT_PUBLIC environment variables
  const envVars = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'NOT_SET',
    NEXT_PUBLIC_LOG_WORKER_URL:
      process.env.NEXT_PUBLIC_LOG_WORKER_URL || 'NOT_SET',
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
  };

  const buildInfo = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
  };

  // Create HTML response for easy viewing in browser
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SupportSignal - Environment Variables Debug</title>
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #ffffff; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #60a5fa; border-bottom: 2px solid #374151; padding-bottom: 10px; }
        h2 { color: #fbbf24; margin-top: 30px; }
        .env-var { margin: 10px 0; padding: 8px; background: #374151; border-radius: 4px; }
        .key { color: #34d399; font-weight: bold; }
        .value { color: #ffffff; }
        .not-set { color: #ef4444; font-weight: bold; }
        .info { background: #1e40af; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .warning { background: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔍 SupportSignal - Environment Variables Debug</h1>
        
        <h2>🔧 NEXT_PUBLIC_* Variables</h2>
        ${Object.entries(envVars)
          .map(
            ([key, value]) => `
          <div class="env-var">
            <span class="key">${key}:</span> 
            <span class="${value === 'NOT_SET' ? 'not-set' : 'value'}">${value}</span>
          </div>
        `
          )
          .join('')}
        
        <h2>📝 Build Information</h2>
        <div class="env-var">
          <span class="key">Timestamp:</span> <span class="value">${buildInfo.timestamp}</span>
        </div>
        <div class="env-var">
          <span class="key">Platform:</span> <span class="value">${buildInfo.platform}</span>
        </div>
        <div class="env-var">
          <span class="key">Node Version:</span> <span class="value">${buildInfo.nodeVersion}</span>
        </div>
        
        <div class="info">
          <strong>ℹ️ Note:</strong> These values are embedded at build time. Changes require rebuild and deployment.
        </div>
        
        ${
          Object.values(envVars).some(v => v === 'NOT_SET')
            ? `
        <div class="warning">
          <strong>⚠️ Warning:</strong> Some environment variables are NOT_SET. Check GitHub repository secrets and Cloudflare Pages environment variables.
        </div>
        `
            : ''
        }
        
        <h2>🔧 Troubleshooting</h2>
        <ul style="color: #d1d5db;">
          <li><strong>NOT_SET values:</strong> Check GitHub repository secrets</li>
          <li><strong>localhost URLs:</strong> Environment not updated in CI/CD</li>
          <li><strong>OAuth issues:</strong> Callback URLs must match these values</li>
          <li><strong>Centralized config:</strong> Environment managed via ~/.env-configs/app.supportsignal.com.au.env</li>
        </ul>
        
        <h2>📋 Environment System Status</h2>
        <div class="info">
          <strong>✅ Centralized Environment System Active</strong><br>
          Environment variables are now managed through:<br>
          <code>~/.env-configs/app.supportsignal.com.au.env</code><br><br>
          
          <strong>🔄 To update environment variables:</strong><br>
          1. Edit: <code>~/.env-configs/app.supportsignal.com.au.env</code><br>
          2. Run: <code>bun run sync-env --deployment=dev</code><br>
          3. Rebuild and deploy for NEXT_PUBLIC_* changes
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}