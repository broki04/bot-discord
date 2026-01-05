import 'dotenv/config';
import { client } from './client';
import { registerEvents } from './events';
import { registerCommands } from './commands';
import { deployCommands } from './commands/deploy-commands';
import { logger } from './utils/logger';

async function initBot() {
  try {
    await registerCommands();
    await registerEvents();

    await deployCommands();

    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    logger.error('Error while startup: ', err);
    process.exit(1);
  }
}

initBot();
