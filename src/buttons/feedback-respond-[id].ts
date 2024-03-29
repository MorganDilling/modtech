import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

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

    const modal = new ModalBuilder()
      .setCustomId(`feedback-respond-modal-${id}`)
      .setTitle('Update response');

    const response = new TextInputBuilder()
      .setCustomId('feedback-response')
      .setLabel('Response')
      .setPlaceholder('Feedback response')
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder().addComponents(response);

    modal.addComponents(row1 as any);

    await interaction.showModal(modal);
  }
}
