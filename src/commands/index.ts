import path from 'node:path';
import fs from 'node:fs';
import { Command } from '../interfaces/Command';
import client from '../client';
import { logger } from '../utils/logger';

export async function registerCommands() {
  logger.debug('Function registerCommands() called');

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? '.ts' : '.js';
  const foldersPath = path.join(
    process.cwd(),
    isDev ? 'src' : 'dist',
    'commands',
  );

  async function load(dir: string) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (
        [
          'index.ts',
          'index.js',
          'deploy-commands.ts',
          'deploy-commands.js',
        ].includes(item)
      )
        continue;

      const fullPath = path.join(dir, item);
      const stat = fs.lstatSync(fullPath);

      if (stat.isDirectory()) {
        await load(fullPath);
        continue;
      }

      if (!item.endsWith(ext)) continue;

      try {
        const imported = await import(fullPath);
        const command: Command | undefined =
          imported.command ?? imported.default;

        if (!command?.data || !command?.execute) continue;
        client.commands.set(command.data.name, command);
        logger.debug(`Command /${command.data.name} added`);
      } catch (err) {
        logger.error(`Error loading command at ${fullPath}:`, err);
      }
    }
  }

  await load(foldersPath);
  logger.info('Total commands registered:', client.commands.size);
}
