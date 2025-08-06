#!/usr/bin/env node

/**
 * Example CLI implementation showcasing the installed dependencies
 * This demonstrates how to use each package in a real CLI application
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import Database from 'better-sqlite3';
import Conf from 'conf';
import { promisify } from 'util';

const figletAsync = promisify(figlet);

// Initialize configuration store
const config = new Conf({ projectName: 'devxp-cli' });

// Initialize SQLite database for local data storage
const initDatabase = () => {
  const db = new Database('devxp.db');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS commands_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT,
      duration_ms INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
};

// Create the main program
const program = new Command();

program
  .name('devxp')
  .description('Developer Experience CLI - A powerful tool for developers')
  .version('1.0.0');

// Welcome command with ASCII art
program
  .command('welcome')
  .description('Display a welcome message with ASCII art')
  .option('-n, --name <name>', 'Your name', 'Developer')
  .action(async (options) => {
    const spinner = ora('Preparing welcome message...').start();

    try {
      // Generate ASCII art
      const asciiArt = await figletAsync('DevXP CLI');
      spinner.succeed('Welcome message ready!');

      // Display welcome box
      const welcomeMessage = boxen(
        chalk.cyan(asciiArt) +
          '\\n\\n' +
          chalk.yellow(`Welcome, ${options.name}!`) +
          '\\n' +
          chalk.gray('Your developer experience toolkit'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'cyan',
          textAlignment: 'center',
        }
      );

      console.log(welcomeMessage);

      // Save to history
      const db = initDatabase();
      db.prepare('INSERT INTO commands_history (command, status) VALUES (?, ?)').run(
        'welcome',
        'success'
      );
      db.close();
    } catch (error) {
      spinner.fail('Failed to generate welcome message');
      console.error(chalk.red(error));
    }
  });

// Configuration management command
program
  .command('config')
  .description('Manage CLI configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration')
  .option('-c, --clear', 'Clear all configuration')
  .action((options) => {
    if (options.set) {
      const [key, ...valueParts] = options.set.split('=');
      const value = valueParts.join('=');
      config.set(key, value);
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
    } else if (options.get) {
      const value = config.get(options.get);
      if (value !== undefined) {
        console.log(chalk.cyan(`${options.get}: ${value}`));
      } else {
        console.log(chalk.yellow(`No value found for key: ${options.get}`));
      }
    } else if (options.list) {
      const allConfig = config.store;
      console.log(chalk.cyan('Current Configuration:'));
      console.log(boxen(JSON.stringify(allConfig, null, 2), { padding: 1, borderColor: 'gray' }));
    } else if (options.clear) {
      config.clear();
      console.log(chalk.yellow('⚠ All configuration cleared'));
    } else {
      console.log(chalk.gray('Use --help to see available options'));
    }
  });

// Database stats command
program
  .command('stats')
  .description('Show usage statistics')
  .action(() => {
    const db = initDatabase();

    try {
      const commandCount = db.prepare('SELECT COUNT(*) as count FROM commands_history').get() as {
        count: number;
      };

      const recentCommands = db
        .prepare('SELECT command, timestamp FROM commands_history ORDER BY timestamp DESC LIMIT 5')
        .all() as Array<{ command: string; timestamp: string }>;

      console.log(
        boxen(
          chalk.cyan.bold('📊 CLI Usage Statistics\\n\\n') +
            chalk.yellow(`Total commands executed: ${commandCount.count}\\n\\n`) +
            chalk.gray('Recent commands:\\n') +
            recentCommands
              .map((cmd) => `  • ${cmd.command} (${new Date(cmd.timestamp).toLocaleString()})`)
              .join('\\n'),
          {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'blue',
          }
        )
      );
    } catch (error) {
      console.error(chalk.red('Error fetching statistics:'), error);
    } finally {
      db.close();
    }
  });

// Interactive spinner demo
program
  .command('demo-spinner')
  .description('Demonstrate various spinner styles')
  .action(async () => {
    const spinners = ['dots', 'dots2', 'dots3', 'line', 'star', 'hamburger'];

    for (const spinnerType of spinners) {
      const spinner = ora({
        text: `Testing ${spinnerType} spinner...`,
        spinner: spinnerType as any,
      }).start();

      await new Promise((resolve) => setTimeout(resolve, 1500));
      spinner.succeed(`${spinnerType} spinner complete!`);
    }

    console.log(chalk.green('\\n✨ All spinner demos complete!'));
  });

// Color palette demo
program
  .command('colors')
  .description('Show available color styles')
  .action(() => {
    console.log(
      boxen(
        chalk.red('Red text\\n') +
          chalk.green('Green text\\n') +
          chalk.yellow('Yellow text\\n') +
          chalk.blue('Blue text\\n') +
          chalk.magenta('Magenta text\\n') +
          chalk.cyan('Cyan text\\n') +
          chalk.white('White text\\n') +
          chalk.gray('Gray text\\n') +
          chalk.bold('Bold text\\n') +
          chalk.italic('Italic text\\n') +
          chalk.underline('Underlined text\\n') +
          chalk.bgBlue.white(' Background colored text '),
        {
          title: 'Color Palette',
          titleAlignment: 'center',
          padding: 1,
          borderStyle: 'classic',
          borderColor: 'yellow',
        }
      )
    );
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
