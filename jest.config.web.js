// Root-level Jest configuration for web logic tests
// Tests are located in tests/web/ for centralized organization
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Test discovery - only look in tests/web directory
  testMatch: [
    '<rootDir>/tests/web/**/*.test.ts',
    '<rootDir>/tests/web/**/*.test.js',
  ],

  // Set roots to include test directory
  roots: ['<rootDir>/tests/web'],

  // Coverage collection from source files in apps/web (if needed)
  collectCoverageFrom: [
    'apps/web/**/*.ts',
    '!apps/web/**/*.d.ts',
    '!apps/web/_generated/**',
    '!apps/web/node_modules/**',
    '!apps/web/coverage/**',
    '!apps/web/jest.config.js',
  ],

  // Coverage output to project root
  coverageDirectory: 'test-coverage/web',
  coverageReporters: ['text', 'lcov', 'html'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_generated/',
    '/coverage/',
    '/test-coverage/',
  ],

  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Allow Jest to transform ESM modules
  transformIgnorePatterns: ['node_modules/(?!(convex|@convex)/)'],

  // Prevent watch mode from automatically starting
  watchman: false,
};
