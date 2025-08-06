/**
 * XP System Module
 * Handles XP calculations, level progression, multipliers, challenges, and events
 */

import { EventEmitter } from 'events';
import {
  ActivityType,
  ActivityCategory,
  XPMultipliers
} from '../types/Activity';
import {
  XPEvent,
  XPEventType,
  XPMultiplier,
  XPMultiplierType,
  XPCalculationRequest,
  XPCalculationResponse,
  XPEventSource
} from '../types/XPEvent';
import { User } from '../types/User';

/**
 * XP System Configuration
 */
export interface XPSystemConfig {
  /** Base XP values for each activity type */
  baseXPValues: Partial<Record<ActivityType, number>>;
  
  /** Level progression formula type */
  progressionType: 'linear' | 'exponential' | 'fibonacci' | 'custom';
  
  /** Custom progression formula if type is 'custom' */
  customProgressionFormula?: (level: number) => number;
  
  /** Maximum level achievable */
  maxLevel: number;
  
  /** Minimum XP required for level 1 */
  baseXPRequirement: number;
  
  /** Streak bonus configuration */
  streakConfig: StreakConfig;
  
  /** Challenge configuration */
  challengeConfig: ChallengeConfig;
  
  /** Global multiplier caps */
  multiplierCaps: {
    maximum: number;
    minimum: number;
  };
}

/**
 * Streak bonus configuration
 */
export interface StreakConfig {
  /** Multiplier per consecutive day */
  dailyMultiplier: number;
  
  /** Maximum streak multiplier */
  maxMultiplier: number;
  
  /** Bonus XP for reaching milestones */
  milestones: Map<number, number>;
  
  /** Whether weekends count towards streak */
  includeWeekends: boolean;
}

/**
 * Challenge configuration
 */
export interface ChallengeConfig {
  /** Daily challenge XP rewards */
  dailyReward: number;
  
  /** Weekly challenge XP rewards */
  weeklyReward: number;
  
  /** Special event challenge rewards */
  specialReward: number;
  
  /** Bonus for completing all daily challenges */
  dailyCompletionBonus: number;
  
  /** Bonus for completing all weekly challenges */
  weeklyCompletionBonus: number;
}

/**
 * Challenge interface
 */
export interface Challenge {
  /** Unique challenge ID */
  id: string;
  
  /** Challenge type */
  type: 'daily' | 'weekly' | 'special';
  
  /** Challenge name */
  name: string;
  
  /** Challenge description */
  description: string;
  
  /** Required activity type */
  requiredActivity?: ActivityType;
  
  /** Required count to complete */
  requiredCount: number;
  
  /** Current progress */
  currentProgress: number;
  
  /** XP reward */
  reward: number;
  
  /** Expiration time */
  expiresAt: Date;
  
  /** Whether challenge is completed */
  isCompleted: boolean;
  
  /** Completion timestamp */
  completedAt?: Date;
}

/**
 * XP System Events
 */
export interface XPSystemEvents {
  'xp-gained': (event: XPEvent) => void;
  'level-up': (userId: string, oldLevel: number, newLevel: number, totalXP: number) => void;
  'streak-bonus': (userId: string, streakDays: number, multiplier: number) => void;
  'challenge-completed': (userId: string, challenge: Challenge, xpEarned: number) => void;
  'milestone-reached': (userId: string, milestone: string, bonusXP: number) => void;
  'multiplier-applied': (userId: string, multiplier: XPMultiplier) => void;
}

/**
 * Main XP System class
 */
export class XPSystem extends EventEmitter {
  private config: XPSystemConfig;
  private activeChallenges: Map<string, Challenge[]> = new Map();
  private userStreaks: Map<string, number> = new Map();
  private activeMultipliers: Map<string, XPMultiplier[]> = new Map();

  constructor(config?: Partial<XPSystemConfig>) {
    super();
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): XPSystemConfig {
    return {
      baseXPValues: this.getDefaultBaseXPValues(),
      progressionType: 'exponential',
      maxLevel: 100,
      baseXPRequirement: 100,
      streakConfig: {
        dailyMultiplier: 0.1,
        maxMultiplier: 2.0,
        milestones: new Map([
          [7, 500],    // 1 week streak
          [30, 2000],  // 1 month streak
          [100, 10000], // 100 days streak
          [365, 50000] // 1 year streak
        ]),
        includeWeekends: true
      },
      challengeConfig: {
        dailyReward: 100,
        weeklyReward: 500,
        specialReward: 1000,
        dailyCompletionBonus: 200,
        weeklyCompletionBonus: 1000
      },
      multiplierCaps: {
        maximum: 5.0,
        minimum: 0.1
      }
    };
  }

  /**
   * Get default base XP values for activities
   */
  private getDefaultBaseXPValues(): Partial<Record<ActivityType, number>> {
    return {
      // Git activities
      [ActivityType.GIT_COMMIT]: 50,
      [ActivityType.GIT_PUSH]: 30,
      [ActivityType.GIT_PULL]: 20,
      [ActivityType.GIT_MERGE]: 75,
      [ActivityType.GIT_BRANCH_CREATE]: 25,
      [ActivityType.GIT_BRANCH_DELETE]: 15,
      [ActivityType.GIT_STASH]: 10,
      [ActivityType.GIT_TAG]: 40,
      [ActivityType.GIT_REBASE]: 100,
      
      // Terminal activities
      [ActivityType.TERMINAL_COMMAND]: 5,
      [ActivityType.TERMINAL_PIPE]: 15,
      [ActivityType.TERMINAL_SCRIPT]: 50,
      [ActivityType.TERMINAL_ALIAS]: 30,
      
      // File operations
      [ActivityType.FILE_CREATE]: 20,
      [ActivityType.FILE_EDIT]: 15,
      [ActivityType.FILE_DELETE]: 10,
      [ActivityType.FILE_RENAME]: 10,
      [ActivityType.DIRECTORY_CREATE]: 15,
      
      // Development activities
      [ActivityType.CODE_COMPILE]: 25,
      [ActivityType.CODE_BUILD]: 40,
      [ActivityType.CODE_TEST]: 60,
      [ActivityType.CODE_LINT]: 20,
      [ActivityType.CODE_FORMAT]: 15,
      [ActivityType.CODE_DEBUG]: 80,
      
      // Package management
      [ActivityType.PACKAGE_INSTALL]: 20,
      [ActivityType.PACKAGE_UPDATE]: 30,
      [ActivityType.PACKAGE_PUBLISH]: 200,
      
      // Docker activities
      [ActivityType.DOCKER_BUILD]: 50,
      [ActivityType.DOCKER_RUN]: 30,
      [ActivityType.DOCKER_COMPOSE]: 40,
      
      // Database activities
      [ActivityType.DATABASE_QUERY]: 15,
      [ActivityType.DATABASE_MIGRATION]: 100,
      [ActivityType.DATABASE_BACKUP]: 75,
      
      // Deployment activities
      [ActivityType.DEPLOY_STAGING]: 150,
      [ActivityType.DEPLOY_PRODUCTION]: 300,
      [ActivityType.DEPLOY_ROLLBACK]: 200,
      
      // Learning activities
      [ActivityType.DOCUMENTATION_READ]: 25,
      [ActivityType.DOCUMENTATION_WRITE]: 100,
      [ActivityType.TUTORIAL_COMPLETE]: 150,
      
      // Collaboration
      [ActivityType.PR_CREATE]: 100,
      [ActivityType.PR_REVIEW]: 75,
      [ActivityType.PR_MERGE]: 125,
      [ActivityType.ISSUE_CREATE]: 50,
      [ActivityType.ISSUE_CLOSE]: 60,
      
      // Custom
      [ActivityType.CUSTOM]: 10
    };
  }

  /**
   * Calculate XP for an activity
   */
  public calculateXP(request: XPCalculationRequest): XPCalculationResponse {
    const breakdown: { step: string; value: number; description: string }[] = [];
    const multipliers: XPMultiplier[] = [];
    const warnings: string[] = [];

    // Get base XP
    let baseXP = request.baseXP || this.config.baseXPValues[request.activityType] || 10;
    breakdown.push({
      step: 'Base XP',
      value: baseXP,
      description: `Base XP for ${request.activityType}`
    });

    // Apply difficulty multiplier
    if (request.context.difficulty) {
      const difficultyMultiplier = this.getDifficultyMultiplier(request.context.difficulty);
      multipliers.push({
        type: XPMultiplierType.DIFFICULTY,
        value: difficultyMultiplier,
        description: `${request.context.difficulty} difficulty`,
        isActive: true
      });
    }

    // Apply streak multiplier
    const streakDays = request.user.streakDays || 0;
    if (streakDays > 0) {
      const streakMultiplier = this.calculateStreakMultiplier(streakDays);
      multipliers.push({
        type: XPMultiplierType.STREAK,
        value: streakMultiplier,
        description: `${streakDays} day streak`,
        isActive: true
      });
      
      // Check for streak milestones
      const milestoneBonus = this.checkStreakMilestone(streakDays);
      if (milestoneBonus > 0) {
        breakdown.push({
          step: 'Streak Milestone',
          value: milestoneBonus,
          description: `${streakDays} day milestone bonus`
        });
        baseXP += milestoneBonus;
      }
    }

    // Apply first-time bonus
    if (request.context.isFirstTime) {
      multipliers.push({
        type: XPMultiplierType.FIRST_TIME,
        value: 1.5,
        description: 'First time bonus',
        isActive: true
      });
    }

    // Apply time-based multipliers
    const timeMultiplier = this.getTimeBasedMultiplier(request.context.timeOfDay || new Date());
    if (timeMultiplier !== 1.0) {
      multipliers.push({
        type: XPMultiplierType.HAPPY_HOUR,
        value: timeMultiplier,
        description: this.getTimeMultiplierDescription(request.context.timeOfDay || new Date()),
        isActive: true
      });
    }

    // Apply weekend bonus
    if (this.isWeekend(request.context.timeOfDay || new Date())) {
      multipliers.push({
        type: XPMultiplierType.WEEKEND,
        value: 1.25,
        description: 'Weekend bonus',
        isActive: true
      });
    }

    // Apply premium bonus
    if (request.user.isPremium) {
      multipliers.push({
        type: XPMultiplierType.PREMIUM,
        value: 1.2,
        description: 'Premium user bonus',
        isActive: true
      });
    }

    // Apply quality score multiplier
    if (request.context.quality !== undefined) {
      const qualityMultiplier = 0.5 + (request.context.quality / 100);
      multipliers.push({
        type: XPMultiplierType.CUSTOM,
        value: qualityMultiplier,
        description: `Quality score: ${request.context.quality}%`,
        isActive: true
      });
    }

    // Add any override multipliers
    if (request.overrideMultipliers) {
      multipliers.push(...request.overrideMultipliers);
    }

    // Get active user multipliers
    const userMultipliers = this.activeMultipliers.get(request.user.id) || [];
    multipliers.push(...userMultipliers.filter(m => m.isActive));

    // Calculate total multiplier
    let totalMultiplier = multipliers.reduce((acc, m) => acc * m.value, 1.0);
    
    // Apply caps
    if (totalMultiplier > this.config.multiplierCaps.maximum) {
      totalMultiplier = this.config.multiplierCaps.maximum;
      warnings.push(`Multiplier capped at maximum ${this.config.multiplierCaps.maximum}x`);
    } else if (totalMultiplier < this.config.multiplierCaps.minimum) {
      totalMultiplier = this.config.multiplierCaps.minimum;
      warnings.push(`Multiplier raised to minimum ${this.config.multiplierCaps.minimum}x`);
    }

    // Calculate final XP
    const finalXP = Math.round(baseXP * totalMultiplier);
    
    breakdown.push({
      step: 'Total Multiplier',
      value: totalMultiplier,
      description: `Combined multiplier effect`
    });
    
    breakdown.push({
      step: 'Final XP',
      value: finalXP,
      description: 'Final calculated XP'
    });

    // Check if this would trigger a level up
    const currentTotalXP = this.getUserTotalXP(request.user.id, request.user.level);
    const newTotalXP = currentTotalXP + finalXP;
    const currentLevel = request.user.level;
    const newLevel = this.calculateLevelFromXP(newTotalXP);
    const wouldLevelUp = newLevel > currentLevel;

    return {
      finalXP,
      baseXP,
      multipliers,
      totalMultiplier,
      breakdown,
      wouldLevelUp,
      newLevel: wouldLevelUp ? newLevel : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Calculate XP required for a specific level
   */
  public calculateXPForLevel(level: number): number {
    if (level <= 0) return 0;
    if (level > this.config.maxLevel) return Number.MAX_SAFE_INTEGER;

    switch (this.config.progressionType) {
      case 'linear':
        return this.config.baseXPRequirement * level;
      
      case 'exponential':
        // Exponential growth: XP = base * (1.5 ^ (level - 1))
        return Math.round(this.config.baseXPRequirement * Math.pow(1.5, level - 1));
      
      case 'fibonacci':
        return this.calculateFibonacciXP(level);
      
      case 'custom':
        if (this.config.customProgressionFormula) {
          return this.config.customProgressionFormula(level);
        }
        // Fallback to exponential
        return Math.round(this.config.baseXPRequirement * Math.pow(1.5, level - 1));
      
      default:
        return this.config.baseXPRequirement * level;
    }
  }

  /**
   * Calculate total XP required to reach a level
   */
  public calculateTotalXPForLevel(level: number): number {
    let totalXP = 0;
    for (let i = 1; i <= level; i++) {
      totalXP += this.calculateXPForLevel(i);
    }
    return totalXP;
  }

  /**
   * Calculate XP needed for next level
   */
  public calculateXPToNextLevel(currentLevel: number, currentXP: number): number {
    const currentLevelTotalXP = this.calculateTotalXPForLevel(currentLevel);
    const nextLevelTotalXP = this.calculateTotalXPForLevel(currentLevel + 1);
    const xpIntoCurrentLevel = currentXP - currentLevelTotalXP;
    const xpNeededForNextLevel = nextLevelTotalXP - currentLevelTotalXP;
    return Math.max(0, xpNeededForNextLevel - xpIntoCurrentLevel);
  }

  /**
   * Calculate level from total XP
   */
  public calculateLevelFromXP(totalXP: number): number {
    let level = 0;
    let xpRequired = 0;
    
    while (xpRequired <= totalXP && level < this.config.maxLevel) {
      level++;
      xpRequired = this.calculateTotalXPForLevel(level);
    }
    
    return Math.max(1, level - 1);
  }

  /**
   * Calculate streak multiplier
   */
  private calculateStreakMultiplier(streakDays: number): number {
    const multiplier = 1 + (streakDays * this.config.streakConfig.dailyMultiplier);
    return Math.min(multiplier, this.config.streakConfig.maxMultiplier);
  }

  /**
   * Check for streak milestone bonus
   */
  private checkStreakMilestone(streakDays: number): number {
    for (const [milestone, bonus] of this.config.streakConfig.milestones) {
      if (streakDays === milestone) {
        return bonus;
      }
    }
    return 0;
  }

  /**
   * Get difficulty multiplier
   */
  private getDifficultyMultiplier(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): number {
    const multipliers = {
      'easy': 0.75,
      'medium': 1.0,
      'hard': 1.5,
      'expert': 2.0
    };
    return multipliers[difficulty];
  }

  /**
   * Get time-based multiplier
   */
  private getTimeBasedMultiplier(time: Date): number {
    const hour = time.getHours();
    
    // Early morning productivity bonus (5 AM - 9 AM)
    if (hour >= 5 && hour < 9) {
      return 1.3;
    }
    
    // Late night coding bonus (10 PM - 2 AM)
    if (hour >= 22 || hour < 2) {
      return 1.2;
    }
    
    // Regular hours
    return 1.0;
  }

  /**
   * Get time multiplier description
   */
  private getTimeMultiplierDescription(time: Date): string {
    const hour = time.getHours();
    
    if (hour >= 5 && hour < 9) {
      return 'Early bird bonus';
    }
    
    if (hour >= 22 || hour < 2) {
      return 'Night owl bonus';
    }
    
    return 'Regular hours';
  }

  /**
   * Check if date is weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Calculate Fibonacci XP progression
   */
  private calculateFibonacciXP(level: number): number {
    if (level <= 1) return this.config.baseXPRequirement;
    if (level === 2) return this.config.baseXPRequirement * 2;
    
    let prev = this.config.baseXPRequirement;
    let current = this.config.baseXPRequirement * 2;
    
    for (let i = 3; i <= level; i++) {
      const next = prev + current;
      prev = current;
      current = next;
    }
    
    return current;
  }

  /**
   * Get user's total XP (stub - would connect to database)
   */
  private getUserTotalXP(userId: string, currentLevel: number): number {
    // This would normally fetch from database
    // For now, return estimated XP based on level
    return this.calculateTotalXPForLevel(currentLevel);
  }

  /**
   * Emit XP gain event
   */
  public emitXPGain(event: XPEvent): void {
    this.emit('xp-gained', event);
    
    // Check for level up
    if (event.triggeredLevelUp && event.newLevel && event.previousLevel) {
      this.emit('level-up', event.userId, event.previousLevel, event.newLevel, event.points);
    }
    
    // Check for streak bonus
    const streakDays = this.userStreaks.get(event.userId) || 0;
    if (streakDays > 0) {
      const multiplier = this.calculateStreakMultiplier(streakDays);
      this.emit('streak-bonus', event.userId, streakDays, multiplier);
    }
  }

  /**
   * Create a daily challenge
   */
  public createDailyChallenge(userId: string): Challenge {
    const activities = Object.values(ActivityType);
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const requiredCount = Math.floor(Math.random() * 5) + 3; // 3-7 activities
    
    const challenge: Challenge = {
      id: `daily_${Date.now()}_${userId}`,
      type: 'daily',
      name: `Daily ${randomActivity.replace(/_/g, ' ')} Challenge`,
      description: `Complete ${requiredCount} ${randomActivity.replace(/_/g, ' ').toLowerCase()} activities`,
      requiredActivity: randomActivity,
      requiredCount,
      currentProgress: 0,
      reward: this.config.challengeConfig.dailyReward,
      expiresAt: this.getEndOfDay(),
      isCompleted: false
    };
    
    // Add to active challenges
    const userChallenges = this.activeChallenges.get(userId) || [];
    userChallenges.push(challenge);
    this.activeChallenges.set(userId, userChallenges);
    
    return challenge;
  }

  /**
   * Create a weekly challenge
   */
  public createWeeklyChallenge(userId: string): Challenge {
    const challengeTypes = [
      { name: 'Code Warrior', description: 'Complete 50 development activities', count: 50 },
      { name: 'Git Master', description: 'Make 20 git commits', count: 20 },
      { name: 'Test Champion', description: 'Run 30 tests', count: 30 },
      { name: 'Documentation Hero', description: 'Write 10 documentation entries', count: 10 },
      { name: 'Deployment Expert', description: 'Complete 5 deployments', count: 5 }
    ];
    
    const randomChallenge = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    const challenge: Challenge = {
      id: `weekly_${Date.now()}_${userId}`,
      type: 'weekly',
      name: randomChallenge.name,
      description: randomChallenge.description,
      requiredCount: randomChallenge.count,
      currentProgress: 0,
      reward: this.config.challengeConfig.weeklyReward,
      expiresAt: this.getEndOfWeek(),
      isCompleted: false
    };
    
    // Add to active challenges
    const userChallenges = this.activeChallenges.get(userId) || [];
    userChallenges.push(challenge);
    this.activeChallenges.set(userId, userChallenges);
    
    return challenge;
  }

  /**
   * Update challenge progress
   */
  public updateChallengeProgress(userId: string, activityType: ActivityType): void {
    const challenges = this.activeChallenges.get(userId) || [];
    
    for (const challenge of challenges) {
      if (challenge.isCompleted) continue;
      
      // Check if activity matches challenge requirement
      if (!challenge.requiredActivity || challenge.requiredActivity === activityType) {
        challenge.currentProgress++;
        
        // Check if challenge is completed
        if (challenge.currentProgress >= challenge.requiredCount) {
          challenge.isCompleted = true;
          challenge.completedAt = new Date();
          
          // Emit challenge completed event
          this.emit('challenge-completed', userId, challenge, challenge.reward);
        }
      }
    }
    
    // Update stored challenges
    this.activeChallenges.set(userId, challenges);
  }

  /**
   * Get active challenges for a user
   */
  public getActiveChallenges(userId: string): Challenge[] {
    const challenges = this.activeChallenges.get(userId) || [];
    const now = new Date();
    
    // Filter out expired challenges
    const activeChallenges = challenges.filter(c => c.expiresAt > now);
    
    // Update stored challenges
    this.activeChallenges.set(userId, activeChallenges);
    
    return activeChallenges;
  }

  /**
   * Add a custom multiplier for a user
   */
  public addUserMultiplier(userId: string, multiplier: XPMultiplier): void {
    const multipliers = this.activeMultipliers.get(userId) || [];
    multipliers.push(multiplier);
    this.activeMultipliers.set(userId, multipliers);
    
    this.emit('multiplier-applied', userId, multiplier);
  }

  /**
   * Remove expired multipliers
   */
  public cleanupExpiredMultipliers(userId: string): void {
    const multipliers = this.activeMultipliers.get(userId) || [];
    const now = new Date();
    
    const activeMultipliers = multipliers.filter(m => {
      if (m.expiresAt && m.expiresAt < now) {
        return false;
      }
      return m.isActive;
    });
    
    this.activeMultipliers.set(userId, activeMultipliers);
  }

  /**
   * Update user streak
   */
  public updateUserStreak(userId: string, streakDays: number): void {
    this.userStreaks.set(userId, streakDays);
    
    // Check for streak milestones
    const milestoneBonus = this.checkStreakMilestone(streakDays);
    if (milestoneBonus > 0) {
      this.emit('milestone-reached', userId, `${streakDays} day streak`, milestoneBonus);
    }
  }

  /**
   * Get end of day timestamp
   */
  private getEndOfDay(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Get end of week timestamp
   */
  private getEndOfWeek(): Date {
    const end = new Date();
    const daysUntilSunday = 7 - end.getDay();
    end.setDate(end.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Reset daily challenges
   */
  public resetDailyChallenges(userId: string): void {
    const challenges = this.activeChallenges.get(userId) || [];
    const nonDailyChallenges = challenges.filter(c => c.type !== 'daily');
    this.activeChallenges.set(userId, nonDailyChallenges);
    
    // Create new daily challenges
    for (let i = 0; i < 3; i++) {
      this.createDailyChallenge(userId);
    }
  }

  /**
   * Reset weekly challenges
   */
  public resetWeeklyChallenges(userId: string): void {
    const challenges = this.activeChallenges.get(userId) || [];
    const nonWeeklyChallenges = challenges.filter(c => c.type !== 'weekly');
    this.activeChallenges.set(userId, nonWeeklyChallenges);
    
    // Create new weekly challenges
    for (let i = 0; i < 2; i++) {
      this.createWeeklyChallenge(userId);
    }
  }

  /**
   * Calculate total daily challenge bonus
   */
  public calculateDailyChallengeBonus(userId: string): number {
    const challenges = this.activeChallenges.get(userId) || [];
    const dailyChallenges = challenges.filter(c => c.type === 'daily');
    const completedDaily = dailyChallenges.filter(c => c.isCompleted);
    
    if (completedDaily.length === dailyChallenges.length && dailyChallenges.length > 0) {
      return this.config.challengeConfig.dailyCompletionBonus;
    }
    
    return 0;
  }

  /**
   * Calculate total weekly challenge bonus
   */
  public calculateWeeklyChallengeBonus(userId: string): number {
    const challenges = this.activeChallenges.get(userId) || [];
    const weeklyChallenges = challenges.filter(c => c.type === 'weekly');
    const completedWeekly = weeklyChallenges.filter(c => c.isCompleted);
    
    if (completedWeekly.length === weeklyChallenges.length && weeklyChallenges.length > 0) {
      return this.config.challengeConfig.weeklyCompletionBonus;
    }
    
    return 0;
  }

  /**
   * Get level progress percentage
   */
  public getLevelProgress(currentLevel: number, currentXP: number): number {
    const currentLevelTotalXP = this.calculateTotalXPForLevel(currentLevel);
    const nextLevelTotalXP = this.calculateTotalXPForLevel(currentLevel + 1);
    const xpIntoCurrentLevel = currentXP - currentLevelTotalXP;
    const xpNeededForLevel = nextLevelTotalXP - currentLevelTotalXP;
    
    return Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForLevel) * 100));
  }

  /**
   * Get level title based on level number
   */
  public getLevelTitle(level: number): string {
    const titles = [
      { min: 1, max: 10, title: 'Novice Developer' },
      { min: 11, max: 20, title: 'Junior Developer' },
      { min: 21, max: 30, title: 'Developer' },
      { min: 31, max: 40, title: 'Senior Developer' },
      { min: 41, max: 50, title: 'Lead Developer' },
      { min: 51, max: 60, title: 'Principal Developer' },
      { min: 61, max: 70, title: 'Architect' },
      { min: 71, max: 80, title: 'Senior Architect' },
      { min: 81, max: 90, title: 'Master Developer' },
      { min: 91, max: 100, title: 'Legendary Developer' }
    ];
    
    const title = titles.find(t => level >= t.min && level <= t.max);
    return title ? title.title : 'Developer';
  }

  /**
   * Export configuration
   */
  public exportConfig(): XPSystemConfig {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  public importConfig(config: Partial<XPSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const xpSystem = new XPSystem();

// Export helper functions
export function calculateXP(request: XPCalculationRequest): XPCalculationResponse {
  return xpSystem.calculateXP(request);
}

export function getXPForLevel(level: number): number {
  return xpSystem.calculateXPForLevel(level);
}

export function getTotalXPForLevel(level: number): number {
  return xpSystem.calculateTotalXPForLevel(level);
}

export function getLevelFromXP(totalXP: number): number {
  return xpSystem.calculateLevelFromXP(totalXP);
}

export function getXPToNextLevel(currentLevel: number, currentXP: number): number {
  return xpSystem.calculateXPToNextLevel(currentLevel, currentXP);
}

export function getLevelProgress(currentLevel: number, currentXP: number): number {
  return xpSystem.getLevelProgress(currentLevel, currentXP);
}

export function getLevelTitle(level: number): string {
  return xpSystem.getLevelTitle(level);
}
