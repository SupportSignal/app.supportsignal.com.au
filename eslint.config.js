
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended, // TIER 1: Frontend Environment (Strict)
  // Files: apps/web/**/*.{ts,tsx} - Browser-only globals, strict rules
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals only
        window: 'readonly',
        document: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        // DOM types for React components
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        // React types
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'error', // Strict: no console in frontend
      'prefer-const': 'error',
      // Strict: no process.env in frontend
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'MemberExpression[object.name="process"][property.name="env"]',
          message:
            'Direct access to process.env is not allowed in frontend. Use centralized configuration instead.',
        },
      ],
    },
  }, // TIER 2: Backend Environment (Pragmatic)
  // Files: apps/convex/**/*.ts - Convex runtime globals, flexible rules
  {
    files: ['apps/convex/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Convex runtime globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        // Node.js-like globals available in Convex
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn', // Pragmatic: warn not error
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'warn', // Pragmatic: console warnings OK
      'prefer-const': 'error',
      // Allow process.env in backend
      'no-restricted-syntax': 'off',
    },
  }, // TIER 3: Workers Environment (Pragmatic)
  // Files: apps/workers/**/*.ts - Cloudflare Workers runtime globals, flexible rules
  {
    files: ['apps/workers/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Cloudflare Workers runtime globals
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        crypto: 'readonly',
        // Workers-specific globals
        DurableObjectState: 'readonly',
        DurableObjectStub: 'readonly',
        DurableObjectNamespace: 'readonly',
        ExecutionContext: 'readonly',
        // Standard globals available in Workers
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn', // Pragmatic: warn not error
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ], // Allow underscore-prefixed unused vars/params/errors
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-nocheck in workers for pragmatic development
      'no-console': 'warn', // Pragmatic: console warnings OK in workers
      'prefer-const': 'error',
      // Allow flexible syntax in workers
      'no-restricted-syntax': 'off',
    },
  }, // TIER 4: Generated Code (Minimal)
  // Files: **/_generated/**/* - Most linting disabled
  {
    files: ['**/_generated/**/*', '**/convex/_generated/**/*'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // Minimal rules for generated code - focus on compilation only
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'prefer-const': 'off',
      'no-restricted-syntax': 'off',
    },
  }, // JavaScript files (legacy support)
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'warn',
    },
  }, // Config files and test setup
  {
    files: [
      '**/jest.config.js',
      '**/jest.setup.js',
      '**/playwright.config.ts',
      '**/test-config/**/*',
      '**/*.config.js',
      '**/*.config.ts',
      'eslint.config.js',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        URLSearchParams: 'readonly',
        navigator: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }, // Test files (Jest environment)
  {
    files: [
      '**/__tests__/**/*',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__mocks__/**/*',
      'tests/**/*',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Browser globals for jsdom
        window: 'readonly',
        document: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        // Node.js globals for test environment
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        // Standard timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URLSearchParams: 'readonly',
        // React Testing Library utilities (if imported)
        fireEvent: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-nocheck in test files
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      'no-undef': 'off', // Turn off for test files since we're mocking globals
      'no-unused-vars': 'off', // Turn off basic ESLint unused vars rule for test files
    },
  },
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'dist/',
      'build/',
      '.turbo/',
      '.convex/',
      'coverage/',
      'apps/convex/_generated/',
    ],
  },
];
