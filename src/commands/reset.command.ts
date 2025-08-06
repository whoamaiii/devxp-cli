/**
 * Reset command - Reset progress with confirmation
 */
import type { Command } from '../types/command.js';
import { database } from '../modules/database.js';
import { achievementManager } from '../modules/achievements.js';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';

export class ResetCommand implements Command {
  readonly name = 'reset';
  readonly description = 'Reset progress with confirmation';
  readonly help = `
Usage: devxp reset [options]

Reset your DevXP progress. This action cannot be undone!

Options:
  --force            Skip confirmation prompt
  --achievements     Reset achievements only
  --xp               Reset XP and level only
  --streak           Reset streak only
  --all              Reset everything (default)
  --backup           Create backup before reset
`;
  readonly aliases = ['clear', 'restart'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const force = args.includes('--force');
    const resetAchievements = args.includes('--achievements');
    const resetXP = args.includes('--xp');
    const resetStreak = args.includes('--streak');
    const resetAll = args.includes('--all') || (!resetAchievements && !resetXP && !resetStreak);
    const createBackup = args.includes('--backup');

    // Show warning
    console.log(chalk.red.bold('\n⚠️  WARNING: Reset Progress\n'));
    
    if (resetAll) {
      console.log(chalk.yellow('This will reset ALL your progress including:'));
      console.log(chalk.yellow('  • XP and levels'));
      console.log(chalk.yellow('  • Achievements'));
      console.log(chalk.yellow('  • Streaks'));
      console.log(chalk.yellow('  • Activity history'));
    } else {
      console.log(chalk.yellow('This will reset:'));
      if (resetAchievements) console.log(chalk.yellow('  • Achievements'));
      if (resetXP) console.log(chalk.yellow('  • XP and levels'));
      if (resetStreak) console.log(chalk.yellow('  • Streaks'));
    }
    
    console.log(chalk.red('\nThis action cannot be undone!'));

    // Get confirmation unless forced
    if (!force) {
      const confirmed = await this.getConfirmation();
      if (!confirmed) {
        console.log(chalk.green('\n✅ Reset cancelled. Your progress is safe.\n'));
        return;
      }
    }

    // Initialize database
    await database.initialize();

    // Create backup if requested
    if (createBackup) {
      const backupSpinner = ora('Creating backup...').start();
      try {
        const backupPath = await database.backup();
        backupSpinner.succeed(`Backup created: ${backupPath}`);
      } catch (error) {
        backupSpinner.fail('Failed to create backup');
        console.error(error);
        await database.close();
        return;
      }
    }

    // Perform reset
    const resetSpinner = ora('Resetting progress...').start();

    try {
      // Get current user
      const username = await this.getCurrentUsername();
      const user = await database.getUserByUsername(username);
      
      if (!user) {
        resetSpinner.fail(`User '${username}' not found`);
        await database.close();
        return;
      }

      if (resetAll) {
        // Delete all user data
        await database.deleteUser(user.id);
        
        // Reset achievements
        achievementManager.resetAllAchievements();
        
        // Recreate user with default values
        await database.createUser({
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          totalXp: 0,
          level: 1,
          streak: 0,
          longestStreak: 0,
          lastActiveDate: new Date().toISOString()
        });
        
        resetSpinner.succeed('All progress reset');
      } else {
        const updates: any = {};
        
        if (resetAchievements) {
          achievementManager.resetAllAchievements();
          console.log(chalk.green('  ✓ Achievements reset'));
        }
        
        if (resetXP) {
          updates.totalXp = 0;
          updates.level = 1;
          console.log(chalk.green('  ✓ XP and level reset'));
        }
        
        if (resetStreak) {
          updates.streak = 0;
          updates.longestStreak = 0;
          console.log(chalk.green('  ✓ Streaks reset'));
        }
        
        if (Object.keys(updates).length > 0) {
          await database.updateUser(user.id, updates);
        }
        
        resetSpinner.succeed('Selected progress reset');
      }

      // Show summary
      console.log('\n' + chalk.cyan.bold('═'.repeat(50)));
      console.log(chalk.cyan.bold('  Reset Complete'));
      console.log(chalk.cyan.bold('═'.repeat(50)));
      
      if (resetAll) {
        console.log('\n' + chalk.gray('You have been reset to:'));
        console.log(`  ${chalk.yellow('Level:')} 1`);
        console.log(`  ${chalk.green('XP:')} 0`);
        console.log(`  ${chalk.magenta('Streak:')} 0 days`);
        console.log(`  ${chalk.blue('Achievements:')} 0 unlocked`);
      } else {
        const updatedUser = await database.getUserByUsername(username);
        if (updatedUser) {
          console.log('\n' + chalk.gray('Current status:'));
          console.log(`  ${chalk.yellow('Level:')} ${updatedUser.level}`);
          console.log(`  ${chalk.green('XP:')} ${updatedUser.totalXp}`);
          console.log(`  ${chalk.magenta('Streak:')} ${updatedUser.streak} days`);
        }
      }
      
      console.log('\n' + chalk.gray('Start earning XP again with your next activity!'));
      console.log(chalk.cyan.bold('═'.repeat(50)) + '\n');

      await database.close();
    } catch (error) {
      resetSpinner.fail('Failed to reset progress');
      console.error(error);
      await database.close();
    }
  }

  private async getConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(chalk.yellow('\nType "RESET" to confirm (or press Enter to cancel): '), (answer) => {
        rl.close();
        resolve(answer.trim() === 'RESET');
      });
    });
  }

  private async getCurrentUsername(): Promise<string> {
    const { execSync } = await import('child_process');
    try {
      const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      return gitUser || 'default';
    } catch {
      return 'default';
    }
  }

  validate(args: ReadonlyArray<string>): boolean {
    // Check for conflicting options
    const resetOptions = ['--achievements', '--xp', '--streak'];
    const selectedOptions = resetOptions.filter(opt => args.includes(opt));
    
    if (selectedOptions.length > 0 && args.includes('--all')) {
      console.error('Cannot use --all with specific reset options');
      return false;
    }
    
    return true;
  }
}
