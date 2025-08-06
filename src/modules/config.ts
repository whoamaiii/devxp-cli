import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';

// Configuration schema
const ActivityXPSchema = z.object({
  commit: z.number().min(0),
  pullRequest: z.number().min(0),
  review: z.number().min(0),
  issue: z.number().min(0),
  test: z.number().min(0),
  documentation: z.number().min(0),
  refactor: z.number().min(0),
  bugfix: z.number().min(0),
  feature: z.number().min(0),
  deployment: z.number().min(0),
  learning: z.number().min(0),
  mentoring: z.number().min(0),
  planning: z.number().min(0),
  debugging: z.number().min(0),
  optimization: z.number().min(0),
});

const LevelingSchema = z.object({
  baseXP: z.number().min(1),
  multiplier: z.number().min(1),
  maxLevel: z.number().min(1).max(999),
});

const NotificationSchema = z.object({
  enabled: z.boolean(),
  levelUp: z.boolean(),
  achievement: z.boolean(),
  dailyStreak: z.boolean(),
  milestone: z.boolean(),
});

const ThemeSchema = z.object({
  colorScheme: z.enum(['auto', 'light', 'dark']),
  accentColor: z.string(),
  animations: z.boolean(),
});

const ConfigSchema = z.object({
  version: z.string(),
  difficulty: z.enum(['easy', 'normal', 'hard', 'custom']),
  activities: ActivityXPSchema,
  leveling: LevelingSchema,
  notifications: NotificationSchema,
  theme: ThemeSchema,
  streakGoal: z.number().min(1),
  dailyXPGoal: z.number().min(0),
  weeklyXPGoal: z.number().min(0),
  timezone: z.string(),
  language: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ActivityXP = z.infer<typeof ActivityXPSchema>;
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'custom';

// Difficulty presets
const DIFFICULTY_PRESETS: Record<DifficultyLevel, Partial<Config>> = {
  easy: {
    activities: {
      commit: 15,
      pullRequest: 100,
      review: 50,
      issue: 40,
      test: 30,
      documentation: 35,
      refactor: 45,
      bugfix: 60,
      feature: 120,
      deployment: 150,
      learning: 25,
      mentoring: 80,
      planning: 40,
      debugging: 50,
      optimization: 70,
    },
    leveling: {
      baseXP: 80,
      multiplier: 1.3,
      maxLevel: 100,
    },
    dailyXPGoal: 100,
    weeklyXPGoal: 500,
  },
  normal: {
    activities: {
      commit: 10,
      pullRequest: 75,
      review: 40,
      issue: 30,
      test: 25,
      documentation: 30,
      refactor: 35,
      bugfix: 50,
      feature: 100,
      deployment: 125,
      learning: 20,
      mentoring: 60,
      planning: 30,
      debugging: 40,
      optimization: 55,
    },
    leveling: {
      baseXP: 100,
      multiplier: 1.5,
      maxLevel: 100,
    },
    dailyXPGoal: 150,
    weeklyXPGoal: 750,
  },
  hard: {
    activities: {
      commit: 5,
      pullRequest: 50,
      review: 25,
      issue: 20,
      test: 15,
      documentation: 20,
      refactor: 25,
      bugfix: 35,
      feature: 75,
      deployment: 100,
      learning: 15,
      mentoring: 45,
      planning: 20,
      debugging: 30,
      optimization: 40,
    },
    leveling: {
      baseXP: 150,
      multiplier: 1.8,
      maxLevel: 100,
    },
    dailyXPGoal: 200,
    weeklyXPGoal: 1000,
  },
  custom: {}, // User-defined values
};

// Default configuration
const DEFAULT_CONFIG: Config = {
  version: '1.0.0',
  difficulty: 'normal',
  activities: DIFFICULTY_PRESETS.normal.activities!,
  leveling: DIFFICULTY_PRESETS.normal.leveling!,
  notifications: {
    enabled: true,
    levelUp: true,
    achievement: true,
    dailyStreak: true,
    milestone: true,
  },
  theme: {
    colorScheme: 'auto',
    accentColor: '#3B82F6',
    animations: true,
  },
  streakGoal: 7,
  dailyXPGoal: DIFFICULTY_PRESETS.normal.dailyXPGoal!,
  weeklyXPGoal: DIFFICULTY_PRESETS.normal.weeklyXPGoal!,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'en',
};

export class ConfigManager {
  private configPath: string;
  private config: Config;
  private configDir: string;

  constructor(customPath?: string) {
    this.configDir = path.join(os.homedir(), '.config', 'devxp');
    this.configPath = customPath || path.join(this.configDir, 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file or create default
   */
  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawConfig = fs.readFileSync(this.configPath, 'utf-8');
        const parsedConfig = JSON.parse(rawConfig);
        
        // Validate and merge with defaults
        const validatedConfig = this.validateConfig(parsedConfig);
        return { ...DEFAULT_CONFIG, ...validatedConfig };
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
    }

    // Create default config if doesn't exist
    this.saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  /**
   * Validate configuration against schema
   */
  private validateConfig(config: unknown): Partial<Config> {
    try {
      // Try to parse as full config
      return ConfigSchema.parse(config);
    } catch {
      // If full validation fails, validate individual parts
      const partialConfig: Partial<Config> = {};
      const configObj = config as any;

      // Validate each section individually
      if (configObj.version) partialConfig.version = configObj.version;
      if (configObj.difficulty) {
        try {
          partialConfig.difficulty = z.enum(['easy', 'normal', 'hard', 'custom']).parse(configObj.difficulty);
        } catch {}
      }
      if (configObj.activities) {
        try {
          partialConfig.activities = ActivityXPSchema.parse(configObj.activities);
        } catch {}
      }
      if (configObj.leveling) {
        try {
          partialConfig.leveling = LevelingSchema.parse(configObj.leveling);
        } catch {}
      }
      if (configObj.notifications) {
        try {
          partialConfig.notifications = NotificationSchema.parse(configObj.notifications);
        } catch {}
      }
      if (configObj.theme) {
        try {
          partialConfig.theme = ThemeSchema.parse(configObj.theme);
        } catch {}
      }
      if (configObj.streakGoal) partialConfig.streakGoal = configObj.streakGoal;
      if (configObj.dailyXPGoal) partialConfig.dailyXPGoal = configObj.dailyXPGoal;
      if (configObj.weeklyXPGoal) partialConfig.weeklyXPGoal = configObj.weeklyXPGoal;
      if (configObj.timezone) partialConfig.timezone = configObj.timezone;
      if (configObj.language) partialConfig.language = configObj.language;

      return partialConfig;
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfig(config: Config): void {
    // Ensure directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    this.config = config;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value
   */
  get<K extends keyof Config>(key: K): Config[K];
  get(path: string): any {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set a configuration value
   */
  set<K extends keyof Config>(key: K, value: Config[K]): void;
  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    // Navigate to the target object
    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    // Set the value
    target[lastKey] = value;

    // Validate and save
    const validated = this.validateConfig(this.config);
    this.saveConfig({ ...DEFAULT_CONFIG, ...validated });
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Partial<Config>): void {
    const merged = { ...this.config, ...updates };
    const validated = this.validateConfig(merged);
    this.saveConfig({ ...DEFAULT_CONFIG, ...validated });
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * Reset specific section to defaults
   */
  resetSection(section: keyof Config): void {
    const updated = { ...this.config };
    updated[section] = DEFAULT_CONFIG[section] as any;
    this.saveConfig(updated);
  }

  /**
   * Apply a difficulty preset
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    if (difficulty === 'custom') {
      // Just set the difficulty flag, keep current values
      this.set('difficulty', difficulty);
      return;
    }

    const preset = DIFFICULTY_PRESETS[difficulty];
    this.update({
      difficulty,
      ...preset,
    });
  }

  /**
   * Export configuration to a file
   */
  exportConfig(filePath: string): void {
    const config = this.getConfig();
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Import configuration from a file
   */
  importConfig(filePath: string): void {
    try {
      const rawConfig = fs.readFileSync(filePath, 'utf-8');
      const parsedConfig = JSON.parse(rawConfig);
      const validated = this.validateConfig(parsedConfig);
      this.saveConfig({ ...DEFAULT_CONFIG, ...validated });
    } catch (error) {
      throw new Error(`Failed to import config from ${filePath}: ${error}`);
    }
  }

  /**
   * Create a configuration profile
   */
  saveProfile(name: string): void {
    const profilePath = path.join(this.configDir, 'profiles', `${name}.json`);
    const profileDir = path.dirname(profilePath);

    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    fs.writeFileSync(profilePath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  /**
   * Load a configuration profile
   */
  loadProfile(name: string): void {
    const profilePath = path.join(this.configDir, 'profiles', `${name}.json`);
    
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile '${name}' not found`);
    }

    this.importConfig(profilePath);
  }

  /**
   * List available profiles
   */
  listProfiles(): string[] {
    const profileDir = path.join(this.configDir, 'profiles');
    
    if (!fs.existsSync(profileDir)) {
      return [];
    }

    return fs.readdirSync(profileDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Delete a profile
   */
  deleteProfile(name: string): void {
    const profilePath = path.join(this.configDir, 'profiles', `${name}.json`);
    
    if (fs.existsSync(profilePath)) {
      fs.unlinkSync(profilePath);
    }
  }

  /**
   * Get activity XP value
   */
  getActivityXP(activity: keyof ActivityXP): number {
    return this.config.activities[activity];
  }

  /**
   * Set activity XP value
   */
  setActivityXP(activity: keyof ActivityXP, xp: number): void {
    const activities = { ...this.config.activities };
    activities[activity] = xp;
    this.set('activities', activities);
    
    // If we're modifying activities, set difficulty to custom
    if (this.config.difficulty !== 'custom') {
      this.set('difficulty', 'custom');
    }
  }

  /**
   * Calculate XP required for a level
   */
  getXPForLevel(level: number): number {
    const { baseXP, multiplier } = this.config.leveling;
    return Math.floor(baseXP * Math.pow(multiplier, level - 1));
  }

  /**
   * Calculate total XP required to reach a level
   */
  getTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += this.getXPForLevel(i);
    }
    return total;
  }

  /**
   * Calculate level from total XP
   */
  getLevelFromXP(totalXP: number): { level: number; progress: number; nextLevelXP: number } {
    let level = 1;
    let remainingXP = totalXP;

    while (level < this.config.leveling.maxLevel) {
      const xpForCurrentLevel = this.getXPForLevel(level);
      
      if (remainingXP < xpForCurrentLevel) {
        return {
          level,
          progress: remainingXP,
          nextLevelXP: xpForCurrentLevel,
        };
      }

      remainingXP -= xpForCurrentLevel;
      level++;
    }

    // Max level reached
    return {
      level: this.config.leveling.maxLevel,
      progress: 0,
      nextLevelXP: 0,
    };
  }

  /**
   * Validate that all required config fields are present
   */
  isValid(): boolean {
    try {
      ConfigSchema.parse(this.config);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration differences from default
   */
  getDifferences(): Partial<Config> {
    const differences: any = {};

    const compareObjects = (current: any, defaults: any, path = ''): void => {
      for (const key in current) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof current[key] === 'object' && !Array.isArray(current[key])) {
          if (defaults[key]) {
            compareObjects(current[key], defaults[key], currentPath);
          } else {
            differences[currentPath] = current[key];
          }
        } else if (current[key] !== defaults[key]) {
          differences[currentPath] = current[key];
        }
      }
    };

    compareObjects(this.config, DEFAULT_CONFIG);
    return differences;
  }
}

// CLI command handlers
export const configCommands = {
  /**
   * Get configuration value
   */
  get: (manager: ConfigManager, path?: string): void => {
    if (!path) {
      console.log(JSON.stringify(manager.getConfig(), null, 2));
    } else {
      const value = manager.get(path);
      if (value !== undefined) {
        console.log(JSON.stringify(value, null, 2));
      } else {
        console.error(`Configuration key '${path}' not found`);
        process.exit(1);
      }
    }
  },

  /**
   * Set configuration value
   */
  set: (manager: ConfigManager, path: string, value: string): void => {
    try {
      // Try to parse as JSON first
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // If not JSON, treat as string
        parsedValue = value;
      }

      manager.set(path, parsedValue);
      console.log(`Configuration updated: ${path} = ${JSON.stringify(parsedValue)}`);
    } catch (error) {
      console.error(`Failed to set configuration: ${error}`);
      process.exit(1);
    }
  },

  /**
   * Reset configuration
   */
  reset: (manager: ConfigManager, section?: string): void => {
    if (section) {
      manager.resetSection(section as keyof Config);
      console.log(`Configuration section '${section}' reset to defaults`);
    } else {
      manager.reset();
      console.log('Configuration reset to defaults');
    }
  },

  /**
   * Set difficulty level
   */
  difficulty: (manager: ConfigManager, level: DifficultyLevel): void => {
    manager.setDifficulty(level);
    console.log(`Difficulty set to: ${level}`);
  },

  /**
   * Export configuration
   */
  export: (manager: ConfigManager, filePath: string): void => {
    try {
      manager.exportConfig(filePath);
      console.log(`Configuration exported to: ${filePath}`);
    } catch (error) {
      console.error(`Failed to export configuration: ${error}`);
      process.exit(1);
    }
  },

  /**
   * Import configuration
   */
  import: (manager: ConfigManager, filePath: string): void => {
    try {
      manager.importConfig(filePath);
      console.log(`Configuration imported from: ${filePath}`);
    } catch (error) {
      console.error(`Failed to import configuration: ${error}`);
      process.exit(1);
    }
  },

  /**
   * Profile management
   */
  profile: {
    save: (manager: ConfigManager, name: string): void => {
      try {
        manager.saveProfile(name);
        console.log(`Profile '${name}' saved`);
      } catch (error) {
        console.error(`Failed to save profile: ${error}`);
        process.exit(1);
      }
    },

    load: (manager: ConfigManager, name: string): void => {
      try {
        manager.loadProfile(name);
        console.log(`Profile '${name}' loaded`);
      } catch (error) {
        console.error(`Failed to load profile: ${error}`);
        process.exit(1);
      }
    },

    list: (manager: ConfigManager): void => {
      const profiles = manager.listProfiles();
      if (profiles.length === 0) {
        console.log('No profiles found');
      } else {
        console.log('Available profiles:');
        profiles.forEach(profile => console.log(`  - ${profile}`));
      }
    },

    delete: (manager: ConfigManager, name: string): void => {
      try {
        manager.deleteProfile(name);
        console.log(`Profile '${name}' deleted`);
      } catch (error) {
        console.error(`Failed to delete profile: ${error}`);
        process.exit(1);
      }
    },
  },

  /**
   * Show differences from default
   */
  diff: (manager: ConfigManager): void => {
    const differences = manager.getDifferences();
    if (Object.keys(differences).length === 0) {
      console.log('No differences from default configuration');
    } else {
      console.log('Differences from default configuration:');
      console.log(JSON.stringify(differences, null, 2));
    }
  },
};

// Export singleton instance for convenience
export const defaultConfigManager = new ConfigManager();
