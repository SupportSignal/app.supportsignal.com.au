# Gitleaks Secret Detection Setup

This project uses [Gitleaks](https://github.com/gitleaks/gitleaks) to prevent API keys and secrets from being committed to the repository.

## Overview

- **Purpose**: Detect and prevent secrets from being committed
- **Integration**: Pre-commit hooks + GitHub Actions CI
- **Configuration**: `.gitleaks.toml` (filters false positives)
- **Failure Mode**: Blocks commits and CI builds when secrets detected

## Components

### 1. Pre-commit Hook

Located at `.git/hooks/pre-commit`, this hook:

- Runs `gitleaks protect --staged` on every commit
- Scans only staged files for performance
- Uses `.gitleaks.toml` configuration to reduce false positives
- Provides helpful error messages with bypass instructions

**Bypass**: Use `git commit --no-verify` (use carefully!)

### 2. GitHub Actions CI

Added to `.github/workflows/ci.yml`:

- **Job**: `security` (runs first, blocks other jobs if fails)
- **Scope**: Full repository history scan
- **Failure**: Prevents deployment if secrets detected

### 3. Configuration File

`.gitleaks.toml` includes:

- **Base rules**: Uses Gitleaks default detection patterns
- **Allowlist**: Ignores documentation placeholders and test fixtures
- **Stop words**: Automatically ignores obvious placeholders
- **Path filtering**: Excludes common false positive locations

## Usage

### Manual Scanning

```bash
# Scan entire repository
gitleaks detect --config=.gitleaks.toml

# Scan only staged files (pre-commit)
gitleaks protect --staged --config=.gitleaks.toml

# Generate detailed report
gitleaks detect --config=.gitleaks.toml --report-path=security-audit.json
```

### Common Commands

```bash
# Install Gitleaks
brew install gitleaks

# Check version
gitleaks version

# Test configuration
gitleaks detect --config=.gitleaks.toml --verbose
```

## Configuration Examples

### Adding Allowlist Rules

To ignore specific patterns in `.gitleaks.toml`:

```toml
[[rules]]
description = "Allow test API keys"
id = "test-keys"
regex = '''test-api-key-[0-9]+'''
path = '''tests/.*\.ts'''
```

### Path-based Exclusions

```toml
[allowlist]
paths = [
    '''docs/.*\.md$''',      # All documentation
    '''tests/.*\.ts$''',     # All test files
    '''\.example$'''         # Example files
]
```

## Troubleshooting

### False Positives

1. **Identify the pattern**: Check what Gitleaks detected
2. **Update `.gitleaks.toml`**: Add allowlist rules for legitimate cases
3. **Test changes**: Run `gitleaks detect --config=.gitleaks.toml`
4. **Emergency bypass**: Use `git commit --no-verify` if urgent

### CI Failures

1. **Check logs**: Look at GitHub Actions security job output
2. **Local testing**: Run `gitleaks detect --config=.gitleaks.toml`
3. **Fix configuration**: Update `.gitleaks.toml` if needed
4. **Re-push**: Changes to config will fix CI on next push

### Installation Issues

If developers don't have Gitleaks installed:

```bash
# macOS
brew install gitleaks

# Linux
curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_$(uname -s)_$(uname -m).tar.gz | tar -xz
sudo mv gitleaks /usr/local/bin/
```

## Security Benefits

- **Prevents data breaches**: Stops secrets from reaching public repositories
- **Early detection**: Catches issues before code review
- **Comprehensive coverage**: Scans both new commits and full history
- **Low false positives**: Configured to minimize developer friction
- **CI integration**: Ensures deployment safety

## Maintenance

- **Regular updates**: Keep Gitleaks version current with `brew upgrade gitleaks`
- **Configuration tuning**: Adjust `.gitleaks.toml` as new patterns emerge
- **Team training**: Ensure developers understand bypass procedures
- **Audit reports**: Periodically scan full repository history

## Related Documentation

- [Gitleaks Official Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Actions Integration](https://github.com/gitleaks/gitleaks-action)
- [TOML Configuration Reference](https://github.com/gitleaks/gitleaks#configuration)