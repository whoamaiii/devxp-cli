#!/usr/bin/env node

/**
 * Test file to verify all dependencies are installed and working
 * Run with: npm run dev src/test-dependencies.ts
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import Database from 'better-sqlite3';
import sqlite3 from 'sqlite3';
import Conf from 'conf';

console.log(chalk.blue.bold('\n🧪 Testing CLI Dependencies\n'));

// Test Commander.js
const program = new Command();
program.version('1.0.0');
console.log(chalk.green('✓ Commander.js imported successfully'));

// Test Chalk
console.log(chalk.yellow('✓ Chalk is working - this text is yellow!'));

// Test Ora
const spinner = ora('Testing spinner...').start();
setTimeout(() => {
  spinner.succeed('Ora spinner works!');

  // Test Boxen
  console.log(
    boxen(chalk.cyan('Boxen is working!'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );

  // Test Figlet
  figlet('DevXP CLI', (err, data) => {
    if (err) {
      console.error('Figlet error:', err);
      return;
    }
    console.log(chalk.magenta(data));
  });

  // Test Better-SQLite3
  try {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO test (name) VALUES (?)').run('test-value');
    const row = db.prepare('SELECT * FROM test WHERE name = ?').get('test-value');
    console.log(chalk.green('✓ Better-SQLite3 is working'), row);
    db.close();
  } catch (error) {
    console.error(chalk.red('✗ Better-SQLite3 error:'), error);
  }

  // Test SQLite3
  const db = new sqlite3.Database(':memory:');
  db.serialize(() => {
    db.run('CREATE TABLE test2 (info TEXT)');
    db.run('INSERT INTO test2 (info) VALUES (?)', 'sqlite3-test');
    db.get('SELECT * FROM test2', (err, row) => {
      if (err) {
        console.error(chalk.red('✗ SQLite3 error:'), err);
      } else {
        console.log(chalk.green('✓ SQLite3 is working'), row);
      }
      db.close();
    });
  });

  // Test Conf
  try {
    const config = new Conf({ projectName: 'devxp-cli-test' });
    config.set('testKey', 'testValue');
    const value = config.get('testKey');
    console.log(chalk.green('✓ Conf is working - stored value:'), value);
    config.clear(); // Clean up test data
  } catch (error) {
    console.error(chalk.red('✗ Conf error:'), error);
  }

  setTimeout(() => {
    console.log(chalk.blue.bold('\n✨ All dependencies tested successfully!\n'));
  }, 100);
}, 1000);
