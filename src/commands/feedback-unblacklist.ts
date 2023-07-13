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

export default class FeedbackUnblacklist extends Command {
  constructor(name: string) {
    super(name);
  }

  description =
    'Unblacklists a user from using the feedback system. [Developer-only]';

  devOnly = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(true)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option
          .setName('user-id')
          .setDescription('User ID of the user to unblacklist')
          .setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const userId = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('user-id');

    if (!userId) {
      await interaction.reply({
        content: '> :warning: User ID not provided',
        ephemeral: true,
      });
      return;
    }

    await client.prisma.feedbackBlacklist.delete({
      where: {
        userId: userId,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Unblacklisted user \`${userId}\``,
      ephemeral: true,
    });
  }
}
