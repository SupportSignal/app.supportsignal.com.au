# Monorepo Setup Example

## Overview

This example demonstrates the complete setup of a Bun-based Turborepo monorepo with essential development tooling, extracted from Story 1.1 implementation.

## Context

**When to use**: Setting up a new monorepo project with modern JavaScript tooling
**Pattern Reference**: [Architecture Patterns - Monorepo Organization](../../patterns/architecture-patterns.md#monorepo-organization)
**Story Reference**: [Story 1.1 - Monorepo & Tooling Initialization](../../stories/1.1.story.md)

## Implementation

### Project Structure

```
/
├── .github/
│   └── workflows/              # CI/CD workflows
├── apps/
│   ├── web/                   # Next.js frontend application
│   ├── workers/               # Cloudflare Workers for Edge API
│   └── convex/                # Convex backend app
├── packages/
│   ├── ui/                    # Shared, reusable UI component library
│   ├── config/                # Shared configurations (ESLint, TSConfig)
│   ├── data-access/           # Implementation of the Repository Pattern
│   ├── storybook/             # Storybook environment
│   └── shared-types/          # Shared TypeScript types
├── docs/                      # Project documentation
├── package.json               # Root package configuration
├── turbo.json                 # Turborepo configuration
├── eslint.config.js           # ESLint configuration
├── .prettierrc                # Prettier configuration
├── commitlint.config.js       # Commitlint configuration
├── .husky/                    # Git hooks
│   ├── pre-commit             # Pre-commit linting
│   └── commit-msg             # Commit message validation
└── bun.lockb                  # Bun lock file
```

### Key Configuration Files

#### Root package.json

```json
{
  "name": "starter-nextjs-convex-ai",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "format": "prettier --write \"**/*.{js,ts,tsx,md}\"",
    "format:check": "prettier --check \"**/*.{js,ts,tsx,md}\"",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.5.0",
    "@commitlint/config-conventional": "^19.5.0",
    "eslint": "^9.15.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10",
    "prettier": "^3.3.3",
    "turbo": "^2.5.4",
    "typescript": "^5.4.5"
  }
}
```

#### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "lint:fix": {
      "dependsOn": ["^lint:fix"],
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

#### eslint.config.js

```javascript
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
```

#### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### commitlint.config.js

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'perf',
        'revert',
      ],
    ],
  },
};
```

### Git Hooks Setup

#### .husky/pre-commit

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### .husky/commit-msg

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit $1
```

## Implementation Steps

### 1. Initialize Project Structure

```bash
# Create directory structure
mkdir -p apps/{web,workers,convex}
mkdir -p packages/{ui,config,data-access,storybook,shared-types}
mkdir -p .github/workflows
mkdir docs

# Initialize git repository
git init
```

### 2. Setup Bun and Turborepo

```bash
# Initialize Bun
bun init

# Install Turborepo
bun add -D turbo

# Create turbo.json configuration
# (See configuration above)
```

### 3. Install Development Tooling

```bash
# Install ESLint and related packages
bun add -D eslint @eslint/js

# Install Prettier
bun add -D prettier

# Install Husky and lint-staged
bun add -D husky lint-staged

# Install commitlint
bun add -D @commitlint/cli @commitlint/config-conventional

# Install TypeScript
bun add -D typescript
```

### 4. Configure Git Hooks

```bash
# Initialize Husky
npx husky init

# Create pre-commit hook
# (See hook configuration above)

# Create commit-msg hook
# (See hook configuration above)
```

### 5. Create Configuration Files

```bash
# Create all configuration files
# (See configurations above)
```

## Validation Steps

### 1. Test Tooling Integration

```bash
# Test ESLint
bun run lint

# Test Prettier
bun run format:check

# Test build system
bun run build

# Test TypeScript
bun run typecheck
```

### 2. Test Git Hooks

```bash
# Test pre-commit hook
git add .
git commit -m "test: validate tooling setup"

# Should trigger:
# - lint-staged (ESLint and Prettier)
# - commitlint validation
```

## Patterns Demonstrated

### Monorepo Structure Pattern

- Clear separation between `apps/` and `packages/`
- Shared configuration through workspace root
- Consistent tooling across all packages

### Development Tooling Pattern

- ESLint for code quality
- Prettier for code formatting
- Husky for git hooks
- Commitlint for commit message standards
- TypeScript for type safety

### Build System Pattern

- Turborepo for efficient builds
- Task dependencies and caching
- Consistent scripts across workspace

## Lessons Learned

### What Worked Well

- Bun provided fast package management
- Turborepo simplified monorepo management
- Git hooks ensured consistent code quality
- Conventional commits improved change tracking

### Challenges Encountered

- ESLint configuration required Node.js globals
- Git hook permissions needed proper setup
- Tool compatibility verification was essential

### Key Insights

- Upfront tooling setup pays dividends later
- Consistent configuration prevents team friction
- Automated quality checks catch issues early

## Variations and Extensions

### Alternative Package Managers

- Can be adapted for npm or pnpm
- Adjust lock file and installation commands
- Update workspace configuration syntax

### Additional Tooling

- Add Jest for testing
- Include Storybook for component development
- Add semantic-release for automated releases

### CI/CD Integration

- GitHub Actions workflows
- Automated testing and deployment
- Quality gates and checks

## Related Examples

- [Frontend Configuration](../frontend/) - For Next.js specific setup
- [Backend Configuration](../backend/) - For Convex specific setup
- [Testing Configuration](../testing/) - For test framework setup

## Related Patterns

- [Architecture Patterns - Monorepo Organization](../../patterns/architecture-patterns.md#monorepo-organization)
- [Development Workflow Patterns - Tooling Patterns](../../patterns/development-workflow-patterns.md#tooling-patterns)
- [Architecture Patterns - Configuration Patterns](../../patterns/architecture-patterns.md#configuration-patterns)
