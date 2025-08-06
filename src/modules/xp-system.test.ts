/**
 * Unit tests for XP calculation and level progression
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  XPSystem,
  XPSystemConfig,
  Challenge,
  xpSystem,
  calculateXP,
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getXPToNextLevel,
  getLevelProgress,
  getLevelTitle
} from './xp-system';
import { ActivityType } from '../types/Activity';
import { XPCalculationRequest, XPMultiplierType } from '../types/XPEvent';
import { User } from '../types/User';

describe('XPSystem', () => {
  let system: XPSystem;
  let mockUser: User;

  beforeEach(() => {
    system = new XPSystem();
    mockUser = {
      id: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
      level: 10,
      totalXP: 5000,
      currentXP: 500,
      streakDays: 5,
      isPremium: false,
      achievements: [],
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
  });

  describe('XP Calculation', () => {
    test('should calculate base XP correctly', () => {
      const request: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      
      expect(result.baseXP).toBe(50); // Default base XP for GIT_COMMIT
      expect(result.finalXP).toBeGreaterThan(0);
      expect(result.multipliers).toBeDefined();
      expect(result.breakdown).toHaveLength(2); // Base XP + Final XP
    });

    test('should apply difficulty multipliers', () => {
      const easyRequest: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: { difficulty: 'easy' },
        timestamp: new Date()
      };

      const hardRequest: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: { difficulty: 'hard' },
        timestamp: new Date()
      };

      const easyResult = system.calculateXP(easyRequest);
      const hardResult = system.calculateXP(hardRequest);

      expect(hardResult.finalXP).toBeGreaterThan(easyResult.finalXP);
      expect(hardResult.multipliers.find(m => m.type === XPMultiplierType.DIFFICULTY)?.value).toBe(1.5);
      expect(easyResult.multipliers.find(m => m.type === XPMultiplierType.DIFFICULTY)?.value).toBe(0.75);
    });

    test('should apply streak multipliers', () => {
      const userWithStreak = { ...mockUser, streakDays: 10 };
      const request: XPCalculationRequest = {
        user: userWithStreak,
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const streakMultiplier = result.multipliers.find(m => m.type === XPMultiplierType.STREAK);
      
      expect(streakMultiplier).toBeDefined();
      expect(streakMultiplier?.value).toBeGreaterThan(1);
      expect(streakMultiplier?.description).toContain('10 day streak');
    });

    test('should apply first-time bonus', () => {
      const request: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: { isFirstTime: true },
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const firstTimeMultiplier = result.multipliers.find(m => m.type === XPMultiplierType.FIRST_TIME);
      
      expect(firstTimeMultiplier).toBeDefined();
      expect(firstTimeMultiplier?.value).toBe(1.5);
    });

    test('should apply weekend bonus', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      const request: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: { timeOfDay: saturday },
        timestamp: saturday
      };

      const result = system.calculateXP(request);
      const weekendMultiplier = result.multipliers.find(m => m.type === XPMultiplierType.WEEKEND);
      
      expect(weekendMultiplier).toBeDefined();
      expect(weekendMultiplier?.value).toBe(1.25);
    });

    test('should apply premium bonus', () => {
      const premiumUser = { ...mockUser, isPremium: true };
      const request: XPCalculationRequest = {
        user: premiumUser,
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const premiumMultiplier = result.multipliers.find(m => m.type === XPMultiplierType.PREMIUM);
      
      expect(premiumMultiplier).toBeDefined();
      expect(premiumMultiplier?.value).toBe(1.2);
    });

    test('should cap multipliers at maximum', () => {
      const request: XPCalculationRequest = {
        user: { ...mockUser, streakDays: 100, isPremium: true },
        activityType: ActivityType.GIT_COMMIT,
        context: { 
          difficulty: 'expert',
          isFirstTime: true,
          timeOfDay: new Date('2024-01-06') // Weekend
        },
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      
      expect(result.totalMultiplier).toBeLessThanOrEqual(5.0); // Default max cap
      expect(result.warnings).toContain('Multiplier capped at maximum 5x');
    });

    test('should apply quality score multiplier', () => {
      const request: XPCalculationRequest = {
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: { quality: 80 },
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const qualityMultiplier = result.multipliers.find(m => m.description?.includes('Quality score'));
      
      expect(qualityMultiplier).toBeDefined();
      expect(qualityMultiplier?.value).toBeCloseTo(1.3, 1); // 0.5 + (80/100) = 1.3
    });

    test('should detect level up', () => {
      const userNearLevelUp = { ...mockUser, level: 10, totalXP: 9900 };
      const request: XPCalculationRequest = {
        user: userNearLevelUp,
        activityType: ActivityType.DEPLOY_PRODUCTION,
        baseXP: 300,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      
      expect(result.wouldLevelUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(userNearLevelUp.level);
    });
  });

  describe('Level Progression', () => {
    test('should calculate XP for level correctly (exponential)', () => {
      const level1XP = system.calculateXPForLevel(1);
      const level10XP = system.calculateXPForLevel(10);
      const level20XP = system.calculateXPForLevel(20);

      expect(level1XP).toBe(100); // Base requirement
      expect(level10XP).toBeGreaterThan(level1XP);
      expect(level20XP).toBeGreaterThan(level10XP);
      
      // Exponential growth check
      const ratio = level10XP / level1XP;
      expect(ratio).toBeGreaterThan(1);
    });

    test('should calculate total XP for level', () => {
      const totalForLevel5 = system.calculateTotalXPForLevel(5);
      const totalForLevel10 = system.calculateTotalXPForLevel(10);

      expect(totalForLevel10).toBeGreaterThan(totalForLevel5);
      
      // Should be sum of all levels up to that point
      let manualSum = 0;
      for (let i = 1; i <= 5; i++) {
        manualSum += system.calculateXPForLevel(i);
      }
      expect(totalForLevel5).toBe(manualSum);
    });

    test('should calculate level from XP', () => {
      const level = system.calculateLevelFromXP(5000);
      expect(level).toBeGreaterThan(1);
      expect(level).toBeLessThanOrEqual(100); // Max level

      // Edge cases
      expect(system.calculateLevelFromXP(0)).toBe(1);
      expect(system.calculateLevelFromXP(99999999)).toBe(100);
    });

    test('should calculate XP to next level', () => {
      const xpNeeded = system.calculateXPToNextLevel(10, 5000);
      expect(xpNeeded).toBeGreaterThan(0);

      // At exact level threshold
      const totalForLevel10 = system.calculateTotalXPForLevel(10);
      const xpAtThreshold = system.calculateXPToNextLevel(10, totalForLevel10);
      const expectedXP = system.calculateXPForLevel(11);
      expect(xpAtThreshold).toBe(expectedXP);
    });

    test('should calculate level progress percentage', () => {
      const progress = system.getLevelProgress(10, 5000);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);

      // At level threshold
      const totalForLevel10 = system.calculateTotalXPForLevel(10);
      const progressAtStart = system.getLevelProgress(10, totalForLevel10);
      expect(progressAtStart).toBe(0);
    });

    test('should handle fibonacci progression', () => {
      const fibSystem = new XPSystem({ progressionType: 'fibonacci' });
      
      const level1 = fibSystem.calculateXPForLevel(1);
      const level2 = fibSystem.calculateXPForLevel(2);
      const level3 = fibSystem.calculateXPForLevel(3);
      const level4 = fibSystem.calculateXPForLevel(4);
      const level5 = fibSystem.calculateXPForLevel(5);

      expect(level1).toBe(100); // Base
      expect(level2).toBe(200); // Base * 2
      expect(level3).toBe(level1 + level2);
      expect(level4).toBe(level2 + level3);
      expect(level5).toBe(level3 + level4);
    });

    test('should handle linear progression', () => {
      const linearSystem = new XPSystem({ progressionType: 'linear' });
      
      const level1 = linearSystem.calculateXPForLevel(1);
      const level5 = linearSystem.calculateXPForLevel(5);
      const level10 = linearSystem.calculateXPForLevel(10);

      expect(level5).toBe(level1 * 5);
      expect(level10).toBe(level1 * 10);
    });

    test('should handle custom progression formula', () => {
      const customFormula = (level: number) => level * level * 50;
      const customSystem = new XPSystem({ 
        progressionType: 'custom',
        customProgressionFormula: customFormula
      });
      
      expect(customSystem.calculateXPForLevel(2)).toBe(200);
      expect(customSystem.calculateXPForLevel(3)).toBe(450);
      expect(customSystem.calculateXPForLevel(4)).toBe(800);
    });
  });

  describe('Level Titles', () => {
    test('should return correct titles for level ranges', () => {
      expect(system.getLevelTitle(1)).toBe('Novice Developer');
      expect(system.getLevelTitle(15)).toBe('Junior Developer');
      expect(system.getLevelTitle(25)).toBe('Developer');
      expect(system.getLevelTitle(35)).toBe('Senior Developer');
      expect(system.getLevelTitle(45)).toBe('Lead Developer');
      expect(system.getLevelTitle(55)).toBe('Principal Developer');
      expect(system.getLevelTitle(65)).toBe('Architect');
      expect(system.getLevelTitle(75)).toBe('Senior Architect');
      expect(system.getLevelTitle(85)).toBe('Master Developer');
      expect(system.getLevelTitle(95)).toBe('Legendary Developer');
    });
  });

  describe('Challenges', () => {
    test('should create daily challenge', () => {
      const challenge = system.createDailyChallenge('user-123');
      
      expect(challenge.type).toBe('daily');
      expect(challenge.id).toContain('daily_');
      expect(challenge.requiredCount).toBeGreaterThanOrEqual(3);
      expect(challenge.requiredCount).toBeLessThanOrEqual(7);
      expect(challenge.reward).toBe(100); // Default daily reward
      expect(challenge.isCompleted).toBe(false);
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should create weekly challenge', () => {
      const challenge = system.createWeeklyChallenge('user-123');
      
      expect(challenge.type).toBe('weekly');
      expect(challenge.id).toContain('weekly_');
      expect(challenge.reward).toBe(500); // Default weekly reward
      expect(challenge.isCompleted).toBe(false);
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(challenge.expiresAt.getDay()).toBe(0); // Sunday
    });

    test('should update challenge progress', () => {
      const userId = 'user-123';
      const challenge = system.createDailyChallenge(userId);
      const activityType = challenge.requiredActivity!;

      // Progress should increase
      system.updateChallengeProgress(userId, activityType);
      const activeChallenges = system.getActiveChallenges(userId);
      const updatedChallenge = activeChallenges.find(c => c.id === challenge.id);
      
      expect(updatedChallenge?.currentProgress).toBe(1);
      
      // Complete the challenge
      for (let i = 1; i < challenge.requiredCount; i++) {
        system.updateChallengeProgress(userId, activityType);
      }
      
      const completedChallenges = system.getActiveChallenges(userId);
      const completed = completedChallenges.find(c => c.id === challenge.id);
      
      expect(completed?.isCompleted).toBe(true);
      expect(completed?.completedAt).toBeDefined();
    });

    test('should filter expired challenges', () => {
      const userId = 'user-123';
      const challenge = system.createDailyChallenge(userId);
      
      // Manually expire the challenge
      challenge.expiresAt = new Date(Date.now() - 1000);
      
      const activeChallenges = system.getActiveChallenges(userId);
      expect(activeChallenges).not.toContain(challenge);
    });

    test('should calculate daily challenge bonus', () => {
      const userId = 'user-123';
      
      // Create and complete all daily challenges
      for (let i = 0; i < 3; i++) {
        const challenge = system.createDailyChallenge(userId);
        challenge.isCompleted = true;
      }
      
      const bonus = system.calculateDailyChallengeBonus(userId);
      expect(bonus).toBe(200); // Default daily completion bonus
    });

    test('should calculate weekly challenge bonus', () => {
      const userId = 'user-123';
      
      // Create and complete all weekly challenges
      for (let i = 0; i < 2; i++) {
        const challenge = system.createWeeklyChallenge(userId);
        challenge.isCompleted = true;
      }
      
      const bonus = system.calculateWeeklyChallengeBonus(userId);
      expect(bonus).toBe(1000); // Default weekly completion bonus
    });
  });

  describe('Multipliers', () => {
    test('should add and retrieve user multipliers', () => {
      const userId = 'user-123';
      const multiplier = {
        type: XPMultiplierType.CUSTOM,
        value: 1.5,
        description: 'Test multiplier',
        isActive: true
      };

      system.addUserMultiplier(userId, multiplier);
      
      const request: XPCalculationRequest = {
        user: { ...mockUser, id: userId },
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const customMultiplier = result.multipliers.find(m => m.description === 'Test multiplier');
      
      expect(customMultiplier).toBeDefined();
      expect(customMultiplier?.value).toBe(1.5);
    });

    test('should cleanup expired multipliers', () => {
      const userId = 'user-123';
      const expiredMultiplier = {
        type: XPMultiplierType.CUSTOM,
        value: 2.0,
        description: 'Expired multiplier',
        isActive: true,
        expiresAt: new Date(Date.now() - 1000)
      };

      system.addUserMultiplier(userId, expiredMultiplier);
      system.cleanupExpiredMultipliers(userId);
      
      const request: XPCalculationRequest = {
        user: { ...mockUser, id: userId },
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const expired = result.multipliers.find(m => m.description === 'Expired multiplier');
      
      expect(expired).toBeUndefined();
    });
  });

  describe('Streaks', () => {
    test('should update user streak', () => {
      const userId = 'user-123';
      system.updateUserStreak(userId, 7);
      
      // Verify streak milestone bonus is triggered
      const eventSpy = jest.fn();
      system.on('milestone-reached', eventSpy);
      system.updateUserStreak(userId, 7);
      
      expect(eventSpy).toHaveBeenCalledWith(userId, '7 day streak', 500);
    });

    test('should calculate streak multiplier with cap', () => {
      const userWithLongStreak = { ...mockUser, streakDays: 100 };
      const request: XPCalculationRequest = {
        user: userWithLongStreak,
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      };

      const result = system.calculateXP(request);
      const streakMultiplier = result.multipliers.find(m => m.type === XPMultiplierType.STREAK);
      
      expect(streakMultiplier?.value).toBeLessThanOrEqual(2.0); // Default max streak multiplier
    });
  });

  describe('Events', () => {
    test('should emit xp-gained event', () => {
      const eventSpy = jest.fn();
      system.on('xp-gained', eventSpy);

      system.emitXPGain({
        id: 'event-1',
        userId: 'user-123',
        points: 100,
        source: 'test',
        activityType: ActivityType.GIT_COMMIT,
        timestamp: new Date().toISOString()
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    test('should emit level-up event', () => {
      const eventSpy = jest.fn();
      system.on('level-up', eventSpy);

      system.emitXPGain({
        id: 'event-1',
        userId: 'user-123',
        points: 1000,
        source: 'test',
        activityType: ActivityType.GIT_COMMIT,
        timestamp: new Date().toISOString(),
        triggeredLevelUp: true,
        previousLevel: 10,
        newLevel: 11
      });

      expect(eventSpy).toHaveBeenCalledWith('user-123', 10, 11, 1000);
    });

    test('should emit challenge-completed event', () => {
      const eventSpy = jest.fn();
      system.on('challenge-completed', eventSpy);

      const userId = 'user-123';
      const challenge = system.createDailyChallenge(userId);
      
      // Complete the challenge
      for (let i = 0; i < challenge.requiredCount; i++) {
        system.updateChallengeProgress(userId, challenge.requiredActivity!);
      }

      expect(eventSpy).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ id: challenge.id }),
        challenge.reward
      );
    });
  });

  describe('Helper Functions', () => {
    test('calculateXP function should work', () => {
      const result = calculateXP({
        user: mockUser,
        activityType: ActivityType.GIT_COMMIT,
        context: {},
        timestamp: new Date()
      });
      
      expect(result.finalXP).toBeGreaterThan(0);
    });

    test('getXPForLevel function should work', () => {
      expect(getXPForLevel(1)).toBe(100);
      expect(getXPForLevel(10)).toBeGreaterThan(100);
    });

    test('getTotalXPForLevel function should work', () => {
      expect(getTotalXPForLevel(1)).toBe(100);
      expect(getTotalXPForLevel(5)).toBeGreaterThan(500);
    });

    test('getLevelFromXP function should work', () => {
      expect(getLevelFromXP(0)).toBe(1);
      expect(getLevelFromXP(5000)).toBeGreaterThan(1);
    });

    test('getXPToNextLevel function should work', () => {
      expect(getXPToNextLevel(1, 50)).toBeGreaterThan(0);
      expect(getXPToNextLevel(10, 5000)).toBeGreaterThan(0);
    });

    test('getLevelProgress function should work', () => {
      expect(getLevelProgress(1, 50)).toBeGreaterThanOrEqual(0);
      expect(getLevelProgress(1, 50)).toBeLessThanOrEqual(100);
    });

    test('getLevelTitle function should work', () => {
      expect(getLevelTitle(1)).toBe('Novice Developer');
      expect(getLevelTitle(50)).toBe('Lead Developer');
    });
  });

  describe('Configuration', () => {
    test('should export configuration', () => {
      const config = system.exportConfig();
      
      expect(config.baseXPValues).toBeDefined();
      expect(config.progressionType).toBeDefined();
      expect(config.maxLevel).toBe(100);
      expect(config.streakConfig).toBeDefined();
      expect(config.challengeConfig).toBeDefined();
    });

    test('should import configuration', () => {
      const newConfig: Partial<XPSystemConfig> = {
        maxLevel: 50,
        baseXPRequirement: 200,
        progressionType: 'linear'
      };

      system.importConfig(newConfig);
      const exported = system.exportConfig();
      
      expect(exported.maxLevel).toBe(50);
      expect(exported.baseXPRequirement).toBe(200);
      expect(exported.progressionType).toBe('linear');
    });
  });
});
