import Command from 'classes/Command';
import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  CommandInteractionOptionResolver,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class Feedback extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Sent feedback to the developers';

  cooldown = 3600;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(option =>
        option
          .setName('feedback')
          .setDescription('Feedback to send')
          .setRequired(true)
      )
      .addAttachmentOption(option =>
        option
          .setName('attachment-1')
          .setDescription('Attachment to send with feedback')
          .setRequired(false)
      )
      .addAttachmentOption(option =>
        option
          .setName('attachment-2')
          .setDescription('Attachment to send with feedback')
          .setRequired(false)
      )
      .addAttachmentOption(option =>
        option
          .setName('attachment-3')
          .setDescription('Attachment to send with feedback')
          .setRequired(false)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const blacklisted = await client.prisma.feedbackBlacklist.findFirst({
      where: {
        userId: interaction.user.id,
      },
    });

    if (blacklisted) {
      await interaction.reply({
        content:
          '> :warning: You are blacklisted from sending feedback. If you believe this is a mistake, please contact a developer.',
        ephemeral: true,
      });
      return;
    }

    const feedback = (
      interaction.options as CommandInteractionOptionResolver
    ).getString('feedback');

    const attachment1 = (
      interaction.options as CommandInteractionOptionResolver
    ).getAttachment('attachment-1');

    const attachment2 = (
      interaction.options as CommandInteractionOptionResolver
    ).getAttachment('attachment-2');

    const attachment3 = (
      interaction.options as CommandInteractionOptionResolver
    ).getAttachment('attachment-3');

    if (!feedback) {
      await interaction.reply({
        content: '> Please provide feedback',
        ephemeral: true,
      });
      return;
    }

    const feedbackEntry = await client.prisma.feedback.create({
      data: {
        userId: interaction.user.id,
        message: feedback,
        attachment1Url: attachment1?.url,
        attachment2Url: attachment2?.url,
        attachment3Url: attachment3?.url,
        status: 'pending',
      },
    });

    client.cache.feedback.set(feedbackEntry.id, feedbackEntry);

    await interaction.reply({
      content: `> Feedback sent! Your feedback ID is \`#${feedbackEntry.id}\`. **Please make note of this to view updates.** You can view your feedback with \`/view-feedback ${feedbackEntry.id}\``,
      ephemeral: true,
    });
  }
}
