import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';
import generateInviteCode from 'utils/testingCodeGenerator';

export default class GenerateInvite extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Generates a testing programme invite code. [Developer-only]';

  devOnly = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addNumberOption(option =>
        option
          .setName('max-servers')
          .setDescription(
            '(1+) Max number of servers that can use this invite code.'
          )
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('unix-expiry')
          .setDescription(
            'Unix timestamp of when the invite code should expire. (Set to -1 to disable expiry)'
          )
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Optional name of invite code')
          .setRequired(false)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const maxServers = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getNumber('max-servers');

    const unixExpiry = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('unix-expiry');

    const name = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('name');

    if (maxServers !== null && maxServers < 1) {
      await interaction.reply({
        content: '> :warning: Max servers must be at least 1',
        ephemeral: true,
      });
      return;
    }

    if (!maxServers || !unixExpiry) {
      await interaction.reply({
        content: '> :warning: Max servers or expiry not provided',
        ephemeral: true,
      });
      return;
    }

    const inviteCodeString = await generateInviteCode(client);

    const invite = await client.prisma.betaInviteCode.create({
      data: {
        code: inviteCodeString,
        maxUses: maxServers,
        expiresAt:
          unixExpiry === '-1' ? null : new Date(parseInt(unixExpiry) * 1000),
        generatedById: interaction.user.id,
        name,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Generated invite code \`${
        invite.code
      }\` with max servers \`${invite.maxUses}\`.${
        invite.expiresAt
          ? ` Expires <t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>.`
          : ``
      }`,
      ephemeral: true,
    });
  }
}
