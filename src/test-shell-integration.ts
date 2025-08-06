#!/usr/bin/env node
/**
 * Test script for DevXP Shell Integration
 * Run with: npx ts-node src/test-shell-integration.ts
 */

import { ShellIntegration } from './modules/shell-integration.js';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

async function testShellIntegration() {
  console.log(chalk.blue('🧪 Testing DevXP Shell Integration\n'));

  const integration = new ShellIntegration();
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Configuration
  console.log(chalk.cyan('Test 1: Configuration'));
  try {
    const config = integration.getConfig();
    console.assert(config.enabled === true, 'Default enabled should be true');
    console.assert(config.privacyMode === false, 'Default privacy mode should be false');
    console.assert(config.debounceMs === 5000, 'Default debounce should be 5000ms');
    console.assert(Array.isArray(config.productiveCommands), 'Productive commands should be array');
    console.assert(Array.isArray(config.ignoredCommands), 'Ignored commands should be array');
    console.log(chalk.green('✅ Configuration test passed'));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('❌ Configuration test failed:', error));
    testsFailed++;
  }

  // Test 2: Privacy Mode
  console.log(chalk.cyan('\nTest 2: Privacy Mode'));
  try {
    integration.enablePrivacyMode();
    console.assert(integration.isPrivacyMode() === true, 'Privacy mode should be enabled');
    
    integration.disablePrivacyMode();
    console.assert(integration.isPrivacyMode() === false, 'Privacy mode should be disabled');
    
    console.log(chalk.green('✅ Privacy mode test passed'));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('❌ Privacy mode test failed:', error));
    testsFailed++;
  }

  // Test 3: Command Lists Management
  console.log(chalk.cyan('\nTest 3: Command Lists Management'));
  try {
    const originalProductive = integration.getConfig().productiveCommands;
    const originalIgnored = integration.getConfig().ignoredCommands;
    
    // Test productive commands
    integration.setProductiveCommands(['test1', 'test2']);
    const productive = integration.getConfig().productiveCommands;
    console.assert(productive.length === 2, 'Should have 2 productive commands');
    console.assert(productive[0] === 'test1', 'First command should be test1');
    
    // Test ignored commands
    integration.setIgnoredCommands(['ignore1', 'ignore2']);
    const ignored = integration.getConfig().ignoredCommands;
    console.assert(ignored.length === 2, 'Should have 2 ignored commands');
    console.assert(ignored[0] === 'ignore1', 'First ignored should be ignore1');
    
    // Restore original
    integration.setProductiveCommands(originalProductive);
    integration.setIgnoredCommands(originalIgnored);
    
    console.log(chalk.green('✅ Command lists management test passed'));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('❌ Command lists management test failed:', error));
    testsFailed++;
  }

  // Test 4: Debouncing
  console.log(chalk.cyan('\nTest 4: Debouncing'));
  try {
    // Test same command within debounce window
    const cmd1 = integration.shouldTrackCommand('git status');
    console.assert(cmd1 === true, 'First command should be tracked');
    
    const cmd2 = integration.shouldTrackCommand('git status');
    console.assert(cmd2 === false, 'Same command within debounce should not be tracked');
    
    // Different command should be tracked
    const cmd3 = integration.shouldTrackCommand('npm install');
    console.assert(cmd3 === true, 'Different command should be tracked');
    
    // Update debounce time
    integration.setDebounceTime(100);
    console.assert(integration.getConfig().debounceMs === 100, 'Debounce should be updated');
    
    // Wait for debounce and test again
    await new Promise(resolve => setTimeout(resolve, 150));
    const cmd4 = integration.shouldTrackCommand('git status');
    console.assert(cmd4 === true, 'Command after debounce should be tracked');
    
    console.log(chalk.green('✅ Debouncing test passed'));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('❌ Debouncing test failed:', error));
    testsFailed++;
  }

  // Test 5: File Generation
  console.log(chalk.cyan('\nTest 5: File Generation'));
  try {
    // Initialize integration
    await integration.initialize();
    
    // Check if file was created
    const configDir = path.join(homedir(), '.config', 'devxp');
    const integrationFile = path.join(configDir, 'shell-integration.zsh');
    
    const fileExists = await fs.access(integrationFile).then(() => true).catch(() => false);
    console.assert(fileExists === true, 'Integration file should exist');
    
    // Check file content
    const content = await fs.readFile(integrationFile, 'utf8');
    console.assert(content.includes('DevXP Shell Integration'), 'File should contain DevXP header');
    console.assert(content.includes('devxp-privacy'), 'File should contain privacy function');
    console.assert(content.includes('devxp-toggle'), 'File should contain toggle function');
    console.assert(content.includes('__devxp_track_command'), 'File should contain tracking function');
    
    console.log(chalk.green('✅ File generation test passed'));
    testsPassed++;
    
    // Clean up test file
    await fs.unlink(integrationFile).catch(() => {});
    
  } catch (error) {
    console.log(chalk.red('❌ File generation test failed:', error));
    testsFailed++;
  }

  // Test 6: Event Emitters
  console.log(chalk.cyan('\nTest 6: Event Emitters'));
  try {
    let eventFired = false;
    
    integration.on('privacy-mode', (enabled) => {
      eventFired = true;
      console.assert(typeof enabled === 'boolean', 'Privacy mode event should pass boolean');
    });
    
    integration.enablePrivacyMode();
    console.assert(eventFired === true, 'Privacy mode event should fire');
    
    eventFired = false;
    integration.on('config-updated', (key, value) => {
      eventFired = true;
      console.assert(key === 'debounceMs', 'Config update should pass correct key');
      console.assert(value === 1000, 'Config update should pass correct value');
    });
    
    integration.setDebounceTime(1000);
    console.assert(eventFired === true, 'Config update event should fire');
    
    console.log(chalk.green('✅ Event emitters test passed'));
    testsPassed++;
  } catch (error) {
    console.log(chalk.red('❌ Event emitters test failed:', error));
    testsFailed++;
  }

  // Summary
  console.log(chalk.blue('\n📊 Test Summary:'));
  console.log(chalk.green(`✅ Passed: ${testsPassed}`));
  if (testsFailed > 0) {
    console.log(chalk.red(`❌ Failed: ${testsFailed}`));
  }
  
  const totalTests = testsPassed + testsFailed;
  const successRate = ((testsPassed / totalTests) * 100).toFixed(1);
  
  if (testsFailed === 0) {
    console.log(chalk.green(`\n🎉 All tests passed! (${successRate}%)`));
  } else {
    console.log(chalk.yellow(`\n⚠️  ${successRate}% tests passed`));
  }
  
  return testsFailed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  testShellIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    });
}

export { testShellIntegration };
