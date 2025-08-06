/**
 * Activity types and interfaces for tracking different developer activities
 */

/**
 * Enum of all possible activity types in the system
 */
export enum ActivityType {
  // Git activities
  GIT_COMMIT = 'git_commit',
  GIT_PUSH = 'git_push',
  GIT_PULL = 'git_pull',
  GIT_MERGE = 'git_merge',
  GIT_BRANCH_CREATE = 'git_branch_create',
  GIT_BRANCH_DELETE = 'git_branch_delete',
  GIT_STASH = 'git_stash',
  GIT_TAG = 'git_tag',
  GIT_REBASE = 'git_rebase',
  
  // Terminal command activities
  TERMINAL_COMMAND = 'terminal_command',
  TERMINAL_PIPE = 'terminal_pipe',
  TERMINAL_SCRIPT = 'terminal_script',
  TERMINAL_ALIAS = 'terminal_alias',
  
  // File operations
  FILE_CREATE = 'file_create',
  FILE_EDIT = 'file_edit',
  FILE_DELETE = 'file_delete',
  FILE_RENAME = 'file_rename',
  DIRECTORY_CREATE = 'directory_create',
  
  // Development activities
  CODE_COMPILE = 'code_compile',
  CODE_BUILD = 'code_build',
  CODE_TEST = 'code_test',
  CODE_LINT = 'code_lint',
  CODE_FORMAT = 'code_format',
  CODE_DEBUG = 'code_debug',
  
  // Package management
  PACKAGE_INSTALL = 'package_install',
  PACKAGE_UPDATE = 'package_update',
  PACKAGE_PUBLISH = 'package_publish',
  
  // Docker activities
  DOCKER_BUILD = 'docker_build',
  DOCKER_RUN = 'docker_run',
  DOCKER_COMPOSE = 'docker_compose',
  
  // Database activities
  DATABASE_QUERY = 'database_query',
  DATABASE_MIGRATION = 'database_migration',
  DATABASE_BACKUP = 'database_backup',
  
  // Deployment activities
  DEPLOY_STAGING = 'deploy_staging',
  DEPLOY_PRODUCTION = 'deploy_production',
  DEPLOY_ROLLBACK = 'deploy_rollback',
  
  // Learning activities
  DOCUMENTATION_READ = 'documentation_read',
  DOCUMENTATION_WRITE = 'documentation_write',
  TUTORIAL_COMPLETE = 'tutorial_complete',
  
  // Collaboration
  PR_CREATE = 'pr_create',
  PR_REVIEW = 'pr_review',
  PR_MERGE = 'pr_merge',
  ISSUE_CREATE = 'issue_create',
  ISSUE_CLOSE = 'issue_close',
  
  // Custom
  CUSTOM = 'custom'
}

/**
 * Base activity interface
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  
  /** Type of activity */
  type: ActivityType;
  
  /** User who performed the activity */
  userId: string;
  
  /** Timestamp when the activity occurred */
  timestamp: Date;
  
  /** XP points earned from this activity */
  xpEarned: number;
  
  /** Additional metadata about the activity */
  metadata: ActivityMetadata;
  
  /** Whether this activity contributed to a streak */
  contributedToStreak: boolean;
  
  /** Project context where the activity occurred */
  projectId?: string;
  
  /** Session ID for grouping related activities */
  sessionId: string;
}

/**
 * Metadata for activities with type-specific information
 */
export interface ActivityMetadata {
  /** Command or action that was executed */
  command?: string;
  
  /** File paths involved in the activity */
  files?: string[];
  
  /** Programming language if applicable */
  language?: string;
  
  /** Number of lines affected */
  linesAffected?: number;
  
  /** Duration of the activity in seconds */
  duration?: number;
  
  /** Success or failure status */
  success?: boolean;
  
  /** Error message if the activity failed */
  errorMessage?: string;
  
  /** Git-specific metadata */
  git?: GitActivityMetadata;
  
  /** Additional custom properties */
  custom?: Record<string, unknown>;
}

/**
 * Git-specific activity metadata
 */
export interface GitActivityMetadata {
  /** Git branch name */
  branch?: string;
  
  /** Commit hash */
  commitHash?: string;
  
  /** Commit message */
  commitMessage?: string;
  
  /** Number of files changed */
  filesChanged?: number;
  
  /** Number of insertions */
  insertions?: number;
  
  /** Number of deletions */
  deletions?: number;
  
  /** Remote repository name */
  remote?: string;
  
  /** Whether it was a merge commit */
  isMergeCommit?: boolean;
}

/**
 * Activity category for grouping related activities
 */
export enum ActivityCategory {
  VERSION_CONTROL = 'version_control',
  TERMINAL = 'terminal',
  FILE_MANAGEMENT = 'file_management',
  DEVELOPMENT = 'development',
  DEPLOYMENT = 'deployment',
  COLLABORATION = 'collaboration',
  LEARNING = 'learning',
  INFRASTRUCTURE = 'infrastructure'
}

/**
 * XP multiplier configuration for activities
 */
export interface ActivityXPConfig {
  /** Base XP for the activity type */
  baseXP: number;
  
  /** Multipliers based on various factors */
  multipliers: XPMultipliers;
  
  /** Maximum XP that can be earned from this activity type */
  maxXP: number;
  
  /** Minimum XP that can be earned from this activity type */
  minXP: number;
  
  /** Cooldown period in seconds before the same activity gives XP again */
  cooldownSeconds?: number;
}

/**
 * XP multipliers for calculating final XP
 */
export interface XPMultipliers {
  /** Multiplier based on complexity */
  complexity?: number;
  
  /** Multiplier for consecutive activities */
  streak?: number;
  
  /** Multiplier for first time performing this activity */
  firstTime?: number;
  
  /** Multiplier based on time of day */
  timeOfDay?: number;
  
  /** Multiplier for weekend activities */
  weekend?: number;
  
  /** Custom multipliers */
  custom?: Record<string, number>;
}

/**
 * Activity filter options for querying activities
 */
export interface ActivityFilter {
  /** Filter by activity types */
  types?: ActivityType[];
  
  /** Filter by categories */
  categories?: ActivityCategory[];
  
  /** Filter by user ID */
  userId?: string;
  
  /** Filter by project ID */
  projectId?: string;
  
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  /** Minimum XP earned */
  minXP?: number;
  
  /** Maximum XP earned */
  maxXP?: number;
  
  /** Only successful activities */
  successOnly?: boolean;
}

/**
 * Activity summary for analytics
 */
export interface ActivitySummary {
  /** Total count of activities */
  totalCount: number;
  
  /** Total XP earned from activities */
  totalXP: number;
  
  /** Breakdown by activity type */
  byType: Record<ActivityType, number>;
  
  /** Breakdown by category */
  byCategory: Record<ActivityCategory, number>;
  
  /** Most common activity type */
  mostCommon: ActivityType;
  
  /** Average XP per activity */
  averageXP: number;
  
  /** Time period of the summary */
  period: {
    start: Date;
    end: Date;
  };
}
