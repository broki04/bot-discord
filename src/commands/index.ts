import path from 'node:path';
import fs from 'node:fs';
import { Command } from '../interfaces/Command';
import client from '../client';

export async function registerCommands() {
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
      const file = path.join(fullPath, `${item}.${ext}`);
      if (fs.existsSync(file)) modulePath = file;
    } else if (item.endsWith(`.${ext}`)) {
      modulePath = fullPath;
    }

    if (modulePath) {
      try {
        const imported = await import(modulePath);
        if ('command' in imported) {
          const cmd: Command = imported.commandl;
          client.commands.set(cmd.data.name, cmd);
        }
      } catch (err) {
        console.error(`💥 Error loading command at ${modulePath}: `, err);
      }
    }
  }

  console.log(`📦 Total commands registered: ${client.commands.size}`);
}
