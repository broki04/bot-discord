import { Client, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(c: Client) {
    console.log(`🚀 Bot ${c.user?.tag} (🆔 ${c.user?.id}) is ready.`);
    console.log(`🚀 Present on ${c.guilds.cache.size} servers.`);
  },
};
