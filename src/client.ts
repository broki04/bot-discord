import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { Command } from './interfaces/Command';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,
    Partials.Reaction,
    Partials.Channel,
    Partials.GuildMember,
    Partials.User,
  ],
});

client.commands = new Collection();

export default client;
