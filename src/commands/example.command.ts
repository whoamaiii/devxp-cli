/**
 * Example command implementation
 */
import type { Command } from '../types/command.js';

export class ExampleCommand implements Command {
  readonly name = 'example';
  readonly description = 'An example command implementation';
  readonly help = `
Usage: devxp example [options]

This is an example command that demonstrates the command structure.

Options:
  --message <msg>  Display a custom message
  --verbose        Enable verbose output
`;
  readonly aliases = ['ex', 'demo'];

  async execute(args: ReadonlyArray<string>): Promise<void> {
    console.log('Executing example command...');

    // Parse arguments
    const messageIndex = args.indexOf('--message');
    if (messageIndex !== -1 && args[messageIndex + 1]) {
      const message = args[messageIndex + 1];
      console.log(`Custom message: ${message}`);
    }

    if (args.includes('--verbose')) {
      console.log('Verbose mode enabled');
      console.log('Arguments received:', args);
    }

    console.log('Example command completed successfully!');
  }

  validate(_args: ReadonlyArray<string>): boolean {
    // Add validation logic here
    return true;
  }
}
