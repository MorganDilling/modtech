import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';
import generateModLogEmbed from 'utils/generateModLogEmbed';

export default class Kick extends Command {
  constructor(name: string) {
    super(name);
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Kick a user from the server')
      .setDMPermission(false)
      .setDefaultMemberPermissions(2) // KICK_MEMBERS
      .addUserOption((option) =>
        option.setName('user').setDescription('User to kick').setRequired(true)
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
        content: '> :warning: You must specify a user to kick',
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

    if (!member.kickable) {
      interaction.reply({
        content: '> :warning: That user cannot be kicked',
        ephemeral: true,
      });
      return;
    }

    try {
      await member.kick();
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
          content: `> :white_check_mark: Successfully kicked ${user.tag}.\n> :warning: Logging channel not found. Please reconfigure logging settings.`,
          ephemeral: true,
        });
        return;
      }

      const embed = generateModLogEmbed(
        client,
        'kicked',
        interaction.user.id,
        user.id
      );

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `> :white_check_mark: Successfully kicked ${user.tag}. Action logged.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `> :white_check_mark: Successfully kicked ${user.tag}`,
        ephemeral: true,
      });
    }
  }
}
