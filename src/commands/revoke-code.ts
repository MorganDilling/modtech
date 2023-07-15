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

export default class RevokeCode extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Revokes a specified beta invite code. [Developer-only]';

  devOnly = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option
          .setName('code')
          .setDescription('The invite code to revoke.')
          .setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const code = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('code');

    if (!code) {
      await interaction.reply({
        content: '> :warning: No code provided',
        ephemeral: true,
      });
      return;
    }

    const invite = await client.prisma.betaInviteCode.findFirst({
      where: {
        code,
      },
    });

    if (!invite) {
      await interaction.reply({
        content: `> :warning: Code \`${code}\` does not exist`,
        ephemeral: true,
      });
      return;
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      await interaction.reply({
        content: `> :warning: Code \`${code}\` has expired`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.betaInviteCode.delete({
      where: {
        code,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Revoked code \`${code}\``,
      ephemeral: true,
    });
  }
}
