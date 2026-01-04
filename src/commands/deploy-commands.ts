import fs from 'fs';
import path from 'path';
import {
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';

export async function deployCommands() {
  const body: RESTPostAPIApplicationCommandsJSONBody[] = [];

  const isDev = process.env.NODE_ENV === 'development';
  const ext = isDev ? 'ts' : 'js';

  const foldersPath = path.join(
    process.cwd(),
    isDev ? 'src' : 'dist',
    'commands',
  );
  const items = fs.readdirSync(foldersPath);

  for (const item of items) {
    if (
      [
        'index.ts',
        'index.js',
        'deploy-commands.ts',
        'deploy-commands.ts',
      ].includes(item)
    )
      continue;

    const fullPath = path.join(foldersPath, item);
    const stat = fs.lstatSync(fullPath);

    let modulePath: string | null = null;
    if (stat.isDirectory()) {
      modulePath = path.join(fullPath, `${item}.${ext}`);
    } else if (item.endsWith(`.${ext}`)) {
      modulePath = fullPath;
    }

    if (modulePath && fs.existsSync(modulePath)) {
      try {
        const imported = await import(modulePath);
        if ('command' in imported && imported.command.data) {
          body.push(imported.command.data.toJSON());
        }
      } catch (err) {
        console.error(`💥 Error loading command at ${modulePath}: `, err);
      }
    }
  }

  if (body.length === 0) {
    console.log('⚠️ No commands found to deploy.');
    return;
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const betaGuilds =
    process.env.BETA_GUILDS?.split(',')
      .map((i) => i.trim())
      .filter(Boolean) || [];
  const deployMode = process.env.DEPLOY_MODE || 'both'; // both, global, guild

  try {
    if (deployMode === 'guild' || deployMode === 'both') {
      for (const guildId of betaGuilds) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
          body: body,
        });
      }
    }

    if (deployMode === 'global' || deployMode === 'both') {
      await rest.put(Routes.applicationCommands(clientId), { body: body });
    }
  } catch (err) {
    console.error('❌ Error deploying commands:', err);
  }
}
