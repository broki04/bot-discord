import { ClientEvents, Events } from 'discord.js';

export interface Event {
  name: keyof ClientEvents | Events;
  once?: boolean;
  evecute: (...args: any[]) => Promise<void> | void;
}
