import StringSelectMenu from 'classes/StringSelectMenu';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  OverwriteType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import GuildNotFoundException from 'exceptions/GuildNotFoundException';
import Exception from 'exceptions/Exception';

export default class SupportTicketTransferDepartment extends StringSelectMenu {
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
      include: {
        supportDepartment: true,
      },
    });

    const departmentId = interaction.values[0];
    const department = await client.prisma.supportDepartments.findUnique({
      where: {
        id: parseInt(departmentId),
      },
    });

    if (!department) {
      await interaction.reply({
        content: 'This department no longer exists',
        ephemeral: true,
      });
      return;
    }

    if (!ticket) {
      await interaction.reply({
        content: 'This ticket no longer exists',
        ephemeral: true,
      });
      return;
    }

    const departmentChannel = (await client.channels.fetch(
      department.inboxChannelId
    )) as TextChannel;

    const claimEmbed = new EmbedBuilder()
      .setTitle('Transferred ticket')
      .setColor(client.color)
      .setDescription(
        `A ticket has been transferred by <@${interaction.user.id}>. Ticket owned by <@${ticket.userId}>.\n\n**Title**\n\`\`\`${ticket.title}\`\`\`\n**Issue**\n\`\`\`${ticket.issue}\`\`\``
      )
      .setTimestamp();

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`support-ticket-claim-${ticket.id}`)
        .setLabel('Reclaim')
        .setStyle(ButtonStyle.Primary)
    );

    if (!ticket.supportDepartment) throw new Exception('No department');

    const currentDepartmentChannel = (await client.channels.fetch(
      ticket.supportDepartment?.inboxChannelId
    )) as TextChannel;

    const inboxMessage = await (
      currentDepartmentChannel as TextChannel
    ).messages.fetch(ticket.claimMessageId as string);

    if (!inboxMessage) {
      await interaction.reply({
        content: 'This ticket no longer exists',
        ephemeral: true,
      });
      return;
    }

    if (ticket.supportDepartmentId !== department.id) {
      await inboxMessage.delete();

      const newMessage = await departmentChannel.send({
        embeds: [claimEmbed],
        components: [claimRow as any],
      });

      if (!ticket.channelId) throw new Exception('No channel');

      const channel = (await client.channels.fetch(
        ticket.channelId
      )) as TextChannel;

      await channel.setParent(departmentChannel.parentId);

      await client.prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          supportDepartmentId: department.id,
          claimMessageId: newMessage.id,
        },
      });
    } else {
      await inboxMessage.edit({
        embeds: [claimEmbed],
        components: [claimRow as any],
      });
    }

    await client.prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        supportDepartmentId: department.id,
        claimed: false,
        claimerId: null,
      },
    });

    if (!ticket.channelId) throw new Exception('No channel');

    const channel = (await client.channels.fetch(
      ticket.channelId
    )) as TextChannel;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('Ticket transferred')
          .setColor(client.color)
          .setDescription(
            `This ticket has been transferred to the ${department.name} department. Please wait for a member of staff to reclaim the ticket.`
          )
          .setTimestamp(),
      ],
    });

    if (!interaction.guild) throw new GuildNotFoundException();

    await (channel as TextChannel).permissionOverwrites.set([
      {
        id: interaction.guild.id,
        type: OverwriteType.Role,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: ticket.userId,
        type: OverwriteType.Member,
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ]);

    await interaction?.reply({
      content: '> :white_check_mark: Ticket transferred',
      ephemeral: true,
    });
  }
}
