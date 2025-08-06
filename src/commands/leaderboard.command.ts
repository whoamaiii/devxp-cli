/**
 * Leaderboard command - Show global or time-based leaderboards
 */
import type { Command } from '../types/command.js';
import { database } from '../modules/database.js';
import chalk from 'chalk';
import ora from 'ora';

export class LeaderboardCommand implements Command {
  readonly name = 'leaderboard';
  readonly description = 'Show global or time-based leaderboards';
  readonly help = `
Usage: devxp leaderboard [options]

Display the leaderboard showing top developers.

Options:
  --period <period>  Time period: all, weekly, monthly (default: weekly)
  --limit <number>   Number of entries to show (default: 10)
  --team <name>      Show team-specific leaderboard
  --me               Highlight your position
  --json             Output in JSON format
`;
  readonly aliases = ['lb', 'rank', 'top'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    const spinner = ora('Loading leaderboard...').start();

    try {
      // Parse arguments
      const periodIndex = args.indexOf('--period');
      const period = periodIndex !== -1 && args[periodIndex + 1] 
        ? args[periodIndex + 1] 
        : 'weekly';
      
      const limitIndex = args.indexOf('--limit');
      const limit = limitIndex !== -1 && args[limitIndex + 1] 
        ? parseInt(args[limitIndex + 1], 10) 
        : 10;
      
      const teamIndex = args.indexOf('--team');
      const team = teamIndex !== -1 && args[teamIndex + 1] 
        ? args[teamIndex + 1] 
        : null;
      
      const highlightMe = args.includes('--me');
      const isJson = args.includes('--json');

      // Initialize database
      await database.initialize();

      // Get leaderboard data
      let leaderboard;
      if (period === 'weekly') {
        leaderboard = await database.getWeeklyLeaderboard(limit);
      } else if (period === 'all' || period === 'global') {
        leaderboard = await database.getGlobalLeaderboard(limit);
      } else {
        // For monthly, we'd need to implement a new method
        leaderboard = await database.getGlobalLeaderboard(limit);
      }

      // Get current user for highlighting
      let currentUsername = null;
      if (highlightMe) {
        currentUsername = await this.getCurrentUsername();
      }

      spinner.stop();

      if (isJson) {
        this.outputJson(leaderboard, period);
      } else {
        this.outputDetailed(leaderboard, period, currentUsername);
      }

      await database.close();
    } catch (error) {
      spinner.fail('Failed to load leaderboard');
      console.error(error);
      await database.close();
    }
  }

  private outputDetailed(leaderboard: any[], period: string, currentUsername: string | null): void {
    // Header
    console.log('\n' + chalk.cyan.bold('═'.repeat(60)));
    console.log(chalk.cyan.bold(`  🏆 Leaderboard - ${this.formatPeriod(period)}`));
    console.log(chalk.cyan.bold('═'.repeat(60)));

    if (leaderboard.length === 0) {
      console.log('\n' + chalk.gray('No entries found for this period.'));
      console.log(chalk.cyan.bold('═'.repeat(60)) + '\n');
      return;
    }

    // Column headers
    console.log('\n' + 
      chalk.gray('Rank'.padEnd(6)) +
      chalk.gray('Developer'.padEnd(25)) +
      chalk.gray('Level'.padEnd(8)) +
      chalk.gray('XP'.padEnd(12)) +
      chalk.gray('Streak')
    );
    console.log(chalk.gray('─'.repeat(60)));

    // Leaderboard entries
    for (const entry of leaderboard) {
      const isCurrentUser = currentUsername && entry.username === currentUsername;
      const rankDisplay = this.getRankDisplay(entry.rank);
      
      let line = '';
      line += rankDisplay.padEnd(6);
      line += this.formatUsername(entry.displayName || entry.username, isCurrentUser).padEnd(25);
      line += this.formatLevel(entry.level).padEnd(8);
      line += this.formatXP(entry.totalXp).padEnd(12);
      line += this.formatStreak(entry.streak);

      if (isCurrentUser) {
        console.log(chalk.yellow.bold('→ ' + line));
      } else {
        console.log('  ' + line);
      }

      // Add separator after top 3
      if (entry.rank === 3) {
        console.log(chalk.gray('─'.repeat(60)));
      }
    }

    // Footer stats
    console.log('\n' + chalk.gray('─'.repeat(60)));
    const totalXP = leaderboard.reduce((sum, entry) => sum + entry.totalXp, 0);
    const avgLevel = Math.round(leaderboard.reduce((sum, entry) => sum + entry.level, 0) / leaderboard.length);
    console.log(chalk.gray(`Total XP: ${totalXP.toLocaleString()} | Average Level: ${avgLevel}`));

    console.log(chalk.cyan.bold('═'.repeat(60)) + '\n');
  }

  private outputJson(leaderboard: any[], period: string): void {
    console.log(JSON.stringify({
      period,
      timestamp: new Date().toISOString(),
      entries: leaderboard.map(entry => ({
        rank: entry.rank,
        userId: entry.userId,
        username: entry.username,
        displayName: entry.displayName,
        level: entry.level,
        totalXp: entry.totalXp,
        streak: entry.streak
      }))
    }, null, 2));
  }

  private getRankDisplay(rank: number): string {
    switch (rank) {
    case 1:
      return chalk.yellow('🥇 1st');
    case 2:
      return chalk.gray('🥈 2nd');
    case 3:
      return chalk.rgb(205, 127, 50)('🥉 3rd');
    default:
      return chalk.white(`#${rank}`);
    }
  }

  private formatUsername(username: string, highlight: boolean = false): string {
    const truncated = username.length > 20 ? username.substring(0, 17) + '...' : username;
    if (highlight) {
      return chalk.yellow.bold(truncated);
    }
    return chalk.white(truncated);
  }

  private formatLevel(level: number): string {
    if (level >= 50) {
      return chalk.magenta.bold(`Lv.${level}`);
    } else if (level >= 25) {
      return chalk.blue.bold(`Lv.${level}`);
    } else if (level >= 10) {
      return chalk.green(`Lv.${level}`);
    }
    return chalk.white(`Lv.${level}`);
  }

  private formatXP(xp: number): string {
    if (xp >= 100000) {
      return chalk.yellow.bold(`${(xp / 1000).toFixed(0)}k XP`);
    } else if (xp >= 10000) {
      return chalk.green.bold(`${(xp / 1000).toFixed(1)}k XP`);
    }
    return chalk.white(`${xp.toLocaleString()} XP`);
  }

  private formatStreak(streak: number): string {
    if (streak >= 100) {
      return chalk.red.bold(`🔥 ${streak}d`);
    } else if (streak >= 30) {
      return chalk.yellow(`🔥 ${streak}d`);
    } else if (streak >= 7) {
      return chalk.green(`🔥 ${streak}d`);
    } else if (streak > 0) {
      return chalk.white(`${streak}d`);
    }
    return chalk.gray('-');
  }

  private formatPeriod(period: string): string {
    switch (period) {
    case 'weekly':
      return 'This Week';
    case 'monthly':
      return 'This Month';
    case 'all':
    case 'global':
      return 'All Time';
    default:
      return period;
    }
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
      const validPeriods = ['all', 'global', 'weekly', 'monthly'];
      if (!validPeriods.includes(args[periodIndex + 1])) {
        console.error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
        return false;
      }
    }

    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      const limit = parseInt(args[limitIndex + 1], 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        console.error('Limit must be a number between 1 and 100');
        return false;
      }
    }

    return true;
  }
}
