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
  StringSelectMenuBuilder,
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

export default class SupportTicketTransfer extends Button {
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
        content: `> :warning: You are not allowed to transfer this ticket`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Where to?')
      .setColor(client.color)
      .setDescription(`Please select a department to transfer this ticket to.`);

    if (!interaction.guild) {
      await interaction.reply({
        content: `> :warning: This command can only be used in a server`,
        ephemeral: true,
      });
      return;
    }

    const availableDepartments =
      await client.prisma.supportDepartments.findMany({
        where: {
          settingsId: interaction.guild.id,
        },
      });

    const departmentOptions = availableDepartments.map((department) => {
      return {
        label: department.name,
        value: department.id.toString(),
        description: department.description || undefined,
      };
    });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`support-ticket-transfer-department-${ticket.id}`)
        .setPlaceholder('Select a department')
        .addOptions(departmentOptions)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row as any],
      ephemeral: true,
    });
  }
}
