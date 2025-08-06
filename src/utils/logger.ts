/**
 * Logger utility for CLI output
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`⚠️  WARN: ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`ℹ️  INFO: ${message}`, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`✅ SUCCESS: ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`🔍 DEBUG: ${message}`, ...args);
    }
  }

  verbose(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.VERBOSE) {
      console.log(`📝 VERBOSE: ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
