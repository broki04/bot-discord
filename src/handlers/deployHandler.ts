import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Command } from '../interfaces/Command';
import {
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';

export async function deployCommands() {
  const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? 'ts' : 'js';
  const foldersPath = path.join(
    process.cwd(),
    isDev ? 'src' : 'dist',
    'commands',
  );

  const items = fs.readdirSync(foldersPath);
  for (const item of items) {
    const fullPath = path.join(foldersPath, item);
    const stat = fs.lstatSync(fullPath);

    let commandModule;
    if (stat.isDirectory()) {
      const _index = path.join(fullPath, `${item}.${ext}`);
      if (fs.existsSync(_index)) {
        commandModule = await import(pathToFileURL(_index).href);
      }
    } else if (item.endsWith(`.${ext}`)) {
      commandModule = await import(pathToFileURL(fullPath).href);
    }

    if (commandModule?.command) {
      const command: Command = commandModule.command;
      commands.push(
        command.data.toJSON() as RESTPostAPIApplicationCommandsJSONBody,
      );
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const betaGuilds =
    process.env.BETA_GUILDS?.split(',')
      .map((i) => i.trim())
      .filter(Boolean) || [];
  const deployMode = process.env.DEPLOY_MODE || 'both'; // both, global, guild

  try {
    console.log(`🚀 Automatic deployment of ${commands.length} started...`);

    if (deployMode === 'guild' || deployMode === 'both') {
      for (const guildId of betaGuilds) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        });
        console.log(`✅ Deployed commands to guild ${guildId}`);
      }
    }

    if (deployMode === 'global' || deployMode === 'both') {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`✅ Deployed commands globally`);
    }
  } catch (err) {
    console.error('❌ Error deploying commands:', err);
  }
}
