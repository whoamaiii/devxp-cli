/**
 * Integration tests for database operations
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { DevXpDatabase } from './database';
import { ActivityType } from '../types/Activity';

describe('DevXpDatabase Integration', () => {
  let db: DevXpDatabase;
  let testDbDir: string;
  let originalHome: string;

  beforeAll(async () => {
    // Create a temporary test directory
    testDbDir = path.join(os.tmpdir(), `devxp-test-${Date.now()}`);
    await fs.mkdir(testDbDir, { recursive: true });
    
    // Mock the home directory for testing
    originalHome = os.homedir();
    process.env.HOME = testDbDir;
  });

  afterAll(async () => {
    // Restore original home
    process.env.HOME = originalHome;
    
    // Clean up test directory
    try {
      await fs.rm(testDbDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    db = new DevXpDatabase();
    await db.initialize();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });

  describe('Database Initialization', () => {
    test('should create database file and tables', async () => {
      const dbPath = path.join(testDbDir, '.config', 'devxp', 'devxp.db');
      const fileExists = await fs.access(dbPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should run migrations successfully', async () => {
      // Database should be initialized with migrations
      const stats = await db.getDatabaseStats();
      expect(stats).toBeDefined();
      expect(stats.userCount).toBe(0);
      expect(stats.activityCount).toBe(0);
    });
  });

  describe('User CRUD Operations', () => {
    test('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      };

      const user = await db.createUser(userData);
      
      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should get user by id', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        displayName: 'Test User 2',
        totalXp: 100,
        level: 2,
        streak: 5,
        longestStreak: 10,
        lastActiveDate: new Date().toISOString()
      };

      const created = await db.createUser(userData);
      const retrieved = await db.getUser(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.username).toBe(userData.username);
      expect(retrieved?.totalXp).toBe(userData.totalXp);
    });

    test('should get user by username', async () => {
      const userData = {
        username: 'uniqueuser',
        email: 'unique@example.com',
        displayName: 'Unique User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      };

      await db.createUser(userData);
      const retrieved = await db.getUserByUsername('uniqueuser');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe('uniqueuser');
      expect(retrieved?.email).toBe('unique@example.com');
    });

    test('should update user', async () => {
      const user = await db.createUser({
        username: 'updateuser',
        email: 'update@example.com',
        displayName: 'Update User',
        totalXp: 100,
        level: 2,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const updated = await db.updateUser(user.id, {
        totalXp: 500,
        level: 5,
        streak: 10
      });

      expect(updated).toBeDefined();
      expect(updated?.totalXp).toBe(500);
      expect(updated?.level).toBe(5);
      expect(updated?.streak).toBe(10);
      expect(updated?.updatedAt).not.toBe(user.updatedAt);
    });

    test('should delete user', async () => {
      const user = await db.createUser({
        username: 'deleteuser',
        email: 'delete@example.com',
        displayName: 'Delete User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const deleted = await db.deleteUser(user.id);
      expect(deleted).toBe(true);

      const retrieved = await db.getUser(user.id);
      expect(retrieved).toBeNull();
    });

    test('should get all users sorted by XP', async () => {
      // Create multiple users
      await db.createUser({
        username: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        totalXp: 300,
        level: 3,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      await db.createUser({
        username: 'user2',
        email: 'user2@example.com',
        displayName: 'User 2',
        totalXp: 500,
        level: 5,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      await db.createUser({
        username: 'user3',
        email: 'user3@example.com',
        displayName: 'User 3',
        totalXp: 100,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const users = await db.getAllUsers();
      
      expect(users.length).toBe(3);
      expect(users[0].totalXp).toBe(500);
      expect(users[1].totalXp).toBe(300);
      expect(users[2].totalXp).toBe(100);
    });
  });

  describe('Activity Operations', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await db.createUser({
        username: 'activityuser',
        email: 'activity@example.com',
        displayName: 'Activity User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });
      testUserId = user.id;
    });

    test('should create activity and update user XP', async () => {
      const activity = await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_COMMIT,
        description: 'Made a commit',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      expect(activity.id).toBeDefined();
      expect(activity.userId).toBe(testUserId);
      expect(activity.xpEarned).toBe(50);

      // Check if user XP was updated
      const user = await db.getUser(testUserId);
      expect(user?.totalXp).toBe(50);
    });

    test('should get user activities', async () => {
      // Create multiple activities
      await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_COMMIT,
        description: 'Commit 1',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_PUSH,
        description: 'Push 1',
        xpEarned: 30,
        timestamp: new Date().toISOString()
      });

      await db.createActivity({
        userId: testUserId,
        type: ActivityType.CODE_TEST,
        description: 'Test 1',
        xpEarned: 60,
        timestamp: new Date().toISOString()
      });

      const activities = await db.getUserActivities(testUserId);
      
      expect(activities.length).toBe(3);
      expect(activities[0].type).toBe(ActivityType.CODE_TEST); // Most recent first
      expect(activities[2].type).toBe(ActivityType.GIT_COMMIT); // Oldest last
    });

    test('should paginate user activities', async () => {
      // Create 10 activities
      for (let i = 0; i < 10; i++) {
        await db.createActivity({
          userId: testUserId,
          type: ActivityType.GIT_COMMIT,
          description: `Commit ${i}`,
          xpEarned: 10,
          timestamp: new Date(Date.now() - i * 1000).toISOString()
        });
      }

      const page1 = await db.getUserActivities(testUserId, 5, 0);
      const page2 = await db.getUserActivities(testUserId, 5, 5);
      
      expect(page1.length).toBe(5);
      expect(page2.length).toBe(5);
      expect(page1[0].description).toBe('Commit 0');
      expect(page2[0].description).toBe('Commit 5');
    });

    test('should delete activity', async () => {
      const activity = await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_COMMIT,
        description: 'To be deleted',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      const deleted = await db.deleteActivity(activity.id);
      expect(deleted).toBe(true);

      const retrieved = await db.getActivity(activity.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Achievement Operations', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await db.createUser({
        username: 'achievementuser',
        email: 'achievement@example.com',
        displayName: 'Achievement User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });
      testUserId = user.id;
    });

    test('should create achievement and award XP', async () => {
      const achievement = await db.createAchievement({
        userId: testUserId,
        type: 'first_commit',
        name: 'First Commit',
        description: 'Made your first commit',
        xpReward: 100,
        unlockedAt: new Date().toISOString()
      });

      expect(achievement.id).toBeDefined();
      expect(achievement.xpReward).toBe(100);

      // Check if user XP was updated
      const user = await db.getUser(testUserId);
      expect(user?.totalXp).toBe(100);
    });

    test('should get user achievements', async () => {
      await db.createAchievement({
        userId: testUserId,
        type: 'first_commit',
        name: 'First Commit',
        description: 'Made your first commit',
        xpReward: 100,
        unlockedAt: new Date().toISOString()
      });

      await db.createAchievement({
        userId: testUserId,
        type: 'streak_7',
        name: 'Week Streak',
        description: '7 day streak',
        xpReward: 200,
        unlockedAt: new Date().toISOString()
      });

      const achievements = await db.getUserAchievements(testUserId);
      
      expect(achievements.length).toBe(2);
      expect(achievements[0].type).toBe('streak_7'); // Most recent first
    });

    test('should check if user has achievement', async () => {
      await db.createAchievement({
        userId: testUserId,
        type: 'unique_achievement',
        name: 'Unique',
        description: 'Unique achievement',
        xpReward: 50,
        unlockedAt: new Date().toISOString()
      });

      const hasAchievement = await db.hasUserAchievement(testUserId, 'unique_achievement');
      const doesNotHave = await db.hasUserAchievement(testUserId, 'nonexistent');
      
      expect(hasAchievement).toBe(true);
      expect(doesNotHave).toBe(false);
    });
  });

  describe('XP History', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await db.createUser({
        username: 'xpuser',
        email: 'xp@example.com',
        displayName: 'XP User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });
      testUserId = user.id;
    });

    test('should track XP history', async () => {
      await db.addXpHistory({
        userId: testUserId,
        xpChange: 50,
        reason: 'Git commit',
        timestamp: new Date().toISOString(),
        balance: 50
      });

      await db.addXpHistory({
        userId: testUserId,
        xpChange: 30,
        reason: 'Code review',
        timestamp: new Date().toISOString(),
        balance: 80
      });

      const history = await db.getUserXpHistory(testUserId);
      
      expect(history.length).toBe(2);
      expect(history[0].reason).toBe('Code review'); // Most recent first
      expect(history[0].balance).toBe(80);
      expect(history[1].reason).toBe('Git commit');
      expect(history[1].balance).toBe(50);
    });

    test('should paginate XP history', async () => {
      for (let i = 0; i < 10; i++) {
        await db.addXpHistory({
          userId: testUserId,
          xpChange: 10,
          reason: `Activity ${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          balance: (i + 1) * 10
        });
      }

      const page1 = await db.getUserXpHistory(testUserId, 5, 0);
      const page2 = await db.getUserXpHistory(testUserId, 5, 5);
      
      expect(page1.length).toBe(5);
      expect(page2.length).toBe(5);
      expect(page1[0].reason).toBe('Activity 0');
      expect(page2[0].reason).toBe('Activity 5');
    });
  });

  describe('Leaderboard Queries', () => {
    beforeEach(async () => {
      // Create test users with different XP
      const users = [
        { username: 'leader1', email: 'leader1@test.com', totalXp: 1000, level: 10 },
        { username: 'leader2', email: 'leader2@test.com', totalXp: 800, level: 8 },
        { username: 'leader3', email: 'leader3@test.com', totalXp: 600, level: 6 },
        { username: 'leader4', email: 'leader4@test.com', totalXp: 400, level: 4 },
        { username: 'leader5', email: 'leader5@test.com', totalXp: 200, level: 2 }
      ];

      for (const userData of users) {
        await db.createUser({
          ...userData,
          displayName: userData.username,
          streak: 0,
          longestStreak: 0,
          lastActiveDate: new Date().toISOString()
        });
      }
    });

    test('should get global leaderboard', async () => {
      const leaderboard = await db.getGlobalLeaderboard(3);
      
      expect(leaderboard.length).toBe(3);
      expect(leaderboard[0].totalXp).toBe(1000);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].totalXp).toBe(800);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].totalXp).toBe(600);
      expect(leaderboard[2].rank).toBe(3);
    });

    test('should paginate global leaderboard', async () => {
      const page1 = await db.getGlobalLeaderboard(2, 0);
      const page2 = await db.getGlobalLeaderboard(2, 2);
      
      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].username).toBe('leader1');
      expect(page2[0].username).toBe('leader3');
    });

    test('should get weekly leaderboard', async () => {
      // Add recent activities for some users
      const users = await db.getAllUsers();
      const recentDate = new Date().toISOString();
      
      await db.createActivity({
        userId: users[0].id,
        type: ActivityType.GIT_COMMIT,
        description: 'Recent commit',
        xpEarned: 100,
        timestamp: recentDate
      });

      await db.createActivity({
        userId: users[1].id,
        type: ActivityType.GIT_COMMIT,
        description: 'Recent commit',
        xpEarned: 50,
        timestamp: recentDate
      });

      const weeklyLeaderboard = await db.getWeeklyLeaderboard(5);
      
      expect(weeklyLeaderboard.length).toBe(5);
      expect(weeklyLeaderboard[0].totalXp).toBe(100);
      expect(weeklyLeaderboard[1].totalXp).toBe(50);
    });
  });

  describe('User Statistics', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await db.createUser({
        username: 'statsuser',
        email: 'stats@example.com',
        displayName: 'Stats User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });
      testUserId = user.id;

      // Create various activities
      await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_COMMIT,
        description: 'Commit',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      await db.createActivity({
        userId: testUserId,
        type: ActivityType.GIT_COMMIT,
        description: 'Another commit',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      await db.createActivity({
        userId: testUserId,
        type: ActivityType.CODE_TEST,
        description: 'Test',
        xpEarned: 60,
        timestamp: new Date().toISOString()
      });

      await db.createAchievement({
        userId: testUserId,
        type: 'test_achievement',
        name: 'Test Achievement',
        description: 'Test',
        xpReward: 100,
        unlockedAt: new Date().toISOString()
      });
    });

    test('should calculate user statistics', async () => {
      const stats = await db.getUserStats(testUserId);
      
      expect(stats.totalActivities).toBe(3);
      expect(stats.totalAchievements).toBe(1);
      expect(stats.favoriteActivityType).toBe(ActivityType.GIT_COMMIT);
      expect(stats.xpByActivityType[ActivityType.GIT_COMMIT]).toBe(100);
      expect(stats.xpByActivityType[ActivityType.CODE_TEST]).toBe(60);
    });
  });

  describe('Streak Management', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await db.createUser({
        username: 'streakuser',
        email: 'streak@example.com',
        displayName: 'Streak User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      });
      testUserId = user.id;
    });

    test('should update streak when continuing', async () => {
      await db.updateUserStreak(testUserId);
      
      const user = await db.getUser(testUserId);
      expect(user?.streak).toBe(1);
      expect(user?.longestStreak).toBe(1);
    });

    test('should reset streak when broken', async () => {
      // Set last active to 3 days ago
      await db.updateUser(testUserId, {
        lastActiveDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        streak: 5,
        longestStreak: 10
      });

      await db.updateUserStreak(testUserId);
      
      const user = await db.getUser(testUserId);
      expect(user?.streak).toBe(1);
      expect(user?.longestStreak).toBe(10); // Longest streak preserved
    });
  });

  describe('Backup and Restore', () => {
    test('should backup database', async () => {
      // Create some test data
      await db.createUser({
        username: 'backupuser',
        email: 'backup@example.com',
        displayName: 'Backup User',
        totalXp: 100,
        level: 2,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const backupPath = await db.backup();
      
      expect(backupPath).toBeDefined();
      expect(backupPath).toContain('backup-');
      
      // Check if backup file exists
      const fileExists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should restore database from backup', async () => {
      // Create initial data
      const user = await db.createUser({
        username: 'restoreuser',
        email: 'restore@example.com',
        displayName: 'Restore User',
        totalXp: 500,
        level: 5,
        streak: 10,
        longestStreak: 20,
        lastActiveDate: new Date().toISOString()
      });

      // Create backup
      const backupPath = await db.backup();

      // Modify data
      await db.updateUser(user.id, { totalXp: 1000, level: 10 });

      // Restore from backup
      await db.restore(backupPath);

      // Check if data was restored
      const restored = await db.getUser(user.id);
      expect(restored?.totalXp).toBe(500);
      expect(restored?.level).toBe(5);
    });
  });

  describe('Export and Import', () => {
    test('should export data to JSON', async () => {
      // Create test data
      const user = await db.createUser({
        username: 'exportuser',
        email: 'export@example.com',
        displayName: 'Export User',
        totalXp: 250,
        level: 3,
        streak: 5,
        longestStreak: 10,
        lastActiveDate: new Date().toISOString()
      });

      await db.createActivity({
        userId: user.id,
        type: ActivityType.GIT_COMMIT,
        description: 'Export test',
        xpEarned: 50,
        timestamp: new Date().toISOString()
      });

      const exportPath = await db.exportData();
      
      expect(exportPath).toBeDefined();
      expect(exportPath).toContain('export-');
      
      // Read and verify exported data
      const exportedData = JSON.parse(await fs.readFile(exportPath, 'utf-8'));
      expect(exportedData.users).toHaveLength(1);
      expect(exportedData.activities).toHaveLength(1);
      expect(exportedData.users[0].username).toBe('exportuser');
    });

    test('should import data from JSON', async () => {
      // Create export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        users: [{
          id: 'import-user-1',
          username: 'importuser',
          email: 'import@example.com',
          displayName: 'Import User',
          totalXp: 750,
          level: 7,
          streak: 15,
          longestStreak: 30,
          lastActiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        activities: [{
          id: 'import-activity-1',
          userId: 'import-user-1',
          type: ActivityType.GIT_COMMIT,
          description: 'Imported commit',
          xpEarned: 50,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }],
        achievements: [],
        xpHistory: []
      };

      const importPath = path.join(testDbDir, 'import-test.json');
      await fs.writeFile(importPath, JSON.stringify(exportData));

      await db.importData(importPath);

      // Verify imported data
      const user = await db.getUserByUsername('importuser');
      expect(user).toBeDefined();
      expect(user?.totalXp).toBe(750);
      expect(user?.level).toBe(7);

      const activities = await db.getUserActivities(user!.id);
      expect(activities).toHaveLength(1);
      expect(activities[0].description).toBe('Imported commit');
    });
  });

  describe('Database Statistics', () => {
    test('should get database statistics', async () => {
      // Create some test data
      await db.createUser({
        username: 'statsuser1',
        email: 'stats1@example.com',
        displayName: 'Stats User 1',
        totalXp: 100,
        level: 2,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      await db.createUser({
        username: 'statsuser2',
        email: 'stats2@example.com',
        displayName: 'Stats User 2',
        totalXp: 200,
        level: 3,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const stats = await db.getDatabaseStats();
      
      expect(stats.sizeInBytes).toBeGreaterThan(0);
      expect(stats.userCount).toBe(2);
      expect(stats.activityCount).toBe(0);
      expect(stats.achievementCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle duplicate username', async () => {
      await db.createUser({
        username: 'duplicate',
        email: 'first@example.com',
        displayName: 'First User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      await expect(db.createUser({
        username: 'duplicate',
        email: 'second@example.com',
        displayName: 'Second User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      })).rejects.toThrow();
    });

    test('should handle duplicate email', async () => {
      await db.createUser({
        username: 'user1',
        email: 'duplicate@example.com',
        displayName: 'First User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      await expect(db.createUser({
        username: 'user2',
        email: 'duplicate@example.com',
        displayName: 'Second User',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      })).rejects.toThrow();
    });

    test('should handle invalid user ID', async () => {
      const user = await db.getUser('invalid-id');
      expect(user).toBeNull();
    });

    test('should handle invalid activity ID', async () => {
      const activity = await db.getActivity('invalid-id');
      expect(activity).toBeNull();
    });

    test('should handle invalid backup path', async () => {
      await expect(db.restore('/invalid/path/backup.db')).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent user creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(db.createUser({
          username: `concurrent${i}`,
          email: `concurrent${i}@example.com`,
          displayName: `Concurrent User ${i}`,
          totalXp: i * 10,
          level: 1,
          streak: 0,
          longestStreak: 0,
          lastActiveDate: new Date().toISOString()
        }));
      }

      const users = await Promise.all(promises);
      
      expect(users).toHaveLength(10);
      expect(new Set(users.map(u => u.id)).size).toBe(10); // All IDs unique
    });

    test('should handle concurrent activity creation', async () => {
      const user = await db.createUser({
        username: 'activityconcurrent',
        email: 'activityconcurrent@example.com',
        displayName: 'Activity Concurrent',
        totalXp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString()
      });

      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(db.createActivity({
          userId: user.id,
          type: ActivityType.GIT_COMMIT,
          description: `Concurrent commit ${i}`,
          xpEarned: 10,
          timestamp: new Date().toISOString()
        }));
      }

      const activities = await Promise.all(promises);
      
      expect(activities).toHaveLength(10);
      
      // Check final XP is correct
      const updatedUser = await db.getUser(user.id);
      expect(updatedUser?.totalXp).toBe(100);
    });
  });
});
