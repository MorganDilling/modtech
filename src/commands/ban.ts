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

  description = 'Bans a user from the server';

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(option =>
        option.setName('user').setDescription('User to ban').setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for banning the user')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('duration')
          .setDescription('Duration of the ban (e.g. 1d, 1w, 1mo, 1y)')
          .setRequired(false)
      )
      .addStringOption(option =>
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

    let couldDM = true;
    try {
      await user.send({
        content: `> :warning: You have been banned from **${guild.name}**${
          reason ? ` for the following reason:\n> \`\`\`${reason}\`\`\`` : ''
        }${
          durationUnix
            ? `\n> :information_source: Expires <t:${Math.floor(
                new Date(Date.now() + durationUnix).getTime() / 1000
              )}:R>`
            : ''
        }`,
      });
    } catch {
      couldDM = false;
    }

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
          content: `> :white_check_mark: Successfully banned ${
            user.tag
          }.\n> :warning: Logging channel not found. Please reconfigure logging settings.${
            couldDM ? '' : '\n> :warning: Could not DM user'
          }`,
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
          expiryDate ? `Expires <t:${expiryDate}:R>` : ''
        }`
      );

      if (durationUnix) {
        const ban = await client.prisma.ban.create({
          data: {
            guildId: guild.id,
            userId: user.id,
            expiresAt: new Date(Date.now() + durationUnix),
            moderatorId: interaction.user.id,
          },
        });

        client.cache.bans.set(ban.id, ban);
      }

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `> :white_check_mark: Successfully banned ${
          user.tag
        }. Action logged.${couldDM ? '' : '\n> :warning: Could not DM user'}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `> :white_check_mark: Successfully banned ${user.tag}${
          couldDM ? '' : '\n> :warning: Could not DM user'
        }`,
        ephemeral: true,
      });
    }
  }
}
