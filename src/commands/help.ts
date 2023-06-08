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
  EmbedBuilder,
  ColorResolvable,
  PermissionFlagsBits,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import { owners } from '../../config.json';

export default class Help extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Get commmand help.';

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption((option) =>
        option
          .setName('command')
          .setDescription('Command to get help for')
          .setRequired(false)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const commands = client.commands;

    const commandName = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('command');

    const helpEmbedAll = new EmbedBuilder()
      .setTitle('Help')
      .setDescription(
        commands
          .filter(
            (command) =>
              !command.devOnly || owners.includes(interaction.user.id)
          )
          .map((command) => `\`/${command.name}\`\n- ${command.description}`)
          .join('\n')
      )
      .setColor(client.color);

    const cmdEmbedDescription = commands
      .filter(
        (command) =>
          command.name === commandName &&
          (!command.devOnly || owners.includes(interaction.user.id))
      )
      .map((command) => `\`/${command.name}\`\n- ${command.description}`)
      .join('\n');

    const helpEmbedCommand = new EmbedBuilder()
      .setTitle(`Help - ${commandName}`)
      .setDescription(
        cmdEmbedDescription ||
          'Command not found. Use `/help` to see all commands.'
      )
      .setColor(client.color);

    await interaction.reply({
      embeds: [commandName ? helpEmbedCommand : helpEmbedAll],
      ephemeral: true,
    });
  }
}
