// Root-level Jest configuration for web logic tests
// Tests are located in tests/web/ for centralized organization
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Test discovery - only look in tests/web directory
  testMatch: [
    '<rootDir>/tests/web/**/*.test.ts',
    '<rootDir>/tests/web/**/*.test.tsx',
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
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],

  // TypeScript transformation for ESM with JSX support
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          verbatimModuleSyntax: false,
          module: 'ESNext',
          moduleResolution: 'node',
        },
      },
    ],
    '^.+\\.(js|jsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          verbatimModuleSyntax: false,
          module: 'ESNext',
        },
      },
    ],
  },

  // Allow Jest to transform ESM modules
  transformIgnorePatterns: ['node_modules/(?!(convex|@convex)/)'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/$1',
    '^@convex/(.*)$': '<rootDir>/apps/convex/$1',
    '^@web/(.*)$': '<rootDir>/apps/web/$1',
    '^@ui/(.*)$': '<rootDir>/packages/ui/$1',
    '^@starter/ui$': '<rootDir>/packages/ui/index.ts',
    '^@starter/ui/(.*)$': '<rootDir>/packages/ui/src/$1',
  },

  // Setup file for React/jsdom environment
  setupFilesAfterEnv: ['<rootDir>/tests/web/setup.ts'],

  // Prevent watch mode from automatically starting
  watchman: false,
};
