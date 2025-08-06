/**
 * CLI command tests for shell-integration command
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Path to the CLI executable
const CLI_PATH = path.join(process.cwd(), 'dist', 'index.js');

describe('shell-integration command', () => {
  let originalHome: string;
  let testHome: string;

  beforeEach(async () => {
    // Create a temporary home directory for testing
    testHome = path.join(os.tmpdir(), `devxp-test-${Date.now()}`);
    await fs.mkdir(testHome, { recursive: true });
    
    // Mock the home directory
    originalHome = process.env.HOME || '';
    process.env.HOME = testHome;
  });

  afterEach(async () => {
    // Restore original home
    process.env.HOME = originalHome;
    
    // Clean up test directory
    try {
      await fs.rm(testHome, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('install subcommand', () => {
    test('should display help for install command', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'install', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot('shell-integration-install-help');
      expect(result.stdout).toContain('Install shell integration');
      expect(result.stdout).toContain('--no-zshrc');
    });

    test('should install shell integration files', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Shell integration installed');
      
      // Check if integration file was created
      const integrationFile = path.join(testHome, '.config', 'devxp', 'shell-integration.zsh');
      const fileExists = await fs.access(integrationFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should handle existing installation gracefully', async () => {
      // First installation
      await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      // Second installation
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Shell integration');
    });
  });

  describe('uninstall subcommand', () => {
    test('should display help for uninstall command', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'uninstall', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot('shell-integration-uninstall-help');
      expect(result.stdout).toContain('Uninstall shell integration');
    });

    test('should uninstall shell integration', async () => {
      // First install
      await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      // Then uninstall
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'uninstall', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Shell integration uninstalled');
      
      // Check if integration file was removed
      const integrationFile = path.join(testHome, '.config', 'devxp', 'shell-integration.zsh');
      const fileExists = await fs.access(integrationFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });
  });

  describe('status subcommand', () => {
    test('should display help for status command', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'status', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot('shell-integration-status-help');
      expect(result.stdout).toContain('Check shell integration status');
    });

    test('should show not installed status', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'status'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Not installed');
    });

    test('should show installed status', async () => {
      // First install
      await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      // Check status
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'status'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Installed');
      expect(result.stdout).toMatchSnapshot('shell-integration-status-installed');
    });
  });

  describe('config subcommand', () => {
    test('should display help for config command', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'config', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot('shell-integration-config-help');
      expect(result.stdout).toContain('Configure shell integration');
    });

    test('should update configuration', async () => {
      // First install
      await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      // Update config
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'config', 
        '--privacy', 'true',
        '--debounce', '3000',
        '--ignored', 'ls,cd,pwd'
      ], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration updated');
      expect(result.stdout).toMatchSnapshot('shell-integration-config-update');
    });
  });

  describe('error handling', () => {
    test('should handle invalid subcommand', async () => {
      try {
        await execa('node', [CLI_PATH, 'shell-integration', 'invalid']);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.exitCode).not.toBe(0);
        expect(error.stderr).toContain('error');
      }
    });

    test('should handle missing CLI file gracefully', async () => {
      try {
        await execa('node', ['/nonexistent/cli.js', 'shell-integration']);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.exitCode).not.toBe(0);
      }
    });
  });

  describe('JSON output', () => {
    test('should output JSON for status when requested', async () => {
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'status', '--json'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json).toHaveProperty('installed');
      expect(json).toHaveProperty('config');
    });

    test('should output JSON for config when requested', async () => {
      // First install
      await execa('node', [CLI_PATH, 'shell-integration', 'install', '--no-zshrc'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      const result = await execa('node', [CLI_PATH, 'shell-integration', 'config', '--json'], {
        env: {
          ...process.env,
          HOME: testHome
        }
      });
      
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json).toHaveProperty('enabled');
      expect(json).toHaveProperty('privacyMode');
      expect(json).toHaveProperty('debounceMs');
      expect(json).toHaveProperty('ignoredCommands');
    });
  });
});
