/**
 * Central export file for all TypeScript types and interfaces
 */

// User types
export {
  User,
  UserStats,
  UserPreferences,
  PrivacySettings,
  StreakInfo,
  LeaderboardEntry
} from './User';

// Activity types
export {
  ActivityType,
  Activity,
  ActivityMetadata,
  GitActivityMetadata,
  ActivityCategory,
  ActivityXPConfig,
  XPMultipliers,
  ActivityFilter,
  ActivitySummary
} from './Activity';

// Achievement types
export {
  AchievementRarity,
  AchievementCategory,
  UnlockConditionType,
  Achievement,
  UnlockCondition,
  UnlockConditionParameters,
  UnlockEffects,
  AchievementProgress,
  ConditionProgress,
  AchievementTier,
  AchievementSet,
  AchievementChallenge
} from './Achievement';

// Config types
export {
  Config,
  SystemConfig,
  XPConfig,
  BonusXPEvent,
  AchievementsConfig,
  ActivitiesConfig,
  ActivityPattern,
  DatabaseConfig,
  UIConfig,
  ThemeConfig,
  StatusBarItem,
  NotificationConfig,
  IntegrationsConfig,
  CustomIntegration,
  FeatureFlags,
  PerformanceConfig
} from './Config';

// Database types
export {
  BaseEntity,
  UserSchema,
  ActivitySchema,
  AchievementSchema,
  UserAchievementSchema,
  XPEventSchema,
  StreakSchema,
  SessionSchema,
  ProjectSchema,
  UserProjectSchema,
  LeaderboardSchema,
  NotificationSchema,
  ConfigurationSchema,
  AnalyticsEventSchema,
  AuditLogSchema,
  MigrationSchema,
  DatabaseIndexes,
  DatabaseConnection,
  DatabaseStats,
  TableStats
} from './Database';

// XP Event types
export {
  XPEventType,
  XPEvent,
  XPMultiplier,
  XPMultiplierType,
  XPEventSource,
  XPEventMetadata,
  XPSummary,
  DailyXP,
  XPLeaderboardEntry,
  XPTransaction,
  XPCalculationRequest,
  XPCalculationResponse,
  XPBoost
} from './XPEvent';
