import { Collection } from 'discord.js';
import { Command } from '../interfaces/Command';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

export const commands = new Collection<string, Command>();

export async function loadCommands() {
  const isDev = process.env.NODE_ENV !== 'production';
  const ext = isDev ? 'ts' : 'js';

  const foldersPath = path.join(
    process.cwd(),
    isDev ? 'src' : 'dist',
    'commands',
  );

  if (!fs.existsSync(foldersPath)) {
    console.error('[ERROR]: Commands folder not found: ', foldersPath);
    return;
  }

  const commandFolders = fs.readdirSync(foldersPath);
  for (const fileOrFolder of commandFolders) {
    const fullPath = path.join(foldersPath, fileOrFolder);
    const stat = fs.lstatSync(fullPath);

    let commandModule;
    if (stat.isDirectory()) {
      const _index = path.join(fullPath, `${fileOrFolder}.${ext}`);
      if (fs.existsSync(_index)) {
        commandModule = await import(pathToFileURL(_index).href);
      }
    } else if (fileOrFolder.endsWith(`.${ext}`)) {
      commandModule = await import(pathToFileURL(fullPath).href);
    }

    if (commandModule && 'command' in commandModule) {
      const command: Command = commandModule.command;
      commands.set(command.data.name, command);

      console.log('komenda załadowana ', command.data.name);
    }
  }

  console.log(`✅ Loaded ${commands.size} commands.`);
}
