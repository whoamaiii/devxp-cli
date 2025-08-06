/**
 * End-to-end tests for complete DevXP CLI workflows
 */

import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// Helper to run CLI commands
async function runCLI(args: string[], env?: NodeJS.ProcessEnv) {
  const cliPath = path.join(process.cwd(), 'dist', 'index.js');
  const { stdout, stderr } = await execAsync(`node ${cliPath} ${args.join(' ')}`, {
    env: { ...process.env, ...env }
  });
  return { stdout, stderr };
}

test.describe('DevXP CLI Full Workflow', () => {
  let testDir: string;
  let testRepo: string;

  test.beforeEach(async () => {
    // Create test environment
    testDir = path.join(os.tmpdir(), `devxp-e2e-${Date.now()}`);
    testRepo = path.join(testDir, 'test-repo');
    await fs.mkdir(testRepo, { recursive: true });
    
    // Initialize git repository
    await execAsync('git init', { cwd: testRepo });
    await execAsync('git config user.email "test@example.com"', { cwd: testRepo });
    await execAsync('git config user.name "Test User"', { cwd: testRepo });
  });

  test.afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('Complete XP earning workflow', async () => {
    // Step 1: Initialize DevXP
    const initResult = await runCLI(['init'], {
      HOME: testDir,
      PWD: testRepo
    });
    expect(initResult.stdout).toContain('DevXP initialized');

    // Step 2: Create a user
    const userResult = await runCLI([
      'user', 'create',
      '--username', 'testuser',
      '--email', 'test@example.com',
      '--name', 'Test User'
    ], {
      HOME: testDir
    });
    expect(userResult.stdout).toContain('User created');

    // Step 3: Install git hooks
    const hooksResult = await runCLI(['hooks', 'install'], {
      HOME: testDir,
      PWD: testRepo
    });
    expect(hooksResult.stdout).toContain('Git hooks installed');

    // Step 4: Make a commit to earn XP
    await fs.writeFile(path.join(testRepo, 'test.txt'), 'Hello World');
    await execAsync('git add .', { cwd: testRepo });
    await execAsync('git commit -m "feat: Initial commit"', { cwd: testRepo });

    // Step 5: Check XP status
    const statusResult = await runCLI(['status'], {
      HOME: testDir
    });
    expect(statusResult.stdout).toContain('Level:');
    expect(statusResult.stdout).toContain('Total XP:');
    expect(statusResult.stdout).toMatch(/Total XP:\s*\d+/);

    // Step 6: View activities
    const activitiesResult = await runCLI(['activities', '--limit', '5'], {
      HOME: testDir
    });
    expect(activitiesResult.stdout).toContain('Recent Activities');

    // Step 7: Check leaderboard
    const leaderboardResult = await runCLI(['leaderboard'], {
      HOME: testDir
    });
    expect(leaderboardResult.stdout).toContain('Leaderboard');
    expect(leaderboardResult.stdout).toContain('testuser');
  });

  test('Shell integration workflow', async () => {
    // Step 1: Install shell integration
    const installResult = await runCLI(['shell-integration', 'install', '--no-zshrc'], {
      HOME: testDir
    });
    expect(installResult.stdout).toContain('Shell integration installed');

    // Step 2: Check status
    const statusResult = await runCLI(['shell-integration', 'status'], {
      HOME: testDir
    });
    expect(statusResult.stdout).toContain('Installed');

    // Step 3: Configure shell integration
    const configResult = await runCLI([
      'shell-integration', 'config',
      '--privacy', 'true',
      '--debounce', '2000'
    ], {
      HOME: testDir
    });
    expect(configResult.stdout).toContain('Configuration updated');

    // Step 4: Verify configuration
    const verifyResult = await runCLI(['shell-integration', 'status', '--json'], {
      HOME: testDir
    });
    const config = JSON.parse(verifyResult.stdout);
    expect(config.config.privacyMode).toBe(true);
    expect(config.config.debounceMs).toBe(2000);

    // Step 5: Uninstall
    const uninstallResult = await runCLI(['shell-integration', 'uninstall', '--no-zshrc'], {
      HOME: testDir
    });
    expect(uninstallResult.stdout).toContain('Shell integration uninstalled');
  });

  test('Achievement and challenge workflow', async () => {
    // Initialize and create user
    await runCLI(['init'], { HOME: testDir, PWD: testRepo });
    await runCLI([
      'user', 'create',
      '--username', 'achiever',
      '--email', 'achiever@example.com',
      '--name', 'Achiever'
    ], { HOME: testDir });

    // Install git hooks
    await runCLI(['hooks', 'install'], {
      HOME: testDir,
      PWD: testRepo
    });

    // Make multiple commits to trigger achievements
    for (let i = 1; i <= 5; i++) {
      await fs.writeFile(path.join(testRepo, `file${i}.txt`), `Content ${i}`);
      await execAsync('git add .', { cwd: testRepo });
      await execAsync(`git commit -m "feat: Commit ${i}"`, { cwd: testRepo });
    }

    // Check achievements
    const achievementsResult = await runCLI(['achievements'], {
      HOME: testDir
    });
    expect(achievementsResult.stdout).toContain('Achievements');

    // Check challenges
    const challengesResult = await runCLI(['challenges'], {
      HOME: testDir
    });
    expect(challengesResult.stdout).toContain('Active Challenges');
  });

  test('Data export and import workflow', async () => {
    // Initialize and create user
    await runCLI(['init'], { HOME: testDir, PWD: testRepo });
    await runCLI([
      'user', 'create',
      '--username', 'exporter',
      '--email', 'export@example.com',
      '--name', 'Exporter'
    ], { HOME: testDir });

    // Generate some activity
    await runCLI(['hooks', 'install'], { HOME: testDir, PWD: testRepo });
    await fs.writeFile(path.join(testRepo, 'export-test.txt'), 'Export test');
    await execAsync('git add .', { cwd: testRepo });
    await execAsync('git commit -m "test: Export test"', { cwd: testRepo });

    // Export data
    const exportResult = await runCLI(['export', '--output', path.join(testDir, 'export.json')], {
      HOME: testDir
    });
    expect(exportResult.stdout).toContain('Data exported');

    // Verify export file exists
    const exportFile = path.join(testDir, 'export.json');
    const exportExists = await fs.access(exportFile).then(() => true).catch(() => false);
    expect(exportExists).toBe(true);

    // Read and verify export content
    const exportData = JSON.parse(await fs.readFile(exportFile, 'utf-8'));
    expect(exportData.users).toBeDefined();
    expect(exportData.activities).toBeDefined();
    expect(exportData.users[0].username).toBe('exporter');

    // Reset database
    await runCLI(['reset', '--force'], { HOME: testDir });

    // Import data
    const importResult = await runCLI(['import', exportFile], {
      HOME: testDir
    });
    expect(importResult.stdout).toContain('Data imported');

    // Verify imported data
    const statusResult = await runCLI(['status'], { HOME: testDir });
    expect(statusResult.stdout).toContain('exporter');
  });

  test('Performance monitoring workflow', async () => {
    // Initialize
    await runCLI(['init'], { HOME: testDir, PWD: testRepo });
    await runCLI([
      'user', 'create',
      '--username', 'performer',
      '--email', 'perf@example.com',
      '--name', 'Performer'
    ], { HOME: testDir });

    // Install hooks
    await runCLI(['hooks', 'install'], { HOME: testDir, PWD: testRepo });

    // Generate heavy activity
    const startTime = Date.now();
    
    // Make multiple commits quickly
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push((async () => {
        const fileName = `perf-file-${i}.txt`;
        await fs.writeFile(path.join(testRepo, fileName), `Performance test ${i}`);
        await execAsync(`git add ${fileName}`, { cwd: testRepo });
        await execAsync(`git commit -m "perf: Test commit ${i}"`, { cwd: testRepo });
      })());
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Check that operations completed in reasonable time
    expect(duration).toBeLessThan(30000); // 30 seconds max

    // Generate XP report
    const reportResult = await runCLI(['report', '--days', '1'], {
      HOME: testDir
    });
    expect(reportResult.stdout).toContain('Git Activity XP Report');
    expect(reportResult.stdout).toContain('Total Commits: 10');
  });

  test('Error recovery workflow', async () => {
    // Test handling of various error conditions
    
    // 1. Try to use commands before initialization
    const uninitResult = await runCLI(['status'], {
      HOME: testDir
    }).catch(err => err);
    expect(uninitResult.stderr || uninitResult.stdout).toContain('not initialized');

    // 2. Initialize
    await runCLI(['init'], { HOME: testDir, PWD: testRepo });

    // 3. Try to create duplicate user
    await runCLI([
      'user', 'create',
      '--username', 'duplicate',
      '--email', 'dup@example.com',
      '--name', 'Duplicate'
    ], { HOME: testDir });

    const dupResult = await runCLI([
      'user', 'create',
      '--username', 'duplicate',
      '--email', 'dup2@example.com',
      '--name', 'Duplicate 2'
    ], { HOME: testDir }).catch(err => err);
    expect(dupResult.stderr || dupResult.stdout).toContain('already exists');

    // 4. Test backup and restore
    await runCLI(['hooks', 'install'], { HOME: testDir, PWD: testRepo });
    
    // Make some commits
    await fs.writeFile(path.join(testRepo, 'backup-test.txt'), 'Backup test');
    await execAsync('git add .', { cwd: testRepo });
    await execAsync('git commit -m "test: Backup test"', { cwd: testRepo });

    // Create backup
    const backupResult = await runCLI(['backup'], { HOME: testDir });
    expect(backupResult.stdout).toContain('Backup created');

    // Corrupt something (simulate data loss)
    await runCLI(['reset', '--force'], { HOME: testDir });

    // Restore from backup
    const restoreResult = await runCLI(['restore', '--latest'], { HOME: testDir });
    expect(restoreResult.stdout).toContain('Data restored');

    // Verify restoration
    const statusResult = await runCLI(['status'], { HOME: testDir });
    expect(statusResult.stdout).toContain('duplicate');
  });

  test('Multi-user workflow', async () => {
    // Initialize
    await runCLI(['init'], { HOME: testDir, PWD: testRepo });

    // Create multiple users
    const users = [
      { username: 'alice', email: 'alice@example.com', name: 'Alice' },
      { username: 'bob', email: 'bob@example.com', name: 'Bob' },
      { username: 'charlie', email: 'charlie@example.com', name: 'Charlie' }
    ];

    for (const user of users) {
      await runCLI([
        'user', 'create',
        '--username', user.username,
        '--email', user.email,
        '--name', user.name
      ], { HOME: testDir });
    }

    // Install hooks
    await runCLI(['hooks', 'install'], { HOME: testDir, PWD: testRepo });

    // Simulate activity for different users
    for (const user of users) {
      // Switch user context
      await execAsync(`git config user.email "${user.email}"`, { cwd: testRepo });
      await execAsync(`git config user.name "${user.name}"`, { cwd: testRepo });
      
      // Make commits
      for (let i = 1; i <= 3; i++) {
        const fileName = `${user.username}-file-${i}.txt`;
        await fs.writeFile(path.join(testRepo, fileName), `${user.name}'s file ${i}`);
        await execAsync(`git add ${fileName}`, { cwd: testRepo });
        await execAsync(`git commit -m "feat: ${user.name} commit ${i}"`, { cwd: testRepo });
      }
    }

    // Check leaderboard
    const leaderboardResult = await runCLI(['leaderboard', '--limit', '5'], {
      HOME: testDir
    });
    expect(leaderboardResult.stdout).toContain('alice');
    expect(leaderboardResult.stdout).toContain('bob');
    expect(leaderboardResult.stdout).toContain('charlie');

    // Check weekly leaderboard
    const weeklyResult = await runCLI(['leaderboard', '--weekly'], {
      HOME: testDir
    });
    expect(weeklyResult.stdout).toContain('Weekly Leaderboard');
  });
});
