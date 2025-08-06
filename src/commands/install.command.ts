/**
 * Install command - Set up git hooks and shell integration
 */
import type { Command } from '../types/command.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';

export class InstallCommand implements Command {
  readonly name = 'install';
  readonly description = 'Set up git hooks and shell integration';
  readonly help = `
Usage: devxp install [options]

Install DevXP integrations for automatic XP tracking.

Options:
  --git              Install git hooks only
  --shell            Install shell integration only
  --zsh              Install for Zsh shell
  --bash             Install for Bash shell
  --fish             Install for Fish shell
  --global           Install git hooks globally
  --uninstall        Remove all integrations
`;
  readonly aliases = ['setup', 'init'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const installGit = args.includes('--git') || (!args.includes('--shell'));
    const installShell = args.includes('--shell') || (!args.includes('--git'));
    const isUninstall = args.includes('--uninstall');
    const isGlobal = args.includes('--global');

    if (isUninstall) {
      await this.uninstall();
      return;
    }

    console.log(chalk.cyan.bold('\n🚀 DevXP Installation\n'));

    if (installGit) {
      await this.installGitHooks(isGlobal);
    }

    if (installShell) {
      await this.installShellIntegration(args);
    }

    console.log(chalk.green.bold('\n✅ Installation complete!\n'));
    console.log(chalk.gray('Run `devxp status` to see your current progress.'));
    console.log(chalk.gray('Run `devxp help` to see available commands.\n'));
  }

  private async installGitHooks(isGlobal: boolean): Promise<void> {
    const spinner = ora('Installing git hooks...').start();

    try {
      if (isGlobal) {
        // Install global git hooks
        const hooksDir = path.join(os.homedir(), '.config', 'devxp', 'git-hooks');
        await fs.mkdir(hooksDir, { recursive: true });

        // Create hook files
        await this.createGitHook(hooksDir, 'post-commit');
        await this.createGitHook(hooksDir, 'post-merge');
        await this.createGitHook(hooksDir, 'post-checkout');

        // Configure git to use global hooks
        execSync(`git config --global core.hooksPath ${hooksDir}`, { encoding: 'utf-8' });
        
        spinner.succeed('Global git hooks installed');
      } else {
        // Install local git hooks
        const gitDir = await this.findGitDirectory();
        if (!gitDir) {
          spinner.fail('Not in a git repository');
          return;
        }

        const hooksDir = path.join(gitDir, 'hooks');
        await fs.mkdir(hooksDir, { recursive: true });

        // Create hook files
        await this.createGitHook(hooksDir, 'post-commit');
        await this.createGitHook(hooksDir, 'post-merge');
        await this.createGitHook(hooksDir, 'post-checkout');

        spinner.succeed('Local git hooks installed');
      }
    } catch (error) {
      spinner.fail('Failed to install git hooks');
      console.error(error);
    }
  }

  private async createGitHook(hooksDir: string, hookName: string): Promise<void> {
    const hookPath = path.join(hooksDir, hookName);
    const hookContent = `#!/bin/sh
# DevXP Git Hook - ${hookName}

# Track the git activity
devxp track --type ${hookName.replace('post-', '')} --auto

# Continue with any existing hooks
if [ -f "${hookPath}.backup" ]; then
  sh "${hookPath}.backup" "$@"
fi
`;

    // Backup existing hook if it exists
    try {
      await fs.access(hookPath);
      const existingContent = await fs.readFile(hookPath, 'utf-8');
      if (!existingContent.includes('DevXP Git Hook')) {
        await fs.rename(hookPath, `${hookPath}.backup`);
      }
    } catch {
      // Hook doesn't exist, that's fine
    }

    // Write new hook
    await fs.writeFile(hookPath, hookContent);
    await fs.chmod(hookPath, 0o755);
  }

  private async installShellIntegration(args: ReadonlyArray<string>): Promise<void> {
    const spinner = ora('Installing shell integration...').start();

    try {
      let shell = await this.detectShell();
      
      // Override with user preference
      if (args.includes('--zsh')) shell = 'zsh';
      if (args.includes('--bash')) shell = 'bash';
      if (args.includes('--fish')) shell = 'fish';

      switch (shell) {
        case 'zsh':
          await this.installZshIntegration();
          spinner.succeed('Zsh integration installed');
          break;
        case 'bash':
          await this.installBashIntegration();
          spinner.succeed('Bash integration installed');
          break;
        case 'fish':
          await this.installFishIntegration();
          spinner.succeed('Fish integration installed');
          break;
        default:
          spinner.warn(`Unknown shell: ${shell}. Please install manually.`);
      }
    } catch (error) {
      spinner.fail('Failed to install shell integration');
      console.error(error);
    }
  }

  private async installZshIntegration(): Promise<void> {
    const zshrcPath = path.join(os.homedir(), '.zshrc');
    const integration = `
# DevXP Shell Integration
if command -v devxp &> /dev/null; then
  # Track directory changes
  function chpwd() {
    devxp track --type cd --auto &> /dev/null &
  }
  
  # Track command execution
  function preexec() {
    devxp track --type command --cmd "$1" --auto &> /dev/null &
  }
fi
`;

    await this.appendToFile(zshrcPath, integration, 'DevXP Shell Integration');
  }

  private async installBashIntegration(): Promise<void> {
    const bashrcPath = path.join(os.homedir(), '.bashrc');
    const integration = `
# DevXP Shell Integration
if command -v devxp &> /dev/null; then
  # Track command execution
  export PROMPT_COMMAND='devxp track --type command --auto &> /dev/null &'
  
  # Track directory changes
  function cd() {
    builtin cd "$@"
    devxp track --type cd --auto &> /dev/null &
  }
fi
`;

    await this.appendToFile(bashrcPath, integration, 'DevXP Shell Integration');
  }

  private async installFishIntegration(): Promise<void> {
    const fishConfigDir = path.join(os.homedir(), '.config', 'fish');
    const fishConfigPath = path.join(fishConfigDir, 'config.fish');
    
    await fs.mkdir(fishConfigDir, { recursive: true });
    
    const integration = `
# DevXP Shell Integration
if command -v devxp &> /dev/null
  # Track directory changes
  function __devxp_cd --on-variable PWD
    devxp track --type cd --auto &> /dev/null &
  end
  
  # Track command execution
  function __devxp_preexec --on-event fish_preexec
    devxp track --type command --cmd "$argv" --auto &> /dev/null &
  end
end
`;

    await this.appendToFile(fishConfigPath, integration, 'DevXP Shell Integration');
  }

  private async appendToFile(filePath: string, content: string, marker: string): Promise<void> {
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      if (existingContent.includes(marker)) {
        console.log(chalk.yellow(`  ⚠️  ${path.basename(filePath)} already contains DevXP integration`));
        return;
      }
      await fs.appendFile(filePath, content);
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(filePath, content);
    }
  }

  private async uninstall(): Promise<void> {
    console.log(chalk.red.bold('\n🗑️  DevXP Uninstallation\n'));
    
    const spinner = ora('Removing integrations...').start();

    try {
      // Remove global git hooks config
      try {
        execSync('git config --global --unset core.hooksPath', { encoding: 'utf-8' });
      } catch {
        // Config might not exist
      }

      // Remove shell integrations
      await this.removeFromFile(path.join(os.homedir(), '.zshrc'), 'DevXP Shell Integration');
      await this.removeFromFile(path.join(os.homedir(), '.bashrc'), 'DevXP Shell Integration');
      await this.removeFromFile(path.join(os.homedir(), '.config', 'fish', 'config.fish'), 'DevXP Shell Integration');

      spinner.succeed('Integrations removed');
      console.log(chalk.gray('\nNote: Local git hooks were not removed. Remove them manually if needed.'));
    } catch (error) {
      spinner.fail('Failed to uninstall');
      console.error(error);
    }
  }

  private async removeFromFile(filePath: string, marker: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const newLines: string[] = [];
      let inBlock = false;

      for (const line of lines) {
        if (line.includes(marker)) {
          inBlock = true;
          continue;
        }
        if (inBlock && line.trim() === '') {
          inBlock = false;
          continue;
        }
        if (!inBlock) {
          newLines.push(line);
        }
      }

      await fs.writeFile(filePath, newLines.join('\n'));
    } catch {
      // File doesn't exist, that's fine
    }
  }

  private async detectShell(): Promise<string> {
    const shell = process.env.SHELL || '';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('fish')) return 'fish';
    return 'unknown';
  }

  private async findGitDirectory(): Promise<string | null> {
    try {
      const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
      return gitDir;
    } catch {
      return null;
    }
  }

  validate(args: ReadonlyArray<string>): boolean {
    // All arguments are optional
    return true;
  }
}
