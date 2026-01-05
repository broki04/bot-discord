import { ClientEvents } from 'discord.js';
import client from '../client';
import { logger } from './logger';
import fs from 'node:fs';
import path from 'node:path';
import { deployCommands } from '../commands/deploy-commands';
import crypto from 'crypto';

const isDev = process.env.NODE_ENV === 'development';
const ext = isDev ? '.ts' : '.js';

const commandsPath = path.join(
  process.cwd(),
  isDev ? 'src/commands' : 'dist/commands',
);
const eventsPath = path.join(
  process.cwd(),
  isDev ? 'src/events' : 'dist/events',
);

const commandIgnore = new Set([
  'index.ts',
  'index.js',
  'deploy-commands.ts',
  'deploy-commands.js',
]);
const eventIgnore = new Set(['index.ts', 'index.js']);

const fileHashes = new Map<string, string>();
const loadedEventListeners = new Map<string, (...args: any[]) => void>();
const timers = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 200;

function debounce(filePath: string, fn: () => void) {
  if (timers.has(filePath)) clearTimeout(timers.get(filePath)!);
  timers.set(
    filePath,
    setTimeout(() => {
      fn();
      timers.delete(filePath);
    }, DEBOUNCE_MS),
  );
}

function getFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

async function reloadCommand(filePath: string) {
  try {
    delete require.cache[require.resolve(filePath)];
    const imported = await import(filePath);
    const command = imported?.default ?? imported?.command;

    if (!command) {
      logger.warn('Invalid command structure', filePath);
      return;
    }

    client.commands.set(command.data.name, command);
    logger.success(`Reloaded command /${command.data.name}`);

    await deployCommands();
  } catch (err) {
    logger.error(`Failed to reload command ${filePath}:`, err);
  }
}

async function reloadEvent(filePath: string) {
  try {
    delete require.cache[require.resolve(filePath)];
    const imported = await import(filePath);
    const event = imported?.default ?? imported?.event;

    console.log(imported);
    console.log(event);

    if (!event) {
      logger.warn('Invalid event structure:', filePath);
      return;
    }

    const old = loadedEventListeners.get(event.name.toString());
    if (old) client.off(event.name, old);

    const listener = (...args: Parameters<typeof event.execute>) =>
      event.execute(...args);
    loadedEventListeners.set(event.name.toString(), listener);

    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);

    logger.success(`Reloaded event ${event.name}`);
  } catch (err) {
    logger.error(`Failed to reload event ${filePath}:`, err);
  }
}

function watchFile(filePath: string, isCommand = false) {
  fileHashes.set(filePath, getFileHash(filePath));

  fs.watch(filePath, (eventType) => {
    if (eventType !== 'change') return;

    const newHash = getFileHash(filePath);
    const oldHash = fileHashes.get(filePath);

    if (!newHash || newHash === oldHash) return;
    fileHashes.set(filePath, newHash);

    debounce(filePath, async () => {
      if (isCommand) await reloadCommand(filePath);
      else await reloadEvent(filePath);
    });
  });
}

function watchDir(baseDir: string, ignore: Set<string>, isCommand = false) {
  fs.readdirSync(baseDir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      watchDir(fullPath, ignore, isCommand);
    } else if (
      entry.isFile() &&
      fullPath.endsWith(ext) &&
      !ignore.has(entry.name)
    ) {
      watchFile(fullPath, isCommand);
    }
  });

  fs.watch(baseDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (ignore.has(filename)) return;
    if (!filename.endsWith(ext)) return;

    const fullPath = path.join(baseDir, filename);
    fs.stat(fullPath, async (err, stats) => {
      if (err) {
        if (isCommand) {
          const name = path.basename(filename, ext);
          client.commands.delete(name);

          logger.warn(`Command deleted: /${name}`);
          await deployCommands();
        } else {
          const name = path.basename(filename, ext);

          const old = loadedEventListeners.get(name);
          if (old) client.off(name as keyof ClientEvents, old);

          loadedEventListeners.delete(name);
          logger.warn(`Event deleted: ${name}`);
        }

        fileHashes.delete(fullPath);
      } else if (stats.isFile()) {
        watchFile(fullPath, isCommand);
      }
    });
  });
}

export function watchHotReload() {
  watchDir(commandsPath, commandIgnore, true);
  watchDir(eventsPath, eventIgnore, false);

  logger.info('Hot reload (fs.watch) is initialized.');
}
