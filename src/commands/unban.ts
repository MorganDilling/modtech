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

export default class Unban extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Unbans a user from the server';

  public betaOnly: boolean = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(option =>
        option.setName('user').setDescription('User to unban').setRequired(true)
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
        content: '> :warning: You must specify a user to unban',
        ephemeral: true,
      });
      return;
    }

    const bans = await guild.bans.fetch();
    const ban = bans.get(user.id);

    console.log(ban);

    if (!ban) {
      await interaction.reply({
        content: '> :warning: That user is not banned',
        ephemeral: true,
      });
      return;
    }

    try {
      await guild.members.unban(user);
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
          content: `> :white_check_mark: Successfully unbanned ${user.tag}.\n> :warning: Logging channel not found. Please reconfigure logging settings.
          }`,
          ephemeral: true,
        });
        return;
      }

      const embed = generateModLogEmbed(
        client,
        'unbanned',
        interaction.user.id,
        user.id
      );

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `> :white_check_mark: Successfully unbanned ${user.tag}. Action logged.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `> :white_check_mark: Successfully unbanned ${user.tag}`,
        ephemeral: true,
      });
    }

    const cachedBan = client.cache.bans.find(
      ban => ban.userId === user.id && ban.guildId === guild.id
    );

    if (cachedBan) {
      await client.prisma.ban.delete({
        where: {
          id: cachedBan.id,
        },
      });

      client.cache.bans.delete(cachedBan.id);
    }
  }
}
