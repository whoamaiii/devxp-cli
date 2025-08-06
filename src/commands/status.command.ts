/**
 * Status command - Show current level, XP, and recent activity
 */
import type { Command } from '../types/command.js';
import { database } from '../modules/database.js';
import { xpSystem } from '../modules/xp-system.js';
import { achievementManager } from '../modules/achievements.js';
import chalk from 'chalk';
import ora from 'ora';

export class StatusCommand implements Command {
  readonly name = 'status';
  readonly description = 'Show current level, XP, and recent activity';
  readonly help = `
Usage: devxp status [options]

Display your current development status including:
- Current level and XP progress
- Active streak
- Recent activities
- Next achievements to unlock

Options:
  --user <username>  Show status for specific user (default: current user)
  --brief           Show brief status summary
  --json            Output in JSON format
`;
  readonly aliases = ['s', 'info'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const spinner = ora('Loading status...').start();

    try {
      // Parse arguments
      const userIndex = args.indexOf('--user');
      const username = userIndex !== -1 && args[userIndex + 1] 
        ? args[userIndex + 1] 
        : await this.getCurrentUsername();
      
      const isBrief = args.includes('--brief');
      const isJson = args.includes('--json');

      // Initialize database
      await database.initialize();

      // Get user data
      const user = await database.getUserByUsername(username);
      if (!user) {
        spinner.fail(`User '${username}' not found`);
        await database.close();
        return;
      }

      spinner.stop();

      if (isJson) {
        await this.outputJson(user);
      } else if (isBrief) {
        await this.outputBrief(user);
      } else {
        await this.outputDetailed(user);
      }

      await database.close();
    } catch (error) {
      spinner.fail('Failed to load status');
      console.error(error);
      await database.close();
    }
  }

  private async outputBrief(user: any): Promise<void> {
    const levelProgress = xpSystem.getLevelProgress(user.level, user.totalXp);
    const levelTitle = xpSystem.getLevelTitle(user.level);

    console.log(chalk.cyan.bold(`${user.displayName} (${user.username})`));
    console.log(`${chalk.yellow('Level:')} ${user.level} - ${levelTitle}`);
    console.log(`${chalk.green('XP:')} ${user.totalXp} (${levelProgress.toFixed(1)}% to next level)`);
    console.log(`${chalk.magenta('Streak:')} ${user.streak} days`);
  }

  private async outputDetailed(user: any): Promise<void> {
    const levelProgress = xpSystem.getLevelProgress(user.level, user.totalXp);
    const xpToNext = xpSystem.calculateXPToNextLevel(user.level, user.totalXp);
    const levelTitle = xpSystem.getLevelTitle(user.level);

    // Header
    console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(`  Developer Status - ${user.displayName}`));
    console.log(chalk.cyan.bold('═'.repeat(60)));

    // Level and XP
    console.log('\n' + chalk.yellow.bold('📊 Level & Experience'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.yellow('Level:')} ${user.level} - ${chalk.cyan(levelTitle)}`);
    console.log(`  ${chalk.green('Total XP:')} ${user.totalXp}`);
    console.log(`  ${chalk.blue('Progress:')} ${this.drawProgressBar(levelProgress)} ${levelProgress.toFixed(1)}%`);
    console.log(`  ${chalk.gray('XP to next level:')} ${xpToNext}`);

    // Streak
    console.log('\n' + chalk.magenta.bold('🔥 Streak'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.magenta('Current:')} ${user.streak} days`);
    console.log(`  ${chalk.magenta('Longest:')} ${user.longestStreak} days`);
    console.log(`  ${chalk.gray('Last active:')} ${new Date(user.lastActiveDate).toLocaleDateString()}`);

    // Recent activities
    const activities = await database.getUserActivities(user.id, 5);
    if (activities.length > 0) {
      console.log('\n' + chalk.blue.bold('🎯 Recent Activities'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const activity of activities) {
        const time = new Date(activity.timestamp).toLocaleString();
        console.log(`  ${chalk.gray(time)}`);
        console.log(`    ${activity.description} ${chalk.green(`+${activity.xpEarned} XP`)}`);
      }
    }

    // Achievements progress
    const stats = achievementManager.getStatistics();
    console.log('\n' + chalk.purple.bold('🏆 Achievements'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.purple('Unlocked:')} ${stats.unlocked}/${stats.total} (${stats.percentage}%)`);
    
    if (stats.nextToUnlock && stats.nextToUnlock.length > 0) {
      console.log(`  ${chalk.gray('Next to unlock:')}`);
      for (const achievement of stats.nextToUnlock) {
        const progress = (achievement.progress / achievement.goal * 100).toFixed(0);
        console.log(`    • ${achievement.name} (${progress}%)`);
      }
    }

    // Active challenges
    const challenges = xpSystem.getActiveChallenges(user.id);
    if (challenges.length > 0) {
      console.log('\n' + chalk.green.bold('⚡ Active Challenges'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const challenge of challenges) {
        const progress = (challenge.currentProgress / challenge.requiredCount * 100).toFixed(0);
        const emoji = challenge.isCompleted ? '✅' : '🎯';
        console.log(`  ${emoji} ${challenge.name}`);
        console.log(`     ${chalk.gray(challenge.description)}`);
        console.log(`     Progress: ${challenge.currentProgress}/${challenge.requiredCount} (${progress}%)`);
        console.log(`     Reward: ${chalk.green(`${challenge.reward} XP`)}`);
      }
    }

    console.log('\n' + chalk.cyan.bold('═'.repeat(60)) + '\n');
  }

  private async outputJson(user: any): Promise<void> {
    const activities = await database.getUserActivities(user.id, 10);
    const stats = await database.getUserStats(user.id);
    const achievements = achievementManager.getStatistics();
    const challenges = xpSystem.getActiveChallenges(user.id);

    const output = {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        level: user.level,
        levelTitle: xpSystem.getLevelTitle(user.level),
        totalXp: user.totalXp,
        levelProgress: xpSystem.getLevelProgress(user.level, user.totalXp),
        xpToNextLevel: xpSystem.calculateXPToNextLevel(user.level, user.totalXp),
        streak: user.streak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate
      },
      recentActivities: activities,
      stats,
      achievements,
      activeChallenges: challenges
    };

    console.log(JSON.stringify(output, null, 2));
  }

  private drawProgressBar(percent: number): string {
    const width = 20;
    const filled = Math.floor(width * percent / 100);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  private async getCurrentUsername(): Promise<string> {
    // Try to get from git config
    const { execSync } = await import('child_process');
    try {
      const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      return gitUser || 'default';
    } catch {
      return 'default';
    }
  }

  validate(args: ReadonlyArray<string>): boolean {
    // All arguments are optional, so always valid
    return true;
  }
}
