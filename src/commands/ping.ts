import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { Command } from '../interfaces/Command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Sprawdź opóźnienie bota 🤖'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: 'pong',
      flags: MessageFlags.Ephemeral,
    });
  },
};
