import { Events } from 'discord.js';
import { client } from '../../client';

export const name = Events.ClientReady;
export const once = true;

export function execute(c: typeof client) {
  console.log(`🚀 Bot ${c.user?.tag} (🆔 ${c.user?.id}) is ready.`);
  console.log(`🚀 Present on ${c.guilds.cache.size} servers.`);
}
