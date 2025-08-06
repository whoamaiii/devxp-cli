# DevXP CLI

🚀 **Gamify Your Development Experience** - Track your coding progress, earn achievements, and level up your skills!

[![npm version](https://img.shields.io/npm/v/devxp-cli.svg)](https://www.npmjs.com/package/devxp-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/devxp-cli.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

## 🎮 What is DevXP?

DevXP CLI is a command-line tool that gamifies your development workflow. It tracks your Git commits, coding sessions, and development activities to provide:

- 🏆 **Achievement System** - Unlock achievements as you code
- 📊 **XP & Leveling** - Gain experience points and level up
- 📈 **Statistics Tracking** - Monitor your coding habits and productivity
- 🏅 **Leaderboards** - Compare your progress with other developers
- 🎨 **Beautiful Visualizations** - See your progress in stunning terminal graphics
- 🔧 **Shell Integration** - Automatic tracking with your favorite shell

## 📸 Screenshots

```
╔═══════════════════════════════════════════════╗
║                  DevXP Status                  ║
╠═══════════════════════════════════════════════╣
║  Level 42 Developer                            ║
║  ████████████████░░░░░  12,450 / 15,000 XP   ║
║                                                ║
║  🔥 Current Streak: 7 days                     ║
║  ⚡ Today's XP: 450                            ║
║  🎯 Next Achievement: Code Warrior (78%)       ║
╚═══════════════════════════════════════════════╝
```

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g devxp-cli

# Or using yarn
yarn global add devxp-cli

# Or using pnpm
pnpm add -g devxp-cli
```

### Initial Setup

```bash
# Run the interactive setup wizard
devxp install

# Or manually configure
devxp config set name "Your Name"
devxp config set shell bash  # or zsh, fish
```

### Basic Usage

```bash
# Check your current status
devxp status

# View your achievements
devxp achievements

# Show statistics
devxp stats

# View leaderboard
devxp leaderboard

# Configure settings
devxp config
```

## 🎯 Features in Detail

### Achievement System

Unlock achievements based on your coding activities:

- **First Commit** - Make your first commit
- **Streak Master** - Maintain a 30-day coding streak
- **Night Owl** - Code after midnight
- **Early Bird** - Start coding before 6 AM
- **Refactor King** - Perform multiple refactoring commits
- **Bug Squasher** - Fix bugs consistently
- **Documentation Hero** - Write comprehensive documentation
- And many more!

### XP System

Earn XP through various activities:

| Activity | XP Earned |
|----------|----------|
| Git Commit | 10-50 XP |
| Pull Request | 100 XP |
| Code Review | 75 XP |
| Issue Resolved | 50 XP |
| Documentation | 30 XP |
| Test Writing | 40 XP |

### Shell Integration

Automatically track your development activities by integrating with your shell:

```bash
# For Bash
echo 'eval "$(devxp shell-integration bash)"' >> ~/.bashrc

# For Zsh
echo 'eval "$(devxp shell-integration zsh)"' >> ~/.zshrc

# For Fish
devxp shell-integration fish | source
echo 'devxp shell-integration fish | source' >> ~/.config/fish/config.fish
```

## 🛠️ Advanced Configuration

### Configuration File

DevXP stores configuration in `~/.config/devxp/config.json`:

```json
{
  "name": "John Doe",
  "theme": "neon",
  "notifications": true,
  "trackingEnabled": true,
  "excludePaths": ["/node_modules", "/.git"],
  "xpMultiplier": 1.0
}
```

### Environment Variables

```bash
# Set custom config directory
export DEVXP_CONFIG_DIR="$HOME/.myconfig/devxp"

# Set custom database location
export DEVXP_DB_PATH="$HOME/.mydata/devxp.db"

# Enable debug mode
export DEVXP_DEBUG=true
```

### Git Hooks Integration

Automatically track Git activities:

```bash
# Install Git hooks for current repository
devxp install --git-hooks

# Install globally for all repositories
devxp install --git-hooks --global
```

## 📚 API Reference

### Commands

#### `devxp status [options]`
Display current level, XP, and recent activity.

**Options:**
- `-v, --verbose` - Show detailed information
- `-j, --json` - Output in JSON format

#### `devxp achievements [options]`
List all achievements and progress.

**Options:**
- `--unlocked` - Show only unlocked achievements
- `--locked` - Show only locked achievements
- `--recent` - Show recently unlocked achievements

#### `devxp stats [period]`
Display coding statistics.

**Arguments:**
- `period` - Time period: `today`, `week`, `month`, `year`, `all` (default: `week`)

#### `devxp leaderboard [options]`
Show leaderboard rankings.

**Options:**
- `--global` - Show global leaderboard
- `--friends` - Show friends leaderboard
- `--limit <n>` - Number of entries to show

#### `devxp config <action> [key] [value]`
Manage configuration settings.

**Actions:**
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `list` - List all configuration
- `reset` - Reset to defaults

## 🧪 Development

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm
- Git

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/devxp-cli.git
cd devxp-cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure

```
devxp-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── status.command.ts
│   │   ├── achievements.command.ts
│   │   ├── stats.command.ts
│   │   └── ...
│   ├── modules/              # Core modules
│   │   ├── xp-system.ts     # XP calculation logic
│   │   ├── achievements.ts   # Achievement system
│   │   ├── database.ts       # SQLite database
│   │   └── ...
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── tests/                    # Test files
├── docs/                     # Documentation
└── package.json
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build for production |
| `npm run dev` | Run in development mode |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |

### Creating Custom Commands

```typescript
// src/commands/mycommand.command.ts
import { Command } from '../types/command.js';
import { logger } from '../utils/logger.js';

export class MyCommand implements Command {
  readonly name = 'mycommand';
  readonly description = 'Description of my command';
  readonly aliases = ['mc'];
  
  async execute(args: ReadonlyArray<string>): Promise<void> {
    logger.info('Executing my command');
    // Your implementation here
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/yourusername/devxp-cli/issues) with a detailed description.

## 💡 Feature Requests

Have an idea? We'd love to hear it! [Open an issue](https://github.com/yourusername/devxp-cli/issues) with the `enhancement` label.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js/)
- Terminal graphics powered by [Chalk](https://github.com/chalk/chalk) and [Boxen](https://github.com/sindresorhus/boxen)
- Database management with [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- Inspired by gaming achievement systems

## 📧 Contact

- **Author**: Your Name
- **Email**: your.email@example.com
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)
- **Website**: [yourwebsite.com](https://yourwebsite.com)

---

<p align="center">Made with ❤️ by developers, for developers</p>
<p align="center">⭐ Star us on GitHub — it helps!</p>
