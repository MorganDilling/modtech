import ExtendedClient from 'classes/ExtendedClient';
import Timer from 'classes/Timer';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { feedbackChannel } from '../../config.json';

export default class FeedbackUpdate extends Timer {
  public once = false;

  public executeOnStart = true;

  public interval = 1000;

  public async execute(
    client: ExtendedClient,
    ...args: unknown[]
  ): Promise<void> {
    const feedbackCache = client.cache.feedback.map(feedback => feedback);

    for (const feedback of feedbackCache) {
      if (feedback.status == 'pending') {
        const channel = client.channels.cache.get(feedbackChannel);

        if (!channel) return;

        feedback.status = 'open';

        const embed = new EmbedBuilder()
          .setTitle(`Feedback #${feedback.id}`)
          .setDescription(
            `By <@${feedback.userId}>\n\n\`\`\`${feedback.message}\`\`\`\n${
              feedback.attachment1Url ||
              feedback.attachment2Url ||
              feedback.attachment3Url
                ? '**Attachment(s)**\n' +
                  [
                    feedback.attachment1Url,
                    feedback.attachment2Url,
                    feedback.attachment3Url,
                  ]
                    .map((url, index) =>
                      url ? `[Attachment ${index + 1}](${url})\n` : ''
                    )
                    .join('') +
                  '\n'
                : ''
            }**Status**\n\`${
              feedback.status
            }\`\n\n**Last updated**\n<t:${Math.floor(
              feedback.updatedAt.getTime() / 1000
            )}:R>`
          )
          .setColor(client.color);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`feedback-accept-${feedback.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`feedback-reject-${feedback.id}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`feedback-respond-${feedback.id}`)
            .setLabel('Respond')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`feedback-blacklist-${feedback.id}`)
            .setLabel('Blacklist')
            .setStyle(ButtonStyle.Danger)
        );

        const message = await (channel as TextChannel).send({
          embeds: [embed],
          components: [row as any],
        });

        await client.prisma.feedback.update({
          where: {
            id: feedback.id,
          },
          data: {
            discordMessageId: message.id,
            status: 'open',
          },
        });

        client.cache.feedback.set(feedback.id, {
          ...feedback,
          discordMessageId: message.id,
        });
      }
    }
  }
}
