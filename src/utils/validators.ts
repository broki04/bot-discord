import { ClientEvents, SlashCommandBuilder } from 'discord.js';
import { Command } from '../interfaces/Command';

const loadedCommandNames = new Set<string>();
const loadedEventNames = new Set<keyof ClientEvents>();

// * commands
export function isValidCommand(obj: any): obj is Command {
  if (!obj || typeof obj !== 'object') return false;

  if (!obj.data || typeof obj.data.name !== 'string') return false;
  if (!obj.execute || typeof obj.execute !== 'function') return false;

  if (loadedCommandNames.has(obj.data.name)) return false;
  loadedCommandNames.add(obj.data.name);
  return true;
}

export function resetCommandValidator() {
  loadedCommandNames.clear();
}

// * events
export function isValidEvent(obj: any): obj is Event {
  if (!obj || typeof obj !== 'object') return false;
  if (!obj.name || typeof obj.name !== 'string') return false;
  if (typeof obj.execute !== 'function') return false;
  if (obj.once !== undefined && typeof obj.once !== 'boolean') return false;

  if (loadedEventNames.has(obj.name)) return false;
  loadedEventNames.add(obj.name);
  return true;
}

export function resetEventValidator() {
  loadedEventNames.clear();
}
