import Command from 'classes/Command';
import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  CommandInteractionOptionResolver,
  EmbedBuilder,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class ViewFeedback extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'View feedback you have sent';

  public betaOnly: boolean = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(option =>
        option.setName('id').setDescription('Feedback ID').setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const id = (
      interaction.options as CommandInteractionOptionResolver
    ).getString('id');

    if (!id) {
      await interaction.reply({
        content: '> Please provide a feedback ID',
        ephemeral: true,
      });
      return;
    }

    const feedback = await client.prisma.feedback.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!feedback) {
      await interaction.reply({
        content: '> Feedback not found.',
        ephemeral: true,
      });
      return;
    }

    if (feedback.userId !== interaction.user.id) {
      await interaction.reply({
        content: '> Feedback not found.',
        ephemeral: true,
      });
      return;
    }

    const feedbackEmbed = new EmbedBuilder()
      .setTitle(`Feedback #${feedback.id}`)
      .setDescription(
        `**Feedback**\n\`\`\`${feedback.message}\`\`\`\n${
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
        )}:R>\n\n${
          feedback.response
            ? '**Response**\n```' + feedback.response + '```'
            : ''
        }
        `
      )
      .setColor(client.color);

    await interaction.reply({
      embeds: [feedbackEmbed],
      ephemeral: true,
    });
  }
}
