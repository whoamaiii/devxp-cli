#!/usr/bin/env node

/**
 * Demo script to showcase all display module features
 * Run with: npx ts-node src/modules/display.demo.ts
 */

import { 
  displayManager,
  LevelUpAnimation,
  XPProgressBar,
  AchievementNotification,
  StatusDashboard,
  XPPopup,
  TerminalChart
} from './display';
import { terminal } from 'terminal-kit';
import chalk from 'chalk';

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to clear and display section header
const displaySection = async (title: string) => {
  console.clear();
  console.log(chalk.bold.cyan('\n' + '='.repeat(50)));
  console.log(chalk.bold.yellow(`  ${title}`));
  console.log(chalk.bold.cyan('='.repeat(50) + '\n'));
  await wait(1000);
};

// Main demo function
async function runDemo() {
  console.clear();
  console.log(chalk.bold.green('🎮 DevXP Display Module Demo 🎮\n'));
  console.log(chalk.gray('This demo will showcase all visual feedback features.\n'));
  console.log(chalk.yellow('Press any key to continue...'));
  
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
    process.stdin.setRawMode(true);
  });

  // 1. Welcome Screen
  await displaySection('Welcome Screen');
  displayManager.displayWelcome('Developer');
  await wait(3000);

  // 2. XP Progress Bar Animations
  await displaySection('XP Progress Bar');
  const xpBar = displayManager.getXPProgressBar();
  
  console.log(chalk.bold('Static XP Bar:'));
  console.log(xpBar.display(450, 1000, 'Experience'));
  await wait(2000);

  console.log(chalk.bold('\nAnimated XP Gain:'));
  await xpBar.animateXPGain(450, 750, 1000);
  await wait(2000);

  console.log(chalk.bold('\nMulti-Stat Bars:'));
  console.log(xpBar.displayMultiBar([
    { label: 'Coding', current: 85, max: 100, color: '#00ff00' },
    { label: 'Debugging', current: 62, max: 100, color: '#00aaff' },
    { label: 'Testing', current: 45, max: 100, color: '#ffaa00' },
    { label: 'Refactoring', current: 73, max: 100, color: '#ff00ff' }
  ]));
  await wait(3000);

  // 3. XP Popups
  await displaySection('XP Gain Popups');
  const xpPopup = displayManager.getXPPopup();
  
  console.log(chalk.bold('Single XP Gain:'));
  await xpPopup.show(50, 'Code commit');
  await wait(1500);

  console.log(chalk.bold('\nCombo XP:'));
  await xpPopup.showCombo(100, 3);
  await wait(2000);

  console.log(chalk.bold('\nMultiple XP Gains:'));
  await xpPopup.showMultiple([
    { amount: 25, reason: 'Fixed bug' },
    { amount: 50, reason: 'Added feature' },
    { amount: 15, reason: 'Code review' },
    { amount: 30, reason: 'Documentation' }
  ]);
  await wait(3000);

  // 4. Level Up Animation
  await displaySection('Level Up Animation');
  const levelUp = displayManager.getLevelUpAnimation();
  await levelUp.displayLevelUp(10);
  await wait(3000);

  console.log(chalk.bold('\nSkill Unlock:'));
  await levelUp.displaySkillUnlock('Advanced Debugging');
  await wait(3000);

  // 5. Achievement Notifications
  await displaySection('Achievement Notifications');
  const achievements = displayManager.getAchievementNotification();
  
  // Common achievement
  achievements.displayUnlock({
    name: 'First Commit',
    description: 'Made your first git commit',
    icon: '🌱',
    rarity: 'common',
    xpReward: 10
  });
  await wait(3000);

  console.clear();
  // Rare achievement
  achievements.displayUnlock({
    name: 'Bug Hunter',
    description: 'Fixed 10 bugs in a single day',
    icon: '🐛',
    rarity: 'rare',
    xpReward: 50
  });
  await wait(3000);

  console.clear();
  // Epic achievement
  achievements.displayUnlock({
    name: 'Refactoring Master',
    description: 'Successfully refactored legacy code',
    icon: '♻️',
    rarity: 'epic',
    xpReward: 100
  });
  await wait(3000);

  console.clear();
  // Legendary achievement
  achievements.displayUnlock({
    name: 'Code Wizard',
    description: 'Reached 100-day coding streak',
    icon: '🧙‍♂️',
    rarity: 'legendary',
    xpReward: 500
  });
  await wait(3000);

  console.log(chalk.bold('\nAchievement Progress:'));
  achievements.displayProgress('100 Commits', 67, 100);
  await wait(3000);

  // 6. Status Dashboard
  await displaySection('Status Dashboard');
  const dashboard = displayManager.getStatusDashboard();
  
  dashboard.display({
    name: 'CodeMaster',
    level: 42,
    xp: 8750,
    maxXP: 10000,
    health: 85,
    maxHealth: 100,
    energy: 60,
    maxEnergy: 100,
    streak: 15,
    achievements: 23,
    skills: [
      { name: 'JavaScript', level: 8 },
      { name: 'TypeScript', level: 7 },
      { name: 'React', level: 6 },
      { name: 'Node.js', level: 5 },
      { name: 'Testing', level: 4 }
    ],
    recentActivity: [
      'Completed "Add user authentication" task',
      'Fixed critical bug in payment module',
      'Reviewed 3 pull requests',
      'Updated API documentation',
      'Optimized database queries'
    ]
  });
  await wait(5000);

  console.clear();
  console.log(chalk.bold('Mini Dashboard:'));
  dashboard.displayMini(42, 8750, 10000, 15);
  await wait(3000);

  // 7. Terminal Charts
  await displaySection('Terminal Charts');
  const charts = displayManager.getTerminalChart();
  
  console.log(chalk.bold('Bar Chart:'));
  charts.displayBarChart([
    { label: 'Monday', value: 120, color: '#00ff00' },
    { label: 'Tuesday', value: 85, color: '#00aaff' },
    { label: 'Wednesday', value: 150, color: '#ffaa00' },
    { label: 'Thursday', value: 110, color: '#ff00ff' },
    { label: 'Friday', value: 180, color: '#00ffaa' },
    { label: 'Saturday', value: 60, color: '#ff0088' },
    { label: 'Sunday', value: 40, color: '#8800ff' }
  ]);
  await wait(3000);

  console.log(chalk.bold('\nLine Chart:'));
  charts.displayLineChart(
    [10, 25, 30, 45, 40, 55, 65, 60, 75, 80, 85, 90],
    'XP Progress (Last 12 Days)'
  );
  await wait(3000);

  console.log(chalk.bold('\nPie Chart:'));
  charts.displayPieChart([
    { label: 'Coding', value: 45, color: '#00ff00' },
    { label: 'Debugging', value: 25, color: '#ff0000' },
    { label: 'Testing', value: 15, color: '#0000ff' },
    { label: 'Documentation', value: 10, color: '#ffff00' },
    { label: 'Code Review', value: 5, color: '#ff00ff' }
  ]);
  await wait(3000);

  console.log(chalk.bold('\nSparklines:'));
  console.log(charts.displaySparkline([3, 5, 2, 8, 4, 9, 7, 10, 6, 8, 12, 15], 'Daily Commits'));
  console.log(charts.displaySparkline([45, 52, 48, 61, 55, 72, 68, 80, 75, 85, 82, 90], 'XP Trend'));
  console.log(charts.displaySparkline([1, 1, 2, 3, 5, 8, 13, 21, 34, 55], 'Fibonacci'));
  await wait(3000);

  // 8. Custom Configuration Demo
  await displaySection('Custom Theme Configuration');
  
  console.log(chalk.bold('Applying Dark Theme...'));
  displayManager.updateConfig({
    colors: {
      primary: '#bb86fc',
      secondary: '#03dac6',
      success: '#00c853',
      warning: '#ffd600',
      error: '#cf6679',
      xp: '#03dac6',
      level: '#bb86fc'
    },
    progressBar: {
      width: 30,
      filledChar: '▓',
      emptyChar: '░',
      borderChar: '║'
    }
  });

  const themedBar = displayManager.getXPProgressBar();
  console.log(themedBar.display(750, 1000, 'Dark Theme XP'));
  await wait(3000);

  // 9. Game Over Screen
  await displaySection('Game Over');
  displayManager.displayGameOver({
    level: 42,
    totalXP: 87500,
    achievements: 23,
    playTime: '127h 34m'
  });
  await wait(4000);

  // End of demo
  console.clear();
  console.log(chalk.bold.green('\n🎉 Demo Complete! 🎉\n'));
  console.log(chalk.cyan('All display features have been demonstrated.\n'));
  console.log(chalk.gray('Features shown:'));
  console.log(chalk.white('  ✓ ASCII art level-up animations with figlet'));
  console.log(chalk.white('  ✓ Progress bars for XP using custom characters'));
  console.log(chalk.white('  ✓ Colorful achievement unlock notifications'));
  console.log(chalk.white('  ✓ Status dashboard layout with boxes'));
  console.log(chalk.white('  ✓ Real-time XP gain popups'));
  console.log(chalk.white('  ✓ Terminal-friendly charts for statistics\n'));
  
  console.log(chalk.yellow('Press any key to exit...'));
  
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve(undefined);
    });
  });

  process.exit(0);
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});

// Run the demo
console.log(chalk.yellow('\nStarting DevXP Display Demo...'));
console.log(chalk.gray('Make sure your terminal supports colors and Unicode!\n'));

// Set up stdin for interactive demo
process.stdin.resume();

runDemo().catch(error => {
  console.error(chalk.red('Demo failed:'), error);
  process.exit(1);
});
