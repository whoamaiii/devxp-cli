# Contributing to DevXP CLI

First off, thank you for considering contributing to DevXP CLI! It's people like you that make DevXP CLI such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/devxp-cli.git
cd devxp-cli

# Install dependencies
npm install

# Create a branch
git checkout -b my-feature-branch

# Make your changes and test
npm run dev
npm test

# Commit your changes
git add .
git commit -m "Add some feature"

# Push to your fork
git push origin my-feature-branch
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Run tests
npm test
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Build
npm run build
npm run watch  # Watch mode
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
  * 🎨 `:art:` when improving the format/structure of the code
  * 🐛 `:bug:` when fixing a bug
  * 🔥 `:fire:` when removing code or files
  * 📝 `:memo:` when writing docs
  * 🚀 `:rocket:` when improving performance
  * ✅ `:white_check_mark:` when adding tests
  * 🔒 `:lock:` when dealing with security
  * ⬆️ `:arrow_up:` when upgrading dependencies
  * ⬇️ `:arrow_down:` when downgrading dependencies

### TypeScript Styleguide

* Use TypeScript strict mode
* Prefer `const` over `let`
* Use meaningful variable names
* Write self-documenting code
* Add JSDoc comments for public APIs
* Use async/await over promises when possible
* Handle errors appropriately
* Write unit tests for new features

### Documentation Styleguide

* Use Markdown
* Reference functions and classes in backticks: \`functionName()\`
* Include code examples where appropriate
* Keep line length to 80 characters where possible
* Use present tense
* Use active voice

## Testing

We use Jest for testing. Please write tests for any new features or bug fixes.

```typescript
// Example test structure
describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Project Structure

```
src/
├── commands/       # CLI commands
├── modules/        # Core modules
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── config/         # Configuration management
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers directly.

## Recognition

Contributors will be recognized in our README and release notes. Thank you for your contributions!
