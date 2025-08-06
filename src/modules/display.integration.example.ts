/**
 * Integration example for the display module
 * Shows how to use display features in your DevXP CLI application
 */

import { displayManager } from './display';
import { XPEngine } from './xp';
import { AchievementEngine } from './achievements';
import chalk from 'chalk';

// Example player state (would normally come from your state management)
interface PlayerState {
  name: string;
  level: number;
  xp: number;
  maxXP: number;
  streak: number;
  totalCommits: number;
  achievements: string[];
}

/**
 * Example integration class that shows how to use the display module
 * with the XP and Achievement engines
 */
export class GameUI {
  private player: PlayerState;
  private xpEngine: XPEngine;
  private achievementEngine: AchievementEngine;

  constructor(playerName: string) {
    // Initialize player state
    this.player = {
      name: playerName,
      level: 1,
      xp: 0,
      maxXP: 100,
      streak: 0,
      totalCommits: 0,
      achievements: []
    };

    // Initialize engines
    this.xpEngine = new XPEngine();
    this.achievementEngine = new AchievementEngine();

    // Show welcome screen
    displayManager.displayWelcome(playerName);
  }

  /**
   * Handle a git commit event
   */
  async onGitCommit(message: string, filesChanged: number): Promise<void> {
    const xpPopup = displayManager.getXPPopup();
    const xpBar = displayManager.getXPProgressBar();

    // Calculate XP based on commit
    const baseXP = 10;
    const filesBonus = filesChanged * 2;
    const totalXP = baseXP + filesBonus;

    // Show XP gain popup
    await xpPopup.show(totalXP, 'Git commit');

    // Update player XP
    const oldXP = this.player.xp;
    this.player.xp += totalXP;
    this.player.totalCommits++;

    // Check for level up
    if (this.player.xp >= this.player.maxXP) {
      await this.handleLevelUp();
    } else {
      // Animate XP bar
      await xpBar.animateXPGain(oldXP, this.player.xp, this.player.maxXP);
    }

    // Check for achievements
    await this.checkAchievements();
  }

  /**
   * Handle level up
   */
  private async handleLevelUp(): Promise<void> {
    const levelUpAnimation = displayManager.getLevelUpAnimation();
    
    // Calculate new level
    this.player.level++;
    this.player.xp = this.player.xp - this.player.maxXP;
    this.player.maxXP = Math.floor(this.player.maxXP * 1.5);

    // Show level up animation
    await levelUpAnimation.displayLevelUp(this.player.level);

    // Check for skill unlocks
    if (this.player.level % 5 === 0) {
      const skills = ['Advanced Debugging', 'Code Optimization', 'Test Mastery', 'Architecture Design'];
      const unlockedSkill = skills[Math.floor((this.player.level / 5) - 1) % skills.length];
      await levelUpAnimation.displaySkillUnlock(unlockedSkill);
    }
  }

  /**
   * Check and unlock achievements
   */
  private async checkAchievements(): Promise<void> {
    const achievementNotification = displayManager.getAchievementNotification();

    // Check for first commit achievement
    if (this.player.totalCommits === 1 && !this.player.achievements.includes('first_commit')) {
      this.player.achievements.push('first_commit');
      achievementNotification.displayUnlock({
        name: 'First Steps',
        description: 'Made your first commit',
        icon: '🎯',
        rarity: 'common',
        xpReward: 10
      });
      this.player.xp += 10;
    }

    // Check for commit milestones
    const commitMilestones = [10, 50, 100, 500, 1000];
    for (const milestone of commitMilestones) {
      const achievementId = `commits_${milestone}`;
      if (this.player.totalCommits >= milestone && !this.player.achievements.includes(achievementId)) {
        this.player.achievements.push(achievementId);
        
        const rarity = milestone >= 500 ? 'legendary' : 
                       milestone >= 100 ? 'epic' : 
                       milestone >= 50 ? 'rare' : 'common';
        
        achievementNotification.displayUnlock({
          name: `${milestone} Commits`,
          description: `Reached ${milestone} total commits`,
          icon: '📝',
          rarity: rarity,
          xpReward: milestone
        });
        this.player.xp += milestone;
      }
    }
  }

  /**
   * Show player dashboard
   */
  showDashboard(): void {
    const dashboard = displayManager.getStatusDashboard();
    
    dashboard.display({
      name: this.player.name,
      level: this.player.level,
      xp: this.player.xp,
      maxXP: this.player.maxXP,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      streak: this.player.streak,
      achievements: this.player.achievements.length,
      skills: [
        { name: 'Git', level: Math.floor(this.player.totalCommits / 10) },
        { name: 'Coding', level: this.player.level }
      ],
      recentActivity: [
        `Total commits: ${this.player.totalCommits}`,
        `Current level: ${this.player.level}`,
        `Achievements unlocked: ${this.player.achievements.length}`
      ]
    });
  }

  /**
   * Show statistics charts
   */
  showStatistics(dailyCommits: number[]): void {
    const charts = displayManager.getTerminalChart();
    
    // Show commit trend
    console.log(chalk.bold('\n📊 Commit Statistics\n'));
    charts.displayLineChart(dailyCommits, 'Daily Commits (Last 30 days)');
    
    // Show sparkline for quick view
    console.log('\n' + charts.displaySparkline(dailyCommits.slice(-7), 'Last 7 days'));
    
    // Show activity distribution
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = dailyCommits.slice(-7).map((value, index) => ({
      label: weekDays[index],
      value,
      color: value > 10 ? '#00ff00' : value > 5 ? '#ffaa00' : '#ff0000'
    }));
    
    charts.displayBarChart(weekData);
  }

  /**
   * Handle streak update
   */
  async updateStreak(newStreak: number): Promise<void> {
    const xpPopup = displayManager.getXPPopup();
    
    this.player.streak = newStreak;
    
    // Show combo for streak milestones
    if (newStreak > 0 && newStreak % 5 === 0) {
      const multiplier = Math.floor(newStreak / 5);
      await xpPopup.showCombo(50, multiplier);
      this.player.xp += 50 * multiplier;
    }
  }

  /**
   * Show mini status (for command prompt integration)
   */
  showMiniStatus(): void {
    const dashboard = displayManager.getStatusDashboard();
    dashboard.displayMini(
      this.player.level,
      this.player.xp,
      this.player.maxXP,
      this.player.streak
    );
  }
}

// Example usage
async function exampleUsage() {
  console.clear();
  
  // Initialize the game UI
  const gameUI = new GameUI('Developer');
  
  // Wait for welcome screen
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate some git commits
  console.log(chalk.bold.cyan('\n🎮 Simulating Development Activity...\n'));
  
  // First commit
  await gameUI.onGitCommit('Initial commit', 5);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // More commits
  await gameUI.onGitCommit('Add feature X', 10);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await gameUI.onGitCommit('Fix bug in module Y', 3);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Update streak
  await gameUI.updateStreak(5);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Show dashboard
  console.clear();
  gameUI.showDashboard();
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Show statistics
  console.clear();
  const mockDailyCommits = [
    3, 5, 8, 2, 12, 15, 7, 9, 11, 4,
    6, 10, 13, 8, 5, 7, 14, 16, 9, 11,
    4, 8, 12, 6, 10, 15, 18, 20, 14, 12
  ];
  gameUI.showStatistics(mockDailyCommits);
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Show mini status
  console.clear();
  console.log(chalk.bold.cyan('\n📌 Mini Status Bar:\n'));
  gameUI.showMiniStatus();
  
  console.log(chalk.green('\n✅ Integration example complete!\n'));
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(error => {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  });
}

// Export for use in other modules
export { GameUI, exampleUsage };
