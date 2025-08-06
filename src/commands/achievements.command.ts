/**
 * Achievements command - List achievements and progress
 */
import type { Command } from '../types/command.js';
import { achievementManager, AchievementCategory } from '../modules/achievements.js';
import chalk from 'chalk';
import ora from 'ora';

export class AchievementsCommand implements Command {
  readonly name = 'achievements';
  readonly description = 'List achievements and progress';
  readonly help = `
Usage: devxp achievements [options]

Display your achievements and progress towards unlocking new ones.

Options:
  --category <name>  Filter by category (git, terminal, milestone, productivity, etc.)
  --unlocked         Show only unlocked achievements
  --locked           Show only locked achievements
  --hidden           Include hidden achievements
  --progress         Sort by progress percentage
  --json             Output in JSON format
`;
  readonly aliases = ['a', 'achieve', 'badges'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const spinner = ora('Loading achievements...').start();

    try {
      // Parse arguments
      const categoryIndex = args.indexOf('--category');
      const category = categoryIndex !== -1 && args[categoryIndex + 1] 
        ? args[categoryIndex + 1].toUpperCase() 
        : null;
      
      const showUnlocked = args.includes('--unlocked');
      const showLocked = args.includes('--locked');
      const includeHidden = args.includes('--hidden');
      const sortByProgress = args.includes('--progress');
      const isJson = args.includes('--json');

      // Get achievements
      let achievements = achievementManager.getAchievements(includeHidden);

      // Filter by category
      if (category) {
        const categoryEnum = this.getCategoryEnum(category);
        if (categoryEnum) {
          achievements = achievements.filter(a => a.category === categoryEnum);
        }
      }

      // Filter by status
      if (showUnlocked && !showLocked) {
        achievements = achievements.filter(a => a.unlocked);
      } else if (showLocked && !showUnlocked) {
        achievements = achievements.filter(a => !a.unlocked);
      }

      // Sort
      if (sortByProgress) {
        achievements.sort((a, b) => {
          const progressA = a.goal > 0 ? (a.progress / a.goal) : 0;
          const progressB = b.goal > 0 ? (b.progress / b.goal) : 0;
          return progressB - progressA;
        });
      } else {
        // Sort by category, then by unlocked status, then by name
        achievements.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          if (a.unlocked !== b.unlocked) {
            return b.unlocked ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        });
      }

      spinner.stop();

      if (isJson) {
        this.outputJson(achievements);
      } else {
        this.outputDetailed(achievements);
      }
    } catch (error) {
      spinner.fail('Failed to load achievements');
      console.error(error);
    }
  }

  private outputDetailed(achievements: any[]): void {
    const stats = achievementManager.getStatistics();

    // Header
    console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold('  🏆 Achievements'));
    console.log(chalk.cyan.bold('═'.repeat(60)));

    // Overview
    console.log('\n' + chalk.yellow.bold('📊 Overview'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.green('Unlocked:')} ${stats.unlocked}/${stats.total} (${stats.percentage}%)`);
    
    if (stats.byCategory) {
      console.log(`  ${chalk.gray('By category:')}`);
      for (const [category, count] of Object.entries(stats.byCategory)) {
        const total = stats.totalByCategory[category] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        console.log(`    • ${category}: ${count}/${total} (${percentage}%)`);
      }
    }

    // Group achievements by category
    const byCategory = new Map<string, any[]>();
    for (const achievement of achievements) {
      const list = byCategory.get(achievement.category) || [];
      list.push(achievement);
      byCategory.set(achievement.category, list);
    }

    // Display each category
    for (const [category, categoryAchievements] of byCategory) {
      console.log('\n' + chalk.magenta.bold(`${this.getCategoryEmoji(category)} ${category}`));
      console.log(chalk.gray('─'.repeat(40)));

      for (const achievement of categoryAchievements) {
        this.displayAchievement(achievement);
      }
    }

    // Next to unlock
    if (stats.nextToUnlock && stats.nextToUnlock.length > 0) {
      console.log('\n' + chalk.green.bold('🎯 Next to Unlock'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const achievement of stats.nextToUnlock) {
        const percentage = Math.round((achievement.progress / achievement.goal) * 100);
        console.log(`  • ${achievement.name}`);
        console.log(`    Progress: ${this.drawProgressBar(percentage)} ${achievement.progress}/${achievement.goal} (${percentage}%)`);
      }
    }

    // Recent unlocks
    if (stats.recentUnlocks && stats.recentUnlocks.length > 0) {
      console.log('\n' + chalk.blue.bold('✨ Recently Unlocked'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const unlock of stats.recentUnlocks) {
        const date = new Date(unlock.timestamp).toLocaleDateString();
        console.log(`  • ${unlock.name} - ${chalk.gray(date)}`);
      }
    }

    console.log('\n' + chalk.cyan.bold('═'.repeat(60)) + '\n');
  }

  private displayAchievement(achievement: any): void {
    const icon = achievement.unlocked ? '✅' : (achievement.hidden ? '🔒' : '⭕');
    const name = achievement.unlocked ? chalk.green(achievement.name) : chalk.gray(achievement.name);
    const percentage = achievement.goal > 0 ? Math.round((achievement.progress / achievement.goal) * 100) : 0;
    
    console.log(`  ${icon} ${name}`);
    console.log(`     ${chalk.gray(achievement.description)}`);
    
    if (!achievement.unlocked && achievement.goal > 1) {
      const progressBar = this.drawProgressBar(percentage);
      console.log(`     Progress: ${progressBar} ${achievement.progress}/${achievement.goal} (${percentage}%)`);
    }
    
    if (achievement.unlocked && achievement.unlockTimestamp) {
      const date = new Date(achievement.unlockTimestamp).toLocaleDateString();
      console.log(`     ${chalk.green('Unlocked:')} ${date}`);
    }
  }

  private outputJson(achievements: any[]): void {
    const stats = achievementManager.getStatistics();
    console.log(JSON.stringify({
      stats,
      achievements: achievements.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        unlocked: a.unlocked,
        unlockTimestamp: a.unlockTimestamp,
        progress: a.progress,
        goal: a.goal,
        hidden: a.hidden,
        percentComplete: a.goal > 0 ? Math.round((a.progress / a.goal) * 100) : 0
      }))
    }, null, 2));
  }

  private drawProgressBar(percent: number): string {
    const width = 15;
    const filled = Math.floor(width * percent / 100);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  private getCategoryEnum(category: string): AchievementCategory | null {
    const map: Record<string, AchievementCategory> = {
      'GIT': AchievementCategory.GIT_MASTER,
      'GIT_MASTER': AchievementCategory.GIT_MASTER,
      'TERMINAL': AchievementCategory.TERMINAL_NINJA,
      'TERMINAL_NINJA': AchievementCategory.TERMINAL_NINJA,
      'MILESTONE': AchievementCategory.MILESTONE,
      'HIDDEN': AchievementCategory.HIDDEN,
      'PRODUCTIVITY': AchievementCategory.PRODUCTIVITY,
      'EXPLORER': AchievementCategory.EXPLORER,
      'SPEEDRUNNER': AchievementCategory.SPEEDRUNNER
    };
    return map[category.toUpperCase()] || null;
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Git Master': '🔀',
      'Terminal Ninja': '🥷',
      'Milestone': '🏆',
      'Hidden': '🎭',
      'Productivity': '📈',
      'Explorer': '🗺️',
      'Speedrunner': '⚡'
    };
    return emojiMap[category] || '🎉';
  }

  validate(args: ReadonlyArray<string>): boolean {
    const categoryIndex = args.indexOf('--category');
    if (categoryIndex !== -1 && args[categoryIndex + 1]) {
      const validCategories = [
        'git', 'git_master', 'terminal', 'terminal_ninja',
        'milestone', 'hidden', 'productivity', 'explorer', 'speedrunner'
      ];
      const category = args[categoryIndex + 1].toLowerCase();
      if (!validCategories.includes(category)) {
        console.error(`Invalid category. Valid options: ${validCategories.join(', ')}`);
        return false;
      }
    }
    return true;
  }
}
