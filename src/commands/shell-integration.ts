import { Command } from 'commander';
import chalk from 'chalk';
import { shellIntegration } from '../modules/shell-integration.js';

export const shellIntegrationCommand = new Command('shell-integration')
  .description('Manage shell integration for command tracking')
  .alias('shell');

// Install shell integration
shellIntegrationCommand
  .command('install')
  .description('Install shell integration for zsh')
  .option('--no-zshrc', 'Skip adding to .zshrc (manual installation)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Installing DevXP shell integration...'));
      
      // Check if already installed
      const isInstalled = await shellIntegration.isInstalled();
      if (isInstalled) {
        console.log(chalk.yellow('⚠️  Shell integration is already installed'));
        return;
      }
      
      // Set up event listeners
      shellIntegration.on('initialized', (file) => {
        console.log(chalk.green(`✅ Created integration file: ${file}`));
      });
      
      shellIntegration.on('added-to-zshrc', (file) => {
        console.log(chalk.green(`✅ Added to ${file}`));
        console.log(chalk.cyan('🔄 Please restart your shell or run:'));
        console.log(chalk.white('   source ~/.zshrc'));
      });
      
      shellIntegration.on('error', (error) => {
        console.error(chalk.red('❌ Error:'), error);
      });
      
      // Initialize shell integration
      await shellIntegration.initialize();
      
      // Add to .zshrc unless skipped
      if (options.zshrc !== false) {
        const added = await shellIntegration.addToZshrc();
        if (!added) {
          console.log(chalk.yellow('ℹ️  Integration already in .zshrc'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Skipped adding to .zshrc'));
        console.log(chalk.cyan('Add this line to your .zshrc manually:'));
        console.log(chalk.white(`   source "${process.env['HOME']}/.config/devxp/shell-integration.zsh"`));
      }
      
      // Test the integration
      const testResult = await shellIntegration.test();
      if (testResult) {
        console.log(chalk.green('✅ Shell integration test passed'));
      } else {
        console.log(chalk.yellow('⚠️  Could not verify installation (this is normal before restarting shell)'));
      }
      
      console.log(chalk.green('\n✨ Shell integration installed successfully!'));
      console.log(chalk.cyan('\nAvailable commands in your shell:'));
      console.log(chalk.white('  devxp-toggle     - Enable/disable tracking'));
      console.log(chalk.white('  devxp-privacy    - Toggle privacy mode'));
      console.log(chalk.white('  devxp-status     - Check DevXP daemon status'));
      console.log(chalk.white('  devxp-stats      - View your stats'));
      
    } catch (error) {
      console.error(chalk.red('Failed to install shell integration:'), error);
      process.exit(1);
    }
  });

// Uninstall shell integration
shellIntegrationCommand
  .command('uninstall')
  .description('Uninstall shell integration')
  .action(async () => {
    try {
      console.log(chalk.blue('🗑️  Uninstalling DevXP shell integration...'));
      
      // Check if installed
      const isInstalled = await shellIntegration.isInstalled();
      if (!isInstalled) {
        console.log(chalk.yellow('⚠️  Shell integration is not installed'));
        return;
      }
      
      shellIntegration.on('removed-from-zshrc', (file) => {
        console.log(chalk.green(`✅ Removed from ${file}`));
      });
      
      shellIntegration.on('uninstalled', (file) => {
        console.log(chalk.green(`✅ Removed integration file: ${file}`));
      });
      
      await shellIntegration.uninstall();
      
      console.log(chalk.green('✅ Shell integration uninstalled successfully'));
      console.log(chalk.cyan('🔄 Please restart your shell to complete removal'));
      
    } catch (error) {
      console.error(chalk.red('Failed to uninstall shell integration:'), error);
      process.exit(1);
    }
  });

// Check status
shellIntegrationCommand
  .command('status')
  .description('Check shell integration status')
  .action(async () => {
    try {
      const isInstalled = await shellIntegration.isInstalled();
      const config = shellIntegration.getConfig();
      
      console.log(chalk.blue('📊 Shell Integration Status\n'));
      
      if (isInstalled) {
        console.log(chalk.green('✅ Installed'));
        console.log(chalk.white(`📁 Config directory: ${process.env['HOME']}/.config/devxp/`));
        console.log(chalk.white(`📄 Integration file: shell-integration.zsh`));
        
        // Test if it works
        const testResult = await shellIntegration.test();
        if (testResult) {
          console.log(chalk.green('✅ Integration test passed'));
        } else {
          console.log(chalk.yellow('⚠️  Integration test failed (restart shell if just installed)'));
        }
      } else {
        console.log(chalk.red('❌ Not installed'));
        console.log(chalk.cyan('Run `devxp shell-integration install` to set up'));
      }
      
      console.log(chalk.blue('\n⚙️  Configuration:'));
      console.log(chalk.white(`  Debounce time: ${config.debounceMs}ms`));
      console.log(chalk.white(`  Privacy mode: ${config.privacyMode ? 'ON' : 'OFF'}`));
      console.log(chalk.white(`  Productive commands: ${config.productiveCommands.length} configured`));
      console.log(chalk.white(`  Ignored commands: ${config.ignoredCommands.length} configured`));
      
    } catch (error) {
      console.error(chalk.red('Failed to check status:'), error);
      process.exit(1);
    }
  });

// Configure productive commands
shellIntegrationCommand
  .command('config')
  .description('Configure shell integration settings')
  .option('-d, --debounce <ms>', 'Set debounce time in milliseconds', parseInt)
  .option('-p, --show-productive', 'Show productive commands list')
  .option('-i, --show-ignored', 'Show ignored commands list')
  .option('--add-productive <cmd>', 'Add a productive command')
  .option('--remove-productive <cmd>', 'Remove a productive command')
  .option('--add-ignored <cmd>', 'Add an ignored command')
  .option('--remove-ignored <cmd>', 'Remove an ignored command')
  .action(async (options) => {
    try {
      const config = shellIntegration.getConfig();
      
      // Handle debounce setting
      if (options.debounce) {
        shellIntegration.setDebounceTime(options.debounce);
        console.log(chalk.green(`✅ Debounce time set to ${options.debounce}ms`));
      }
      
      // Handle productive commands
      if (options.addProductive) {
        const commands = [...config.productiveCommands, options.addProductive];
        shellIntegration.setProductiveCommands(commands);
        console.log(chalk.green(`✅ Added '${options.addProductive}' to productive commands`));
      }
      
      if (options.removeProductive) {
        const commands = config.productiveCommands.filter(cmd => cmd !== options.removeProductive);
        shellIntegration.setProductiveCommands(commands);
        console.log(chalk.green(`✅ Removed '${options.removeProductive}' from productive commands`));
      }
      
      // Handle ignored commands
      if (options.addIgnored) {
        const commands = [...config.ignoredCommands, options.addIgnored];
        shellIntegration.setIgnoredCommands(commands);
        console.log(chalk.green(`✅ Added '${options.addIgnored}' to ignored commands`));
      }
      
      if (options.removeIgnored) {
        const commands = config.ignoredCommands.filter(cmd => cmd !== options.removeIgnored);
        shellIntegration.setIgnoredCommands(commands);
        console.log(chalk.green(`✅ Removed '${options.removeIgnored}' from ignored commands`));
      }
      
      // Show lists
      if (options.showProductive) {
        console.log(chalk.blue('\n📋 Productive Commands:'));
        config.productiveCommands.forEach((cmd, i) => {
          if (i % 5 === 0 && i > 0) console.log(); // New line every 5 items
          process.stdout.write(chalk.green(`  ${cmd.padEnd(12)}`));
        });
        console.log();
      }
      
      if (options.showIgnored) {
        console.log(chalk.blue('\n🚫 Ignored Commands:'));
        config.ignoredCommands.forEach((cmd, i) => {
          if (i % 5 === 0 && i > 0) console.log(); // New line every 5 items
          process.stdout.write(chalk.yellow(`  ${cmd.padEnd(12)}`));
        });
        console.log();
      }
      
      // If no specific action, show current config
      if (!options.debounce && !options.addProductive && !options.removeProductive && 
          !options.addIgnored && !options.removeIgnored && 
          !options.showProductive && !options.showIgnored) {
        console.log(chalk.blue('⚙️  Current Configuration:'));
        console.log(chalk.white(`  Debounce time: ${config.debounceMs}ms`));
        console.log(chalk.white(`  Productive commands: ${config.productiveCommands.length} configured`));
        console.log(chalk.white(`  Ignored commands: ${config.ignoredCommands.length} configured`));
        console.log(chalk.cyan('\nUse --show-productive or --show-ignored to see command lists'));
      }
      
    } catch (error) {
      console.error(chalk.red('Failed to configure:'), error);
      process.exit(1);
    }
  });

// Privacy mode control
shellIntegrationCommand
  .command('privacy')
  .description('Control privacy mode')
  .argument('[mode]', 'on, off, or status')
  .action(async (mode) => {
    try {
      switch (mode?.toLowerCase()) {
        case 'on':
          shellIntegration.enablePrivacyMode();
          console.log(chalk.green('🔒 Privacy mode enabled'));
          console.log(chalk.yellow('Commands will not be tracked while privacy mode is active'));
          break;
          
        case 'off':
          shellIntegration.disablePrivacyMode();
          console.log(chalk.green('🔓 Privacy mode disabled'));
          console.log(chalk.cyan('Command tracking resumed'));
          break;
          
        case 'status':
        case undefined:
          const isPrivacy = shellIntegration.isPrivacyMode();
          if (isPrivacy) {
            console.log(chalk.yellow('🔒 Privacy mode is ON'));
            console.log(chalk.gray('Commands are not being tracked'));
          } else {
            console.log(chalk.green('🔓 Privacy mode is OFF'));
            console.log(chalk.gray('Commands are being tracked normally'));
          }
          break;
          
        default:
          console.error(chalk.red(`Invalid mode: ${mode}`));
          console.log(chalk.cyan('Use: on, off, or status'));
          process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('Failed to control privacy mode:'), error);
      process.exit(1);
    }
  });

export default shellIntegrationCommand;
