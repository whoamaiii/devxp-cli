import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { createHash } from 'crypto';

// Type definitions for database entities
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: string; // 'commit', 'pr', 'review', 'issue', 'deployment', etc.
  description: string;
  xpEarned: number;
  metadata?: string; // JSON string for additional data
  timestamp: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  xpReward: number;
  unlockedAt: string;
  metadata?: string; // JSON string for achievement-specific data
}

export interface XpHistory {
  id: string;
  userId: string;
  xpChange: number;
  reason: string;
  activityId?: string;
  achievementId?: string;
  timestamp: string;
  balance: number; // XP balance after this change
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  totalXp: number;
  level: number;
  rank: number;
  streak: number;
}

export interface UserStats {
  totalActivities: number;
  totalAchievements: number;
  averageXpPerDay: number;
  mostProductiveDay: string;
  favoriteActivityType: string;
  xpByActivityType: Record<string, number>;
}

// Migration interface
interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

export class DevXpDatabase {
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private dbPath: string;
  private configDir: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'devxp');
    this.dbPath = path.join(this.configDir, 'devxp.db');
  }

  // Initialize database and run migrations
  async initialize(): Promise<void> {
    // Ensure config directory exists
    await fs.mkdir(this.configDir, { recursive: true });

    // Open database connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await this.db.exec('PRAGMA foreign_keys = ON');

    // Run migrations
    await this.runMigrations();
  }

  // Migration system
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create migrations table if it doesn't exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    const migrations: Migration[] = [
      {
        version: 1,
        name: 'initial_schema',
        up: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            avatar_url TEXT,
            total_xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_active_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            xp_earned INTEGER NOT NULL,
            metadata TEXT,
            timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            xp_reward INTEGER NOT NULL,
            unlocked_at TEXT NOT NULL,
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS xp_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            xp_change INTEGER NOT NULL,
            reason TEXT NOT NULL,
            activity_id TEXT,
            achievement_id TEXT,
            timestamp TEXT NOT NULL,
            balance INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
            FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE SET NULL
          );

          CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
          CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
          CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
          CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
          CREATE INDEX IF NOT EXISTS idx_xp_history_timestamp ON xp_history(timestamp);
        `,
        down: `
          DROP TABLE IF EXISTS xp_history;
          DROP TABLE IF EXISTS achievements;
          DROP TABLE IF EXISTS activities;
          DROP TABLE IF EXISTS users;
        `
      },
      {
        version: 2,
        name: 'add_team_support',
        up: `
          CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS team_members (
            team_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT DEFAULT 'member',
            joined_at TEXT NOT NULL,
            PRIMARY KEY (team_id, user_id),
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          ALTER TABLE users ADD COLUMN current_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
        `,
        down: `
          ALTER TABLE users DROP COLUMN current_team_id;
          DROP TABLE IF EXISTS team_members;
          DROP TABLE IF EXISTS teams;
        `
      }
    ];

    // Get current migration version
    const currentVersion = await this.db.get<{ version: number }>(
      'SELECT MAX(version) as version FROM migrations'
    );
    const current = currentVersion?.version || 0;

    // Apply pending migrations
    for (const migration of migrations) {
      if (migration.version > current) {
        console.log(`Applying migration ${migration.version}: ${migration.name}`);
        await this.db.exec(migration.up);
        await this.db.run(
          'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
          migration.version,
          migration.name,
          new Date().toISOString()
        );
      }
    }
  }

  // Generate unique ID
  private generateId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return createHash('sha256').update(timestamp + random).digest('hex').substring(0, 16);
  }

  // User CRUD operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.run(
      `INSERT INTO users (id, username, email, display_name, avatar_url, total_xp, level, streak, longest_streak, last_active_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      user.username,
      user.email,
      user.displayName,
      user.avatarUrl,
      user.totalXp || 0,
      user.level || 1,
      user.streak || 0,
      user.longestStreak || 0,
      user.lastActiveDate || now,
      now,
      now
    );

    return { ...user, id, createdAt: now, updatedAt: now };
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.db.get<any>(
      'SELECT * FROM users WHERE id = ?',
      id
    );

    if (!user) return null;

    return this.mapDbUserToUser(user);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.db.get<any>(
      'SELECT * FROM users WHERE username = ?',
      username
    );

    if (!user) return null;

    return this.mapDbUserToUser(user);
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.getUser(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    
    await this.db.run(
      `UPDATE users SET username = ?, email = ?, display_name = ?, avatar_url = ?, total_xp = ?, level = ?, streak = ?, longest_streak = ?, last_active_date = ?, updated_at = ?
       WHERE id = ?`,
      updatedUser.username,
      updatedUser.email,
      updatedUser.displayName,
      updatedUser.avatarUrl,
      updatedUser.totalXp,
      updatedUser.level,
      updatedUser.streak,
      updatedUser.longestStreak,
      updatedUser.lastActiveDate,
      updatedUser.updatedAt,
      id
    );

    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run('DELETE FROM users WHERE id = ?', id);
    return (result.changes || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.db.all<any[]>('SELECT * FROM users ORDER BY total_xp DESC');
    return users.map(this.mapDbUserToUser);
  }

  // Activity CRUD operations
  async createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.run(
      `INSERT INTO activities (id, user_id, type, description, xp_earned, metadata, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      activity.userId,
      activity.type,
      activity.description,
      activity.xpEarned,
      activity.metadata,
      activity.timestamp,
      now
    );

    // Update user XP and last active date
    await this.updateUserXp(activity.userId, activity.xpEarned, `Activity: ${activity.description}`, id);

    return { ...activity, id, createdAt: now };
  }

  async getActivity(id: string): Promise<Activity | null> {
    if (!this.db) throw new Error('Database not initialized');

    const activity = await this.db.get<any>(
      'SELECT * FROM activities WHERE id = ?',
      id
    );

    if (!activity) return null;

    return this.mapDbActivityToActivity(activity);
  }

  async getUserActivities(userId: string, limit?: number, offset?: number): Promise<Activity[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM activities WHERE user_id = ? ORDER BY timestamp DESC';
    const params: any[] = [userId];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const activities = await this.db.all<any[]>(query, ...params);
    return activities.map(this.mapDbActivityToActivity);
  }

  async deleteActivity(id: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run('DELETE FROM activities WHERE id = ?', id);
    return (result.changes || 0) > 0;
  }

  // Achievement CRUD operations
  async createAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    
    await this.db.run(
      `INSERT INTO achievements (id, user_id, type, name, description, xp_reward, unlocked_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      achievement.userId,
      achievement.type,
      achievement.name,
      achievement.description,
      achievement.xpReward,
      achievement.unlockedAt,
      achievement.metadata
    );

    // Update user XP
    await this.updateUserXp(achievement.userId, achievement.xpReward, `Achievement unlocked: ${achievement.name}`, undefined, id);

    return { ...achievement, id };
  }

  async getAchievement(id: string): Promise<Achievement | null> {
    if (!this.db) throw new Error('Database not initialized');

    const achievement = await this.db.get<any>(
      'SELECT * FROM achievements WHERE id = ?',
      id
    );

    if (!achievement) return null;

    return this.mapDbAchievementToAchievement(achievement);
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    if (!this.db) throw new Error('Database not initialized');

    const achievements = await this.db.all<any[]>(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
      userId
    );

    return achievements.map(this.mapDbAchievementToAchievement);
  }

  async hasUserAchievement(userId: string, type: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM achievements WHERE user_id = ? AND type = ?',
      userId,
      type
    );

    return (result?.count || 0) > 0;
  }

  // XP History operations
  async addXpHistory(history: Omit<XpHistory, 'id'>): Promise<XpHistory> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    
    await this.db.run(
      `INSERT INTO xp_history (id, user_id, xp_change, reason, activity_id, achievement_id, timestamp, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      history.userId,
      history.xpChange,
      history.reason,
      history.activityId,
      history.achievementId,
      history.timestamp,
      history.balance
    );

    return { ...history, id };
  }

  async getUserXpHistory(userId: string, limit?: number, offset?: number): Promise<XpHistory[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM xp_history WHERE user_id = ? ORDER BY timestamp DESC';
    const params: any[] = [userId];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const history = await this.db.all<any[]>(query, ...params);
    return history.map(this.mapDbXpHistoryToXpHistory);
  }

  // Helper method to update user XP and record history
  private async updateUserXp(userId: string, xpChange: number, reason: string, activityId?: string, achievementId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const newTotalXp = user.totalXp + xpChange;
    const newLevel = this.calculateLevel(newTotalXp);
    const now = new Date().toISOString();

    // Update user
    await this.db.run(
      'UPDATE users SET total_xp = ?, level = ?, last_active_date = ?, updated_at = ? WHERE id = ?',
      newTotalXp,
      newLevel,
      now,
      now,
      userId
    );

    // Add to XP history
    await this.addXpHistory({
      userId,
      xpChange,
      reason,
      activityId,
      achievementId,
      timestamp: now,
      balance: newTotalXp
    });
  }

  // Calculate level based on XP (example formula)
  private calculateLevel(totalXp: number): number {
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }

  // Leaderboard queries
  async getGlobalLeaderboard(limit: number = 10, offset: number = 0): Promise<LeaderboardEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.db.all<any[]>(
      `SELECT id, username, display_name, total_xp, level, streak,
       ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
       FROM users
       ORDER BY total_xp DESC
       LIMIT ? OFFSET ?`,
      limit,
      offset
    );

    return users.map((user) => ({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      totalXp: user.total_xp,
      level: user.level,
      rank: user.rank,
      streak: user.streak
    }));
  }

  async getWeeklyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const users = await this.db.all<any[]>(
      `SELECT u.id, u.username, u.display_name, u.level, u.streak,
       COALESCE(SUM(a.xp_earned), 0) as weekly_xp,
       ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.xp_earned), 0) DESC) as rank
       FROM users u
       LEFT JOIN activities a ON u.id = a.user_id AND a.timestamp >= ?
       GROUP BY u.id
       ORDER BY weekly_xp DESC
       LIMIT ?`,
      oneWeekAgo,
      limit
    );

    return users.map((user) => ({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      totalXp: user.weekly_xp,
      level: user.level,
      rank: user.rank,
      streak: user.streak
    }));
  }

  // Statistics queries
  async getUserStats(userId: string): Promise<UserStats> {
    if (!this.db) throw new Error('Database not initialized');

    // Total activities
    const totalActivities = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM activities WHERE user_id = ?',
      userId
    );

    // Total achievements
    const totalAchievements = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM achievements WHERE user_id = ?',
      userId
    );

    // Average XP per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const avgXp = await this.db.get<{ avg_xp: number }>(
      `SELECT AVG(daily_xp) as avg_xp FROM (
        SELECT DATE(timestamp) as day, SUM(xp_earned) as daily_xp
        FROM activities
        WHERE user_id = ? AND timestamp >= ?
        GROUP BY DATE(timestamp)
      )`,
      userId,
      thirtyDaysAgo
    );

    // Most productive day
    const mostProductive = await this.db.get<{ day: string; total_xp: number }>(
      `SELECT DATE(timestamp) as day, SUM(xp_earned) as total_xp
       FROM activities
       WHERE user_id = ?
       GROUP BY DATE(timestamp)
       ORDER BY total_xp DESC
       LIMIT 1`,
      userId
    );

    // Favorite activity type
    const favoriteType = await this.db.get<{ type: string; count: number }>(
      `SELECT type, COUNT(*) as count
       FROM activities
       WHERE user_id = ?
       GROUP BY type
       ORDER BY count DESC
       LIMIT 1`,
      userId
    );

    // XP by activity type
    const xpByType = await this.db.all<{ type: string; total_xp: number }[]>(
      `SELECT type, SUM(xp_earned) as total_xp
       FROM activities
       WHERE user_id = ?
       GROUP BY type`,
      userId
    );

    const xpByActivityType: Record<string, number> = {};
    xpByType.forEach((row) => {
      xpByActivityType[row.type] = row.total_xp;
    });

    return {
      totalActivities: totalActivities?.count || 0,
      totalAchievements: totalAchievements?.count || 0,
      averageXpPerDay: Math.round(avgXp?.avg_xp || 0),
      mostProductiveDay: mostProductive?.day || '',
      favoriteActivityType: favoriteType?.type || '',
      xpByActivityType
    };
  }

  // Backup and restore functionality
  async backup(backupPath?: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const defaultBackupPath = path.join(this.configDir, `backup-${timestamp}.db`);
    const targetPath = backupPath || defaultBackupPath;

    // Close current connection
    await this.db.close();

    // Copy database file
    await fs.copyFile(this.dbPath, targetPath);

    // Reopen connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    console.log(`Database backed up to: ${targetPath}`);
    return targetPath;
  }

  async restore(backupPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Close current connection
    await this.db.close();

    // Create a backup of current database before restoring
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const currentBackupPath = path.join(this.configDir, `pre-restore-${timestamp}.db`);
    await fs.copyFile(this.dbPath, currentBackupPath);
    console.log(`Current database backed up to: ${currentBackupPath}`);

    // Restore from backup
    await fs.copyFile(backupPath, this.dbPath);

    // Reopen connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    console.log(`Database restored from: ${backupPath}`);
  }

  // Export data as JSON
  async exportData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.getAllUsers();
    const activities: Activity[] = [];
    const achievements: Achievement[] = [];
    const xpHistory: XpHistory[] = [];

    for (const user of users) {
      const userActivities = await this.getUserActivities(user.id);
      const userAchievements = await this.getUserAchievements(user.id);
      const userXpHistory = await this.getUserXpHistory(user.id);

      activities.push(...userActivities);
      achievements.push(...userAchievements);
      xpHistory.push(...userXpHistory);
    }

    const data = {
      exportedAt: new Date().toISOString(),
      users,
      activities,
      achievements,
      xpHistory
    };

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const exportPath = path.join(this.configDir, `export-${timestamp}.json`);
    
    await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
    console.log(`Data exported to: ${exportPath}`);
    
    return exportPath;
  }

  // Import data from JSON
  async importData(importPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dataStr = await fs.readFile(importPath, 'utf-8');
    const data = JSON.parse(dataStr);

    // Import users
    for (const user of data.users || []) {
      const existingUser = await this.getUserByUsername(user.username);
      if (!existingUser) {
        await this.db.run(
          `INSERT INTO users (id, username, email, display_name, avatar_url, total_xp, level, streak, longest_streak, last_active_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          user.id,
          user.username,
          user.email,
          user.displayName || user.display_name,
          user.avatarUrl || user.avatar_url,
          user.totalXp || user.total_xp,
          user.level,
          user.streak,
          user.longestStreak || user.longest_streak,
          user.lastActiveDate || user.last_active_date,
          user.createdAt || user.created_at,
          user.updatedAt || user.updated_at
        );
      }
    }

    // Import activities
    for (const activity of data.activities || []) {
      const existingActivity = await this.getActivity(activity.id);
      if (!existingActivity) {
        await this.db.run(
          `INSERT INTO activities (id, user_id, type, description, xp_earned, metadata, timestamp, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          activity.id,
          activity.userId || activity.user_id,
          activity.type,
          activity.description,
          activity.xpEarned || activity.xp_earned,
          activity.metadata,
          activity.timestamp,
          activity.createdAt || activity.created_at
        );
      }
    }

    // Import achievements
    for (const achievement of data.achievements || []) {
      const existingAchievement = await this.getAchievement(achievement.id);
      if (!existingAchievement) {
        await this.db.run(
          `INSERT INTO achievements (id, user_id, type, name, description, xp_reward, unlocked_at, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          achievement.id,
          achievement.userId || achievement.user_id,
          achievement.type,
          achievement.name,
          achievement.description,
          achievement.xpReward || achievement.xp_reward,
          achievement.unlockedAt || achievement.unlocked_at,
          achievement.metadata
        );
      }
    }

    // Import XP history
    for (const history of data.xpHistory || []) {
      await this.db.run(
        `INSERT OR IGNORE INTO xp_history (id, user_id, xp_change, reason, activity_id, achievement_id, timestamp, balance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        history.id,
        history.userId || history.user_id,
        history.xpChange || history.xp_change,
        history.reason,
        history.activityId || history.activity_id,
        history.achievementId || history.achievement_id,
        history.timestamp,
        history.balance
      );
    }

    console.log(`Data imported from: ${importPath}`);
  }

  // Cleanup and close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Helper methods to map database rows to TypeScript interfaces
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      totalXp: dbUser.total_xp,
      level: dbUser.level,
      streak: dbUser.streak,
      longestStreak: dbUser.longest_streak,
      lastActiveDate: dbUser.last_active_date,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }

  private mapDbActivityToActivity(dbActivity: any): Activity {
    return {
      id: dbActivity.id,
      userId: dbActivity.user_id,
      type: dbActivity.type,
      description: dbActivity.description,
      xpEarned: dbActivity.xp_earned,
      metadata: dbActivity.metadata,
      timestamp: dbActivity.timestamp,
      createdAt: dbActivity.created_at
    };
  }

  private mapDbAchievementToAchievement(dbAchievement: any): Achievement {
    return {
      id: dbAchievement.id,
      userId: dbAchievement.user_id,
      type: dbAchievement.type,
      name: dbAchievement.name,
      description: dbAchievement.description,
      xpReward: dbAchievement.xp_reward,
      unlockedAt: dbAchievement.unlocked_at,
      metadata: dbAchievement.metadata
    };
  }

  private mapDbXpHistoryToXpHistory(dbHistory: any): XpHistory {
    return {
      id: dbHistory.id,
      userId: dbHistory.user_id,
      xpChange: dbHistory.xp_change,
      reason: dbHistory.reason,
      activityId: dbHistory.activity_id,
      achievementId: dbHistory.achievement_id,
      timestamp: dbHistory.timestamp,
      balance: dbHistory.balance
    };
  }

  // Utility methods for streak management
  async updateUserStreak(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate ? user.lastActiveDate.split('T')[0] : null;

    if (!lastActive || lastActive === today) {
      // Already updated today or first activity
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newStreak = user.streak;
    let newLongestStreak = user.longestStreak;

    if (lastActive === yesterday) {
      // Continuing streak
      newStreak++;
      newLongestStreak = Math.max(newStreak, user.longestStreak);
    } else {
      // Streak broken
      newStreak = 1;
    }

    await this.db.run(
      'UPDATE users SET streak = ?, longest_streak = ?, last_active_date = ?, updated_at = ? WHERE id = ?',
      newStreak,
      newLongestStreak,
      new Date().toISOString(),
      new Date().toISOString(),
      userId
    );
  }

  // Get database size and statistics
  async getDatabaseStats(): Promise<{
    sizeInBytes: number;
    userCount: number;
    activityCount: number;
    achievementCount: number;
    lastBackup?: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const stats = await fs.stat(this.dbPath);
    
    const userCount = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const activityCount = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM activities');
    const achievementCount = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM achievements');

    // Find most recent backup
    const files = await fs.readdir(this.configDir);
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.db'));
    const lastBackup = backupFiles.sort().pop();

    return {
      sizeInBytes: stats.size,
      userCount: userCount?.count || 0,
      activityCount: activityCount?.count || 0,
      achievementCount: achievementCount?.count || 0,
      lastBackup
    };
  }
}

// Export singleton instance
export const database = new DevXpDatabase();
