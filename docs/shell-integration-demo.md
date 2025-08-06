# DevXP Shell Integration Demo

## Overview
The DevXP Shell Integration provides automatic command tracking for zsh, allowing the system to award XP for productive terminal commands without manual intervention.

## Features

### 1. **Automatic Command Tracking**
- Tracks productive commands (git, npm, docker, etc.)
- Ignores navigation commands (cd, ls, pwd, etc.)
- Debouncing to prevent XP spam (5-second default)

### 2. **Privacy Mode**
- Temporarily disable tracking for sensitive work
- Can be toggled via shell commands or CLI

### 3. **Smart Command Classification**
- Pre-configured lists of productive vs ignored commands
- Customizable command lists

## Installation

```bash
# Install the shell integration
devxp shell-integration install

# Restart your shell or source the config
source ~/.zshrc
```

## Shell Commands

Once installed, these commands are available in your shell:

### `devxp-toggle`
Enable or disable DevXP tracking globally.

```bash
# Toggle tracking on/off
devxp-toggle
```

### `devxp-privacy`
Control privacy mode for temporary tracking suspension.

```bash
# Enable privacy mode
devxp-privacy on

# Disable privacy mode
devxp-privacy off

# Check status
devxp-privacy
```

### `devxp-status`
Check if the DevXP daemon is running.

```bash
devxp-status
```

### `devxp-stats`
View your current XP statistics.

```bash
devxp-stats
```

## CLI Management Commands

### Check Status
```bash
devxp shell-integration status
```

### Configure Settings
```bash
# Set debounce time (milliseconds)
devxp shell-integration config --debounce 3000

# Show productive commands list
devxp shell-integration config --show-productive

# Show ignored commands list
devxp shell-integration config --show-ignored

# Add a productive command
devxp shell-integration config --add-productive "terraform"

# Remove an ignored command
devxp shell-integration config --remove-ignored "ls"
```

### Privacy Mode Management
```bash
# Enable privacy mode
devxp shell-integration privacy on

# Disable privacy mode
devxp shell-integration privacy off

# Check privacy mode status
devxp shell-integration privacy status
```

### Uninstall
```bash
devxp shell-integration uninstall
```

## How It Works

### Command Tracking Flow
1. **Pre-execution Hook**: Captures command and start time
2. **Post-execution Hook**: Calculates duration and exit code
3. **Filtering**: Checks if command is productive (not ignored)
4. **Debouncing**: Ensures same command isn't tracked within debounce window
5. **Privacy Check**: Skips tracking if privacy mode is enabled
6. **XP Award**: Sends command data to DevXP daemon for XP calculation

### Productive Commands (Default)
- **Version Control**: git, gh, hub
- **Package Managers**: npm, yarn, pnpm, pip, cargo, composer, brew
- **Build Tools**: make, gradle, mvn, webpack, vite, rollup
- **Containers**: docker, kubectl, docker-compose
- **Cloud**: aws, gcloud, az, terraform, ansible
- **Development**: node, python, go, rustc, tsc
- **Testing**: jest, mocha, pytest, rspec
- **Editors**: vim, nvim, code, emacs

### Ignored Commands (Default)
- **Navigation**: cd, ls, pwd
- **File Operations**: cat, less, more, head, tail, touch, mkdir, rm, cp, mv
- **System Info**: ps, top, htop, df, du, free, uname, date
- **Shell**: echo, export, alias, source, history, clear
- **Help**: man, info, help, whatis

## Configuration Files

### Shell Integration Script
Located at: `~/.config/devxp/shell-integration.zsh`

This file contains:
- Environment variable checks
- Shell functions for privacy and toggle
- ZSH hooks for command tracking
- Helper aliases

### Integration with .zshrc
The following line is automatically added to your `~/.zshrc`:
```bash
# DevXP Shell Integration
source "$HOME/.config/devxp/shell-integration.zsh"
```

## Environment Variables

- `DEVXP_ENABLED`: Set to 0 to disable tracking (default: 1)
- `DEVXP_PRIVACY`: Set to 1 to enable privacy mode
- `DEVXP_QUIET`: Set to 1 to suppress startup message
- `DEVXP_DISABLE`: If set, tracking is disabled by default

## Advanced Usage

### Manual Installation
If you prefer to manually add the integration:

```bash
# Generate the integration file without modifying .zshrc
devxp shell-integration install --no-zshrc

# Manually add to your .zshrc
echo 'source "$HOME/.config/devxp/shell-integration.zsh"' >> ~/.zshrc
```

### Custom Command Lists
Modify which commands are tracked:

```bash
# Add multiple productive commands
devxp shell-integration config --add-productive "rustup"
devxp shell-integration config --add-productive "deno"

# Remove commands from ignored list
devxp shell-integration config --remove-ignored "sudo"
```

### Debounce Tuning
Adjust how frequently the same command can earn XP:

```bash
# Set to 10 seconds (10000ms)
devxp shell-integration config --debounce 10000

# Set to 1 second for rapid testing
devxp shell-integration config --debounce 1000
```

## Troubleshooting

### Integration Not Working
1. Ensure you've restarted your shell or run `source ~/.zshrc`
2. Check installation status: `devxp shell-integration status`
3. Verify hooks are installed: `echo $__devxp_hooks_installed` (should be 1)

### Commands Not Being Tracked
1. Check if tracking is enabled: `echo $DEVXP_ENABLED` (should be 1)
2. Check privacy mode: `devxp-privacy` (should be OFF)
3. Verify command is in productive list: `devxp shell-integration config --show-productive`
4. Ensure DevXP daemon is running: `devxp-status`

### Too Much/Too Little XP
1. Adjust debounce time: `devxp shell-integration config --debounce <ms>`
2. Customize command lists to match your workflow

## Security & Privacy

- **Local Only**: All tracking happens locally on your machine
- **No Network Calls**: Shell integration never sends data over network
- **Privacy Mode**: Instantly disable tracking when needed
- **Selective Tracking**: Only productive commands are tracked
- **No Command Arguments**: Only base commands are tracked, not arguments or parameters
- **User Control**: Can be disabled/uninstalled at any time

## Performance Impact

The shell integration has minimal performance impact:
- **Lightweight**: Simple shell functions with minimal logic
- **Async Processing**: Command tracking happens in background
- **Debouncing**: Prevents excessive processing
- **Selective Hooks**: Only tracks when necessary

## Future Enhancements

Potential improvements for shell integration:
- [ ] Bash support
- [ ] Fish shell support
- [ ] Command complexity analysis for bonus XP
- [ ] Project-aware tracking (different XP for different repos)
- [ ] Time-of-day multipliers
- [ ] Command success rate tracking
- [ ] Integration with terminal multiplexers (tmux, screen)
- [ ] Custom achievement triggers based on command patterns
