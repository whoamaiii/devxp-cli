#!/usr/bin/env node

/**
 * DevXP CLI - Developer Experience Command Line Interface
 * Main entry point for the CLI application
 */

// CLI metadata
const CLI_NAME = 'devxp';
const CLI_VERSION = '1.0.0';
const CLI_DESCRIPTION = 'Developer Experience Command Line Interface';

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    // Display help if no arguments or help flag
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      displayHelp();
      process.exit(0);
    }

    // Display version if version flag
    if (args.includes('--version') || args.includes('-v')) {
      console.log(`${CLI_NAME} version ${CLI_VERSION}`);
      process.exit(0);
    }

    // Get the command
    const commandName = args[0];
    const commandArgs = args.slice(1);

    console.log(`Executing command: ${commandName}`);
    console.log('With arguments:', commandArgs);

    // TODO: Load and execute commands from the commands directory
    console.log('Command execution will be implemented soon...');
  } catch (error) {
    console.error('Error executing CLI:', error);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
${CLI_NAME} - ${CLI_DESCRIPTION}
Version: ${CLI_VERSION}

Usage:
  ${CLI_NAME} <command> [options]

Options:
  -h, --help     Show help
  -v, --version  Show version

Commands:
  (Commands will be loaded dynamically from the commands directory)

Examples:
  ${CLI_NAME} --version
  ${CLI_NAME} --help
  ${CLI_NAME} <command> --help
`);
}

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
