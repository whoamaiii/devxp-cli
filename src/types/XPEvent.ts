/**
 * XP Event types and interfaces for tracking experience point gains
 */

import { ActivityType } from './Activity';
import { AchievementRarity } from './Achievement';

/**
 * Types of XP events
 */
export enum XPEventType {
  /** XP from completing an activity */
  ACTIVITY = 'activity',
  
  /** XP from unlocking an achievement */
  ACHIEVEMENT = 'achievement',
  
  /** XP from bonus events or multipliers */
  BONUS = 'bonus',
  
  /** XP penalty (negative XP) */
  PENALTY = 'penalty',
  
  /** Manual XP adjustment by admin */
  MANUAL = 'manual',
  
  /** XP decay over time */
  DECAY = 'decay',
  
  /** XP from daily login bonus */
  DAILY_BONUS = 'daily_bonus',
  
  /** XP from streak bonus */
  STREAK_BONUS = 'streak_bonus',
  
  /** XP from completing a challenge */
  CHALLENGE = 'challenge',
  
  /** XP from milestone completion */
  MILESTONE = 'milestone',
  
  /** XP from referral bonus */
  REFERRAL = 'referral',
  
  /** XP from special events */
  SPECIAL_EVENT = 'special_event'
}

/**
 * Main XP Event interface
 */
export interface XPEvent {
  /** Unique event identifier */
  id: string;
  
  /** User who gained/lost the XP */
  userId: string;
  
  /** Type of XP event */
  type: XPEventType;
  
  /** Amount of XP gained (negative for penalties) */
  points: number;
  
  /** Base XP before multipliers */
  basePoints: number;
  
  /** Activity that triggered this XP gain */
  activityType?: ActivityType;
  
  /** Activity ID if applicable */
  activityId?: string;
  
  /** Achievement ID if applicable */
  achievementId?: string;
  
  /** Timestamp of the XP event */
  timestamp: Date;
  
  /** Description of why XP was awarded */
  reason: string;
  
  /** Multipliers that were applied */
  multipliers: XPMultiplier[];
  
  /** Total multiplier applied */
  totalMultiplier: number;
  
  /** Source of the XP event */
  source: XPEventSource;
  
  /** Additional metadata */
  metadata?: XPEventMetadata;
  
  /** Whether this event triggered a level up */
  triggeredLevelUp: boolean;
  
  /** New level if level up occurred */
  newLevel?: number;
  
  /** Previous level if level up occurred */
  previousLevel?: number;
  
  /** Session ID for grouping events */
  sessionId?: string;
  
  /** Project context if applicable */
  projectId?: string;
}

/**
 * XP Multiplier details
 */
export interface XPMultiplier {
  /** Type of multiplier */
  type: XPMultiplierType;
  
  /** Multiplier value (e.g., 1.5 for 50% bonus) */
  value: number;
  
  /** Description of the multiplier */
  description: string;
  
  /** Whether this multiplier is currently active */
  isActive: boolean;
  
  /** Expiration time if temporary */
  expiresAt?: Date;
}

/**
 * Types of XP multipliers
 */
export enum XPMultiplierType {
  /** Streak bonus multiplier */
  STREAK = 'streak',
  
  /** First time bonus */
  FIRST_TIME = 'first_time',
  
  /** Weekend bonus */
  WEEKEND = 'weekend',
  
  /** Happy hour bonus */
  HAPPY_HOUR = 'happy_hour',
  
  /** Difficulty multiplier */
  DIFFICULTY = 'difficulty',
  
  /** Combo multiplier */
  COMBO = 'combo',
  
  /** Event multiplier */
  EVENT = 'event',
  
  /** Achievement rarity multiplier */
  RARITY = 'rarity',
  
  /** Team bonus */
  TEAM = 'team',
  
  /** Premium user bonus */
  PREMIUM = 'premium',
  
  /** Custom multiplier */
  CUSTOM = 'custom'
}

/**
 * Source of the XP event
 */
export interface XPEventSource {
  /** Type of source */
  type: 'system' | 'user' | 'admin' | 'integration' | 'api';
  
  /** Identifier of the source */
  id?: string;
  
  /** Name of the source */
  name: string;
  
  /** Additional source details */
  details?: Record<string, unknown>;
}

/**
 * XP Event metadata
 */
export interface XPEventMetadata {
  /** Programming language if applicable */
  language?: string;
  
  /** File paths affected */
  files?: string[];
  
  /** Lines of code affected */
  linesChanged?: number;
  
  /** Difficulty rating */
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  
  /** Time spent on the activity */
  timeSpent?: number;
  
  /** Quality score if applicable */
  qualityScore?: number;
  
  /** Impact level */
  impact?: 'low' | 'medium' | 'high' | 'critical';
  
  /** Tags associated with this event */
  tags?: string[];
  
  /** Custom properties */
  custom?: Record<string, unknown>;
}

/**
 * XP Summary for a time period
 */
export interface XPSummary {
  /** User ID */
  userId: string;
  
  /** Time period */
  period: {
    start: Date;
    end: Date;
  };
  
  /** Total XP gained */
  totalXP: number;
  
  /** XP breakdown by event type */
  byType: Record<XPEventType, number>;
  
  /** XP breakdown by activity type */
  byActivity: Partial<Record<ActivityType, number>>;
  
  /** Number of XP events */
  eventCount: number;
  
  /** Average XP per event */
  averageXP: number;
  
  /** Highest single XP gain */
  highestGain: {
    amount: number;
    eventId: string;
    timestamp: Date;
  };
  
  /** Number of level ups */
  levelUps: number;
  
  /** Current level */
  currentLevel: number;
  
  /** Current XP in level */
  currentLevelXP: number;
  
  /** XP to next level */
  xpToNextLevel: number;
  
  /** Daily XP breakdown */
  dailyBreakdown: DailyXP[];
}

/**
 * Daily XP breakdown
 */
export interface DailyXP {
  /** Date */
  date: Date;
  
  /** Total XP for the day */
  totalXP: number;
  
  /** Number of events */
  eventCount: number;
  
  /** Peak hour of activity */
  peakHour?: number;
  
  /** Whether streak was maintained */
  streakMaintained: boolean;
}

/**
 * XP Leaderboard entry
 */
export interface XPLeaderboardEntry {
  /** User ID */
  userId: string;
  
  /** Username */
  username: string;
  
  /** Rank position */
  rank: number;
  
  /** Total XP */
  totalXP: number;
  
  /** Level */
  level: number;
  
  /** XP gained in period */
  periodXP: number;
  
  /** Change in rank */
  rankChange: number;
  
  /** Trend (up, down, same) */
  trend: 'up' | 'down' | 'same';
  
  /** Avatar URL or identifier */
  avatar?: string;
  
  /** Badges or special indicators */
  badges?: string[];
}

/**
 * XP Transaction for database storage
 */
export interface XPTransaction {
  /** Transaction ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** XP event ID */
  eventId: string;
  
  /** Amount changed */
  amount: number;
  
  /** Balance before transaction */
  previousBalance: number;
  
  /** Balance after transaction */
  newBalance: number;
  
  /** Transaction type */
  type: 'credit' | 'debit';
  
  /** Transaction status */
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  
  /** Transaction timestamp */
  timestamp: Date;
  
  /** Processing notes */
  notes?: string;
  
  /** Related transaction ID (for reversals) */
  relatedTransactionId?: string;
}

/**
 * XP Calculation request
 */
export interface XPCalculationRequest {
  /** Activity type */
  activityType: ActivityType;
  
  /** Base XP amount */
  baseXP: number;
  
  /** User context */
  user: {
    id: string;
    level: number;
    streakDays: number;
    isPremium?: boolean;
  };
  
  /** Activity context */
  context: {
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    isFirstTime?: boolean;
    timeOfDay?: Date;
    duration?: number;
    quality?: number;
  };
  
  /** Active bonuses */
  activeBonuses?: string[];
  
  /** Override multipliers */
  overrideMultipliers?: XPMultiplier[];
}

/**
 * XP Calculation response
 */
export interface XPCalculationResponse {
  /** Final XP amount */
  finalXP: number;
  
  /** Base XP before multipliers */
  baseXP: number;
  
  /** Applied multipliers */
  multipliers: XPMultiplier[];
  
  /** Total multiplier */
  totalMultiplier: number;
  
  /** Breakdown of XP calculation */
  breakdown: {
    step: string;
    value: number;
    description: string;
  }[];
  
  /** Whether this would trigger a level up */
  wouldLevelUp: boolean;
  
  /** New level if level up would occur */
  newLevel?: number;
  
  /** Warnings or notes */
  warnings?: string[];
}

/**
 * XP Boost configuration
 */
export interface XPBoost {
  /** Boost identifier */
  id: string;
  
  /** Boost name */
  name: string;
  
  /** Boost description */
  description: string;
  
  /** Multiplier value */
  multiplier: number;
  
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime: Date;
  
  /** Whether boost is currently active */
  isActive: boolean;
  
  /** Activity types affected */
  affectedActivities?: ActivityType[];
  
  /** User IDs affected (empty = all users) */
  affectedUsers?: string[];
  
  /** Maximum uses per user */
  maxUsesPerUser?: number;
  
  /** Icon or image */
  icon?: string;
  
  /** Boost type */
  type: 'global' | 'personal' | 'group' | 'event';
  
  /** Requirements to activate */
  requirements?: {
    minLevel?: number;
    achievements?: string[];
    premium?: boolean;
  };
}
