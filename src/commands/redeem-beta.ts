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

export default class RedeemBeta extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Redeem a beta invite code.';

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option
          .setName('code')
          .setDescription('Beta invite code')
          .setRequired(true)
      )
      .addBooleanOption(option =>
        option
          .setName('force')
          .setDescription('Force redeem the code')
          .setRequired(false)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const code = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('code');

    const force = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getBoolean('force');

    if (!interaction.guild?.id) {
      await interaction.reply({
        content: '> :warning: This command can only be used in a server',
        ephemeral: true,
      });
      return;
    }

    const guild = await client.prisma.guild.findUnique({
      where: {
        id: interaction.guild.id,
      },
    });

    if (!code) {
      await interaction.reply({
        content: '> :warning: Code not provided',
        ephemeral: true,
      });
      return;
    }

    const invite = await client.prisma.betaInviteCode.findUnique({
      where: {
        code: code,
      },
    });

    if (!invite) {
      await interaction.reply({
        content: '> :warning: Invalid code',
        ephemeral: true,
      });
      return;
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      await interaction.reply({
        content: '> :warning: Code has expired',
        ephemeral: true,
      });
      return;
    }

    if (invite.uses >= invite.maxUses) {
      await interaction.reply({
        content: '> :warning: Code has reached max uses',
        ephemeral: true,
      });
      return;
    }

    if (guild?.betaInviteCode && !force) {
      await interaction.reply({
        content: `> :warning: Guild already has a code redeemed. Use \`/redeem-beta code: ${guild.betaInviteCode} force: true\` to override`,
        ephemeral: true,
      });
      return;
    }

    if (guild?.betaInviteCode && force) {
      await client.prisma.betaInviteCode.update({
        where: {
          code: guild.betaInviteCode,
        },
        data: {
          uses: {
            decrement: 1,
          },
        },
      });
    }

    if (!guild) {
      await interaction.reply({
        content: '> :warning: Guild not found',
        ephemeral: true,
      });
      return;
    }

    await client.prisma.guild.update({
      where: {
        id: guild.id,
      },
      data: {
        betaInviteCode: code,
      },
    });

    await client.prisma.betaInviteCode.update({
      where: {
        code: code,
      },
      data: {
        uses: {
          increment: 1,
        },
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Redeemed code \`${code}\`! Enjoy beta access :tada:\nPlease report any bugs or issues through the /feedback command.`,
      ephemeral: true,
    });
  }
}
