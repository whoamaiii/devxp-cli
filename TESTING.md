# DevXP CLI Testing Suite

## Overview

This document describes the comprehensive testing suite for the DevXP CLI application, covering unit tests, integration tests, CLI command tests with snapshots, performance tests, and end-to-end tests.

## Test Structure

```
├── src/
│   ├── modules/
│   │   ├── xp-system.test.ts          # Unit tests for XP calculations
│   │   ├── database.integration.test.ts # Integration tests for database
│   │   └── git-hooks.test.ts          # Unit tests for git hooks
│   └── commands/
│       └── __tests__/
│           └── *.command.test.ts      # CLI command tests with snapshots
├── e2e/
│   └── full-workflow.spec.ts          # End-to-end workflow tests
├── jest.config.js                     # Jest configuration
├── jest.setup.js                       # Jest setup and helpers
└── playwright.config.ts               # Playwright configuration
```

## Test Categories

### 1. Unit Tests
Tests for individual modules and functions in isolation.

**Coverage:**
- XP calculation logic and level progression
- Streak and multiplier calculations
- Challenge and achievement systems
- Git commit analysis and quality scoring
- Configuration management

**Run:**
```bash
npm run test:unit
```

### 2. Integration Tests
Tests for database operations and module interactions.

**Coverage:**
- Database CRUD operations
- User management
- Activity tracking
- XP history
- Leaderboard queries
- Backup and restore functionality
- Data import/export

**Run:**
```bash
npm run test:integration
```

### 3. CLI Command Tests
Tests for CLI commands with snapshot testing.

**Coverage:**
- Command help output
- Shell integration commands
- Configuration commands
- Error handling
- JSON output formats

**Run:**
```bash
npm run test:unit -- shell-integration.command.test
```

### 4. Performance Tests
Tests for shell integration and performance monitoring.

**Coverage:**
- Command debouncing
- Concurrent operations
- Heavy activity handling
- Resource usage

**Run:**
```bash
npm run test:integration -- --testNamePattern="Performance"
```

### 5. End-to-End Tests
Complete workflow tests using Playwright.

**Coverage:**
- Complete XP earning workflow
- Shell integration workflow
- Achievement and challenge workflow
- Data export/import workflow
- Multi-user scenarios
- Error recovery

**Run:**
```bash
npm run test:e2e
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode with coverage
npm run test:ci
```

### Specific Test Files
```bash
# Run specific test file
npx jest src/modules/xp-system.test.ts

# Run tests matching pattern
npx jest --testNamePattern="XP calculation"

# Run tests in specific directory
npx jest src/modules
```

## Test Coverage

The test suite aims for the following coverage targets:
- **Lines:** 80%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 80%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Mocking

### Common Mocks

**File System:**
```typescript
jest.mock('fs/promises');
```

**Child Process:**
```typescript
jest.mock('child_process');
```

**Database:**
```typescript
jest.mock('./database');
```

### Mock Helpers

The `jest.setup.js` file provides global test helpers:
- `testHelpers.generateUserId()` - Generate random user IDs
- `testHelpers.generateTimestamp(daysAgo)` - Generate timestamps
- `testHelpers.sleep(ms)` - Async sleep helper

## Snapshot Testing

Snapshots are used for CLI command output testing. Update snapshots when output changes are intentional:

```bash
# Update all snapshots
npm run test:unit -- -u

# Update specific snapshot
npm run test:unit -- shell-integration.command.test -u
```

## Custom Matchers

The test suite includes custom Jest matchers:

```typescript
expect(value).toBeWithinRange(min, max);
```

## Performance Testing

Performance tests verify:
- Operations complete within time limits
- No memory leaks
- Proper resource cleanup
- Concurrent operation handling

## E2E Testing

End-to-end tests use Playwright to test complete workflows:

### Configuration
- Tests run in isolated temporary directories
- Each test creates its own git repository
- Automatic cleanup after tests

### Debugging E2E Tests
```bash
# Run with headed browser (if applicable)
npx playwright test --headed

# Debug specific test
npx playwright test --debug full-workflow.spec.ts

# View trace
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: coverage
          path: coverage/
```

## Test Data

### Test Database
Integration tests use temporary SQLite databases in system temp directory.

### Test Git Repositories
E2E tests create temporary git repositories for testing hooks and commands.

### Cleanup
All test data is automatically cleaned up after test completion.

## Troubleshooting

### Common Issues

**"Database not initialized" errors:**
- Ensure `beforeEach` hooks properly initialize the database
- Check that async operations are properly awaited

**Snapshot mismatches:**
- Review the diff carefully
- Update snapshots if changes are intentional
- Check for environment-specific output

**E2E test timeouts:**
- Increase timeout in `playwright.config.ts`
- Check for hanging async operations
- Verify CLI build is complete

**Mock not working:**
- Ensure mock is defined before module import
- Check mock path matches actual module path
- Verify mock implementation returns expected types

## Best Practices

1. **Test Isolation:** Each test should be independent
2. **Clear Names:** Use descriptive test names
3. **Arrange-Act-Assert:** Follow AAA pattern
4. **Mock External Dependencies:** Don't make real API calls or file system changes
5. **Test Edge Cases:** Include boundary conditions and error cases
6. **Keep Tests Fast:** Mock heavy operations
7. **Use Fixtures:** Share common test data setup
8. **Clean Up:** Always clean up test data and restore mocks

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for database changes
3. Update E2E tests for new workflows
4. Ensure coverage targets are met
5. Update snapshots if CLI output changes
6. Document new test helpers or patterns

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest Mock Functions](https://jestjs.io/docs/mock-functions)
- [Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
