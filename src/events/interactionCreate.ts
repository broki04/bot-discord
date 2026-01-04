import {
  ChatInputCommandInteraction,
  Interaction,
  MessageFlags,
} from 'discord.js';
import { commands } from '../handlers/commandHandler';

export async function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guildId) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: '❌ Wystąpił błąd podczas wykonywania tej komendy.',
      flags: MessageFlags.Ephemeral,
    });
  }
}
