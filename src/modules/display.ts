import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { terminal } from 'terminal-kit';
import * as TWEEN from '@tweenjs/tween.js';

// Types for display module
export interface DisplayConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    xp: string;
    level: string;
  };
  animations: {
    duration: number;
    fps: number;
  };
  progressBar: {
    width: number;
    filledChar: string;
    emptyChar: string;
    borderChar: string;
  };
}

// Default configuration
const defaultConfig: DisplayConfig = {
  colors: {
    primary: '#00ff00',
    secondary: '#00aaff',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff0044',
    xp: '#ffff00',
    level: '#ff00ff'
  },
  animations: {
    duration: 1500,
    fps: 30
  },
  progressBar: {
    width: 40,
    filledChar: '█',
    emptyChar: '░',
    borderChar: '│'
  }
};

// ASCII Art Level-Up Animations
export class LevelUpAnimation {
  private config: DisplayConfig;
  private term = terminal;

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Display level up animation with figlet ASCII art
   */
  async displayLevelUp(newLevel: number): Promise<void> {
    return new Promise((resolve) => {
      const levelText = `LEVEL ${newLevel}!`;
      
      // Clear area for animation
      console.clear();
      
      // Create gradient effect for the text
      const gradientText = gradient.rainbow.multiline(
        figlet.textSync(levelText, {
          font: 'Big',
          horizontalLayout: 'default',
          verticalLayout: 'default'
        })
      );

      // Animate the appearance with particles
      this.animateWithParticles(gradientText);
      
      // Display congratulations message
      setTimeout(() => {
        const congratsBox = boxen(
          chalk.bold.yellow('🎉 Congratulations! 🎉\n') +
          chalk.green(`You've reached Level ${newLevel}!\n`) +
          chalk.cyan('New abilities unlocked!'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'yellow',
            align: 'center'
          }
        );
        console.log(congratsBox);
        resolve();
      }, this.config.animations.duration);
    });
  }

  /**
   * Animate text with particle effects
   */
  private animateWithParticles(text: string): void {
    const lines = text.split('\n');
    const particles = ['✨', '⭐', '🌟', '💫', '✦', '✧'];
    
    // Animate each line appearing
    lines.forEach((line, index) => {
      setTimeout(() => {
        // Add random particles around the text
        const particle = particles[Math.floor(Math.random() * particles.length)];
        const paddedLine = `${particle} ${line} ${particle}`;
        console.log(paddedLine);
      }, index * 100);
    });
  }

  /**
   * Display skill unlock animation
   */
  async displaySkillUnlock(skillName: string): Promise<void> {
    const skillText = figlet.textSync('NEW SKILL', {
      font: 'Small',
      horizontalLayout: 'default'
    });

    console.log(gradient.pastel.multiline(skillText));
    console.log(
      boxen(
        chalk.bold.cyan(`✨ ${skillName} ✨\n`) +
        chalk.gray('has been unlocked!'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          align: 'center'
        }
      )
    );
  }
}

// XP Progress Bar with Custom Characters
export class XPProgressBar {
  private config: DisplayConfig;
  private currentXP: number = 0;
  private targetXP: number = 0;
  private maxXP: number = 100;

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Create and display an XP progress bar
   */
  display(currentXP: number, maxXP: number, label: string = 'XP'): string {
    this.currentXP = currentXP;
    this.maxXP = maxXP;

    const percentage = Math.min((currentXP / maxXP) * 100, 100);
    const filledWidth = Math.floor((percentage / 100) * this.config.progressBar.width);
    const emptyWidth = this.config.progressBar.width - filledWidth;

    const filledBar = this.config.progressBar.filledChar.repeat(filledWidth);
    const emptyBar = this.config.progressBar.emptyChar.repeat(emptyWidth);
    
    const bar = 
      chalk.gray(this.config.progressBar.borderChar) +
      chalk.hex(this.config.colors.xp)(filledBar) +
      chalk.gray(emptyBar) +
      chalk.gray(this.config.progressBar.borderChar);

    const progressText = chalk.white(
      ` ${label}: ${currentXP}/${maxXP} (${percentage.toFixed(1)}%)`
    );

    return bar + progressText;
  }

  /**
   * Animate XP gain with smooth transition
   */
  async animateXPGain(startXP: number, endXP: number, maxXP: number): Promise<void> {
    return new Promise((resolve) => {
      const coords = { xp: startXP };
      const tween = new TWEEN.Tween(coords)
        .to({ xp: endXP }, this.config.animations.duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          // Clear previous line and redraw
          process.stdout.write('\r' + this.display(Math.floor(coords.xp), maxXP));
        })
        .onComplete(() => {
          console.log(); // New line after animation
          resolve();
        })
        .start();

      // Animation loop
      const animate = (time: number) => {
        if (tween.update(time)) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    });
  }

  /**
   * Create a multi-stat progress bar
   */
  displayMultiBar(stats: Array<{ label: string; current: number; max: number; color: string }>): string {
    return stats.map(stat => {
      const percentage = Math.min((stat.current / stat.max) * 100, 100);
      const width = 20; // Smaller width for multi-bar display
      const filledWidth = Math.floor((percentage / 100) * width);
      const emptyWidth = width - filledWidth;

      const bar = 
        chalk.hex(stat.color)('█'.repeat(filledWidth)) +
        chalk.gray('░'.repeat(emptyWidth));

      return chalk.white(`${stat.label.padEnd(10)} `) + 
             `[${bar}] ` +
             chalk.gray(`${stat.current}/${stat.max}`);
    }).join('\n');
  }
}

// Achievement Unlock Notifications
export class AchievementNotification {
  private config: DisplayConfig;

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Display colorful achievement unlock notification
   */
  displayUnlock(achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
  }): void {
    const rarityColors = {
      common: chalk.gray,
      rare: chalk.blue,
      epic: chalk.magenta,
      legendary: chalk.yellow
    };

    const rarityGradients = {
      common: gradient(['#808080', '#a0a0a0']),
      rare: gradient(['#0066cc', '#0099ff']),
      epic: gradient(['#9933ff', '#cc66ff']),
      legendary: gradient(['#ffcc00', '#ffff00'])
    };

    const color = rarityColors[achievement.rarity];
    const gradientColor = rarityGradients[achievement.rarity];

    // Create the achievement banner
    const banner = figlet.textSync('ACHIEVEMENT!', {
      font: 'Small',
      horizontalLayout: 'default'
    });

    console.log(gradientColor.multiline(banner));

    // Create the achievement details box
    const achievementBox = boxen(
      color.bold(`${achievement.icon} ${achievement.name}\n\n`) +
      chalk.white(achievement.description + '\n\n') +
      chalk.green(`+${achievement.xpReward} XP`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: achievement.rarity === 'legendary' ? 'yellow' : 
          achievement.rarity === 'epic' ? 'magenta' :
            achievement.rarity === 'rare' ? 'blue' : 'gray',
        align: 'center'
      }
    );

    console.log(achievementBox);

    // Add sparkle animation
    this.displaySparkles();
  }

  /**
   * Display sparkle animation around achievement
   */
  private displaySparkles(): void {
    const sparkles = ['✨', '🌟', '⭐', '💫'];
    const positions = [
      { x: 0, y: -1 },
      { x: 10, y: -1 },
      { x: 20, y: -1 },
      { x: 30, y: -1 }
    ];

    positions.forEach((pos, index) => {
      setTimeout(() => {
        terminal.moveTo(pos.x, pos.y);
        terminal(sparkles[index % sparkles.length]);
      }, index * 100);
    });
  }

  /**
   * Display achievement progress
   */
  displayProgress(achievementName: string, current: number, total: number): void {
    const percentage = (current / total) * 100;
    const progressBar = new XPProgressBar(this.config);
    
    const progressBox = boxen(
      chalk.bold.white(`📊 ${achievementName}\n\n`) +
      progressBar.display(current, total, 'Progress') + '\n\n' +
      chalk.gray(`${total - current} more to unlock!`),
      {
        padding: 1,
        borderStyle: 'single',
        borderColor: 'cyan',
        align: 'center'
      }
    );

    console.log(progressBox);
  }
}

// Status Dashboard Layout
export class StatusDashboard {
  private config: DisplayConfig;

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Display a comprehensive status dashboard
   */
  display(playerData: {
    name: string;
    level: number;
    xp: number;
    maxXP: number;
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    streak: number;
    achievements: number;
    skills: Array<{ name: string; level: number }>;
    recentActivity: string[];
  }): void {
    // Clear screen for dashboard
    console.clear();

    // Header with player name and level
    const header = gradient.rainbow(
      figlet.textSync(playerData.name, {
        font: 'Standard',
        horizontalLayout: 'default'
      })
    );
    console.log(header);

    // Main stats box
    const mainStats = boxen(
      chalk.bold.yellow(`⭐ Level ${playerData.level}\n\n`) +
      this.createStatBar('XP', playerData.xp, playerData.maxXP, this.config.colors.xp) + '\n' +
      this.createStatBar('Health', playerData.health, playerData.maxHealth, '#ff6b6b') + '\n' +
      this.createStatBar('Energy', playerData.energy, playerData.maxEnergy, '#4ecdc4') + '\n\n' +
      chalk.bold.white(`🔥 Streak: ${playerData.streak} days\n`) +
      chalk.bold.white(`🏆 Achievements: ${playerData.achievements}`),
      {
        title: '📊 Stats',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
        float: 'left'
      }
    );

    // Skills box
    const skillsContent = playerData.skills
      .map(skill => {
        const stars = '⭐'.repeat(Math.min(skill.level, 5));
        return `${skill.name.padEnd(15)} ${stars} (Lvl ${skill.level})`;
      })
      .join('\n');

    const skillsBox = boxen(
      skillsContent,
      {
        title: '💪 Skills',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        float: 'right'
      }
    );

    // Recent activity box
    const activityContent = playerData.recentActivity
      .map((activity, index) => `${index + 1}. ${activity}`)
      .join('\n');

    const activityBox = boxen(
      activityContent || 'No recent activity',
      {
        title: '📝 Recent Activity',
        padding: 1,
        borderStyle: 'single',
        borderColor: 'green',
        float: 'center'
      }
    );

    // Display all boxes
    console.log(mainStats);
    console.log(skillsBox);
    console.log(activityBox);
  }

  /**
   * Create a colored stat bar
   */
  private createStatBar(label: string, current: number, max: number, color: string): string {
    const percentage = (current / max) * 100;
    const barWidth = 20;
    const filled = Math.floor((percentage / 100) * barWidth);
    const empty = barWidth - filled;

    const bar = chalk.hex(color)('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    return `${label.padEnd(8)} [${bar}] ${current}/${max}`;
  }

  /**
   * Display a mini dashboard (compact version)
   */
  displayMini(level: number, xp: number, maxXP: number, streak: number): void {
    const miniBox = boxen(
      chalk.bold(`Lvl ${level} | `) +
      chalk.yellow(`XP: ${xp}/${maxXP} | `) +
      chalk.red(`🔥 ${streak}`),
      {
        padding: 0,
        borderStyle: 'single',
        borderColor: 'dim'
      }
    );
    console.log(miniBox);
  }
}

// Real-time XP Gain Popups
export class XPPopup {
  private config: DisplayConfig;
  private activePopups: Array<{ text: string; y: number; opacity: number }> = [];

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Display XP gain popup animation
   */
  async show(xpAmount: number, reason: string = ''): Promise<void> {
    const text = chalk.bold.yellow(`+${xpAmount} XP`) + 
                 (reason ? chalk.gray(` (${reason})`) : '');
    
    // Create floating animation effect
    return new Promise((resolve) => {
      let y = 0;
      const maxY = 5;
      const step = 0.5;
      
      const animationInterval = setInterval(() => {
        // Clear previous position
        process.stdout.write('\x1b[2K\r');
        
        // Calculate fade effect
        const opacity = 1 - (y / maxY);
        const spaces = ' '.repeat(Math.floor(y * 2));
        
        // Display popup with floating effect
        if (opacity > 0) {
          const fadedText = this.applyOpacity(text, opacity);
          console.log(spaces + fadedText);
          y += step;
        } else {
          clearInterval(animationInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Display combo XP popup
   */
  async showCombo(baseXP: number, multiplier: number): Promise<void> {
    const totalXP = baseXP * multiplier;
    
    const comboText = figlet.textSync(`x${multiplier}`, {
      font: 'Small',
      horizontalLayout: 'default'
    });

    console.log(gradient.cristal.multiline(comboText));
    
    const comboBox = boxen(
      chalk.bold.yellow('🔥 COMBO! 🔥\n\n') +
      chalk.white(`Base XP: ${baseXP}\n`) +
      chalk.cyan(`Multiplier: x${multiplier}\n`) +
      chalk.bold.green(`Total: ${totalXP} XP!`),
      {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'yellow',
        align: 'center'
      }
    );
    
    console.log(comboBox);
  }

  /**
   * Apply opacity effect to text (simulate fading)
   */
  private applyOpacity(text: string, opacity: number): string {
    if (opacity >= 0.7) return text;
    if (opacity >= 0.4) return chalk.dim(text);
    return chalk.gray(text);
  }

  /**
   * Display multiple XP gains simultaneously
   */
  async showMultiple(gains: Array<{ amount: number; reason: string }>): Promise<void> {
    const total = gains.reduce((sum, gain) => sum + gain.amount, 0);
    
    console.log(chalk.bold.cyan('📈 XP Gains:'));
    gains.forEach(gain => {
      console.log(`  ${chalk.yellow(`+${gain.amount}`)} - ${chalk.gray(gain.reason)}`);
    });
    console.log(chalk.bold.green(`\n💰 Total: +${total} XP`));
  }
}

// Terminal-friendly Charts
export class TerminalChart {
  private config: DisplayConfig;

  constructor(config: DisplayConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Display a bar chart for statistics
   */
  displayBarChart(data: Array<{ label: string; value: number; color?: string }>): void {
    const maxValue = Math.max(...data.map(d => d.value));
    const maxBarWidth = 40;

    console.log(chalk.bold.white('\n📊 Statistics\n'));

    data.forEach(item => {
      const barWidth = Math.floor((item.value / maxValue) * maxBarWidth);
      const bar = '█'.repeat(barWidth);
      const color = item.color ? chalk.hex(item.color) : chalk.cyan;
      
      console.log(
        `${item.label.padEnd(15)} ${color(bar)} ${chalk.gray(item.value.toString())}`
      );
    });
  }

  /**
   * Display a line chart using ASCII characters
   */
  displayLineChart(data: number[], label: string = 'Progress'): void {
    const height = 10;
    const width = data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    console.log(chalk.bold.white(`\n📈 ${label}\n`));

    // Create the chart grid
    const chart: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

    // Plot the data points
    data.forEach((value, x) => {
      const y = Math.floor(((value - min) / range) * (height - 1));
      chart[height - 1 - y][x] = '●';
    });

    // Connect points with lines
    for (let x = 0; x < width - 1; x++) {
      const y1 = Math.floor(((data[x] - min) / range) * (height - 1));
      const y2 = Math.floor(((data[x + 1] - min) / range) * (height - 1));
      
      if (y1 !== y2) {
        const yMin = Math.min(y1, y2);
        const yMax = Math.max(y1, y2);
        for (let y = yMin + 1; y < yMax; y++) {
          chart[height - 1 - y][x] = '│';
        }
      }
    }

    // Display the chart
    chart.forEach((row, index) => {
      const rowStr = row.join('');
      const yLabel = Math.round(max - (index / (height - 1)) * range);
      console.log(chalk.gray(`${yLabel.toString().padStart(5)} │`) + chalk.cyan(rowStr));
    });

    // X-axis
    console.log(chalk.gray('      └' + '─'.repeat(width)));
  }

  /**
   * Display a pie chart using ASCII characters
   */
  displayPieChart(data: Array<{ label: string; value: number; color: string }>): void {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const chartSymbols = ['█', '▓', '▒', '░', '▪', '▫'];
    
    console.log(chalk.bold.white('\n🥧 Distribution\n'));

    data.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const barWidth = Math.floor(percentage / 2);
      const symbol = chartSymbols[index % chartSymbols.length];
      const bar = symbol.repeat(barWidth);
      
      console.log(
        chalk.hex(item.color)(bar) + ' ' +
        chalk.white(`${item.label}: `) +
        chalk.gray(`${percentage.toFixed(1)}% (${item.value})`)
      );
    });
  }

  /**
   * Display a sparkline chart
   */
  displaySparkline(data: number[], label: string = ''): string {
    const sparkSymbols = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const sparkline = data.map(value => {
      const index = Math.floor(((value - min) / range) * (sparkSymbols.length - 1));
      return sparkSymbols[index];
    }).join('');

    return label ? `${label}: ${chalk.cyan(sparkline)}` : chalk.cyan(sparkline);
  }
}

// Main Display Manager
export class DisplayManager {
  private config: DisplayConfig;
  private levelUpAnimation: LevelUpAnimation;
  private xpProgressBar: XPProgressBar;
  private achievementNotification: AchievementNotification;
  private statusDashboard: StatusDashboard;
  private xpPopup: XPPopup;
  private terminalChart: TerminalChart;

  constructor(config: Partial<DisplayConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.levelUpAnimation = new LevelUpAnimation(this.config);
    this.xpProgressBar = new XPProgressBar(this.config);
    this.achievementNotification = new AchievementNotification(this.config);
    this.statusDashboard = new StatusDashboard(this.config);
    this.xpPopup = new XPPopup(this.config);
    this.terminalChart = new TerminalChart(this.config);
  }

  /**
   * Get level up animation handler
   */
  getLevelUpAnimation(): LevelUpAnimation {
    return this.levelUpAnimation;
  }

  /**
   * Get XP progress bar handler
   */
  getXPProgressBar(): XPProgressBar {
    return this.xpProgressBar;
  }

  /**
   * Get achievement notification handler
   */
  getAchievementNotification(): AchievementNotification {
    return this.achievementNotification;
  }

  /**
   * Get status dashboard handler
   */
  getStatusDashboard(): StatusDashboard {
    return this.statusDashboard;
  }

  /**
   * Get XP popup handler
   */
  getXPPopup(): XPPopup {
    return this.xpPopup;
  }

  /**
   * Get terminal chart handler
   */
  getTerminalChart(): TerminalChart {
    return this.terminalChart;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DisplayConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize components with new config
    this.levelUpAnimation = new LevelUpAnimation(this.config);
    this.xpProgressBar = new XPProgressBar(this.config);
    this.achievementNotification = new AchievementNotification(this.config);
    this.statusDashboard = new StatusDashboard(this.config);
    this.xpPopup = new XPPopup(this.config);
    this.terminalChart = new TerminalChart(this.config);
  }

  /**
   * Display a welcome screen
   */
  displayWelcome(playerName: string): void {
    console.clear();
    
    const welcomeText = figlet.textSync('WELCOME', {
      font: 'Big',
      horizontalLayout: 'default'
    });

    console.log(gradient.rainbow.multiline(welcomeText));
    
    const welcomeBox = boxen(
      chalk.bold.white(`Hello, ${playerName}!\n\n`) +
      chalk.cyan('Ready to start your journey?\n\n') +
      chalk.gray('Track your progress, unlock achievements,\n') +
      chalk.gray('and level up your skills!'),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        align: 'center'
      }
    );

    console.log(welcomeBox);
  }

  /**
   * Display game over screen
   */
  displayGameOver(finalStats: {
    level: number;
    totalXP: number;
    achievements: number;
    playTime: string;
  }): void {
    console.clear();
    
    const gameOverText = figlet.textSync('GAME OVER', {
      font: 'Doom',
      horizontalLayout: 'default'
    });

    console.log(chalk.red(gameOverText));
    
    const statsBox = boxen(
      chalk.bold.white('📊 Final Statistics\n\n') +
      chalk.yellow(`Final Level: ${finalStats.level}\n`) +
      chalk.cyan(`Total XP: ${finalStats.totalXP}\n`) +
      chalk.green(`Achievements: ${finalStats.achievements}\n`) +
      chalk.magenta(`Play Time: ${finalStats.playTime}`),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        align: 'center'
      }
    );

    console.log(statsBox);
  }
}

// Export default instance
export const displayManager = new DisplayManager();

// Export all classes for direct use
export {
  DisplayManager as Display,
  LevelUpAnimation,
  XPProgressBar,
  AchievementNotification,
  StatusDashboard,
  XPPopup,
  TerminalChart
};
