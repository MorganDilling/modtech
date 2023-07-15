import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import { SupportDepartments } from '@prisma/client';
import FailedToCreateTicketChannelException from 'exceptions/FailedToCreateTicketChannelException';
import ChannelNotFoundException from 'exceptions/ChannelNotFoundException';
import GuildNotFoundException from 'exceptions/GuildNotFoundException';

export default class SupportTicketClaim extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction,
    pathData: { id: string }
  ): Promise<void> {
    if (!client.user) {
      await interaction.reply({
        content: `> :warning: Failed to claim ticket. (Client does not exist)`,
      });
      return;
    }

    const { id: ticketId } = pathData;
    const ticket = await client.prisma.ticket.findUnique({
      where: {
        id: parseInt(ticketId),
      },
    });

    if (!ticket) {
      await interaction.reply({
        content: `> :warning: Ticket with ID \`${ticketId}\` not found`,
      });
      return;
    }

    let department: SupportDepartments | null = null;
    if (!ticket.supportDepartmentId) {
      department = await client.prisma.supportDepartments.findFirst({
        where: {
          inboxChannelId: interaction.channelId,
        },
      });
    } else {
      department = await client.prisma.supportDepartments.findUnique({
        where: {
          id: ticket.supportDepartmentId,
        },
      });
    }

    if (!department) {
      await interaction.reply({
        content: `> :warning: Support department not found`,
      });
      return;
    }

    if (!ticket.channelId) {
      const channel = await interaction.guild?.channels.create({
        type: ChannelType.GuildText,
        name: `ticket-${ticket.id}`,
        reason: `Ticket claimed by ${interaction.user.tag}`,
        parent: department.ticketsCategoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            type: OverwriteType.Role,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: ticket.userId,
            type: OverwriteType.Member,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            type: OverwriteType.Member,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: client.user.id,
            type: OverwriteType.Member,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      if (!channel) {
        throw new FailedToCreateTicketChannelException(ticket.id);
      }

      await client.prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          channelId: channel.id,
          claimerId: interaction.user.id,
          claimed: true,
        },
      });

      await interaction.reply({
        content: `> :white_check_mark: Ticket opened in <#${channel.id}>`,
        ephemeral: true,
      });

      const channelEmbed = new EmbedBuilder()
        .setTitle('Ticket')
        .setColor(client.color)
        .setDescription(
          `**Title**\n\`\`\`${ticket.title}\`\`\`\n**Issue**\n\`\`\`${ticket.issue}\`\`\`\n\nHi <@${ticket.userId}>,\n\nThank you for opening a ticket. We will get back to you as soon as possible.`
        )
        .setTimestamp()
        .setColor(client.color);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`support-ticket-close-${ticket.id}`)
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`support-ticket-transfer-${ticket.id}`)
          .setLabel('Transfer')
          .setStyle(ButtonStyle.Primary)
      );

      const message = await (channel as TextChannel).send({
        embeds: [channelEmbed],
        components: [row as any],
      });

      await message.pin();

      const pingMessage = await (channel as TextChannel).send({
        content: `<@${ticket.userId}>`,
      });

      await pingMessage.delete();

      await (channel as TextChannel).send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `:white_check_mark: Ticket claimed by <@${interaction.user.id}>`
            )
            .setColor(client.color),
        ],
      });
    } else {
      await client.prisma.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          claimerId: interaction.user.id,
          claimed: true,
        },
      });

      await interaction.reply({
        content: `> :white_check_mark: Ticket claimed. Go to <#${ticket.channelId}>`,
        ephemeral: true,
      });

      const channel = await client.channels.fetch(ticket.channelId);

      if (!channel) {
        throw new ChannelNotFoundException(ticket.channelId);
      }

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
        {
          id: interaction.user.id,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: client.user.id,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ]);

      await (channel as TextChannel).send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `:white_check_mark: Ticket reclaimed by <@${interaction.user.id}>`
            )
            .setColor(client.color),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Ticket')
      .setColor(client.color)
      .setDescription(
        `Ticket opened by <@${ticket.userId}>, claimed by <@${interaction.user.id}>.\n\n**Title**\n\`\`\`${ticket.title}\`\`\`\n**Issue**\n\`\`\`${ticket.issue}\`\`\``
      )
      .setTimestamp();

    await interaction.message.edit({
      embeds: [embed],
      components: [],
    });
  }
}
