# Display Module Documentation

## Overview

The Display Module provides comprehensive visual feedback components for the DevXP CLI gamification system. It includes ASCII art animations, progress bars, notifications, dashboards, and terminal-friendly charts to create an engaging developer experience.

## Features

### 🎨 Core Components

1. **ASCII Art Level-Up Animations** - Spectacular figlet-based animations for achievements
2. **XP Progress Bars** - Customizable progress indicators with smooth animations
3. **Achievement Notifications** - Colorful, rarity-based unlock notifications
4. **Status Dashboard** - Comprehensive player statistics display
5. **Real-time XP Popups** - Floating animations for immediate feedback
6. **Terminal Charts** - ASCII-based data visualization

## Installation

```bash
npm install chalk figlet boxen gradient-string terminal-kit @tweenjs/tween.js
npm install --save-dev @types/figlet @types/gradient-string
```

## Quick Start

```typescript
import { displayManager } from './modules/display';

// Show welcome screen
displayManager.displayWelcome('PlayerName');

// Display XP gain
const xpPopup = displayManager.getXPPopup();
await xpPopup.show(50, 'Code commit');

// Show level up animation
const levelUp = displayManager.getLevelUpAnimation();
await levelUp.displayLevelUp(10);
```

## Component Details

### 1. Level-Up Animation

Creates stunning ASCII art animations for level progression and skill unlocks.

```typescript
const levelUpAnimation = displayManager.getLevelUpAnimation();

// Display level up with particle effects
await levelUpAnimation.displayLevelUp(5);

// Display skill unlock
await levelUpAnimation.displaySkillUnlock('Advanced Debugging');
```

**Features:**
- Gradient rainbow text effects
- Particle animations (✨, ⭐, 🌟, 💫)
- Boxed congratulations messages
- Multiple font styles via figlet

### 2. XP Progress Bar

Displays experience points with customizable progress bars and smooth animations.

```typescript
const xpBar = displayManager.getXPProgressBar();

// Static display
const bar = xpBar.display(450, 1000, 'Experience');
console.log(bar); // │████████████████░░░░░░░░│ Experience: 450/1000 (45.0%)

// Animated XP gain
await xpBar.animateXPGain(450, 750, 1000);

// Multi-stat bars
const stats = xpBar.displayMultiBar([
  { label: 'Coding', current: 85, max: 100, color: '#00ff00' },
  { label: 'Testing', current: 45, max: 100, color: '#ffaa00' }
]);
```

**Features:**
- Smooth tweened animations
- Customizable bar characters
- Multi-bar displays for multiple stats
- Color-coded progress indicators

### 3. Achievement Notifications

Displays colorful achievement unlock notifications with rarity tiers.

```typescript
const achievements = displayManager.getAchievementNotification();

achievements.displayUnlock({
  name: 'Code Wizard',
  description: 'Reached 100-day coding streak',
  icon: '🧙‍♂️',
  rarity: 'legendary', // common, rare, epic, legendary
  xpReward: 500
});

// Show achievement progress
achievements.displayProgress('100 Commits', 67, 100);
```

**Rarity Colors:**
- Common: Gray
- Rare: Blue
- Epic: Magenta
- Legendary: Yellow (with special effects)

### 4. Status Dashboard

Comprehensive player statistics dashboard with multiple information panels.

```typescript
const dashboard = displayManager.getStatusDashboard();

dashboard.display({
  name: 'PlayerName',
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
    { name: 'TypeScript', level: 7 }
  ],
  recentActivity: [
    'Completed authentication task',
    'Fixed critical bug'
  ]
});

// Compact mini dashboard
dashboard.displayMini(42, 8750, 10000, 15);
```

### 5. XP Popups

Real-time floating animations for XP gains and combos.

```typescript
const xpPopup = displayManager.getXPPopup();

// Single XP gain
await xpPopup.show(50, 'Bug fixed');

// Combo multiplier
await xpPopup.showCombo(100, 3); // Base XP: 100, x3 multiplier

// Multiple simultaneous gains
await xpPopup.showMultiple([
  { amount: 25, reason: 'Fixed bug' },
  { amount: 50, reason: 'Added feature' },
  { amount: 15, reason: 'Code review' }
]);
```

**Effects:**
- Floating animation with fade-out
- Combo multiplier displays
- Aggregate XP summaries

### 6. Terminal Charts

ASCII-based data visualization for statistics and trends.

```typescript
const charts = displayManager.getTerminalChart();

// Bar chart
charts.displayBarChart([
  { label: 'Monday', value: 120, color: '#00ff00' },
  { label: 'Tuesday', value: 85, color: '#00aaff' }
]);

// Line chart
charts.displayLineChart(
  [10, 25, 30, 45, 40, 55, 65, 60, 75, 80, 85, 90],
  'XP Progress'
);

// Pie chart
charts.displayPieChart([
  { label: 'Coding', value: 45, color: '#00ff00' },
  { label: 'Testing', value: 15, color: '#0000ff' }
]);

// Sparkline
const sparkline = charts.displaySparkline(
  [3, 5, 2, 8, 4, 9, 7, 10],
  'Daily Commits'
);
```

## Configuration

Customize the display module appearance:

```typescript
displayManager.updateConfig({
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
    duration: 1500,  // Animation duration in ms
    fps: 30          // Animation frame rate
  },
  progressBar: {
    width: 40,
    filledChar: '█',
    emptyChar: '░',
    borderChar: '│'
  }
});
```

### Theme Presets

```typescript
// Dark theme
const darkTheme = {
  colors: {
    primary: '#bb86fc',
    secondary: '#03dac6',
    success: '#00c853',
    warning: '#ffd600',
    error: '#cf6679',
    xp: '#03dac6',
    level: '#bb86fc'
  }
};

// Neon theme
const neonTheme = {
  colors: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    xp: '#00ffff',
    level: '#ff00ff'
  }
};

displayManager.updateConfig(darkTheme);
```

## Integration Example

```typescript
import { displayManager } from './modules/display';

class GameUI {
  async onGitCommit(message: string, filesChanged: number) {
    const xpPopup = displayManager.getXPPopup();
    const xpBar = displayManager.getXPProgressBar();
    
    // Calculate XP
    const totalXP = 10 + (filesChanged * 2);
    
    // Show popup
    await xpPopup.show(totalXP, 'Git commit');
    
    // Update progress bar
    await xpBar.animateXPGain(oldXP, newXP, maxXP);
    
    // Check for level up
    if (newXP >= maxXP) {
      const levelUp = displayManager.getLevelUpAnimation();
      await levelUp.displayLevelUp(newLevel);
    }
  }
}
```

## Running the Demo

```bash
# Full feature demo
npx ts-node src/modules/display.demo.ts

# Integration example
npx ts-node src/modules/display.integration.example.ts
```

## Terminal Requirements

- **Unicode Support**: Required for special characters (█, ░, ▓, etc.)
- **Color Support**: 256 colors or true color recommended
- **Font**: Monospace font for proper alignment
- **Size**: Minimum 80x24 terminal size recommended

## Performance Considerations

1. **Animations**: Use `requestAnimationFrame` for smooth animations
2. **Screen Clearing**: Clear selectively to avoid flicker
3. **Color Caching**: Chalk caches color functions for performance
4. **Batch Updates**: Group multiple visual updates when possible

## API Reference

### DisplayManager

Main manager class that provides access to all display components.

```typescript
class DisplayManager {
  constructor(config?: Partial<DisplayConfig>)
  getLevelUpAnimation(): LevelUpAnimation
  getXPProgressBar(): XPProgressBar
  getAchievementNotification(): AchievementNotification
  getStatusDashboard(): StatusDashboard
  getXPPopup(): XPPopup
  getTerminalChart(): TerminalChart
  updateConfig(config: Partial<DisplayConfig>): void
  displayWelcome(playerName: string): void
  displayGameOver(finalStats: GameOverStats): void
}
```

### Types

```typescript
interface DisplayConfig {
  colors: ColorConfig;
  animations: AnimationConfig;
  progressBar: ProgressBarConfig;
}

interface Achievement {
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

interface PlayerData {
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
  skills: Skill[];
  recentActivity: string[];
}
```

## Troubleshooting

### Common Issues

1. **Colors not showing**: Ensure terminal supports ANSI colors
2. **Characters not displaying**: Check Unicode/UTF-8 support
3. **Animations flickering**: Reduce animation FPS or duration
4. **Layout broken**: Ensure terminal width is at least 80 columns

### Debug Mode

```typescript
// Enable debug output
process.env.DEBUG_DISPLAY = 'true';

// Disable animations for testing
displayManager.updateConfig({
  animations: { duration: 0, fps: 1 }
});
```

## Contributing

See main project contributing guidelines. When adding new visual components:

1. Follow existing component patterns
2. Support configuration options
3. Include demo in display.demo.ts
4. Add TypeScript types
5. Test on multiple terminal emulators

## License

Part of the DevXP CLI project. See main project license.
