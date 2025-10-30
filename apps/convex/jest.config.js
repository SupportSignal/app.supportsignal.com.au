module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/../../tests/convex'],
  testMatch: ['../../tests/convex/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/_generated/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  // Move coverage outside convex functions directory to avoid conflicts
  coverageDirectory: '../../test-coverage/convex',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/_generated/',
    '/coverage/',
    '/test-coverage/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
    '^.+\\.js$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // Allow Jest to transform ESM modules
  transformIgnorePatterns: ['node_modules/(?!(convex|@convex|convex-test)/)'],

  // ESM support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  // Setup file for test configuration
  setupFilesAfterEnv: ['<rootDir>/../../tests/convex/setup.ts'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@convex/(.*)$': '<rootDir>/$1',
    '^@convex-tests/(.*)$': '<rootDir>/../../tests/convex/$1',
    '^@web/(.*)$': '<rootDir>/../web/$1',
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/$1',
  },

  // Prevent watch mode from automatically starting
  watchman: false,
};
