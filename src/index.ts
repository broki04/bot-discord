import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (clientReady) => {
  console.log(`🚀 Bot ${clientReady.user.tag} is ready.`);
});

client.login(process.env.DISCORD_TOKEN);
