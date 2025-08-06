/**
 * Configuration interfaces for the terminal gamification system
 */

import { ActivityType, ActivityXPConfig } from './Activity';
import { AchievementRarity } from './Achievement';

/**
 * Main configuration interface
 */
export interface Config {
  /** General system settings */
  system: SystemConfig;
  
  /** XP and leveling configuration */
  xp: XPConfig;
  
  /** Achievement system configuration */
  achievements: AchievementsConfig;
  
  /** Activity tracking configuration */
  activities: ActivitiesConfig;
  
  /** Database configuration */
  database: DatabaseConfig;
  
  /** UI and display configuration */
  ui: UIConfig;
  
  /** Notification settings */
  notifications: NotificationConfig;
  
  /** Integration settings */
  integrations: IntegrationsConfig;
  
  /** Feature flags */
  features: FeatureFlags;
  
  /** Performance settings */
  performance: PerformanceConfig;
}

/**
 * System-wide configuration
 */
export interface SystemConfig {
  /** Application name */
  appName: string;
  
  /** Application version */
  version: string;
  
  /** Environment (development, staging, production) */
  environment: 'development' | 'staging' | 'production';
  
  /** Debug mode enabled */
  debug: boolean;
  
  /** Logging level */
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Timezone for the application */
  timezone: string;
  
  /** Default locale */
  locale: string;
  
  /** Auto-update configuration */
  autoUpdate: {
    enabled: boolean;
    checkInterval: number; // in seconds
    channel: 'stable' | 'beta' | 'nightly';
  };
}

/**
 * XP and leveling system configuration
 */
export interface XPConfig {
  /** Base XP required for level 2 */
  baseXPForLevel: number;
  
  /** Multiplier for XP requirements per level */
  levelMultiplier: number;
  
  /** Maximum level achievable */
  maxLevel: number;
  
  /** XP calculation formula type */
  formula: 'linear' | 'exponential' | 'logarithmic' | 'custom';
  
  /** Custom formula function (if formula is 'custom') */
  customFormula?: (level: number) => number;
  
  /** XP configurations for each activity type */
  activityXP: Partial<Record<ActivityType, ActivityXPConfig>>;
  
  /** Default XP for unknown activities */
  defaultActivityXP: ActivityXPConfig;
  
  /** XP decay configuration */
  decay: {
    enabled: boolean;
    daysUntilDecay: number;
    decayRate: number; // percentage per day
    minimumXP: number; // XP floor that won't decay below
  };
  
  /** Bonus XP events */
  bonusEvents: BonusXPEvent[];
}

/**
 * Bonus XP event configuration
 */
export interface BonusXPEvent {
  /** Event identifier */
  id: string;
  
  /** Event name */
  name: string;
  
  /** Multiplier for XP during this event */
  multiplier: number;
  
  /** Start date of the event */
  startDate: Date;
  
  /** End date of the event */
  endDate: Date;
  
  /** Activity types affected by this bonus */
  affectedActivities?: ActivityType[];
  
  /** Whether the event is recurring */
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
}

/**
 * Achievements system configuration
 */
export interface AchievementsConfig {
  /** Whether achievements are enabled */
  enabled: boolean;
  
  /** Path to achievements definition file */
  definitionsPath: string;
  
  /** Whether to show hidden achievements */
  showHidden: boolean;
  
  /** Whether to show progress for locked achievements */
  showProgress: boolean;
  
  /** XP multipliers for different rarities */
  rarityMultipliers: Record<AchievementRarity, number>;
  
  /** Maximum achievements to display at once */
  displayLimit: number;
  
  /** Whether to enable achievement sets */
  enableSets: boolean;
  
  /** Whether to enable daily challenges */
  enableChallenges: boolean;
}

/**
 * Activity tracking configuration
 */
export interface ActivitiesConfig {
  /** Whether to automatically track activities */
  autoTrack: boolean;
  
  /** Activities to exclude from tracking */
  excludedActivities: ActivityType[];
  
  /** Minimum duration for an activity to be tracked (in seconds) */
  minimumDuration: number;
  
  /** Maximum activities to store in history */
  historyLimit: number;
  
  /** How long to keep activity history (in days) */
  historyRetentionDays: number;
  
  /** Batch processing configuration */
  batching: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number; // in seconds
  };
  
  /** Activity detection patterns */
  patterns: ActivityPattern[];
}

/**
 * Activity detection pattern
 */
export interface ActivityPattern {
  /** Pattern identifier */
  id: string;
  
  /** Regular expression to match */
  pattern: RegExp;
  
  /** Activity type to assign when matched */
  activityType: ActivityType;
  
  /** Additional metadata extractor */
  metadataExtractor?: (match: RegExpMatchArray) => Record<string, unknown>;
  
  /** Priority for pattern matching (higher = checked first) */
  priority: number;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Database type */
  type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
  
  /** Connection configuration */
  connection: {
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    filename?: string; // for SQLite
    connectionString?: string; // for connection URLs
  };
  
  /** Connection pool settings */
  pool?: {
    min: number;
    max: number;
    idleTimeout: number;
  };
  
  /** Whether to run migrations on startup */
  runMigrations: boolean;
  
  /** Whether to seed initial data */
  seedData: boolean;
  
  /** Backup configuration */
  backup: {
    enabled: boolean;
    interval: number; // in seconds
    path: string;
    maxBackups: number;
  };
}

/**
 * UI and display configuration
 */
export interface UIConfig {
  /** Theme settings */
  theme: {
    default: 'dark' | 'light' | 'auto';
    customThemes?: Record<string, ThemeConfig>;
  };
  
  /** Animation settings */
  animations: {
    enabled: boolean;
    duration: number; // in milliseconds
    easing: string;
  };
  
  /** Status bar configuration */
  statusBar: {
    enabled: boolean;
    position: 'top' | 'bottom';
    items: StatusBarItem[];
    updateInterval: number; // in seconds
  };
  
  /** Progress bar configuration */
  progressBar: {
    style: 'simple' | 'detailed' | 'minimal';
    showPercentage: boolean;
    showXPNumbers: boolean;
    animated: boolean;
  };
  
  /** Dashboard configuration */
  dashboard: {
    defaultView: 'overview' | 'achievements' | 'leaderboard' | 'stats';
    refreshInterval: number; // in seconds
    compactMode: boolean;
  };
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Color palette */
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  /** Font settings */
  fonts: {
    family: string;
    size: number;
    weight: string;
  };
}

/**
 * Status bar item configuration
 */
export interface StatusBarItem {
  /** Item identifier */
  id: string;
  
  /** Display type */
  type: 'level' | 'xp' | 'streak' | 'achievements' | 'custom';
  
  /** Display format template */
  format?: string;
  
  /** Whether the item is visible */
  visible: boolean;
  
  /** Display order */
  order: number;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Global notification enable */
  enabled: boolean;
  
  /** Types of notifications to show */
  types: {
    xpGain: boolean;
    levelUp: boolean;
    achievement: boolean;
    streak: boolean;
    challenge: boolean;
    system: boolean;
  };
  
  /** Notification display settings */
  display: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
    duration: number; // in milliseconds
    maxStack: number; // maximum notifications to show at once
  };
  
  /** Sound settings */
  sounds: {
    enabled: boolean;
    volume: number; // 0-1
    customSounds?: Record<string, string>; // paths to sound files
  };
  
  /** Do not disturb settings */
  doNotDisturb: {
    enabled: boolean;
    schedule?: {
      start: string; // HH:MM format
      end: string;
      days: number[]; // 0-6, where 0 is Sunday
    };
  };
}

/**
 * Integration configuration
 */
export interface IntegrationsConfig {
  /** Git integration */
  git: {
    enabled: boolean;
    trackAllRepositories: boolean;
    excludedPaths?: string[];
    includeOnlyPaths?: string[];
  };
  
  /** GitHub integration */
  github: {
    enabled: boolean;
    token?: string;
    username?: string;
    trackPRs: boolean;
    trackIssues: boolean;
  };
  
  /** VS Code integration */
  vscode: {
    enabled: boolean;
    extensionId?: string;
    syncSettings: boolean;
  };
  
  /** Slack integration */
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel?: string;
    shareAchievements: boolean;
    shareLevelUps: boolean;
  };
  
  /** Discord integration */
  discord: {
    enabled: boolean;
    webhookUrl?: string;
    richPresence: boolean;
  };
  
  /** Custom integrations */
  custom: CustomIntegration[];
}

/**
 * Custom integration configuration
 */
export interface CustomIntegration {
  /** Integration identifier */
  id: string;
  
  /** Integration name */
  name: string;
  
  /** Whether the integration is enabled */
  enabled: boolean;
  
  /** Webhook or API endpoint */
  endpoint?: string;
  
  /** Authentication configuration */
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'oauth2';
    credentials?: Record<string, string>;
  };
  
  /** Events to send to this integration */
  events: string[];
  
  /** Custom configuration */
  config?: Record<string, unknown>;
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  /** Enable beta features */
  betaFeatures: boolean;
  
  /** Enable experimental features */
  experimentalFeatures: boolean;
  
  /** Specific feature toggles */
  features: Record<string, boolean>;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Cache settings */
  cache: {
    enabled: boolean;
    ttl: number; // in seconds
    maxSize: number; // in MB
    strategy: 'lru' | 'lfu' | 'fifo';
  };
  
  /** Rate limiting */
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number; // in milliseconds
  };
  
  /** Background job settings */
  backgroundJobs: {
    enabled: boolean;
    workerThreads: number;
    jobTimeout: number; // in seconds
  };
  
  /** Memory management */
  memory: {
    maxHeapSize: number; // in MB
    gcInterval: number; // in seconds
    alertThreshold: number; // percentage
  };
}
