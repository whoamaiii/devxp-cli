# Release Process for DevXP CLI

This document outlines the release process for publishing new versions of DevXP CLI to npm.

## Pre-Release Checklist

### 1. Code Quality
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Code is formatted: `npm run format:check`
- [ ] TypeScript builds successfully: `npm run build`
- [ ] E2E tests pass: `npm run test:e2e`

### 2. Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md has been updated with new changes
- [ ] API documentation is current
- [ ] Examples are working and up to date
- [ ] QUICK_START.md reflects any new features

### 3. Version Management
- [ ] Version number follows semantic versioning
- [ ] Package.json version is correct
- [ ] Git tags are ready

## Release Types

### Patch Release (x.x.1)
Bug fixes and minor updates that don't break compatibility.
```bash
npm run release
```

### Minor Release (x.1.0)
New features that are backward compatible.
```bash
npm run release:minor
```

### Major Release (1.0.0)
Breaking changes or significant new features.
```bash
npm run release:major
```

## Release Process

### 1. Prepare Release Branch
```bash
git checkout -b release/v1.0.0
git pull origin main
```

### 2. Update Version and Changelog
```bash
# Update package.json version
npm version patch/minor/major --no-git-tag-version

# Update CHANGELOG.md
# Add release notes under [Unreleased] section
# Move them to new version section with date
```

### 3. Run Final Checks
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run all tests
npm run test:all

# Build project
npm run build

# Test CLI locally
npm link
devxp --version
devxp --help
npm unlink
```

### 4. Commit Changes
```bash
git add .
git commit -m "chore: prepare release v1.0.0"
```

### 5. Create Pull Request
```bash
git push origin release/v1.0.0
# Create PR on GitHub
# Get approval from maintainers
```

### 6. Merge and Tag
```bash
git checkout main
git pull origin main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

### 7. Publish to npm

#### First Time Setup
```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

#### Publish
```bash
# Dry run first
npm publish --dry-run

# Actual publish
npm publish

# Or use the release script
npm run release  # for patch
```

### 8. Create GitHub Release
1. Go to GitHub releases page
2. Click "Create a new release"
3. Select the tag you just created
4. Title: "v1.0.0 - Release Name"
5. Copy changelog entries for this version
6. Attach any relevant assets
7. Publish release

### 9. Post-Release
- [ ] Verify package on npm: https://www.npmjs.com/package/devxp-cli
- [ ] Test installation: `npm install -g devxp-cli@latest`
- [ ] Update documentation site (if applicable)
- [ ] Announce release on social media
- [ ] Notify users via Discord/Slack
- [ ] Update Docker image (if applicable)

## Hotfix Process

For critical bugs in production:

1. Create hotfix branch from main
```bash
git checkout -b hotfix/v1.0.1 main
```

2. Apply fix and test thoroughly
```bash
# Make fixes
npm test
npm run build
```

3. Fast-track through review process

4. Merge directly to main and tag
```bash
git checkout main
git merge --no-ff hotfix/v1.0.1
npm version patch
git push origin main --tags
npm publish
```

## Rollback Process

If a release has critical issues:

1. Unpublish the broken version (within 72 hours)
```bash
npm unpublish devxp-cli@1.0.0
```

2. Or deprecate it
```bash
npm deprecate devxp-cli@1.0.0 "Critical bug, please use 1.0.1"
```

3. Publish a fix immediately following the hotfix process

## npm Scripts Reference

```json
{
  "release": "npm version patch && npm publish",
  "release:minor": "npm version minor && npm publish",
  "release:major": "npm version major && npm publish",
  "prepublishOnly": "npm run test:ci && npm run build"
}
```

## Security Considerations

- Never commit sensitive data or API keys
- Use npm 2FA for publishing
- Regularly audit dependencies: `npm audit`
- Keep GitHub repository settings secure
- Use signed commits when possible

## Automation with GitHub Actions

The CI/CD pipeline automatically:
- Runs tests on all PRs
- Builds and tests on multiple Node versions
- Publishes to npm when a release is tagged
- Updates Docker images

To trigger automated release:
1. Push a tag starting with 'v'
2. GitHub Actions will handle the rest

## Contact

For questions about the release process:
- Slack: #devxp-releases
- Email: releases@devxp-cli.com
