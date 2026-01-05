import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import {
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { logger } from '../utils/logger';
import { isValidCommand, resetCommandValidator } from '../utils/validators';
import { loadDirectory } from '../utils/loadDirectory';

const HASH_FILE = path.join(process.cwd(), 'data', 'command-hashes.json');

interface CommandInfo {
  name: string;
  data: RESTPostAPIApplicationCommandsJSONBody;
  hash: string;
}

interface CommandHashes {
  global: Record<string, string>;
  guilds: Record<string, Record<string, string>>;
}

function loadHashes(): CommandHashes {
  if (!fs.existsSync(HASH_FILE)) {
    return { global: {}, guilds: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(HASH_FILE, 'utf-8'));

    return {
      global: parsed.global ?? {},
      guilds: parsed.guilds ?? {},
    };
  } catch {
    return { global: {}, guilds: {} };
  }
}

function saveHashes(hashes: CommandHashes) {
  fs.writeFileSync(HASH_FILE, JSON.stringify(hashes, null, 2), 'utf-8');

  logger.success('Commands hashes saved');
}

export async function deployCommands() {
  logger.debug(`Function deployCommands() called`);

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? 'ts' : 'js';
  const baseDir = path.join(process.cwd(), isDev ? 'src' : 'dist', 'commands');

  const commands: CommandInfo[] = [];
  resetCommandValidator();

  await loadDirectory(
    baseDir,
    {
      ext,
      ignore: new Set([
        'index.ts',
        'index.js',
        'deploy-commands.ts',
        'deploy-commands.js',
      ]),
    },
    async (filePath) => {
      const imported = await import(filePath);
      const command = imported.command ?? imported.default;

      if (!isValidCommand(command)) {
        logger.warn('Invalid or duplicate command:', filePath, command);
        return;
      }

      const data = command.data.toJSON();
      const source = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(source).digest('hex');

      commands.push({
        name: data.name,
        data,
        hash,
      });

      logger.debug(`Collected command: /${data.name}`);
    },
  );

  if (commands.length === 0) {
    logger.success('No commands found to deploy');
    return;
  }

  commands.sort((a, b) => a.name.localeCompare(b.name));

  const currentHashes: Record<string, string> = {};
  commands.forEach((c) => (currentHashes[c.name] = c.hash));

  const saved = loadHashes();

  const betaGuilds = (process.env.BETA_GUILDS || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

  const mode = process.env.DEPLOY_MODE || 'both';
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const body = commands.map((c) => c.data);

  // * remove deleted commands
  const currentNames = new Set(commands.map((c) => c.name));
  const removedGlobal = Object.keys(saved.global).filter(
    (name) => !currentNames.has(name),
  );
  const removedGuilds: Record<string, string[]> = {};

  for (const [guildId, guildCommands] of Object.entries(saved.guilds)) {
    const removed = Object.keys(guildCommands).filter(
      (name) => !currentNames.has(name),
    );
    if (removed.length > 0) removedGuilds[guildId] = removed;
  }

  for (const name of removedGlobal) {
    try {
      const existing = (await rest.get(
        Routes.applicationCommands(clientId),
      )) as any[];
      const cmd = existing.find((c) => c.name === name);

      if (cmd) {
        await rest.delete(Routes.applicationCommand(clientId, cmd.id));
        logger.debug(`Removed /${name} globally`);
      }
      delete saved.global[name];
    } catch (err) {
      logger.error(`Error removing /${name}: `, err);
    }
  }

  for (const [guildId, names] of Object.entries(removedGuilds)) {
    try {
      const existing = (await rest.get(
        Routes.applicationGuildCommands(clientId, guildId),
      )) as any[];

      for (const name of names) {
        const cmd = existing.find((c) => c.name === name);

        if (cmd) {
          await rest.delete(
            Routes.applicationGuildCommand(clientId, guildId, cmd.id),
          );

          logger.debug(`Removed /${name} from ${guildId}`);
        }
        delete saved.guilds[guildId][name];
      }
    } catch (err) {
      logger.error(`Error removing guild command from ${guildId}: `, err);
    }
  }

  // * change detection
  function hasCommandChanged(name: string, hash: string): boolean {
    if (saved.global[name] === hash) return false;
    for (const guild of Object.values(saved.guilds)) {
      if (guild[name] === hash) return false;
    }
    return true;
  }

  const changedCommands = commands.filter((cmd) =>
    hasCommandChanged(cmd.name, cmd.hash),
  );

  if (changedCommands.length === 0) {
    logger.success('No command changes detected - deploy skipped');
    saveHashes(saved);
    return;
  }

  logger.debug(
    `Deploying changes: /${changedCommands.map((c) => c.name).join(', ')}`,
  );

  // * deploy

  logger.debug(
    'Started deployment',
    mode === 'guild'
      ? 'for guilds'
      : mode === 'both'
      ? 'for guilds and globally'
      : 'globally',
  );

  if ((mode === 'guild' || mode === 'both') && betaGuilds.length > 0) {
    for (const guildId of betaGuilds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: body,
      });
      saved.guilds[guildId] = { ...currentHashes };

      logger.success(`Deployed commands to guild ${guildId}`);
    }
  }

  if (mode === 'global' || mode === 'both') {
    await rest.put(Routes.applicationCommands(clientId), { body: body });
    saved.global = { ...currentHashes };

    logger.success('Deployed commands globally');
  }

  saveHashes(saved);
}
