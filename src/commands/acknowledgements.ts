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
import fs from 'fs';

export default class Acknowledgements extends Command {
  constructor(name: string) {
    super(name);
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('View acknowledgements.');
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const packageJson = JSON.parse(
      fs.readFileSync('./package.json', { encoding: 'utf-8' })
    );

    const acknowledgementsEmbed = new EmbedBuilder()
      .setTitle('Acknowledgements')
      .setDescription(
        'This bot is powered by the following packages:' +
          Object.keys(packageJson.dependencies)
            .map(
              (dependency) =>
                `\n- [${dependency}](https://www.npmjs.com/package/${dependency})`
            )
            .join('') +
          '\n\n' +
          'This bot is licensed under the MIT license. For more information, see https://github.com/MorganDilling/modtech/blob/master/LICENSE.'
      )
      .setColor(client.color);

    await interaction.reply({
      embeds: [acknowledgementsEmbed],
      ephemeral: true,
    });
  }
}
