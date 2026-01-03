import { Collection } from 'discord.js';
import { Command } from '../interfaces/Command';
import path from 'path';
import fs from 'fs';
import { __dirname } from '../utils/path';

const commands = new Collection<string, Command>();

export async function loadCommands() {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      const subFiles = fs
        .readdirSync(filePath)
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
      for (const sub of subFiles) {
        const subPath = path.join(filePath, sub);
        const cmd: { command: Command } = require(subPath);
        commands.set(cmd.command.data.name, cmd.command);
      }
    } else {
      const cmd: { command: Command } = require(filePath);
      commands.set(cmd.command.data.name, cmd.command);
    }
  }

  console.log(`✅ Loaded ${commands.size} commands.`);
}
