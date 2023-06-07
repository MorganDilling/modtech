import DiscordEvent from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  ModalBuilder,
  ModalSubmitInteraction,
  OverwriteType,
  PermissionFlagsBits,
  PermissionOverwrites,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import CommandNotFoundException from 'exceptions/CommandNotFoundException';
import ButtonNotFoundException from 'exceptions/ButtonNotFoundException';
import ModalNotFoundException from 'exceptions/ModalNotFoundException';
import FailedToCreateTicketChannelException from 'exceptions/FailedToCreateTicketChannelException';
import Exception from 'exceptions/Exception';
import { SupportDepartments } from '@prisma/client';
import { StringSelectMenuBuilder } from 'discord.js';
import ChannelNotFoundException from 'exceptions/ChannelNotFoundException';
import GuildNotFoundException from 'exceptions/GuildNotFoundException';
import dynamicCustomIdFinder from 'utils/dynamicCustomIdFinder';
import Button from 'classes/Button';
import Modal from 'classes/Modal';

export default class InteractionCreate extends DiscordEvent {
  public once = false;

  public async execute(
    client: ExtendedClient,
    interaction: Interaction
  ): Promise<void> {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) throw new CommandNotFoundException(interaction.commandName);

      try {
        await command.execute(client, interaction);

        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: `> :warning: Failed to execute command \`${command.name}\``,
            ephemeral: true,
          });
        }
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name}: ${exception.message}`,
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith('support-ticket-claim')) {
        const ticketId = interaction.customId.split('.')[1];
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
              .setCustomId(`support-ticket-close.${ticket.id}`)
              .setLabel('Close')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`support-ticket-transfer.${ticket.id}`)
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

        return;
      } else if (interaction.customId.startsWith('support-ticket-close')) {
        await interaction.deferReply({
          ephemeral: true,
        });

        const ticketId = interaction.customId.split('.')[1];
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
          const inboxMessage = await (
            inboxChannel as TextChannel
          ).messages.fetch(ticket.claimMessageId as string);

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

        return;
      } else if (interaction.customId.startsWith('support-ticket-transfer')) {
        const ticketId = interaction.customId.split('.')[1];
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
          .setDescription(
            `Please select a department to transfer this ticket to.`
          );

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
            value: 'support-ticket-open.' + department.id.toString(),
            description: department.description || undefined,
          };
        });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`support-ticket-transfer-department.${ticket.id}`)
            .setPlaceholder('Select a department')
            .addOptions(departmentOptions)
        );

        await interaction.reply({
          embeds: [embed],
          components: [row as any],
          ephemeral: true,
        });

        return;
      }

      const [button, pathData] = dynamicCustomIdFinder(
        client.buttons,
        (interaction as ButtonInteraction).customId
      );

      if (!button)
        throw new ButtonNotFoundException(
          (interaction as ButtonInteraction).customId
        );

      try {
        (button as Button).execute(
          client,
          interaction as ButtonInteraction,
          pathData
        );
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name} ${exception.message}`,
          ephemeral: true,
        });
      }
    } else if (interaction.isModalSubmit()) {
      const [modal, pathData] = dynamicCustomIdFinder(
        client.buttons,
        (interaction as ModalSubmitInteraction).customId
      );

      if (!modal)
        throw new ModalNotFoundException(
          (interaction as ModalSubmitInteraction).customId
        );

      try {
        (modal as Modal).execute(
          client,
          interaction as ModalSubmitInteraction,
          pathData
        );
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name} ${exception.message}`,
          ephemeral: true,
        });
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('support-ticket-open')) {
        const ticketId = interaction.customId.split('.')[1];
        const ticket = await client.prisma.ticket.findUnique({
          where: {
            id: parseInt(ticketId),
          },
        });

        const departmentId = interaction.values[0].split('.')[1];
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
            .setCustomId(`support-ticket-claim.${ticket.id}`)
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
      } else if (
        interaction.customId.startsWith('support-ticket-transfer-department')
      ) {
        const ticketId = interaction.customId.split('.')[1];
        const ticket = await client.prisma.ticket.findUnique({
          where: {
            id: parseInt(ticketId),
          },
          include: {
            supportDepartment: true,
          },
        });

        const departmentId = interaction.values[0].split('.')[1];
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
            .setCustomId(`support-ticket-claim.${ticket.id}`)
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
  }
}
