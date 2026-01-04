import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription(
      'Wyświetla avatar wybranego użytkownika lub własny avatar 😌',
    )
    .addUserOption((o) =>
      o
        .setName('member')
        .setDescription('Wybierz użytkownika')
        .setRequired(false),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    console.log('executed ???');

    const member = interaction.options.getUser('member') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`Zdjęcie profilowe 🖼️`)
      .setDescription(
        `Użytkownik: **${member.tag}**\nKliknij na **obrazek**, aby zobaczyć w pełnym rozmiarze 👀`,
      )
      .setColor('Random')
      .setImage(member.displayAvatarURL({ size: 1024 }))
      .setURL(member.avatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
