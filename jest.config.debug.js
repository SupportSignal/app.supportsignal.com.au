// Debug Jest configuration for isolated AI question generation testing
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Only run specific debug tests
  testMatch: [
    '<rootDir>/tests/convex/ai/question-generation-debug.test.ts',
    '<rootDir>/tests/convex/ai/clarification-database-test.test.ts',
    '<rootDir>/tests/convex/ai/production-scenario-test.test.ts',
    '<rootDir>/tests/convex/ai/enhanced-logging-verification.test.ts',
  ],

  // Set roots to include test directory
  roots: ['<rootDir>/tests/convex'],

  // Coverage collection from source files
  collectCoverageFrom: [
    'apps/convex/lib/ai/questionGenerator.ts',
    'apps/convex/aiClarification.ts',
  ],

  // Coverage output 
  coverageDirectory: 'test-coverage/debug',
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

  // TypeScript transformation for ESM
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: 'es2020',
          module: 'esnext',
          moduleResolution: 'node',
        },
      },
    ],
  },

  // Allow Jest to transform ESM modules
  transformIgnorePatterns: ['node_modules/(?!(convex|@convex)/)'],

  // Don't use setup file to avoid dependency issues
  // setupFilesAfterEnv: [],

  // Minimal module name mapping - avoid problematic paths
  moduleNameMapper: {
    // Only include essential mappings
  },

  // Prevent watch mode
  watchman: false,
  verbose: true,
};