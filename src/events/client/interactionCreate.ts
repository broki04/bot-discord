import {
  ChatInputCommandInteraction,
  Events,
  Interaction,
  MessageFlags,
} from 'discord.js';

import { client } from '../../client';
import { logger } from '../../utils/logger';

export const name = Events.InteractionCreate;
export const once = false;

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    console.log('aaacb');

    logger.debug(
      `executed /${interaction.commandName} (cmdId: ${interaction.commandId} | typeId: ${interaction.type})`,
    );

    logger.debug(`map of client.commands:`);

    client.commands.forEach((cmd, name) => {
      logger.debug(`   -> ${name}: `, {
        hasData: !!cmd.data,
        nameInData: cmd.data?.name,
        hasExecute: typeof cmd.execute === 'function',
      });
    });

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content:
          '❌ Komenda nie została znaleziona w kolekcji! Zgłoś ten błąd do support.',
        flags: MessageFlags.Ephemeral,
      });

      logger.debug(`Command is undefined`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error('Error while executing ', err);
    }
  },
};
