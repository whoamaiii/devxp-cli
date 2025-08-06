/**
 * Achievement system types and interfaces
 */

import { ActivityType } from './Activity';

/**
 * Achievement rarity levels
 */
export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Achievement categories
 */
export enum AchievementCategory {
  BEGINNER = 'beginner',
  GIT_MASTER = 'git_master',
  TERMINAL_WIZARD = 'terminal_wizard',
  CODE_WARRIOR = 'code_warrior',
  PRODUCTIVITY = 'productivity',
  LEARNING = 'learning',
  COLLABORATION = 'collaboration',
  STREAK = 'streak',
  MILESTONE = 'milestone',
  SPECIAL = 'special',
  SEASONAL = 'seasonal'
}

/**
 * Types of unlock conditions
 */
export enum UnlockConditionType {
  ACTIVITY_COUNT = 'activity_count',
  XP_THRESHOLD = 'xp_threshold',
  LEVEL_REACHED = 'level_reached',
  STREAK_DAYS = 'streak_days',
  TIME_BASED = 'time_based',
  SPECIFIC_ACTION = 'specific_action',
  COMBINATION = 'combination',
  HIDDEN = 'hidden',
  MANUAL = 'manual'
}

/**
 * Main achievement interface
 */
export interface Achievement {
  /** Unique identifier for the achievement */
  id: string;
  
  /** Display name of the achievement */
  name: string;
  
  /** Detailed description of the achievement */
  description: string;
  
  /** Short teaser text shown before unlocking */
  teaserText?: string;
  
  /** Icon identifier or emoji for the achievement */
  icon: string;
  
  /** Category of the achievement */
  category: AchievementCategory;
  
  /** Rarity level of the achievement */
  rarity: AchievementRarity;
  
  /** XP reward for unlocking this achievement */
  xpReward: number;
  
  /** Unlock conditions that must be met */
  unlockConditions: UnlockCondition[];
  
  /** Whether this is a hidden achievement */
  isHidden: boolean;
  
  /** Whether this achievement can be earned multiple times */
  isRepeatable: boolean;
  
  /** Maximum number of times this can be earned (if repeatable) */
  maxRepetitions?: number;
  
  /** Display order/priority */
  displayOrder: number;
  
  /** Badge color or theme */
  badgeColor?: string;
  
  /** Special effects or animations when unlocked */
  unlockEffects?: UnlockEffects;
  
  /** Related achievements that might interest the user */
  relatedAchievements?: string[];
  
  /** Tags for filtering and searching */
  tags: string[];
  
  /** When the achievement was added to the system */
  addedDate: Date;
  
  /** Expiration date for seasonal achievements */
  expirationDate?: Date;
}

/**
 * Unlock condition definition
 */
export interface UnlockCondition {
  /** Type of condition */
  type: UnlockConditionType;
  
  /** Parameters for the condition */
  parameters: UnlockConditionParameters;
  
  /** Optional description of the condition */
  description?: string;
  
  /** Whether this condition is required (for combination conditions) */
  required?: boolean;
}

/**
 * Parameters for unlock conditions
 */
export interface UnlockConditionParameters {
  /** For activity count conditions */
  activityType?: ActivityType;
  activityCount?: number;
  
  /** For XP threshold conditions */
  xpAmount?: number;
  xpTimeframe?: number; // in seconds
  
  /** For level conditions */
  level?: number;
  
  /** For streak conditions */  
  streakDays?: number;
  
  /** For time-based conditions */
  timeOfDay?: {
    start: string; // HH:MM format
    end: string;
  };
  dayOfWeek?: number[]; // 0-6, where 0 is Sunday
  specificDate?: Date;
  
  /** For specific action conditions */
  action?: string;
  actionTarget?: string;
  actionCount?: number;
  
  /** For combination conditions */
  subConditions?: UnlockCondition[];
  requireAll?: boolean; // true = AND, false = OR
  
  /** Custom parameters */
  custom?: Record<string, unknown>;
}

/**
 * Special effects when achievement is unlocked
 */
export interface UnlockEffects {
  /** Animation type to play */
  animation?: 'confetti' | 'fireworks' | 'glow' | 'bounce' | 'custom';
  
  /** Sound effect to play */
  sound?: 'chime' | 'fanfare' | 'coin' | 'levelup' | 'custom';
  
  /** Custom CSS classes to apply */
  cssClasses?: string[];
  
  /** Duration of the effect in milliseconds */
  duration?: number;
  
  /** Whether to show a notification */
  showNotification?: boolean;
  
  /** Custom notification message */
  notificationMessage?: string;
}

/**
 * User's achievement progress
 */
export interface AchievementProgress {
  /** Achievement ID */
  achievementId: string;
  
  /** User ID */
  userId: string;
  
  /** Current progress towards unlocking */
  currentProgress: number;
  
  /** Required progress to unlock */
  requiredProgress: number;
  
  /** Progress percentage (0-100) */
  progressPercentage: number;
  
  /** Whether the achievement is unlocked */
  isUnlocked: boolean;
  
  /** When the achievement was unlocked */
  unlockedAt?: Date;
  
  /** Number of times earned (for repeatable achievements) */
  timesEarned: number;
  
  /** Last progress update timestamp */
  lastProgressUpdate: Date;
  
  /** Detailed progress for each condition */
  conditionProgress?: ConditionProgress[];
}

/**
 * Progress for individual unlock conditions
 */
export interface ConditionProgress {
  /** Index of the condition in the achievement's conditions array */
  conditionIndex: number;
  
  /** Whether this condition is met */
  isMet: boolean;
  
  /** Current value for this condition */
  currentValue: number;
  
  /** Target value for this condition */
  targetValue: number;
  
  /** Additional details about the progress */
  details?: Record<string, unknown>;
}

/**
 * Achievement tier for progressive achievements
 */
export interface AchievementTier {
  /** Tier level (1, 2, 3, etc.) */
  tier: number;
  
  /** Name of this tier (Bronze, Silver, Gold, etc.) */
  name: string;
  
  /** Requirements to reach this tier */
  requirements: UnlockCondition[];
  
  /** XP reward for this tier */
  xpReward: number;
  
  /** Icon or badge for this tier */
  icon: string;
  
  /** Color associated with this tier */
  color: string;
}

/**
 * Achievement set for related achievements
 */
export interface AchievementSet {
  /** Set identifier */
  id: string;
  
  /** Name of the achievement set */
  name: string;
  
  /** Description of the set */
  description: string;
  
  /** Achievement IDs in this set */
  achievementIds: string[];
  
  /** Bonus XP for completing the entire set */
  completionBonus: number;
  
  /** Special badge for completing the set */
  completionBadge?: string;
  
  /** Order in which achievements should be earned */
  isOrdered: boolean;
}

/**
 * Daily/Weekly/Monthly achievement challenges
 */
export interface AchievementChallenge {
  /** Challenge ID */
  id: string;
  
  /** Associated achievement ID */
  achievementId: string;
  
  /** Type of challenge */
  type: 'daily' | 'weekly' | 'monthly';
  
  /** Start date of the challenge */
  startDate: Date;
  
  /** End date of the challenge */
  endDate: Date;
  
  /** Additional XP multiplier for completing during challenge */
  xpMultiplier: number;
  
  /** Whether the challenge is currently active */
  isActive: boolean;
  
  /** Special rewards for completing the challenge */
  specialRewards?: string[];
}
