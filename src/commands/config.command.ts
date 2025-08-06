/**
 * Config command - Manage configuration settings
 */
import type { Command } from '../types/command.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';

const configDir = path.join(os.homedir(), '.config', 'devxp');
const configFile = path.join(configDir, 'config.json');

export class ConfigCommand implements Command {
  readonly name = 'config';
  readonly description = 'Manage configuration settings';
  readonly help = `
Usage: devxp config [action] [key] [value]

Manage configuration settings for DevXP.

Actions:
  get <key>        Get a configuration value
  set <key> <value>  Set a configuration value
  list             List all configuration settings
  reset            Reset configuration to defaults
  path             Show path to configuration file

Examples:
  devxp config get user.name
  devxp config set notifications.enabled false
  devxp config list
`;
  readonly aliases = ['c', 'configure'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    if (args.length === 0) {
      console.log(this.help);
      return;
    }

    const [action, key, ...valueParts] = args;
    const value = valueParts.join(' ');

    switch (action) {
      case 'get':
        await this.get(key);
        break;
      case 'set':
        await this.set(key, value);
        break;
      case 'list':
        await this.list();
        break;
      case 'reset':
        await this.reset();
        break;
      case 'path':
        console.log(chalk.green(`Config file path: ${configFile}`));
        break;
      default:
        console.error(chalk.red(`Unknown action: ${action}`));
        console.log(this.help);
        break;
    }
  }

  private async get(key: string): Promise<void> {
    if (!key) {
      console.error(chalk.red('Key is required for get action'));
      return;
    }

    const config = await this.loadConfig();
    const value = this.getValue(config, key);

    if (value !== undefined) {
      console.log(chalk.cyan(`${key}:`), JSON.stringify(value, null, 2));
    } else {
      console.error(chalk.red(`Key '${key}' not found`));
    }
  }

  private async set(key: string, value: string): Promise<void> {
    if (!key || value === undefined) {
      console.error(chalk.red('Key and value are required for set action'));
      return;
    }

    const spinner = ora('Saving configuration...').start();
    try {
      const config = await this.loadConfig();
      const parsedValue = this.parseValue(value);
      this.setValue(config, key, parsedValue);
      await this.saveConfig(config);
      spinner.succeed(`Configuration saved: ${key} = ${JSON.stringify(parsedValue)}`);
    } catch (error) {
      spinner.fail('Failed to save configuration');
      console.error(error);
    }
  }

  private async list(): Promise<void> {
    const config = await this.loadConfig();
    console.log(chalk.cyan.bold('Current Configuration:'));
    console.log(JSON.stringify(config, null, 2));
  }

  private async reset(): Promise<void> {
    const spinner = ora('Resetting configuration...').start();
    try {
      const defaultConfig = this.getDefaultConfig();
      await this.saveConfig(defaultConfig);
      spinner.succeed('Configuration reset to defaults');
    } catch (error) {
      spinner.fail('Failed to reset configuration');
      console.error(error);
    }
  }

  private async loadConfig(): Promise<any> {
    try {
      await fs.mkdir(configDir, { recursive: true });
      const data = await fs.readFile(configFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.getDefaultConfig();
      }
      throw error;
    }
  }

  private async saveConfig(config: any): Promise<void> {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
  }

  private getDefaultConfig(): any {
    return {
      user: {
        name: '',
        email: ''
      },
      notifications: {
        enabled: true,
        levelUp: true,
        achievement: true
      },
      integrations: {
        github: {
          enabled: false,
          token: ''
        }
      },
      theme: 'default',
      leaderboard: {
        defaultPeriod: 'weekly'
      }
    };
  }

  private getValue(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }

  private setValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, i) => (o[i] = o[i] || {}), obj);
    target[lastKey] = value;
  }

  private parseValue(value: string): any {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  validate(args: ReadonlyArray<string>): boolean {
    const [action, key, value] = args;
    if (!action) return true; // Will show help

    const validActions = ['get', 'set', 'list', 'reset', 'path'];
    if (!validActions.includes(action)) {
      console.error(`Invalid action: ${action}`);
      return false;
    }

    if (action === 'get' && !key) {
      console.error('Missing key for "get" action');
      return false;
    }

    if (action === 'set' && (!key || value === undefined)) {
      console.error('Missing key or value for "set" action');
      return false;
    }

    return true;
  }
}
