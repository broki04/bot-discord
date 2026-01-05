import path from 'node:path';
import { Command } from '../interfaces/Command';
import client from '../client';
import { logger } from '../utils/logger';
import { loadDirectory } from '../utils/loadDirectory';
import { isValidCommand, resetCommandValidator } from '../utils/validators';

resetCommandValidator();

const ignoreFiles = new Set([
  'index.ts',
  'index.js',
  'deploy-commands.ts',
  'deploy-commands.js',
]);

export async function registerCommands() {
  logger.debug('Function registerCommands() called');

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? '.ts' : '.js';

  const baseDir = path.join(process.cwd(), isDev ? 'src' : 'dist', 'commands');

  await loadDirectory(
    baseDir,
    { ext, ignore: ignoreFiles },
    async (filePath) => {
      try {
        const imported = await import(filePath);
        const command: Command | undefined =
          imported.command ?? imported.default;

        if (!isValidCommand(command)) {
          logger.warn('Invalid command structure:', filePath);
          return;
        }

        if (client.commands.has(command.data.name)) {
          logger.warn(`Duplicate command /${command.data.name} ignored`);
          return;
        }

        client.commands.set(command.data.name, command);
        logger.debug(`Loaded /${command.data.name}`);
      } catch (err) {
        logger.error(`Failed to load:`, filePath, err);
      }
    },
  );

  logger.info('Total commands registered:', client.commands.size);
}
