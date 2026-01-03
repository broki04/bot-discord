import { Client, Events } from 'discord.js';
import { loadCommands } from '../handlers/commandHandler';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client: Client) {
    console.log(`🚀 Bot ${client.user?.tag} is ready.`);
    console.log(`🚀 Present on ${client.guilds.cache.size} servers.`);

    await loadCommands();
  },
};
