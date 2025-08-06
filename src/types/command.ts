/**
 * Command interface for CLI commands
 */
export interface Command {
  /**
   * Name of the command
   */
  readonly name: string;

  /**
   * Short description of the command
   */
  readonly description: string;

  /**
   * Detailed help text for the command
   */
  readonly help?: string;

  /**
   * Aliases for the command
   */
  readonly aliases?: ReadonlyArray<string>;

  /**
   * Execute the command
   * @param args Command line arguments passed to the command
   * @returns Promise that resolves when command execution is complete
   */
  execute(args: ReadonlyArray<string>): Promise<void>;

  /**
   * Validate command arguments
   * @param args Command line arguments to validate
   * @returns True if arguments are valid, false otherwise
   */
  validate?(args: ReadonlyArray<string>): boolean;
}

/**
 * Command options interface
 */
export interface CommandOptions {
  /**
   * Verbose output mode
   */
  verbose?: boolean;

  /**
   * Quiet mode (minimal output)
   */
  quiet?: boolean;

  /**
   * Force operation without confirmations
   */
  force?: boolean;

  /**
   * Configuration file path
   */
  config?: string;
}

/**
 * Command context interface
 */
export interface CommandContext {
  /**
   * Current working directory
   */
  readonly cwd: string;

  /**
   * Environment variables
   */
  readonly env: NodeJS.ProcessEnv;

  /**
   * Command options
   */
  readonly options: CommandOptions;
}
