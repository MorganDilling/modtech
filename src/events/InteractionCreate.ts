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
  StringSelectMenuInteraction,
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
import StringSelectMenu from 'classes/StringSelectMenu';
import StringSelectMenuNotFoundException from 'exceptions/StringSelectMenuNotFoundException';
import DeveloperOnlyException from 'exceptions/DeveloperOnlyException';
import { owners } from '../../config.json';
import verifyBetaCode from 'utils/verifyBetaCode';

export default class InteractionCreate extends DiscordEvent {
  public once = false;

  public async execute(
    client: ExtendedClient,
    interaction: Interaction
  ): Promise<void> {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) throw new CommandNotFoundException(interaction.commandName);

      const cooldownSeconds = command.cooldown;
      const cooldownExpiry = Date.now() + cooldownSeconds * 1000;

      if (client.cooldowns.has(`${command.name}-${interaction.user.id}`)) {
        const cooldown = client.cooldowns.get(
          `${command.name}-${interaction.user.id}`
        );

        if (
          cooldown &&
          cooldown > Date.now() &&
          !owners.includes(interaction.user.id)
        ) {
          await interaction.reply({
            content: `> :warning: You are on cooldown for \`/${
              command.name
            }\`. It will expire <t:${Math.floor(cooldown / 1000)}:R>.
              `,
            ephemeral: true,
          });
          return;
        } else {
          client.cooldowns.delete(`${command.name}-${interaction.user.id}`);
        }
      }

      client.cooldowns.set(
        `${command.name}-${interaction.user.id}`,
        cooldownExpiry
      );

      try {
        if (command.devOnly && !owners.includes(interaction.user.id))
          throw new DeveloperOnlyException(command.name);

        const guild = await client.prisma.guild.findUnique({
          where: {
            id: interaction.guild?.id,
          },
        });

        if (
          command.betaOnly &&
          guild &&
          !owners.includes(interaction.user.id) &&
          !(await verifyBetaCode(client, guild))
        ) {
          await interaction.reply({
            content: `> :warning: This command is currently in beta. Your server must have a valid beta code to use it.\n\n**Tip:** Use \`/redeem-beta\` to redeem a beta code.`,
            ephemeral: true,
          });
          return;
        }

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
        client.modals,
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
      const [stringSelectMenu, pathData] = dynamicCustomIdFinder(
        client.stringSelectMenus,
        (interaction as StringSelectMenuInteraction).customId
      );

      if (!stringSelectMenu)
        throw new StringSelectMenuNotFoundException(
          (interaction as StringSelectMenuInteraction).customId
        );

      try {
        (stringSelectMenu as StringSelectMenu).execute(
          client,
          interaction as StringSelectMenuInteraction,
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
    }
  }
}
