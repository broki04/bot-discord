import { ClientEvents } from 'discord.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import client from '../client';
import { logger } from '../utils/logger';
import { loadDirectory } from '../utils/loadDirectory';

interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => void | Promise<void>;
}

const loadedEvents = new Set<string>();
const ignoredFiles = new Set(['index.ts', 'index.js']);

export async function registerEvents() {
  logger.debug('Function registerEvents() called');

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? '.ts' : '.js';

  const baseDir = path.join(process.cwd(), isDev ? 'src' : 'dist', 'events');

  let loaded = 0;
  await loadDirectory(
    baseDir,
    { ext, ignore: new Set(['index.ts', 'index.js']) },

    async (filePath) => {
      try {
        const imported = await import(filePath);
        const event: Event | undefined = imported.default ?? imported.event;

        if (!event?.name || typeof event.execute !== 'function') {
          logger.warn('Invalid event structure in', filePath);
          return;
        }

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }

        logger.info(`Registered ${event.name} (once: ${Boolean(event.once)})`);

        loadedEvents.add(filePath);
        loaded++;
      } catch (err) {
        logger.error('Failed to import event:', filePath, err);
      }
    },
  );

  logger.info(`Events loaded: ${loaded}`);
}
