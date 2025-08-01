// Jest configuration for Convex tests (run from project root)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/convex-tests'],
  testMatch: ['convex-tests/**/*.test.ts'],
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
  // Allow imports from apps/convex
  moduleNameMapper: {
    '^../(.*)$': '<rootDir>/apps/convex/$1',
    '^../../(.*)$': '<rootDir>/apps/convex/$1',
  },
  // Prevent watch mode from automatically starting
  watchman: false,
};