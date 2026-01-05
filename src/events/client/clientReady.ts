import { Client, Events } from 'discord.js';
import { logger } from '../../utils/logger';

export default {
  name: Events.ClientReady,
  once: true,
  execute(c: Client) {
    logger.info(`Bot ${c.user?.tag} (🆔 ${c.user?.id}) is ready.`);
    logger.info(`Present on ${c.guilds.cache.size} servers.`);
  },
};
