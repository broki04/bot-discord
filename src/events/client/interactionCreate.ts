import {
  ChatInputCommandInteraction,
  Events,
  Interaction,
  MessageFlags,
} from 'discord.js';

import { client } from '../../client';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const isDebug = process.env.DEBUG_MODE === 'true';

  if (isDebug) {
    console.log(`[CMD DEBUG] Nazwa komendy: ${interaction.commandName}`);
    console.log(`[CMD DEBUG] Typ interakcji: ${interaction.type}`);
    console.log(`[CMD DEBUG] ID komendy: ${interaction.commandId}`);
    console.log(
      `[CMD DEBUG] Klucze client.commands: ${[...client.commands.keys()]}`,
    );
    console.log(`[CMD DEBUG] Pełna mapa client.commands: `);

    client.commands.forEach((cmd, name) => {
      console.log(`   -> ${name}: `, {
        hasData: !!cmd.data,
        nameInData: cmd.data?.name,
        hasExecute: typeof cmd.execute === 'function',
      });
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content:
        '❌ Komenda nie została znaleziona w kolekcji! Zgłoś ten błąd do support.',
      flags: MessageFlags.Ephemeral,
    });

    if (isDebug) {
      console.log(`[CMD DEBUG] Komenda jest undefined.`);
    }
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error('❌ Błąd wykonania: ', err);
  }
}
