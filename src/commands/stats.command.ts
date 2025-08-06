/**
 * Stats command - Display detailed statistics and charts
 */
import type { Command } from '../types/command.js';
import { database } from '../modules/database.js';
import chalk from 'chalk';
import ora from 'ora';

export class StatsCommand implements Command {
  readonly name = 'stats';
  readonly description = 'Display detailed statistics and charts';
  readonly help = `
Usage: devxp stats [options]

Display detailed statistics about your development activity:
- Activity breakdown by type
- Time-based statistics
- XP progression over time
- Productivity metrics

Options:
  --user <username>    Show stats for specific user (default: current user)
  --period <period>    Time period: day, week, month, year, all (default: month)
  --type <type>        Focus on specific activity type
  --chart              Show ASCII charts
  --json               Output in JSON format
`;
  readonly aliases = ['statistics', 'metrics'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const spinner = ora('Loading statistics...').start();

    try {
      // Parse arguments
      const userIndex = args.indexOf('--user');
      const username = userIndex !== -1 && args[userIndex + 1] 
        ? args[userIndex + 1] 
        : await this.getCurrentUsername();
      
      const periodIndex = args.indexOf('--period');
      const period = periodIndex !== -1 && args[periodIndex + 1] 
        ? args[periodIndex + 1] 
        : 'month';
      
      const typeIndex = args.indexOf('--type');
      const activityType = typeIndex !== -1 && args[typeIndex + 1] 
        ? args[typeIndex + 1] 
        : null;
      
      const showChart = args.includes('--chart');
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

      // Get statistics
      const stats = await database.getUserStats(user.id);
      const activities = await this.getActivitiesForPeriod(user.id, period);
      const xpHistory = await database.getUserXpHistory(user.id, 100);

      spinner.stop();

      if (isJson) {
        this.outputJson({ stats, activities, xpHistory, period });
      } else {
        this.outputDetailed(user, stats, activities, xpHistory, period, activityType, showChart);
      }

      await database.close();
    } catch (error) {
      spinner.fail('Failed to load statistics');
      console.error(error);
      await database.close();
    }
  }

  private async getActivitiesForPeriod(userId: string, period: string): Promise<any[]> {
    let limit = 100;
    switch (period) {
      case 'day':
        limit = 50;
        break;
      case 'week':
        limit = 200;
        break;
      case 'month':
        limit = 500;
        break;
      case 'year':
        limit = 2000;
        break;
      case 'all':
        limit = undefined;
        break;
    }
    return database.getUserActivities(userId, limit);
  }

  private outputDetailed(
    user: any,
    stats: any,
    activities: any[],
    xpHistory: any[],
    period: string,
    activityType: string | null,
    showChart: boolean
  ): void {
    // Header
    console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(`  Statistics - ${user.displayName} (${period})`));
    console.log(chalk.cyan.bold('═'.repeat(60)));

    // Overview
    console.log('\n' + chalk.yellow.bold('📊 Overview'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  ${chalk.yellow('Total Activities:')} ${stats.totalActivities}`);
    console.log(`  ${chalk.green('Total Achievements:')} ${stats.totalAchievements}`);
    console.log(`  ${chalk.blue('Average XP/Day:')} ${stats.averageXpPerDay}`);
    console.log(`  ${chalk.magenta('Most Productive Day:')} ${stats.mostProductiveDay}`);
    console.log(`  ${chalk.cyan('Favorite Activity:')} ${stats.favoriteActivityType}`);

    // Activity breakdown
    if (Object.keys(stats.xpByActivityType).length > 0) {
      console.log('\n' + chalk.green.bold('🎯 XP by Activity Type'));
      console.log(chalk.gray('─'.repeat(40)));
      
      const sortedTypes = Object.entries(stats.xpByActivityType)
        .sort(([, a], [, b]) => b - a)
        .filter(([type]) => !activityType || type === activityType);
      
      const maxXp = Math.max(...Object.values(stats.xpByActivityType));
      
      for (const [type, xp] of sortedTypes) {
        const percentage = (xp / maxXp * 100).toFixed(0);
        const bar = this.drawBar(xp, maxXp, 20);
        console.log(`  ${type.padEnd(20)} ${bar} ${chalk.green(`${xp} XP`)} (${percentage}%)`);
      }
    }

    // Time-based analysis
    if (activities.length > 0) {
      console.log('\n' + chalk.blue.bold('⏰ Activity Timeline'));
      console.log(chalk.gray('─'.repeat(40)));
      
      const hourCounts = new Array(24).fill(0);
      const dayCounts = new Array(7).fill(0);
      
      for (const activity of activities) {
        const date = new Date(activity.timestamp);
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
      }
      
      // Most active hours
      const topHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      console.log(`  ${chalk.gray('Most active hours:')}`);
      for (const { hour, count } of topHours) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
        console.log(`    • ${timeStr}: ${count} activities`);
      }
      
      // Most active days
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const topDays = dayCounts
        .map((count, day) => ({ day: dayNames[day], count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      console.log(`  ${chalk.gray('Most active days:')}`);
      for (const { day, count } of topDays) {
        console.log(`    • ${day}: ${count} activities`);
      }
    }

    // XP progression chart
    if (showChart && xpHistory.length > 0) {
      console.log('\n' + chalk.magenta.bold('📈 XP Progression'));
      console.log(chalk.gray('─'.repeat(40)));
      
      // Group by day and show last 7 days
      const dailyXp = new Map<string, number>();
      for (const entry of xpHistory) {
        const date = new Date(entry.timestamp).toLocaleDateString();
        dailyXp.set(date, (dailyXp.get(date) || 0) + entry.xpChange);
      }
      
      const sortedDays = Array.from(dailyXp.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-7);
      
      if (sortedDays.length > 0) {
        const maxDailyXp = Math.max(...sortedDays.map(([, xp]) => xp));
        
        for (const [date, xp] of sortedDays) {
          const bar = this.drawBar(xp, maxDailyXp, 30);
          const shortDate = new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
          console.log(`  ${shortDate.padEnd(8)} ${bar} ${chalk.green(`+${xp} XP`)}`);
        }
      }
    }

    // Recent milestones
    const milestones = this.calculateMilestones(user, activities, xpHistory);
    if (milestones.length > 0) {
      console.log('\n' + chalk.purple.bold('🏆 Recent Milestones'));
      console.log(chalk.gray('─'.repeat(40)));
      for (const milestone of milestones.slice(0, 5)) {
        console.log(`  ${milestone}`);
      }
    }

    console.log('\n' + chalk.cyan.bold('═'.repeat(60)) + '\n');
  }

  private outputJson(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  private drawBar(value: number, max: number, width: number): string {
    const filled = Math.floor(width * value / max);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  private calculateMilestones(user: any, activities: any[], xpHistory: any[]): string[] {
    const milestones: string[] = [];
    
    // Check for level milestones
    const levelMilestones = [10, 25, 50, 75, 100];
    for (const level of levelMilestones) {
      if (user.level >= level) {
        milestones.push(`🎯 Reached level ${level}`);
      }
    }
    
    // Check for XP milestones
    const xpMilestones = [1000, 5000, 10000, 50000, 100000];
    for (const xp of xpMilestones) {
      if (user.totalXp >= xp) {
        milestones.push(`⭐ Earned ${xp.toLocaleString()} total XP`);
      }
    }
    
    // Check for activity milestones
    const activityMilestones = [100, 500, 1000, 5000];
    for (const count of activityMilestones) {
      if (activities.length >= count) {
        milestones.push(`🚀 Completed ${count} activities`);
      }
    }
    
    // Check for streak milestones
    const streakMilestones = [7, 30, 100, 365];
    for (const days of streakMilestones) {
      if (user.longestStreak >= days) {
        milestones.push(`🔥 Maintained ${days}-day streak`);
      }
    }
    
    return milestones;
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
    const periodIndex = args.indexOf('--period');
    if (periodIndex !== -1 && args[periodIndex + 1]) {
      const validPeriods = ['day', 'week', 'month', 'year', 'all'];
      if (!validPeriods.includes(args[periodIndex + 1])) {
        console.error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
        return false;
      }
    }
    return true;
  }
}
