/**
 * Unit tests for git hooks module
 */

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { GitHooksManager, GitHookType, CommitAnalysis } from './git-hooks';
import { ActivityType } from '../types/Activity';

// Mock modules
jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('./database');

describe('GitHooksManager', () => {
  let manager: GitHooksManager;
  let mockExec: jest.MockedFunction<typeof exec>;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    manager = new GitHooksManager();
    mockExec = exec as jest.MockedFunction<typeof exec>;
    mockFs = fs as jest.Mocked<typeof fs>;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Generation', () => {
    test('should generate post-commit hook script', () => {
      const script = manager['generatePostCommitHook']();
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('DevXP Tracker - Post-commit Hook');
      expect(script).toContain('devxp track git-commit');
      expect(script).toContain('COMMIT_HASH=$(git rev-parse HEAD)');
      expect(script).toContain('FILES_CHANGED=');
      expect(script).toContain('INSERTIONS=');
      expect(script).toContain('DELETIONS=');
      expect(script).toContain('exit 0');
    });

    test('should generate post-merge hook script', () => {
      const script = manager['generatePostMergeHook']();
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('DevXP Tracker - Post-merge Hook');
      expect(script).toContain('devxp track git-merge');
      expect(script).toContain('CURRENT_BRANCH=$(git branch --show-current)');
      expect(script).toContain('exit 0');
    });

    test('should generate post-checkout hook script', () => {
      const script = manager['generatePostCheckoutHook']();
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('DevXP Tracker - Post-checkout Hook');
      expect(script).toContain('IS_BRANCH_CHECKOUT=$3');
      expect(script).toContain('devxp track git-branch-create');
      expect(script).toContain('devxp track git-checkout');
      expect(script).toContain('exit 0');
    });

    test('should generate pre-push hook script', () => {
      const script = manager['generatePrePushHook']();
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('DevXP Tracker - Pre-push Hook');
      expect(script).toContain('devxp track git-push');
      expect(script).toContain('REMOTE=$1');
      expect(script).toContain('COMMIT_COUNT');
      expect(script).toContain('exit 0');
    });

    test('should generate commit-msg hook script', () => {
      const script = manager['generateCommitMsgHook']();
      
      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('DevXP Tracker - Commit-msg Hook');
      expect(script).toContain('devxp analyze-commit-msg');
      expect(script).toContain('COMMIT_MSG_FILE=$1');
      expect(script).toContain('exit 0');
    });
  });

  describe('Hook Installation', () => {
    test('should install hooks in repository', async () => {
      const testRepoPath = '/test/repo';
      const gitDir = path.join(testRepoPath, '.git');
      const hooksDir = path.join(gitDir, 'hooks');

      // Mock file system operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.chmod.mockResolvedValue(undefined);

      await manager.installHooks({ repoPath: testRepoPath });

      // Verify git directory check
      expect(mockFs.access).toHaveBeenCalledWith(gitDir);

      // Verify hooks directory creation
      expect(mockFs.mkdir).toHaveBeenCalledWith(hooksDir, { recursive: true });

      // Verify hooks were written
      const hookTypes = Object.values(GitHookType);
      for (const hookType of hookTypes) {
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          path.join(hooksDir, hookType),
          expect.stringContaining('DevXP Tracker')
        );
      }

      // Verify hooks were made executable
      for (const hookType of hookTypes) {
        expect(mockFs.chmod).toHaveBeenCalledWith(
          path.join(hooksDir, hookType),
          0o755
        );
      }
    });

    test('should preserve existing hooks when installing', async () => {
      const testRepoPath = '/test/repo';
      const hooksDir = path.join(testRepoPath, '.git', 'hooks');
      const existingHook = '#!/bin/bash\necho "Existing hook"';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(existingHook);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.chmod.mockResolvedValue(undefined);

      await manager.installHooks({ 
        repoPath: testRepoPath,
        preserveExisting: true,
        createBackup: true
      });

      // Verify backup was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.backup.'),
        existingHook
      );

      // Verify combined hook was written
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Existing hook')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('DevXP Tracker')
      );
    });

    test('should skip already installed hooks', async () => {
      const testRepoPath = '/test/repo';
      const existingHook = '#!/bin/bash\n# DevXP Tracker Hook\necho "Already installed"';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(existingHook);
      mockFs.writeFile.mockResolvedValue(undefined);

      await manager.installHooks({ 
        repoPath: testRepoPath,
        preserveExisting: true,
        verbose: true
      });

      // Should not write over existing DevXP hooks
      const writeCallsCount = (mockFs.writeFile as jest.Mock).mock.calls.filter(
        call => !call[0].includes('.backup.')
      ).length;
      
      expect(writeCallsCount).toBeLessThan(Object.values(GitHookType).length);
    });

    test('should handle non-git repository', async () => {
      const testRepoPath = '/not/a/repo';
      
      mockFs.access.mockRejectedValue(new Error('Not found'));

      await expect(manager.installHooks({ repoPath: testRepoPath }))
        .rejects.toThrow('Not a git repository');
    });
  });

  describe('Hook Uninstallation', () => {
    test('should uninstall hooks from repository', async () => {
      const testRepoPath = '/test/repo';
      const hooksDir = path.join(testRepoPath, '.git', 'hooks');
      const devxpHook = '#!/bin/bash\n# DevXP Tracker\ndevxp track';

      mockFs.readFile.mockResolvedValue(devxpHook);
      mockFs.unlink.mockResolvedValue(undefined);

      await manager.uninstallHooks(testRepoPath);

      // Verify hooks were removed
      const hookTypes = Object.values(GitHookType);
      for (const hookType of hookTypes) {
        expect(mockFs.unlink).toHaveBeenCalledWith(
          path.join(hooksDir, hookType)
        );
      }
    });

    test('should only remove DevXP part from combined hooks', async () => {
      const testRepoPath = '/test/repo';
      const hooksDir = path.join(testRepoPath, '.git', 'hooks');
      const combinedHook = `#!/bin/bash
echo "Original hook"
# ===== DevXP Tracker Hook Start =====
devxp track git-commit
# ===== DevXP Tracker Hook End =====
echo "More original"`;

      mockFs.readFile.mockResolvedValue(combinedHook);
      mockFs.writeFile.mockResolvedValue(undefined);

      await manager.uninstallHooks(testRepoPath);

      // Verify only DevXP part was removed
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Original hook')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.stringContaining('DevXP Tracker')
      );
    });
  });

  describe('Commit Analysis', () => {
    test('should analyze commit with full details', async () => {
      const mockLogOutput = 'abc123|John Doe|feat: Add new feature\n\nDetailed description';
      const mockStatOutput = '5\t3\tfile1.js\n10\t2\tfile2.ts\n';
      const mockParentCount = '2\n';

      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log')) {
          callback(null, { stdout: mockLogOutput });
        } else if (cmd.includes('git diff-tree')) {
          callback(null, { stdout: mockStatOutput });
        } else if (cmd.includes('git rev-list')) {
          callback(null, { stdout: mockParentCount });
        }
      });

      const analysis = await manager.analyzeCommit('HEAD');

      expect(analysis.hash).toBe('abc123');
      expect(analysis.author).toBe('John Doe');
      expect(analysis.message).toContain('feat: Add new feature');
      expect(analysis.filesChanged).toBe(2);
      expect(analysis.insertions).toBe(15);
      expect(analysis.deletions).toBe(5);
      expect(analysis.isMerge).toBe(false);
      expect(analysis.messageQuality).toBeGreaterThan(0);
      expect(analysis.xpReward).toBeGreaterThan(0);
    });

    test('should detect merge commits', async () => {
      const mockLogOutput = 'def456|Jane Doe|Merge branch feature';
      const mockStatOutput = '';
      const mockParentCount = '3\n'; // More than 2 means merge

      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log')) {
          callback(null, { stdout: mockLogOutput });
        } else if (cmd.includes('git diff-tree')) {
          callback(null, { stdout: mockStatOutput });
        } else if (cmd.includes('git rev-list')) {
          callback(null, { stdout: mockParentCount });
        }
      });

      const analysis = await manager.analyzeCommit('HEAD');

      expect(analysis.isMerge).toBe(true);
      expect(analysis.xpReward).toBe(75); // Default merge XP
    });

    test('should handle analysis errors', async () => {
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        callback(new Error('Git command failed'));
      });

      await expect(manager.analyzeCommit('HEAD'))
        .rejects.toThrow('Failed to analyze commit');
    });
  });

  describe('Message Quality Analysis', () => {
    test('should score conventional commit format highly', () => {
      const message = 'feat(auth): Add OAuth2 integration\n\nImplemented OAuth2 flow for third-party authentication';
      const quality = manager['analyzeMessageQuality'](message);
      
      expect(quality).toBeGreaterThan(60);
    });

    test('should score detailed messages higher', () => {
      const shortMessage = 'Fix bug';
      const detailedMessage = `fix(api): Resolve race condition in user session handling

This commit addresses the race condition that occurred when multiple
requests tried to update the user session simultaneously. The fix
implements a mutex lock to ensure atomic operations.

Fixes #123`;

      const shortQuality = manager['analyzeMessageQuality'](shortMessage);
      const detailedQuality = manager['analyzeMessageQuality'](detailedMessage);
      
      expect(detailedQuality).toBeGreaterThan(shortQuality);
    });

    test('should reward issue references', () => {
      const withIssue = 'fix: Resolve login bug #123';
      const withoutIssue = 'fix: Resolve login bug';
      
      const withIssueQuality = manager['analyzeMessageQuality'](withIssue);
      const withoutIssueQuality = manager['analyzeMessageQuality'](withoutIssue);
      
      expect(withIssueQuality).toBeGreaterThan(withoutIssueQuality);
    });

    test('should check for quality keywords', () => {
      const withKeywords = 'refactor: Improve performance of data processing';
      const withoutKeywords = 'Update stuff';
      
      const withKeywordsQuality = manager['analyzeMessageQuality'](withKeywords);
      const withoutKeywordsQuality = manager['analyzeMessageQuality'](withoutKeywords);
      
      expect(withKeywordsQuality).toBeGreaterThan(withoutKeywordsQuality);
    });
  });

  describe('XP Calculation', () => {
    test('should calculate XP for regular commit', () => {
      const xp = manager['calculateCommitXP']({
        filesChanged: 3,
        insertions: 50,
        deletions: 20,
        messageQuality: 80,
        isMerge: false
      });

      // Base (50) + files (3*5) + insertions (50*1) + deletions (20*0.5) + bonus
      expect(xp).toBeGreaterThan(50);
      expect(xp).toBeLessThanOrEqual(200); // Max cap
    });

    test('should apply message quality bonus', () => {
      const lowQualityXP = manager['calculateCommitXP']({
        filesChanged: 1,
        insertions: 10,
        deletions: 5,
        messageQuality: 30,
        isMerge: false
      });

      const highQualityXP = manager['calculateCommitXP']({
        filesChanged: 1,
        insertions: 10,
        deletions: 5,
        messageQuality: 90,
        isMerge: false
      });

      expect(highQualityXP).toBeGreaterThan(lowQualityXP);
    });

    test('should cap XP at maximum', () => {
      const xp = manager['calculateCommitXP']({
        filesChanged: 100,
        insertions: 1000,
        deletions: 500,
        messageQuality: 100,
        isMerge: false
      });

      expect(xp).toBe(200); // Default max cap
    });

    test('should use fixed XP for merge commits', () => {
      const xp = manager['calculateCommitXP']({
        filesChanged: 10,
        insertions: 100,
        deletions: 50,
        messageQuality: 50,
        isMerge: true
      });

      expect(xp).toBe(75); // Default merge XP
    });
  });

  describe('Git History Analysis', () => {
    test('should analyze git history', async () => {
      const mockHashes = 'hash1\nhash2\nhash3';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log') && cmd.includes('--pretty=format:"%H"')) {
          callback(null, { stdout: mockHashes });
        } else if (cmd.includes('git log -1')) {
          callback(null, { stdout: 'hash|Author|Message' });
        } else if (cmd.includes('git diff-tree')) {
          callback(null, { stdout: '5\t3\tfile.js' });
        } else if (cmd.includes('git rev-list')) {
          callback(null, { stdout: '2' });
        }
      });

      const result = await manager.analyzeGitHistory({ maxCommits: 3 });

      expect(result.commits).toHaveLength(3);
      expect(result.totalXP).toBeGreaterThan(0);
    });

    test('should filter by date range', async () => {
      const mockHashes = 'hash1';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log')) {
          expect(cmd).toContain('--since="7 days ago"');
          expect(cmd).toContain('--until="today"');
          callback(null, { stdout: mockHashes });
        } else {
          callback(null, { stdout: '' });
        }
      });

      await manager.analyzeGitHistory({ 
        since: '7 days ago',
        until: 'today'
      });
    });

    test('should filter by author', async () => {
      const mockHashes = 'hash1';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log')) {
          expect(cmd).toContain('--author="John Doe"');
          callback(null, { stdout: mockHashes });
        } else {
          callback(null, { stdout: '' });
        }
      });

      await manager.analyzeGitHistory({ author: 'John Doe' });
    });
  });

  describe('Installation Check', () => {
    test('should check if hooks are installed', async () => {
      const testRepoPath = '/test/repo';
      const hooksDir = path.join(testRepoPath, '.git', 'hooks');

      // Mock some hooks as installed
      mockFs.readFile.mockImplementation((path: any) => {
        if (path.includes('post-commit')) {
          return Promise.resolve('#!/bin/bash\n# DevXP Tracker');
        }
        return Promise.reject(new Error('Not found'));
      });

      const result = await manager.checkInstallation(testRepoPath);

      expect(result.installed).toBe(true);
      expect(result.hooks[GitHookType.POST_COMMIT]).toBe(true);
      expect(result.hooks[GitHookType.POST_MERGE]).toBe(false);
    });

    test('should detect no hooks installed', async () => {
      const testRepoPath = '/test/repo';
      
      mockFs.readFile.mockRejectedValue(new Error('Not found'));

      const result = await manager.checkInstallation(testRepoPath);

      expect(result.installed).toBe(false);
      Object.values(result.hooks).forEach(installed => {
        expect(installed).toBe(false);
      });
    });
  });

  describe('XP Estimation', () => {
    test('should estimate XP for staged changes', async () => {
      const mockDiffStat = '10\t5\tfile1.js\n20\t10\tfile2.ts\n';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git diff --cached')) {
          callback(null, { stdout: mockDiffStat });
        }
      });

      const result = await manager.estimateCommitXP();

      expect(result.estimatedXP).toBeGreaterThan(0);
      expect(result.breakdown.base).toBe(50); // Default base XP
      expect(result.breakdown.files).toBe(10); // 2 files * 5
      expect(result.breakdown.lines).toBeGreaterThan(0);
      expect(result.breakdown.potential).toBe(25); // Message bonus potential
    });

    test('should handle no staged changes', async () => {
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        callback(null, { stdout: '' });
      });

      const result = await manager.estimateCommitXP();

      expect(result.estimatedXP).toBe(50); // Just base XP
      expect(result.breakdown.files).toBe(0);
      expect(result.breakdown.lines).toBe(0);
    });
  });

  describe('XP Report Generation', () => {
    test('should generate XP report', async () => {
      const mockHashes = 'hash1\nhash2';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log') && cmd.includes('--pretty=format:"%H"')) {
          callback(null, { stdout: mockHashes });
        } else if (cmd.includes('git log -1')) {
          callback(null, { stdout: 'hash|Author|Good commit message' });
        } else if (cmd.includes('git diff-tree')) {
          callback(null, { stdout: '5\t3\tfile.js' });
        } else if (cmd.includes('git rev-list')) {
          callback(null, { stdout: '2' });
        }
      });

      const report = await manager.generateXPReport({ days: 30 });

      expect(report).toContain('Git Activity XP Report');
      expect(report).toContain('Last 30 days');
      expect(report).toContain('Total Commits: 2');
      expect(report).toContain('Total XP Earned:');
      expect(report).toContain('Average XP per Commit:');
      expect(report).toContain('Best Commit:');
    });

    test('should filter report by author', async () => {
      const mockHashes = 'hash1';
      
      (mockExec as any).mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('git log')) {
          callback(null, { stdout: mockHashes });
        } else {
          callback(null, { stdout: 'hash|John Doe|Message' });
        }
      });

      const report = await manager.generateXPReport({ 
        days: 7,
        author: 'John Doe'
      });

      expect(report).toContain('Author: John Doe');
    });
  });

  describe('Configuration', () => {
    test('should export configuration', () => {
      const config = manager.exportConfig();
      
      expect(config.commitBase).toBe(50);
      expect(config.perFileChanged).toBe(5);
      expect(config.perLineAdded).toBe(1);
      expect(config.perLineDeleted).toBe(0.5);
      expect(config.mergeXP).toBe(75);
      expect(config.maxCommitXP).toBe(200);
    });

    test('should import configuration', () => {
      manager.importConfig({
        commitBase: 100,
        maxCommitXP: 500,
        mergeXP: 150
      });

      const config = manager.exportConfig();
      
      expect(config.commitBase).toBe(100);
      expect(config.maxCommitXP).toBe(500);
      expect(config.mergeXP).toBe(150);
    });

    test('should use custom XP rewards', () => {
      const customManager = new GitHooksManager({
        commitBase: 75,
        perFileChanged: 10,
        maxCommitXP: 300
      });

      const config = customManager.exportConfig();
      
      expect(config.commitBase).toBe(75);
      expect(config.perFileChanged).toBe(10);
      expect(config.maxCommitXP).toBe(300);
    });
  });
});
