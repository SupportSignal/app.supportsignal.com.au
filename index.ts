// Sample index file for monorepo
export const greeting = 'Hello from Bun monorepo!';

if (typeof window === 'undefined') {
  // Node.js environment - safe to use console
  // eslint-disable-next-line no-console
  console.log(greeting);
}
