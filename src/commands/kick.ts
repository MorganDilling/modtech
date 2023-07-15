import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';
import generateModLogEmbed from 'utils/generateModLogEmbed';

export default class Kick extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Kick a user from the server';

  public betaOnly: boolean = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(option =>
        option.setName('user').setDescription('User to kick').setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('reason')
          .setDescription('Reason for kicking the user')
          .setRequired(false)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const guild = interaction.guild;
    const user = interaction.options.getUser('user');

    if (!guild) {
      await interaction.reply({
        content: '> :warning: You can only use this command in a server',
        ephemeral: true,
      });
      return;
    }

    if (!user) {
      await interaction.reply({
        content: '> :warning: You must specify a user to kick',
        ephemeral: true,
      });
      return;
    }

    if (!guild.members.cache.has(user.id)) {
      await interaction.reply({
        content: '> :warning: That user is not in this server',
        ephemeral: true,
      });
      return;
    }

    const member = guild.members.cache.get(user.id);

    if (!member) {
      await interaction.reply({
        content: '> :warning: That user is not in this server',
        ephemeral: true,
      });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({
        content: '> :warning: That user cannot be kicked',
        ephemeral: true,
      });
      return;
    }

    const reason = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('reason');

    let couldDM = true;
    try {
      await user.send({
        content: `> :warning: You have been kicked from **${guild.name}**${
          reason ? ` for the following reason:\n> \`\`\`${reason}\`\`\`` : ''
        }`,
      });
    } catch {
      couldDM = false;
    }

    try {
      await member.kick(reason ? reason : 'No reason specified');
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
          content: `> :white_check_mark: Successfully kicked ${
            user.tag
          }.\n> :warning: Logging channel not found. Please reconfigure logging settings.${
            couldDM ? '' : '\n> :warning: Could not DM user'
          }`,
          ephemeral: true,
        });
        return;
      }

      const embed = generateModLogEmbed(
        client,
        'kicked',
        interaction.user.id,
        user.id,
        `for ${reason ? reason : 'No reason specified'}.`
      );

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `> :white_check_mark: Successfully kicked ${
          user.tag
        }. Action logged.${couldDM ? '' : '\n> :warning: Could not DM user'}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `> :white_check_mark: Successfully kicked ${user.tag}${
          couldDM ? '' : '\n> :warning: Could not DM user'
        }`,
        ephemeral: true,
      });
    }
  }
}
