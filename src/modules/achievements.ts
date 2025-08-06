/**
 * @file Manages the achievement system, including definitions, unlocking logic, and notifications.
 */

// Achievement system for DevXP CLI
// Tracks user progress and gamifies the terminal experience

// 1. Achievement Categories
export enum AchievementCategory {
  GIT_MASTER = 'Git Master',
  TERMINAL_NINJA = 'Terminal Ninja',
  MILESTONE = 'Milestone',
  HIDDEN = 'Hidden',
  PRODUCTIVITY = 'Productivity',
  EXPLORER = 'Explorer',
  SPEEDRUNNER = 'Speedrunner',
}

// 2. Achievement Definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockTimestamp?: number;
  progress: number; // Current progress
  goal: number;     // Goal for multi-step achievements
  hidden: boolean;
  checkCondition: (context: AchievementContext) => boolean;
}

// Context for checking achievement conditions
export interface AchievementContext {
  gitCommitCount?: number;
  gitBranchCount?: number;
  gitMergeCount?: number;
  dailyStreak?: number;
  totalCommands?: number;
  uniqueCommands?: number;
  commandHistory?: string[];
  sessionDuration?: number; // in minutes
  filesCreated?: number;
  filesModified?: number;
  linesOfCode?: number;
  testsRun?: number;
  testsPass?: number;
  buildCount?: number;
  debugSessions?: number;
  customMetrics?: Record<string, any>;
}

// 3. Special achievements and milestones
const achievements: Map<string, Achievement> = new Map();

function defineAchievement(
  id: string,
  name: string,
  description: string,
  category: AchievementCategory,
  goal: number,
  checkCondition: (context: AchievementContext) => boolean,
  hidden = false,
): void {
  achievements.set(id, {
    id,
    name,
    description,
    category,
    unlocked: false,
    progress: 0,
    goal,
    hidden,
    checkCondition,
  });
}

// --- Achievement Definitions ---

// Git Master Achievements
defineAchievement(
  'git_commit_1',
  'First Commit',
  'Make your first commit.',
  AchievementCategory.GIT_MASTER,
  1,
  (ctx) => (ctx.gitCommitCount || 0) >= 1
);

defineAchievement(
  'git_commit_10',
  'Commit Apprentice',
  'Make 10 commits.',
  AchievementCategory.GIT_MASTER,
  10,
  (ctx) => (ctx.gitCommitCount || 0) >= 10
);

defineAchievement(
  'git_commit_100',
  'Commit Centurion',
  'Make 100 commits.',
  AchievementCategory.GIT_MASTER,
  100,
  (ctx) => (ctx.gitCommitCount || 0) >= 100
);

defineAchievement(
  'git_commit_1000',
  'Commit Legend',
  'Make 1000 commits. You are a true Git master!',
  AchievementCategory.GIT_MASTER,
  1000,
  (ctx) => (ctx.gitCommitCount || 0) >= 1000
);

defineAchievement(
  'git_branch_master',
  'Branch Manager',
  'Create and manage 10 different branches.',
  AchievementCategory.GIT_MASTER,
  10,
  (ctx) => (ctx.gitBranchCount || 0) >= 10
);

defineAchievement(
  'git_merge_expert',
  'Merge Expert',
  'Successfully complete 50 merges.',
  AchievementCategory.GIT_MASTER,
  50,
  (ctx) => (ctx.gitMergeCount || 0) >= 50
);

// Terminal Ninja Achievements
defineAchievement(
  'terminal_100_commands',
  'Command Runner',
  'Execute 100 terminal commands.',
  AchievementCategory.TERMINAL_NINJA,
  100,
  (ctx) => (ctx.totalCommands || 0) >= 100
);

defineAchievement(
  'terminal_1000_commands',
  'Command Master',
  'Execute 1000 terminal commands.',
  AchievementCategory.TERMINAL_NINJA,
  1000,
  (ctx) => (ctx.totalCommands || 0) >= 1000
);

defineAchievement(
  'terminal_diverse',
  'Command Diversity',
  'Use 50 different unique commands.',
  AchievementCategory.TERMINAL_NINJA,
  50,
  (ctx) => (ctx.uniqueCommands || 0) >= 50
);

defineAchievement(
  'terminal_pipe_master',
  'Pipe Master',
  'Use pipes in 20 commands.',
  AchievementCategory.TERMINAL_NINJA,
  20,
  (ctx) => (ctx.commandHistory || []).filter(cmd => cmd.includes('|')).length >= 20
);

// Milestone Achievements
defineAchievement(
  'milestone_streak_7',
  'Week Warrior',
  'Maintain a 7-day usage streak.',
  AchievementCategory.MILESTONE,
  7,
  (ctx) => (ctx.dailyStreak || 0) >= 7
);

defineAchievement(
  'milestone_streak_30',
  'Monthly Master',
  'Maintain a 30-day usage streak.',
  AchievementCategory.MILESTONE,
  30,
  (ctx) => (ctx.dailyStreak || 0) >= 30
);

defineAchievement(
  'milestone_streak_100',
  'Century Streak',
  'Maintain a 100-day usage streak. Incredible dedication!',
  AchievementCategory.MILESTONE,
  100,
  (ctx) => (ctx.dailyStreak || 0) >= 100
);

defineAchievement(
  'milestone_streak_365',
  'Year of Code',
  'Maintain a 365-day usage streak. A full year of coding!',
  AchievementCategory.MILESTONE,
  365,
  (ctx) => (ctx.dailyStreak || 0) >= 365
);

// Productivity Achievements
defineAchievement(
  'productivity_files_100',
  'File Creator',
  'Create 100 files.',
  AchievementCategory.PRODUCTIVITY,
  100,
  (ctx) => (ctx.filesCreated || 0) >= 100
);

defineAchievement(
  'productivity_loc_10000',
  'Code Writer',
  'Write 10,000 lines of code.',
  AchievementCategory.PRODUCTIVITY,
  10000,
  (ctx) => (ctx.linesOfCode || 0) >= 10000
);

defineAchievement(
  'productivity_tests_100',
  'Test Runner',
  'Run 100 tests.',
  AchievementCategory.PRODUCTIVITY,
  100,
  (ctx) => (ctx.testsRun || 0) >= 100
);

defineAchievement(
  'productivity_perfect_tests',
  'Perfect Tester',
  'Have all tests pass in 10 consecutive test runs.',
  AchievementCategory.PRODUCTIVITY,
  10,
  (ctx) => {
    if (!ctx.testsRun || !ctx.testsPass) return false;
    // This is simplified - in reality you'd track consecutive passes
    return ctx.testsPass >= 10 && ctx.testsPass === ctx.testsRun;
  }
);

// Explorer Achievements
defineAchievement(
  'explorer_new_tools',
  'Tool Explorer',
  'Try 10 different CLI tools.',
  AchievementCategory.EXPLORER,
  10,
  (ctx) => {
    const tools = ['npm', 'yarn', 'git', 'docker', 'kubectl', 'aws', 'terraform', 'vim', 'nano', 'code'];
    const usedTools = tools.filter(tool => 
      (ctx.commandHistory || []).some(cmd => cmd.startsWith(tool))
    );
    return usedTools.length >= 10;
  }
);

// Speedrunner Achievements
defineAchievement(
  'speed_quick_session',
  'Quick Session',
  'Complete a productive session in under 30 minutes.',
  AchievementCategory.SPEEDRUNNER,
  1,
  (ctx) => {
    return (ctx.sessionDuration || 0) < 30 && 
           (ctx.gitCommitCount || 0) >= 1;
  }
);

defineAchievement(
  'speed_marathon',
  'Marathon Coder',
  'Code for 8 hours straight in a single session.',
  AchievementCategory.SPEEDRUNNER,
  480, // 8 hours in minutes
  (ctx) => (ctx.sessionDuration || 0) >= 480
);

// Hidden Achievements (Easter Eggs)
defineAchievement(
  'hidden_sudo_sandwich',
  'Make me a sandwich',
  'What? Make it yourself! (Try with sudo)',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => (ctx.commandHistory || []).includes('sudo make me a sandwich'),
  true
);

defineAchievement(
  'hidden_rm_rf',
  'Living Dangerously',
  'You tried the forbidden command... thankfully we caught it!',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => (ctx.commandHistory || []).some(cmd => cmd.includes('rm -rf /')),
  true
);

defineAchievement(
  'hidden_vim_exit',
  'Vim Escape Artist',
  'Successfully exit Vim (the eternal struggle).',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => (ctx.commandHistory || []).some(cmd => cmd === ':q' || cmd === ':wq' || cmd === ':q!'),
  true
);

defineAchievement(
  'hidden_hello_world',
  'Hello, World!',
  'Echo the classic programmer greeting.',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => (ctx.commandHistory || []).some(cmd => 
    cmd.includes('echo "Hello, World!"') || cmd.includes('echo \'Hello, World!\'')
  ),
  true
);

defineAchievement(
  'hidden_konami',
  'Konami Code',
  'Up, Up, Down, Down, Left, Right, Left, Right, B, A.',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => {
    // Check if custom metrics contain the konami code sequence
    return ctx.customMetrics?.konamiCode === true;
  },
  true
);

defineAchievement(
  'hidden_night_owl',
  'Night Owl',
  'Code between 2 AM and 5 AM.',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 5;
  },
  true
);

defineAchievement(
  'hidden_early_bird',
  'Early Bird',
  'Start coding before 6 AM.',
  AchievementCategory.HIDDEN,
  1,
  (ctx) => {
    const hour = new Date().getHours();
    return hour < 6;
  },
  true
);

// 4. Achievement unlocking and progress tracking logic
class AchievementManager {
  private userAchievements: Map<string, Omit<Achievement, 'checkCondition'>> = new Map();

  constructor() {
    // Here you would load user's saved achievements
    // For now, we'll initialize from the base definitions
    this.initializeAchievements();
  }

  private initializeAchievements() {
    achievements.forEach(ach => {
      this.userAchievements.set(ach.id, {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        category: ach.category,
        unlocked: false,
        progress: 0,
        goal: ach.goal,
        hidden: ach.hidden,
      });
    });
  }

  // 6. Progress tracking for multi-step achievements
  updateProgress(achievementId: string, progress: number) {
    const achievement = this.userAchievements.get(achievementId);
    if (achievement && !achievement.unlocked) {
      const oldProgress = achievement.progress;
      achievement.progress = Math.min(progress, achievement.goal);
      
      // Only log if progress actually changed
      if (oldProgress !== achievement.progress) {
        console.log(`Achievement progress for '${achievement.name}': ${achievement.progress}/${achievement.goal}`);
        
        // Check if we should show a progress notification
        const percentComplete = (achievement.progress / achievement.goal) * 100;
        if (percentComplete >= 25 && oldProgress / achievement.goal * 100 < 25) {
          this.notifyProgress(achievement, 25);
        } else if (percentComplete >= 50 && oldProgress / achievement.goal * 100 < 50) {
          this.notifyProgress(achievement, 50);
        } else if (percentComplete >= 75 && oldProgress / achievement.goal * 100 < 75) {
          this.notifyProgress(achievement, 75);
        } else if (percentComplete >= 90 && oldProgress / achievement.goal * 100 < 90) {
          this.notifyProgress(achievement, 90);
        }
      }
    }
  }

  // Progress notification for milestones
  private notifyProgress(achievement: Omit<Achievement, 'checkCondition'>, percent: number) {
    console.log(`📊 Achievement Progress: '${achievement.name}' is ${percent}% complete!`);
  }

  // 5. Achievement notification system
  private notify(achievement: Achievement) {
    const rarity = this.getAchievementRarity(achievement);
    const emoji = this.getAchievementEmoji(achievement.category);
    
    // Enhanced notification with rarity and category-specific emoji
    console.log(`\n${emoji} Achievement Unlocked! ${emoji}`);
    console.log(`[${rarity}] ${achievement.name}`);
    console.log(`Category: ${achievement.category}`);
    console.log(`${achievement.description}`);
    console.log(`Unlocked at: ${new Date().toLocaleString()}\n`);
    
    // Store notification for later retrieval
    this.storeNotification(achievement);
    
    // In a real app, this would trigger a UI notification
    // eventEmitter.emit('achievement_unlocked', achievement);
  }

  private getAchievementRarity(achievement: Achievement): string {
    if (achievement.hidden) return '🌟 LEGENDARY';
    if (achievement.goal >= 1000) return '💎 EPIC';
    if (achievement.goal >= 100) return '💜 RARE';
    if (achievement.goal >= 10) return '💚 UNCOMMON';
    return '⚪ COMMON';
  }

  private getAchievementEmoji(category: AchievementCategory): string {
    const emojiMap: Record<AchievementCategory, string> = {
      [AchievementCategory.GIT_MASTER]: '🔀',
      [AchievementCategory.TERMINAL_NINJA]: '🥷',
      [AchievementCategory.MILESTONE]: '🏆',
      [AchievementCategory.HIDDEN]: '🎭',
      [AchievementCategory.PRODUCTIVITY]: '📈',
      [AchievementCategory.EXPLORER]: '🗺️',
      [AchievementCategory.SPEEDRUNNER]: '⚡',
    };
    return emojiMap[category] || '🎉';
  }

  private notifications: Array<{achievement: Achievement; timestamp: number}> = [];
  
  private storeNotification(achievement: Achievement) {
    this.notifications.push({
      achievement,
      timestamp: Date.now()
    });
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications.shift();
    }
  }

  // Check all achievements against the current context
  checkAllAchievements(context: AchievementContext): number {
    let unlockedCount = 0;
    
    achievements.forEach(achievementDef => {
      const userAchievement = this.userAchievements.get(achievementDef.id);

      if (userAchievement && !userAchievement.unlocked) {
        // Update progress for various achievement types
        this.updateProgressFromContext(achievementDef, context);
        
        // Check unlock condition
        if (achievementDef.checkCondition(context)) {
          userAchievement.unlocked = true;
          userAchievement.unlockTimestamp = Date.now();
          userAchievement.progress = userAchievement.goal; // Max out progress
          this.notify(achievementDef);
          unlockedCount++;

          // Save the updated achievement state
          this.saveAchievementState(userAchievement);
          
          // Check for combo achievements
          this.checkComboAchievements();
        }
      }
    });
    
    return unlockedCount;
  }

  private updateProgressFromContext(achievement: Achievement, context: AchievementContext) {
    // Git achievements
    if (achievement.id.startsWith('git_commit_') && context.gitCommitCount !== undefined) {
      this.updateProgress(achievement.id, context.gitCommitCount);
    }
    if (achievement.id.startsWith('git_branch_') && context.gitBranchCount !== undefined) {
      this.updateProgress(achievement.id, context.gitBranchCount);
    }
    if (achievement.id.startsWith('git_merge_') && context.gitMergeCount !== undefined) {
      this.updateProgress(achievement.id, context.gitMergeCount);
    }
    
    // Milestone achievements
    if (achievement.id.startsWith('milestone_streak_') && context.dailyStreak !== undefined) {
      this.updateProgress(achievement.id, context.dailyStreak);
    }
    
    // Terminal achievements
    if (achievement.id.startsWith('terminal_') && achievement.id.includes('commands')) {
      if (context.totalCommands !== undefined) {
        this.updateProgress(achievement.id, context.totalCommands);
      }
    }
    
    // Productivity achievements
    if (achievement.id.startsWith('productivity_files_') && context.filesCreated !== undefined) {
      this.updateProgress(achievement.id, context.filesCreated);
    }
    if (achievement.id.startsWith('productivity_loc_') && context.linesOfCode !== undefined) {
      this.updateProgress(achievement.id, context.linesOfCode);
    }
    if (achievement.id.startsWith('productivity_tests_') && context.testsRun !== undefined) {
      this.updateProgress(achievement.id, context.testsRun);
    }
    
    // Speed achievements
    if (achievement.id.startsWith('speed_') && context.sessionDuration !== undefined) {
      this.updateProgress(achievement.id, context.sessionDuration);
    }
  }

  private saveAchievementState(achievement: Omit<Achievement, 'checkCondition'>) {
    // In a real implementation, this would persist to storage
    // localStorage.setItem(`achievement_${achievement.id}`, JSON.stringify(achievement));
    console.log(`Saved achievement state for: ${achievement.name}`);
  }

  private checkComboAchievements() {
    // Check if certain combinations of achievements unlock special achievements
    const unlockedIds = Array.from(this.userAchievements.values())
      .filter(a => a.unlocked)
      .map(a => a.id);
    
    // Example: Check if user has all Git Master achievements
    const gitMasterAchievements = Array.from(achievements.values())
      .filter(a => a.category === AchievementCategory.GIT_MASTER)
      .map(a => a.id);
    
    if (gitMasterAchievements.every(id => unlockedIds.includes(id))) {
      console.log('🎊 Special Combo: Git Master Collection Complete!');
    }
  }

  // Getters to expose data to the UI
  getAchievements(includeHidden = false): Achievement[] {
    return Array.from(this.userAchievements.values())
      .filter(ach => !ach.hidden || includeHidden)
      .map(userAch => {
        const definition = achievements.get(userAch.id);
        return {
          ...userAch,
          checkCondition: definition ? definition.checkCondition : () => false,
        };
      });
  }

  getAchievement(id: string): Achievement | undefined {
    const userAch = this.userAchievements.get(id);
    if (!userAch) return undefined;
    const definition = achievements.get(id);
    return {
      ...userAch,
      checkCondition: definition ? definition.checkCondition : () => false,
    };
  }

  // Get statistics about achievements
  getStatistics() {
    const allAchievements = Array.from(this.userAchievements.values());
    const unlocked = allAchievements.filter(a => a.unlocked);
    const byCategory = new Map<AchievementCategory, number>();
    
    // Count unlocked achievements by category
    for (const achievement of unlocked) {
      const count = byCategory.get(achievement.category) || 0;
      byCategory.set(achievement.category, count + 1);
    }
    
    // Calculate total possible by category
    const totalByCategory = new Map<AchievementCategory, number>();
    for (const achievement of allAchievements) {
      if (!achievement.hidden) {
        const count = totalByCategory.get(achievement.category) || 0;
        totalByCategory.set(achievement.category, count + 1);
      }
    }
    
    return {
      total: allAchievements.filter(a => !a.hidden).length,
      unlocked: unlocked.length,
      percentage: Math.round((unlocked.length / allAchievements.filter(a => !a.hidden).length) * 100),
      byCategory: Object.fromEntries(byCategory),
      totalByCategory: Object.fromEntries(totalByCategory),
      recentUnlocks: this.notifications.slice(-5).map(n => ({
        name: n.achievement.name,
        timestamp: n.timestamp
      })),
      nextToUnlock: this.getNextAchievements(3)
    };
  }

  // Get achievements that are close to being unlocked
  private getNextAchievements(count: number): Array<{name: string; progress: number; goal: number}> {
    return Array.from(this.userAchievements.values())
      .filter(a => !a.unlocked && !a.hidden && a.progress > 0)
      .sort((a, b) => {
        const aPercent = a.progress / a.goal;
        const bPercent = b.progress / b.goal;
        return bPercent - aPercent;
      })
      .slice(0, count)
      .map(a => ({
        name: a.name,
        progress: a.progress,
        goal: a.goal
      }));
  }

  // Reset all achievements (for testing or user request)
  resetAllAchievements() {
    this.userAchievements.forEach((achievement) => {
      achievement.unlocked = false;
      achievement.unlockTimestamp = undefined;
      achievement.progress = 0;
    });
    this.notifications = [];
    console.log('All achievements have been reset.');
  }

  // Get recent notifications
  getRecentNotifications(count: number = 10) {
    return this.notifications.slice(-count);
  }
}

export const achievementManager = new AchievementManager();

// Export types for use in other modules
export type { Achievement, AchievementContext };

