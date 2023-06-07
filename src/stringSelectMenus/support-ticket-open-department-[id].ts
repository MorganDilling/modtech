import StringSelectMenu from 'classes/StringSelectMenu';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class SupportTicketOpenDepartment extends StringSelectMenu {
  public async execute(
    client: ExtendedClient,
    interaction: StringSelectMenuInteraction,
    pathData: { id: string }
  ): Promise<void> {
    const { id: ticketId } = pathData;

    const ticket = await client.prisma.ticket.findUnique({
      where: {
        id: parseInt(ticketId),
      },
    });

    if (ticket && ticket.supportDepartmentId) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Error')
            .setDescription(
              'If you want to change the department of your ticket, please ask once your ticket has been claimed.'
            )
            .setColor(client.color),
        ],
        ephemeral: true,
      });
      return;
    }

    const departmentId = interaction.values[0];
    const department = await client.prisma.supportDepartments.findUnique({
      where: {
        id: parseInt(departmentId),
      },
    });

    if (!department) {
      interaction.reply({
        content: 'This department no longer exists',
        ephemeral: true,
      });
      return;
    }

    if (!ticket) {
      interaction.reply({
        content: 'This ticket no longer exists',
        ephemeral: true,
      });
      return;
    }

    const departmentChannel = (await client.channels.fetch(
      department.inboxChannelId
    )) as TextChannel;

    const claimEmbed = new EmbedBuilder()
      .setTitle('New ticket')
      .setColor(client.color)
      .setDescription(
        `A new ticket has been opened by <@${ticket.userId}>.\n\n**Title**\n\`\`\`${ticket.title}\`\`\`\n**Issue**\n\`\`\`${ticket.issue}\`\`\``
      )
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`support-ticket-claim-${ticket.id}`)
        .setLabel('Claim')
        .setStyle(ButtonStyle.Primary)
    );

    const claimMessage = await departmentChannel.send({
      embeds: [claimEmbed],
      components: [claimRow as any],
    });

    await client.prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        supportDepartmentId: department.id,
        claimMessageId: claimMessage.id,
      },
    });

    const embed = new EmbedBuilder()
      .setTitle('Support ticket')
      .setDescription(
        'A ticket has been opened. Once someone has claimed your ticket, a channel will be opened for you to discuss your issue.'
      )
      .setColor(client.color);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}
