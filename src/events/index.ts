import path from 'node:path';
import client from '../client';
import { logger } from '../utils/logger';
import { loadDirectory } from '../utils/loadDirectory';
import { isValidEvent, resetEventValidator } from '../utils/validators';
import { Event } from '../interfaces/Event';

resetEventValidator();

const loadedEvents = new Set<string>();
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
        delete require.cache[require.resolve(filePath)];
        const imported = await import(filePath);
        const event: Event | undefined = imported.default ?? imported.event;

        if (!isValidEvent(event)) {
          logger.warn('Invalid or duplicate event:', filePath);
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
