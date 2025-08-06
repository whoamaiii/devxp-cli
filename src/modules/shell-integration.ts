import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import { EventEmitter } from 'events';
import { x } from 'tinyexec';

interface ShellIntegrationConfig {
  enabled: boolean;
  privacyMode: boolean;
  debounceMs: number;
  productiveCommands: string[];
  ignoredCommands: string[];
}

export class ShellIntegration extends EventEmitter {
  private config: ShellIntegrationConfig;
  private configDir: string;
  private integrationFile: string;
  private lastCommandTime: Map<string, number> = new Map();

  constructor() {
    super();
    this.configDir = path.join(homedir(), '.config', 'devxp');
    this.integrationFile = path.join(this.configDir, 'shell-integration.zsh');
    
    this.config = {
      enabled: true,
      privacyMode: false,
      debounceMs: 5000, // 5 seconds debounce
      productiveCommands: [
        'git', 'npm', 'yarn', 'pnpm', 'docker', 'kubectl', 'cargo',
        'python', 'pip', 'node', 'deno', 'bun', 'make', 'gradle',
        'mvn', 'composer', 'brew', 'apt', 'yum', 'snap', 'vim',
        'nvim', 'code', 'subl', 'atom', 'emacs', 'terraform',
        'ansible', 'vagrant', 'aws', 'gcloud', 'az', 'heroku',
        'netlify', 'vercel', 'gh', 'hub', 'rustc', 'go', 'tsc',
        'webpack', 'vite', 'rollup', 'parcel', 'jest', 'mocha',
        'pytest', 'rspec', 'phpunit', 'mix', 'rails', 'django',
        'flask', 'fastapi', 'express', 'next', 'nuxt', 'gatsby',
        'hugo', 'jekyll', 'eleventy', 'astro', 'remix', 'sveltekit'
      ],
      ignoredCommands: [
        'cd', 'ls', 'pwd', 'echo', 'cat', 'less', 'more', 'head',
        'tail', 'grep', 'find', 'which', 'whereis', 'whoami', 'who',
        'w', 'ps', 'top', 'htop', 'df', 'du', 'free', 'uname',
        'date', 'cal', 'history', 'clear', 'reset', 'exit', 'logout',
        'true', 'false', 'test', '[', ']', 'alias', 'unalias', 'type',
        'source', '.', 'export', 'unset', 'set', 'env', 'printenv',
        'man', 'info', 'help', 'whatis', 'apropos', 'touch', 'mkdir',
        'rmdir', 'rm', 'cp', 'mv', 'ln', 'chmod', 'chown', 'chgrp',
        'umask', 'id', 'groups', 'passwd', 'su', 'sudo', 'kill',
        'killall', 'jobs', 'fg', 'bg', 'wait', 'sleep', 'yes', 'no'
      ]
    };
  }

  /**
   * Initialize shell integration by creating necessary files and directories
   */
  async initialize(): Promise<void> {
    try {
      // Create config directory if it doesn't exist
      await fs.mkdir(this.configDir, { recursive: true });
      
      // Generate and write the shell integration script
      const integrationScript = this.generateZshIntegration();
      await fs.writeFile(this.integrationFile, integrationScript, 'utf8');
      
      // Make the script readable
      await fs.chmod(this.integrationFile, 0o644);
      
      this.emit('initialized', this.integrationFile);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Generate the zsh integration script
   */
  private generateZshIntegration(): string {
    return `#!/usr/bin/env zsh
# DevXP Shell Integration for ZSH
# This file is auto-generated. Do not edit manually.

# Check if DevXP tracking is enabled
if [[ -z "$DEVXP_DISABLE" ]]; then
  export DEVXP_ENABLED=1
else
  export DEVXP_ENABLED=0
fi

# Privacy mode toggle
function devxp-privacy() {
  if [[ "$1" == "on" ]]; then
    export DEVXP_PRIVACY=1
    echo "DevXP privacy mode enabled"
  elif [[ "$1" == "off" ]]; then
    unset DEVXP_PRIVACY
    echo "DevXP privacy mode disabled"
  else
    if [[ -n "$DEVXP_PRIVACY" ]]; then
      echo "DevXP privacy mode is ON"
    else
      echo "DevXP privacy mode is OFF"
    fi
  fi
}

# Toggle DevXP tracking
function devxp-toggle() {
  if [[ "$DEVXP_ENABLED" == "1" ]]; then
    export DEVXP_ENABLED=0
    echo "DevXP tracking disabled"
  else
    export DEVXP_ENABLED=1
    echo "DevXP tracking enabled"
  fi
}

# Command tracking function
function __devxp_track_command() {
  local cmd="$1"
  local exit_code="$2"
  local duration="$3"
  
  # Skip if disabled or in privacy mode
  [[ "$DEVXP_ENABLED" != "1" ]] && return
  [[ -n "$DEVXP_PRIVACY" ]] && return
  
  # Skip if command is empty
  [[ -z "$cmd" ]] && return
  
  # Extract the base command (first word)
  local base_cmd="\${cmd%% *}"
  
  # Skip ignored commands
  local ignored_commands=(${this.config.ignoredCommands.join(' ')})
  for ignored in $ignored_commands; do
    [[ "$base_cmd" == "$ignored" ]] && return
  done
  
  # Check if it's a productive command
  local productive_commands=(${this.config.productiveCommands.join(' ')})
  local is_productive=0
  for productive in $productive_commands; do
    if [[ "$base_cmd" == "$productive" ]]; then
      is_productive=1
      break
    fi
  done
  
  # Only track productive commands
  if [[ "$is_productive" == "1" ]]; then
    # Send tracking data to DevXP daemon (if running)
    if command -v devxp &> /dev/null; then
      devxp track-command "$base_cmd" "$exit_code" "$duration" &> /dev/null &
    fi
  fi
}

# Hook into preexec and precmd for command tracking
if [[ -n "$ZSH_VERSION" ]]; then
  # Store command start time
  function __devxp_preexec() {
    __devxp_cmd_start_time=$EPOCHREALTIME
    __devxp_current_cmd="$1"
  }
  
  # Calculate duration and track command
  function __devxp_precmd() {
    local exit_code=$?
    if [[ -n "$__devxp_cmd_start_time" ]]; then
      local end_time=$EPOCHREALTIME
      local duration=$(( end_time - __devxp_cmd_start_time ))
      __devxp_track_command "$__devxp_current_cmd" "$exit_code" "$duration"
      unset __devxp_cmd_start_time
      unset __devxp_current_cmd
    fi
  }
  
  # Add hooks if not already added
  if [[ -z "$__devxp_hooks_installed" ]]; then
    autoload -Uz add-zsh-hook
    add-zsh-hook preexec __devxp_preexec
    add-zsh-hook precmd __devxp_precmd
    export __devxp_hooks_installed=1
  fi
fi

# Helpful aliases
alias devxp-status='devxp status 2>/dev/null || echo "DevXP daemon not running"'
alias devxp-stats='devxp stats 2>/dev/null || echo "DevXP daemon not running"'

# Display status on shell startup (can be disabled)
if [[ "$DEVXP_QUIET" != "1" ]] && [[ "$DEVXP_ENABLED" == "1" ]]; then
  echo "DevXP tracking enabled (use 'devxp-toggle' to disable, 'devxp-privacy on' for privacy mode)"
fi
`;
  }

  /**
   * Add source line to user's .zshrc file
   */
  async addToZshrc(): Promise<boolean> {
    try {
      const zshrcPath = path.join(homedir(), '.zshrc');
      const sourceLine = `\n# DevXP Shell Integration\nsource "${this.integrationFile}"\n`;
      
      // Check if .zshrc exists
      let zshrcContent = '';
      try {
        zshrcContent = await fs.readFile(zshrcPath, 'utf8');
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
        // .zshrc doesn't exist, we'll create it
      }
      
      // Check if already sourced
      if (zshrcContent.includes(this.integrationFile)) {
        this.emit('info', 'Shell integration already added to .zshrc');
        return false;
      }
      
      // Add source line
      await fs.appendFile(zshrcPath, sourceLine, 'utf8');
      this.emit('added-to-zshrc', zshrcPath);
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove shell integration from .zshrc
   */
  async removeFromZshrc(): Promise<boolean> {
    try {
      const zshrcPath = path.join(homedir(), '.zshrc');
      
      // Read .zshrc
      let zshrcContent = '';
      try {
        zshrcContent = await fs.readFile(zshrcPath, 'utf8');
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          return false; // .zshrc doesn't exist
        }
        throw error;
      }
      
      // Remove DevXP integration lines
      const lines = zshrcContent.split('\n');
      const filteredLines = [];
      let skipNext = false;
      
      for (const line of lines) {
        if (line.includes('# DevXP Shell Integration')) {
          skipNext = true;
          continue;
        }
        if (skipNext && line.includes(this.integrationFile)) {
          skipNext = false;
          continue;
        }
        filteredLines.push(line);
      }
      
      const newContent = filteredLines.join('\n');
      if (newContent !== zshrcContent) {
        await fs.writeFile(zshrcPath, newContent, 'utf8');
        this.emit('removed-from-zshrc', zshrcPath);
        return true;
      }
      
      return false;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if a command should be tracked (debouncing logic)
   */
  shouldTrackCommand(command: string): boolean {
    const now = Date.now();
    const lastTime = this.lastCommandTime.get(command) || 0;
    
    if (now - lastTime < this.config.debounceMs) {
      return false; // Too soon, skip tracking
    }
    
    this.lastCommandTime.set(command, now);
    
    // Clean up old entries to prevent memory leak
    if (this.lastCommandTime.size > 100) {
      const cutoff = now - 60000; // 1 minute ago
      for (const [cmd, time] of this.lastCommandTime.entries()) {
        if (time < cutoff) {
          this.lastCommandTime.delete(cmd);
        }
      }
    }
    
    return true;
  }

  /**
   * Enable privacy mode
   */
  enablePrivacyMode(): void {
    this.config.privacyMode = true;
    this.emit('privacy-mode', true);
  }

  /**
   * Disable privacy mode
   */
  disablePrivacyMode(): void {
    this.config.privacyMode = false;
    this.emit('privacy-mode', false);
  }

  /**
   * Check if privacy mode is enabled
   */
  isPrivacyMode(): boolean {
    return this.config.privacyMode;
  }

  /**
   * Update productive commands list
   */
  setProductiveCommands(commands: string[]): void {
    this.config.productiveCommands = commands;
    this.emit('config-updated', 'productiveCommands', commands);
  }

  /**
   * Update ignored commands list
   */
  setIgnoredCommands(commands: string[]): void {
    this.config.ignoredCommands = commands;
    this.emit('config-updated', 'ignoredCommands', commands);
  }

  /**
   * Update debounce time in milliseconds
   */
  setDebounceTime(ms: number): void {
    this.config.debounceMs = Math.max(0, ms);
    this.emit('config-updated', 'debounceMs', this.config.debounceMs);
  }

  /**
   * Get current configuration
   */
  getConfig(): ShellIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Check if shell integration is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      await fs.access(this.integrationFile);
      const zshrcPath = path.join(homedir(), '.zshrc');
      const zshrcContent = await fs.readFile(zshrcPath, 'utf8');
      return zshrcContent.includes(this.integrationFile);
    } catch {
      return false;
    }
  }

  /**
   * Uninstall shell integration
   */
  async uninstall(): Promise<void> {
    try {
      // Remove from .zshrc
      await this.removeFromZshrc();
      
      // Remove integration file
      try {
        await fs.unlink(this.integrationFile);
        this.emit('uninstalled', this.integrationFile);
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Try to remove config directory if empty
      try {
        await fs.rmdir(this.configDir);
      } catch {
        // Directory not empty or doesn't exist, ignore
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Test shell integration by running a test command
   */
  async test(): Promise<boolean> {
    try {
      // Source the integration file and check if functions are available
      const testScript = `
        source "${this.integrationFile}"
        type __devxp_track_command &>/dev/null && echo "OK"
      `;
      
      const result = await x('zsh', ['-c', testScript]);
      return result.stdout.trim() === 'OK';
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const shellIntegration = new ShellIntegration();

// CLI usage example
if (require.main === module) {
  (async () => {
    const integration = new ShellIntegration();
    
    // Set up event listeners
    integration.on('initialized', (file) => {
      console.log(`✅ Shell integration initialized: ${file}`);
    });
    
    integration.on('added-to-zshrc', (file) => {
      console.log(`✅ Added to .zshrc: ${file}`);
      console.log('🔄 Please restart your shell or run: source ~/.zshrc');
    });
    
    integration.on('error', (error) => {
      console.error('❌ Error:', error);
    });
    
    // Initialize and install
    await integration.initialize();
    const added = await integration.addToZshrc();
    
    if (!added) {
      console.log('ℹ️  Shell integration was already installed');
    }
    
    // Test the integration
    const testResult = await integration.test();
    console.log(`🧪 Integration test: ${testResult ? 'PASSED' : 'FAILED'}`);
  })();
}
