// Jest configuration for Cloudflare Worker testing environment
// Based on project testing standards with Worker-specific adaptations

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node', // Worker environment is Node-like, not browser
  extensionsToTreatAsEsm: ['.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform configuration for TypeScript
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          target: 'es2022',
          module: 'esnext',
          moduleResolution: 'node',
        },
      },
    ],
  },

  // Test file patterns - now pointing to centralized tests/workers/log-ingestion/
  testMatch: [
    '<rootDir>/../../../tests/workers/log-ingestion/**/*.test.ts',
  ],

  // Setup files - setup.ts handles cross-file isolation
  setupFilesAfterEnv: [
    '<rootDir>/../../../tests/workers/log-ingestion/integration/setup.ts',
  ],

  // Optional: Force test files to run in isolation (slower but guarantees isolation)
  // Uncomment if cross-file contamination persists despite setup.ts changes
  // maxWorkers: 1,

  // Coverage configuration targeting 85% for Worker logic
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types.ts', // Type definitions don't need coverage
    '!src/**/index.ts', // Main entry has minimal logic
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    // Specific thresholds for critical files
    'src/rate-limiter.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/redis-client.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/log-processor.ts': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test timeout for async operations
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Globals for Worker environment (will be set up in setup.ts)
  globals: {
    Request: 'readonly',
    Response: 'readonly',
    Headers: 'readonly',
    URL: 'readonly',
    fetch: 'readonly',
    DurableObjectState: 'readonly',
    DurableObjectStub: 'readonly',
    ExecutionContext: 'readonly',
  },

  // Error reporting
  errorOnDeprecated: true,

  // Verbose output for debugging
  verbose: true,

  // Handle Worker-specific modules
  transformIgnorePatterns: ['node_modules/(?!(@cloudflare/workers-types)/)'],
};
