/**
 * Command loader module for dynamically loading CLI commands
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { Command } from '../types/command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load all commands from the commands directory
 */
export async function loadCommands(): Promise<Map<string, Command>> {
  const commands = new Map<string, Command>();
  const commandsDir = join(__dirname, '..', 'commands');

  try {
    const files = await readdir(commandsDir);

    for (const file of files) {
      // Only load .command.ts or .command.js files
      if (!file.endsWith('.command.ts') && !file.endsWith('.command.js')) {
        continue;
      }

      const filePath = join(commandsDir, file);

      try {
        // Dynamic import of command module
        const module = await import(filePath);

        // Find the exported Command class
        for (const exportName in module) {
          const ExportedClass = module[exportName];

          if (typeof ExportedClass === 'function') {
            const instance = new ExportedClass();

            if (isCommand(instance)) {
              commands.set(instance.name, instance);

              // Register aliases
              if (instance.aliases) {
                for (const alias of instance.aliases) {
                  commands.set(alias, instance);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load command from ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to read commands directory:', error);
  }

  return commands;
}

/**
 * Type guard to check if an object implements the Command interface
 */
function isCommand(obj: unknown): obj is Command {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'description' in obj &&
    'execute' in obj &&
    typeof (obj as Command).name === 'string' &&
    typeof (obj as Command).description === 'string' &&
    typeof (obj as Command).execute === 'function'
  );
}

/**
 * Get a command by name or alias
 */
export async function getCommand(name: string): Promise<Command | undefined> {
  const commands = await loadCommands();
  return commands.get(name);
}

/**
 * List all available commands
 */
export async function listCommands(): Promise<Command[]> {
  const commands = await loadCommands();
  const uniqueCommands = new Map<string, Command>();

  // Filter out duplicates from aliases
  for (const [key, command] of commands) {
    if (key === command.name) {
      uniqueCommands.set(key, command);
    }
  }

  return Array.from(uniqueCommands.values());
}
