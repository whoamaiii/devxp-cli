# DevXP CLI Dependencies

This document provides an overview of all the core dependencies installed for the DevXP CLI project.

## Core Dependencies

### 1. **Commander.js** (v14.0.0)
- **Purpose**: Command-line interface framework
- **Usage**: Parsing CLI arguments, defining commands and options
- **Documentation**: [Commander.js](https://github.com/tj/commander.js)
```typescript
import { Command } from 'commander';
const program = new Command();
program.version('1.0.0').parse(process.argv);
```

### 2. **Chalk** (v5.5.0)
- **Purpose**: Terminal string styling
- **Usage**: Colorful console output for better UX
- **Documentation**: [Chalk](https://github.com/chalk/chalk)
```typescript
import chalk from 'chalk';
console.log(chalk.blue('Hello World!'));
```

### 3. **Ora** (v8.2.0)
- **Purpose**: Elegant terminal spinners
- **Usage**: Loading indicators for async operations
- **Documentation**: [Ora](https://github.com/sindresorhus/ora)
```typescript
import ora from 'ora';
const spinner = ora('Loading...').start();
// ... async operation
spinner.succeed('Done!');
```

### 4. **Boxen** (v8.0.1)
- **Purpose**: Create boxes in the terminal
- **Usage**: Styled terminal boxes for important messages
- **Documentation**: [Boxen](https://github.com/sindresorhus/boxen)
```typescript
import boxen from 'boxen';
console.log(boxen('Hello', { padding: 1 }));
```

### 5. **Figlet** (v1.8.2)
- **Purpose**: ASCII art text generation
- **Usage**: Creating stylized text headers
- **Documentation**: [Figlet](https://github.com/patorjk/figlet.js)
```typescript
import figlet from 'figlet';
figlet('DevXP CLI', (err, data) => {
  console.log(data);
});
```

### 6. **SQLite3** (v5.1.7) & **Better-SQLite3** (v12.2.0)
- **Purpose**: Local database storage
- **Usage**: 
  - `sqlite3`: Asynchronous SQLite operations
  - `better-sqlite3`: Synchronous, faster SQLite operations
- **Documentation**: 
  - [SQLite3](https://github.com/TryGhost/node-sqlite3)
  - [Better-SQLite3](https://github.com/JoshuaWise/better-sqlite3)
```typescript
import Database from 'better-sqlite3';
const db = new Database('app.db');
```

### 7. **Conf** (v14.0.0)
- **Purpose**: Simple config management
- **Usage**: Storing user preferences and configuration
- **Documentation**: [Conf](https://github.com/sindresorhus/conf)
```typescript
import Conf from 'conf';
const config = new Conf({ projectName: 'devxp-cli' });
config.set('key', 'value');
```

## Development Dependencies

### TypeScript & Build Tools
- **@types/node** (v24.2.0): Node.js type definitions
- **@types/figlet** (v1.7.0): Figlet type definitions
- **tsx** (v4.20.3): TypeScript execution engine
- **typescript** (v5.9.2): TypeScript compiler

### Code Quality Tools
- **eslint** (v9.32.0): JavaScript/TypeScript linter
- **@typescript-eslint/eslint-plugin** (v8.39.0): TypeScript ESLint rules
- **@typescript-eslint/parser** (v8.39.0): TypeScript ESLint parser
- **prettier** (v3.6.2): Code formatter

## Configuration Files

### ESLint Configuration (`.eslintrc.json`)
- Configured for TypeScript with recommended rules
- Enforces consistent code style
- Allows console statements for CLI development

### Prettier Configuration (`.prettierrc.json`)
- Single quotes
- Semicolons required
- 2-space indentation
- 100 character line width

## Package Scripts

```json
{
  "build": "tsc",              // Build TypeScript to JavaScript
  "dev": "tsx src/index.ts",   // Run TypeScript directly
  "watch": "tsc --watch",      // Watch mode for development
  "lint": "eslint src --ext .ts", // Lint TypeScript files
  "format": "prettier --write 'src/**/*.ts'" // Format code
}
```

## Testing Dependencies

To verify all dependencies are working correctly, run:
```bash
npx tsx src/test-dependencies.ts
```

## Example Usage

See `src/cli-example.ts` for a comprehensive example demonstrating all installed dependencies in action:
```bash
npx tsx src/cli-example.ts --help
```

Available example commands:
- `welcome` - Display ASCII art welcome message
- `config` - Manage configuration
- `stats` - Show usage statistics
- `demo-spinner` - Demonstrate spinner styles
- `colors` - Show color palette

## Next Steps

With all dependencies installed and configured, you can now:
1. Build the main CLI structure using Commander.js
2. Implement colorful output with Chalk
3. Add loading spinners with Ora
4. Create styled boxes with Boxen
5. Generate ASCII art with Figlet
6. Store data locally with SQLite
7. Manage configuration with Conf
