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
import { createTranscript } from 'discord-html-transcripts';

export default class SupportTicketClose extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction,
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

    if (!ticket) {
      await interaction.reply({
        content: `> :warning: Ticket with ID \`${ticketId}\` not found`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.user.id !== ticket.claimerId) {
      await interaction.reply({
        content: `> :warning: You are not allowed to close this ticket`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const attachment = await createTranscript(
      interaction.channel as TextChannel,
      {
        filename: `ticket-${ticket.id}.html`,
        saveImages: true,
        poweredBy: false,
      }
    );

    const inboxChannel = await interaction.guild?.channels.fetch(
      ticket.supportDepartment?.inboxChannelId as string
    );

    if (inboxChannel) {
      const inboxMessage = await (inboxChannel as TextChannel).messages.fetch(
        ticket.claimMessageId as string
      );

      if (inboxMessage) {
        await inboxMessage.delete();
      }
    }

    await client.prisma.ticket.delete({
      where: {
        id: ticket.id,
      },
    });

    try {
      await interaction.user.send({
        content: `> :white_check_mark: Ticket ${ticketId} closed, thanks for helping out. Here is your transcript:`,
        files: [attachment],
      });
    } catch {
      await interaction.channel?.send(
        `> :warning: Failed to send transcript to <@${interaction.user.id}>`
      );
    }

    const ticketUser = await client.users.fetch(ticket.userId);

    try {
      await ticketUser.send({
        content: `> :white_check_mark: Ticket ${ticketId} closed. Here is your transcript:`,
        files: [attachment],
      });
    } catch {
      await interaction.channel?.send(
        `> :warning: Failed to send transcript to <@${ticket.userId}>`
      );
    }

    await interaction.editReply({
      content: `> :white_check_mark: Ticket closed. Deleting channel in 5 seconds...`,
    });

    setTimeout(async () => {
      await interaction.channel?.delete();
    }, 5000);

    // TODO: Add close reason
  }
}
