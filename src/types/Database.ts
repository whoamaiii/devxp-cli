/**
 * Database schema types and interfaces
 */

import { ActivityType } from './Activity';
import { AchievementRarity, AchievementCategory, UnlockConditionType } from './Achievement';

/**
 * Base entity interface for all database records
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Soft delete timestamp */
  deletedAt?: Date;
}

/**
 * User table schema
 */
export interface UserSchema extends BaseEntity {
  /** Unique username */
  username: string;
  
  /** User email (optional) */
  email?: string;
  
  /** Current level */
  level: number;
  
  /** Current XP in the current level */
  currentXP: number;
  
  /** Total XP accumulated */
  totalXP: number;
  
  /** XP needed for next level */
  xpToNextLevel: number;
  
  /** JSON string of preferences */
  preferences: string;
  
  /** Last activity timestamp */
  lastActiveAt: Date;
  
  /** Account status */
  status: 'active' | 'inactive' | 'suspended';
  
  /** Profile metadata JSON */
  metadata?: string;
}

/**
 * Activity table schema
 */
export interface ActivitySchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Activity type */
  type: ActivityType;
  
  /** XP earned from this activity */
  xpEarned: number;
  
  /** Activity timestamp */
  timestamp: Date;
  
  /** Session ID for grouping */
  sessionId: string;
  
  /** Project ID if applicable */
  projectId?: string;
  
  /** Activity metadata JSON */
  metadata: string;
  
  /** Whether it contributed to streak */
  contributedToStreak: boolean;
  
  /** Duration in seconds */
  duration?: number;
  
  /** Success status */
  success: boolean;
}

/**
 * Achievement table schema
 */
export interface AchievementSchema extends BaseEntity {
  /** Achievement unique key */
  key: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Teaser text for locked state */
  teaserText?: string;
  
  /** Icon emoji or identifier */
  icon: string;
  
  /** Category */
  category: AchievementCategory;
  
  /** Rarity level */
  rarity: AchievementRarity;
  
  /** XP reward amount */
  xpReward: number;
  
  /** JSON string of unlock conditions */
  unlockConditions: string;
  
  /** Hidden achievement flag */
  isHidden: boolean;
  
  /** Repeatable flag */
  isRepeatable: boolean;
  
  /** Max repetitions if repeatable */
  maxRepetitions?: number;
  
  /** Display order */
  displayOrder: number;
  
  /** Badge color */
  badgeColor?: string;
  
  /** JSON string of unlock effects */
  unlockEffects?: string;
  
  /** JSON array of related achievement IDs */
  relatedAchievements?: string;
  
  /** JSON array of tags */
  tags: string;
  
  /** When the achievement expires */
  expirationDate?: Date;
  
  /** Whether the achievement is active */
  isActive: boolean;
}

/**
 * User achievements junction table
 */
export interface UserAchievementSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Achievement ID foreign key */
  achievementId: string;
  
  /** When the achievement was unlocked */
  unlockedAt: Date;
  
  /** Number of times earned (for repeatable) */
  timesEarned: number;
  
  /** Current progress value */
  currentProgress: number;
  
  /** Required progress value */
  requiredProgress: number;
  
  /** Progress percentage */
  progressPercentage: number;
  
  /** JSON string of condition progress */
  conditionProgress?: string;
  
  /** Last progress update */
  lastProgressUpdate: Date;
}

/**
 * XP event/transaction table schema
 */
export interface XPEventSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Activity ID foreign key (optional) */
  activityId?: string;
  
  /** Achievement ID foreign key (optional) */
  achievementId?: string;
  
  /** Amount of XP gained/lost */
  amount: number;
  
  /** Reason for XP change */
  reason: string;
  
  /** Event type */
  eventType: 'activity' | 'achievement' | 'bonus' | 'penalty' | 'manual' | 'decay';
  
  /** Previous total XP */
  previousTotal: number;
  
  /** New total XP */
  newTotal: number;
  
  /** Previous level */
  previousLevel: number;
  
  /** New level */
  newLevel: number;
  
  /** Multipliers applied JSON */
  multipliers?: string;
  
  /** Event metadata JSON */
  metadata?: string;
}

/**
 * Streak table schema
 */
export interface StreakSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Current streak count */
  currentStreak: number;
  
  /** Longest streak achieved */
  longestStreak: number;
  
  /** Last activity date for streak */
  lastStreakDate: Date;
  
  /** Whether streak is active today */
  isActiveToday: boolean;
  
  /** Streak start date */
  streakStartDate: Date;
  
  /** Total days with activity */
  totalActiveDays: number;
  
  /** Freeze tokens available */
  freezeTokens: number;
  
  /** Last freeze used date */
  lastFreezeUsed?: Date;
}

/**
 * Session table schema
 */
export interface SessionSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Session unique identifier */
  sessionId: string;
  
  /** Session start time */
  startTime: Date;
  
  /** Session end time */
  endTime?: Date;
  
  /** Total XP earned in session */
  totalXP: number;
  
  /** Number of activities in session */
  activityCount: number;
  
  /** Session duration in seconds */
  duration?: number;
  
  /** Terminal/IDE used */
  terminal?: string;
  
  /** Operating system */
  os?: string;
  
  /** Session metadata JSON */
  metadata?: string;
  
  /** Whether session is currently active */
  isActive: boolean;
}

/**
 * Project table schema
 */
export interface ProjectSchema extends BaseEntity {
  /** Project unique identifier */
  projectId: string;
  
  /** Project name */
  name: string;
  
  /** Project description */
  description?: string;
  
  /** Project path on filesystem */
  path: string;
  
  /** Git repository URL */
  gitUrl?: string;
  
  /** Primary programming language */
  primaryLanguage?: string;
  
  /** JSON array of all languages used */
  languages?: string;
  
  /** Total XP earned in this project */
  totalXP: number;
  
  /** Total activities in this project */
  totalActivities: number;
  
  /** Last activity in this project */
  lastActivityAt?: Date;
  
  /** Project metadata JSON */
  metadata?: string;
  
  /** Whether project is archived */
  isArchived: boolean;
}

/**
 * User projects junction table
 */
export interface UserProjectSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Project ID foreign key */
  projectId: string;
  
  /** User's role in the project */
  role: 'owner' | 'contributor' | 'viewer';
  
  /** XP earned by user in this project */
  xpEarned: number;
  
  /** Activities by user in this project */
  activityCount: number;
  
  /** First contribution date */
  firstContribution: Date;
  
  /** Last contribution date */
  lastContribution: Date;
  
  /** Favorite flag */
  isFavorite: boolean;
}

/**
 * Leaderboard table schema
 */
export interface LeaderboardSchema extends BaseEntity {
  /** Leaderboard type */
  type: 'global' | 'weekly' | 'monthly' | 'alltime';
  
  /** Period start date */
  periodStart: Date;
  
  /** Period end date */
  periodEnd: Date;
  
  /** User ID foreign key */
  userId: string;
  
  /** Rank position */
  rank: number;
  
  /** Total XP for the period */
  totalXP: number;
  
  /** Level at the end of period */
  level: number;
  
  /** Number of achievements */
  achievementCount: number;
  
  /** Activities count for the period */
  activityCount: number;
  
  /** Streak days during period */
  streakDays: number;
  
  /** Change in rank from previous period */
  rankChange?: number;
  
  /** Whether this is the final rank */
  isFinal: boolean;
}

/**
 * Notification table schema
 */
export interface NotificationSchema extends BaseEntity {
  /** User ID foreign key */
  userId: string;
  
  /** Notification type */
  type: 'xp_gain' | 'level_up' | 'achievement' | 'streak' | 'challenge' | 'system';
  
  /** Notification title */
  title: string;
  
  /** Notification message */
  message: string;
  
  /** Icon to display */
  icon?: string;
  
  /** Action URL or command */
  actionUrl?: string;
  
  /** Additional data JSON */
  data?: string;
  
  /** Read status */
  isRead: boolean;
  
  /** Read timestamp */
  readAt?: Date;
  
  /** Notification priority */
  priority: 'low' | 'normal' | 'high';
  
  /** Expiration date */
  expiresAt?: Date;
}

/**
 * Configuration table schema
 */
export interface ConfigurationSchema extends BaseEntity {
  /** Configuration key */
  key: string;
  
  /** Configuration value (JSON) */
  value: string;
  
  /** Configuration category */
  category: string;
  
  /** Description of the configuration */
  description?: string;
  
  /** Data type of the value */
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  
  /** Whether this is a system config */
  isSystem: boolean;
  
  /** Whether this config is encrypted */
  isEncrypted: boolean;
  
  /** User ID if user-specific */
  userId?: string;
}

/**
 * Analytics event table schema
 */
export interface AnalyticsEventSchema extends BaseEntity {
  /** User ID foreign key */
  userId?: string;
  
  /** Event name */
  eventName: string;
  
  /** Event category */
  category: string;
  
  /** Event properties JSON */
  properties: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** User agent string */
  userAgent?: string;
  
  /** IP address (hashed) */
  ipHash?: string;
  
  /** Event source */
  source: string;
  
  /** Event version */
  version?: string;
}

/**
 * Audit log table schema
 */
export interface AuditLogSchema extends BaseEntity {
  /** User ID who performed the action */
  userId?: string;
  
  /** Action performed */
  action: string;
  
  /** Entity type affected */
  entityType: string;
  
  /** Entity ID affected */
  entityId?: string;
  
  /** Old values JSON */
  oldValues?: string;
  
  /** New values JSON */
  newValues?: string;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Additional metadata JSON */
  metadata?: string;
  
  /** Action status */
  status: 'success' | 'failure';
  
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Database migration schema
 */
export interface MigrationSchema {
  /** Migration ID */
  id: number;
  
  /** Migration name */
  name: string;
  
  /** Execution timestamp */
  executedAt: Date;
  
  /** Migration checksum */
  checksum: string;
}

/**
 * Database indexes definition
 */
export interface DatabaseIndexes {
  users: {
    username: string;
    email?: string;
    level: number;
    totalXP: number;
    lastActiveAt: Date;
  };
  
  activities: {
    userId: string;
    type: ActivityType;
    timestamp: Date;
    sessionId: string;
    projectId?: string;
  };
  
  achievements: {
    key: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    isActive: boolean;
  };
  
  userAchievements: {
    userId: string;
    achievementId: string;
    unlockedAt: Date;
  };
  
  xpEvents: {
    userId: string;
    eventType: string;
    createdAt: Date;
  };
  
  leaderboard: {
    type: string;
    periodStart: Date;
    rank: number;
    userId: string;
  };
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /** Connect to the database */
  connect(): Promise<void>;
  
  /** Disconnect from the database */
  disconnect(): Promise<void>;
  
  /** Run migrations */
  migrate(): Promise<void>;
  
  /** Seed initial data */
  seed(): Promise<void>;
  
  /** Backup the database */
  backup(path: string): Promise<void>;
  
  /** Restore from backup */
  restore(path: string): Promise<void>;
  
  /** Get connection status */
  isConnected(): boolean;
  
  /** Get database statistics */
  getStats(): Promise<DatabaseStats>;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  /** Total number of users */
  userCount: number;
  
  /** Total number of activities */
  activityCount: number;
  
  /** Total number of achievements */
  achievementCount: number;
  
  /** Database size in bytes */
  sizeInBytes: number;
  
  /** Last backup timestamp */
  lastBackup?: Date;
  
  /** Database version */
  version: string;
  
  /** Table statistics */
  tables: Record<string, TableStats>;
}

/**
 * Table statistics
 */
export interface TableStats {
  /** Row count */
  rowCount: number;
  
  /** Table size in bytes */
  sizeInBytes: number;
  
  /** Index count */
  indexCount: number;
  
  /** Last analyzed timestamp */
  lastAnalyzed?: Date;
}
