import { query } from './_generated/server';

// Simple test query to verify CI deployment
export const verifyDeployment = query({
  args: {},
  handler: async () => {
    const timestamp = new Date().toISOString();
    console.log(`CI Deployment Verification - Deployed at: ${timestamp}`);
    return {
      message: 'CI/CD deployment successful',
      deployedAt: timestamp,
      version: '2025-10-24-test-3',
    };
  },
});
