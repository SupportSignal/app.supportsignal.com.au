/**
 * Mock for session resolver - handles authentication and user session validation
 */

// Mock session resolver for multi-tenant security testing
const mockSessionResolver = {};

const getUserFromSession = jest.fn(async (ctx, sessionToken) => {
  // Use the mock session resolver from the context if available
  if (ctx.mockSessionResolver && ctx.mockSessionResolver[sessionToken]) {
    return ctx.mockSessionResolver[sessionToken];
  }
  
  // Default behavior - return null for invalid sessions
  return null;
});

module.exports = {
  getUserFromSession,
};