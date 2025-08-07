// Jest configuration for Convex tests (run from project root)
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/convex'],
  testMatch: ['tests/convex/**/*.test.ts'],
  collectCoverageFrom: [
    'apps/convex/**/*.ts',
    '!apps/convex/**/*.d.ts',
    '!apps/convex/_generated/**',
    '!apps/convex/node_modules/**',
    '!apps/convex/coverage/**',
    '!apps/convex/jest.config.js',
  ],
  // Move coverage outside convex functions directory to avoid conflicts
  coverageDirectory: 'coverage-convex',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_generated/',
    '/coverage/',
    '/coverage-convex/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Allow imports from apps/convex using @/ aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/convex/$1',
    '^../(.*)$': '<rootDir>/apps/convex/$1',
    '^../../(.*)$': '<rootDir>/apps/convex/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/convex/setup.ts'],
  // Prevent watch mode from automatically starting
  watchman: false,
};