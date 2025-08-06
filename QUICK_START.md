# 🚀 DevXP CLI - Quick Start Guide

Get up and running with DevXP CLI in under 2 minutes!

## One-Line Installation

### Using npm (Recommended)
```bash
npm install -g devxp-cli && devxp install
```

### Using the Quick Install Script
```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/devxp-cli/main/quick-install.sh | bash
```

### Using Docker
```bash
docker run -it --rm -v ~/.devxp:/data devxp/cli
```

## Manual Installation

### Step 1: Install DevXP CLI
```bash
npm install -g devxp-cli
```

### Step 2: Run Setup Wizard
```bash
devxp install
```
This will:
- ✅ Create configuration directory
- ✅ Initialize SQLite database
- ✅ Set up user profile
- ✅ Configure shell integration (optional)
- ✅ Install Git hooks (optional)

### Step 3: Configure Your Shell (Optional)

#### Bash
```bash
echo 'eval "$(devxp shell-integration bash)"' >> ~/.bashrc
source ~/.bashrc
```

#### Zsh
```bash
echo 'eval "$(devxp shell-integration zsh)"' >> ~/.zshrc
source ~/.zshrc
```

#### Fish
```bash
echo 'devxp shell-integration fish | source' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

## First Commands

### Check Your Status
```bash
devxp status
```
Shows your current level, XP, and recent activity.

### View Achievements
```bash
devxp achievements
```
See all available achievements and your progress.

### Show Statistics
```bash
devxp stats week
```
Display your coding statistics for the past week.

### View Leaderboard
```bash
devxp leaderboard
```
See how you rank against other developers.

## Common Workflows

### Track Git Commits Automatically
```bash
# In any Git repository
devxp install --git-hooks

# Now all commits will be tracked automatically!
git commit -m "feat: Add awesome feature"
# +50 XP earned! 🎉
```

### Manual Activity Tracking
```bash
# Track a code review
devxp track review "Reviewed PR #123"

# Track learning
devxp track learning "Completed TypeScript course"

# Track debugging
devxp track debug "Fixed production bug"
```

### Daily Challenges
```bash
# View today's challenges
devxp challenges

# Complete a challenge
devxp challenge complete daily-commit
```

## Configuration

### Set Your Name
```bash
devxp config set name "John Doe"
```

### Enable Notifications
```bash
devxp config set notifications true
```

### Set Theme
```bash
devxp config set theme neon  # Options: default, neon, matrix, retro
```

### View All Settings
```bash
devxp config list
```

## Tips & Tricks

### 🎯 Quick Level Up
- Make frequent, meaningful commits
- Write comprehensive commit messages
- Review code regularly
- Document your code
- Write tests

### 🏆 Unlock Achievements Faster
- Maintain daily coding streaks
- Try different types of development activities
- Participate in code reviews
- Contribute to open source

### ⚡ Power User Features
```bash
# Export stats as JSON
devxp stats --json > stats.json

# View detailed achievement info
devxp achievements --detailed

# Track custom metrics
devxp track custom "metric-name" --value 100
```

## Troubleshooting

### Command Not Found
```bash
# Verify installation
npm list -g devxp-cli

# Reinstall if needed
npm uninstall -g devxp-cli
npm install -g devxp-cli
```

### Permission Issues
```bash
# Fix npm permissions
sudo npm install -g devxp-cli

# Or use a Node version manager (recommended)
nvm use 20
npm install -g devxp-cli
```

### Database Issues
```bash
# Reset database (WARNING: Loses all data)
devxp reset --hard

# Backup database first
cp ~/.config/devxp/devxp.db ~/.config/devxp/devxp.db.backup
```

### Shell Integration Not Working
```bash
# Verify shell type
echo $SHELL

# Manually add to RC file
vim ~/.bashrc  # or ~/.zshrc
# Add: eval "$(devxp shell-integration bash)"
```

## Need Help?

- 📖 Full Documentation: `devxp help`
- 🐛 Report Issues: [GitHub Issues](https://github.com/yourusername/devxp-cli/issues)
- 💬 Community: [Discord Server](https://discord.gg/devxp)
- 📧 Email: support@devxp-cli.com

## What's Next?

1. **Complete your first achievement** - Make a commit!
2. **Set up Git hooks** - Track automatically
3. **Join the leaderboard** - Compare with friends
4. **Customize your experience** - Configure themes and settings
5. **Share your progress** - Export and share stats

---

**Happy Coding! 🚀** May your commits be meaningful and your XP ever-growing!
