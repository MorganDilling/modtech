import Command from 'classes/Command';
import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  CommandInteractionOptionResolver,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowData,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class Echo extends Command {
  constructor(name: string) {
    super(name);
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Echoes your message (example command)')
      .addStringOption((option) =>
        option
          .setName('message')
          .setDescription('The message to echo')
          .setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const message = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('message');

    if (!message) {
      interaction.reply({
        content: '> :warning: | Please provide a message to echo',
        ephemeral: true,
      });
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('echo-delete')
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: `> :information_source: ${message}`,
      components: [row as any],
    });
  }
}
