import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonInteraction,
  EmbedBuilder,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import { createTranscript } from 'discord-html-transcripts';

export default class FeedbackResponse extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction,
    pathData: { id: string }
  ): Promise<void> {
    const { id } = pathData;

    const feedback = await client.prisma.feedback.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!feedback) {
      await interaction.reply({
        content: '> :warning: Feedback not found',
        ephemeral: true,
      });
      return;
    }

    const userId = feedback.userId;

    await client.prisma.feedbackBlacklist.upsert({
      create: {
        userId,
      },
      update: {},
      where: {
        userId,
      },
    });

    const updatedFeedback = await client.prisma.feedback.update({
      where: {
        id: parseInt(id),
      },
      data: {
        response: 'You have been blacklisted from using the feedback command.',
        status: 'rejected',
      },
    });

    client.cache.feedback.delete(feedback.id);

    const embed = new EmbedBuilder()
      .setTitle(`Feedback #${updatedFeedback.id} (USER BLACKLISTED)`)
      .setDescription(
        `By <@${updatedFeedback.userId}>\n\n\`\`\`${
          updatedFeedback.message
        }\`\`\`\n${
          updatedFeedback.attachment1Url ||
          updatedFeedback.attachment2Url ||
          updatedFeedback.attachment3Url
            ? '**Attachment(s)**\n' +
              [
                updatedFeedback.attachment1Url,
                updatedFeedback.attachment2Url,
                updatedFeedback.attachment3Url,
              ]
                .map((url, index) =>
                  url ? `[Attachment ${index + 1}](${url})\n` : ''
                )
                .join('') +
              '\n'
            : ''
        }**Status**\n\`${
          updatedFeedback.status
        }\`\n\n**Last updated**\n<t:${Math.floor(
          updatedFeedback.updatedAt.getTime() / 1000
        )}:R>\n\n${
          updatedFeedback.response
            ? '**Response**\n```' + updatedFeedback.response + '```'
            : ''
        }`
      )
      .setColor(client.color);

    await interaction.message.edit({
      embeds: [embed],
      components: [],
    });

    await interaction.reply({
      content: `> :white_check_mark: Blacklisted <@${userId}> from using the feedback command`,
      ephemeral: true,
    });
  }
}
