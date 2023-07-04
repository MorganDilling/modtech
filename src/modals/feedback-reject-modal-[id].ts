import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class FeedbackRejectModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction,
    pathData: { id: string }
  ): Promise<void> {
    const { id } = pathData;

    const response = interaction.fields.getTextInputValue('feedback-response');

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

    if (!feedback.discordMessageId) {
      await interaction.reply({
        content: '> :warning: Feedback message not found',
        ephemeral: true,
      });
      return;
    }

    const message = await interaction.channel?.messages.fetch(
      feedback.discordMessageId
    );

    if (!message) {
      await interaction.reply({
        content: '> :warning: Feedback message not found',
        ephemeral: true,
      });
      return;
    }

    const updatedFeedback = await client.prisma.feedback.update({
      where: {
        id: parseInt(id),
      },
      data: {
        response,
        status: 'rejected',
      },
    });

    const embed = new EmbedBuilder()
      .setTitle(`Feedback #${updatedFeedback.id}`)
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

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`feedback-respond-${feedback.id}`)
        .setLabel('Respond')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.edit({
      embeds: [embed],
      components: [row as any],
    });

    client.cache.feedback.delete(feedback.id);

    await interaction.reply({
      content: '> :white_check_mark: Feedback rejected',
      ephemeral: true,
    });
  }
}
