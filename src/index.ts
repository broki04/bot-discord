import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadCommands } from './handlers/commandHandler';
import { deployCommands } from './handlers/deployHandler';
import { handleInteractionCreate } from './events/interactionCreate';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

await loadCommands();
await deployCommands();

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log(interaction.commandName, ' wywołana');
});

client.once(Events.ClientReady, () => {
  console.log(`🚀 Bot ${client.user?.tag} is ready.`);
  console.log(`🚀 Present on ${client.guilds.cache.size} servers.`);
});

client.login(process.env.DISCORD_TOKEN);
