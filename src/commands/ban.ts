import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';
import generateModLogEmbed from 'utils/generateModLogEmbed';
import durationParser from 'utils/durationParser';

export default class Ban extends Command {
  constructor(name: string) {
    super(name);
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Bans a user from the server')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((option) =>
        option.setName('user').setDescription('User to ban').setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('reason')
          .setDescription('Reason for banning the user')
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName('duration')
          .setDescription('Duration of the ban (e.g. 1d, 1w, 1mo, 1y)')
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName('delete-messages')
          .setDescription('How recently to delete messages')
          .setRequired(false)
          .addChoices(
            { name: 'None', value: 'none' },
            { name: 'Previous Hour', value: '1h' },
            { name: 'Previous 6 Hours', value: '6h' },
            { name: 'Previous 12 Hours', value: '12h' },
            { name: 'Previous 1 Day', value: '1d' },
            { name: 'Previous 3 Days', value: '3d' },
            { name: 'Previous 1 Week', value: '1w' }
          )
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const guild = interaction.guild;
    const user = interaction.options.getUser('user');

    if (!guild) {
      interaction.reply({
        content: '> :warning: You can only use this command in a server',
        ephemeral: true,
      });
      return;
    }

    if (!user) {
      interaction.reply({
        content: '> :warning: You must specify a user to ban',
        ephemeral: true,
      });
      return;
    }

    if (!guild.members.cache.has(user.id)) {
      interaction.reply({
        content: '> :warning: That user is not in this server',
        ephemeral: true,
      });
      return;
    }

    const member = guild.members.cache.get(user.id);

    if (!member) {
      interaction.reply({
        content: '> :warning: That user is not in this server',
        ephemeral: true,
      });
      return;
    }

    if (!member.bannable) {
      interaction.reply({
        content: '> :warning: That user cannot be banned',
        ephemeral: true,
      });
      return;
    }

    const duration = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('duration');
    const deleteMessages = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('delete-messages');

    const durationUnix = durationParser(duration)?.getTime();
    const deleteMessagesUnix = (() => {
      try {
        return durationParser(deleteMessages)?.getTime();
      } catch {
        return -1;
      }
    })();

    const reason = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('reason');

    try {
      await member.ban({
        reason: reason ? reason : 'No reason specified',
        deleteMessageSeconds:
          deleteMessagesUnix && deleteMessagesUnix > 0
            ? Math.floor(deleteMessagesUnix / 1000)
            : undefined,
      });
    } catch (error) {
      throw error;
    }

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild.id,
      },
    });

    if (settings?.logging && settings?.loggingChannelId) {
      const channel = guild.channels.cache.get(
        settings.loggingChannelId
      ) as TextChannel;

      if (!channel) {
        interaction.reply({
          content: `> :white_check_mark: Successfully banned ${user.tag}.\n> :warning: Logging channel not found. Please reconfigure logging settings.`,
          ephemeral: true,
        });
        return;
      }

      const expiryDate = durationUnix
        ? Math.floor(new Date(Date.now() + durationUnix).getTime() / 1000)
        : undefined;

      const embed = generateModLogEmbed(
        client,
        'banned',
        interaction.user.id,
        user.id,
        `for ${reason ? reason : 'No reason specified'}. ${
          expiryDate ? `Expires <t:${expiryDate}>` : ''
        }`
      );

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `> :white_check_mark: Successfully banned ${user.tag}. Action logged.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `> :white_check_mark: Successfully banned ${user.tag}`,
        ephemeral: true,
      });
    }
  }
}
