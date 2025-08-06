/**
 * User profile interface for the terminal gamification system
 */

import { Achievement } from './Achievement';

/**
 * Represents a user's profile in the gamification system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  
  /** User's display name */
  username: string;
  
  /** Current experience level */
  level: number;
  
  /** Current XP points */
  currentXP: number;
  
  /** Total XP earned all-time */
  totalXP: number;
  
  /** XP required to reach the next level */
  xpToNextLevel: number;
  
  /** Array of achievement IDs that the user has unlocked */
  unlockedAchievements: string[];
  
  /** User statistics */
  stats: UserStats;
  
  /** Timestamp when the user profile was created */
  createdAt: Date;
  
  /** Timestamp of the last activity */
  lastActiveAt: Date;
  
  /** User preferences and settings */
  preferences: UserPreferences;
  
  /** Current streak information */
  streak: StreakInfo;
}

/**
 * User statistics tracking various activities
 */
export interface UserStats {
  /** Total number of git commits */
  totalCommits: number;
  
  /** Total number of terminal commands executed */
  totalCommands: number;
  
  /** Total number of files created */
  filesCreated: number;
  
  /** Total number of files modified */
  filesModified: number;
  
  /** Total lines of code written */
  linesOfCode: number;
  
  /** Total time spent in terminal (in seconds) */
  terminalTime: number;
  
  /** Number of different projects worked on */
  projectsWorked: number;
  
  /** Most used programming languages */
  languageStats: Record<string, number>;
  
  /** Daily activity breakdown */
  dailyActivity: Record<string, number>;
  
  /** Weekly activity breakdown */
  weeklyActivity: Record<string, number>;
}

/**
 * User preferences for the gamification system
 */
export interface UserPreferences {
  /** Whether to show notifications for XP gains */
  showXPNotifications: boolean;
  
  /** Whether to show achievement unlock notifications */
  showAchievementNotifications: boolean;
  
  /** Whether to display the status bar */
  showStatusBar: boolean;
  
  /** Theme preference for the UI */
  theme: 'dark' | 'light' | 'auto';
  
  /** Whether to track activities automatically */
  autoTrack: boolean;
  
  /** Privacy settings */
  privacy: PrivacySettings;
}

/**
 * Privacy settings for user data
 */
export interface PrivacySettings {
  /** Whether to share profile publicly */
  publicProfile: boolean;
  
  /** Whether to share achievements */
  shareAchievements: boolean;
  
  /** Whether to participate in leaderboards */
  participateInLeaderboards: boolean;
  
  /** Whether to collect anonymous usage data */
  allowAnalytics: boolean;
}

/**
 * Streak tracking information
 */
export interface StreakInfo {
  /** Current consecutive days streak */
  currentStreak: number;
  
  /** Longest streak achieved */
  longestStreak: number;
  
  /** Date of the last activity for streak calculation */
  lastStreakDate: Date;
  
  /** Whether the streak is active today */
  isActiveToday: boolean;
}

/**
 * Leaderboard entry for a user
 */
export interface LeaderboardEntry {
  /** User ID */
  userId: string;
  
  /** User display name */
  username: string;
  
  /** User level */
  level: number;
  
  /** Total XP */
  totalXP: number;
  
  /** Rank position */
  rank: number;
  
  /** Number of achievements unlocked */
  achievementCount: number;
}
