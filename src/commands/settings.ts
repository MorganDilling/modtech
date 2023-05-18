import Command from 'classes/Command';
import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  CommandInteractionOptionResolver,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowData,
  EmbedBuilder,
  ColorResolvable,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import SettingsNotFoundException from 'exceptions/SettingsNotFoundException';
import DatabaseGuildNotFoundException from 'exceptions/DatabaseGuildNotFoundException';

export default class Settings extends Command {
  constructor(name: string) {
    super(name);
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription("Configure your bot's server settings")
      .setDMPermission(false)
      .setDefaultMemberPermissions(32) // MANAGE_SERVER
      .addStringOption((option) =>
        option
          .setName('setting')
          .setDescription(
            'Name of setting to configure (if blank, the bot will list all available settings)'
          )
          .addChoices(
            { name: 'Toggle logging', value: 'LOGGING' },
            { name: 'Logging channel', value: 'LOGGING_CHANNEL' },
            { name: 'Exempt roles', value: 'EXEMPT_ROLES' },
            { name: 'Exempt users', value: 'EXEMPT_USERS' },
            { name: 'Support departments', value: 'SUPPORT' }
          )
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const setting = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('setting');
    const guild = await interaction.guild?.fetch();

    if (!guild) {
      interaction.reply({
        content: '> :warning: You can only use this command in a server',
        ephemeral: true,
      });
      return;
    }

    const dbGuild = await client.prisma.guild.findUnique({
      where: {
        id: guild.id,
      },
    });

    if (!dbGuild) throw new DatabaseGuildNotFoundException(guild.id);

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild.id,
      },
      include: {
        exemptRoles: true,
        exemptUsers: true,
        supportDepartments: true,
      },
    });

    if (!settings) throw new SettingsNotFoundException(guild.id);

    if (!setting) {
      let settingsDesc = 'Use `/settings <setting>` to configure a setting\n\n';

      settingsDesc += `**Logging enabled**\n\`${settings.logging}\`${
        dbGuild.premium === false ? ' (Premium only)' : ''
      }${
        settings.logging
          ? !!settings.loggingChannelId
            ? `\n**Logging channel**\n<#${settings.loggingChannelId}>`
            : '\n**Logging channel**\nNone'
          : ''
      }\n\n`;

      settingsDesc += `**Exempt Roles**\n`;
      if (settings.exemptRoles.length === 0) {
        settingsDesc += 'None\n\n';
      } else {
        settingsDesc += settings.exemptRoles
          .map((role) => `<@&${role.roleId}>`)
          .join(', ');
        settingsDesc += '\n\n';
      }

      settingsDesc += `**Exempt Users**\n`;
      if (settings.exemptUsers.length === 0) {
        settingsDesc += 'None\n\n';
      } else {
        settingsDesc += settings.exemptUsers
          .map((user) => `<@${user.userId}>`)
          .join(', ');
        settingsDesc += '\n\n';
      }

      settingsDesc += `**Support Departments**\n`;
      if (settings.supportDepartments.length === 0) {
        settingsDesc += 'None\n';
      } else {
        settingsDesc += settings.supportDepartments
          .map(
            (department) =>
              `${department.emoji ? department.emoji + ' ' : ''}*${
                department.name
              }* • <#${department.inboxChannelId}>\n- ${department.description}`
          )
          .join('\n');
        settingsDesc += '\n\n';
      }

      const embed = new EmbedBuilder()
        .setTitle('Settings')
        .setColor(client.color)
        .setDescription(settingsDesc)
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      switch (setting.toUpperCase()) {
        case 'LOGGING': {
          if (dbGuild.premium === false) {
            await interaction.reply({
              content: `> :warning: Logging is a premium-only setting`,
              ephemeral: true,
            });
            return;
          }

          const logging = settings.logging;
          await client.prisma.settings.update({
            where: {
              guildId: guild.id,
            },
            data: {
              logging: !logging,
            },
          });
          await interaction.reply({
            content: `> :white_check_mark: Logging has been ${
              !logging ? 'enabled' : 'disabled'
            }`,
            ephemeral: true,
          });
          break;
        }
        case 'LOGGING_CHANNEL': {
          if (dbGuild.premium === false) {
            await interaction.reply({
              content: `> :warning: Logging is a premium-only setting`,
              ephemeral: true,
            });
            return;
          }

          const loggingChannelId = settings.loggingChannelId;

          const embed = new EmbedBuilder()
            .setTitle('Logging Channel')
            .setColor(client.color)
            .setDescription(
              `${
                !!loggingChannelId
                  ? `The current logging channel is <#${loggingChannelId}>`
                  : 'There is no logging channel set'
              }\n\n:information_source: Click the button below to update the logging channel`
            );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('settings-logging-update')
              .setLabel('Update Logging Channel')
              .setStyle(ButtonStyle.Primary)
          );

          await interaction.reply({
            embeds: [embed],
            components: [row as any],
            ephemeral: true,
          });

          break;
        }
        case 'EXEMPT_ROLES': {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('settings-exempt-roles-add')
              .setLabel('Add Role')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('settings-exempt-roles-remove')
              .setLabel('Remove Role')
              .setStyle(ButtonStyle.Danger)
          );

          let message = '';
          if (settings.exemptRoles.length === 0) {
            message += 'None\n\n';
          } else {
            message += settings.exemptRoles
              .map((role) => `<@&${role.roleId}>`)
              .join(', ');
            message += '\n\n';
          }

          message +=
            ':information_source: Click the buttons below to add or remove exempt roles';

          const embed = new EmbedBuilder()
            .setTitle('Exempt Roles')
            .setColor(client.color)
            .setDescription(message)
            .setTimestamp();

          await interaction.reply({
            embeds: [embed],
            components: [row as any],
            ephemeral: true,
          });

          break;
        }
        case 'EXEMPT_USERS': {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('settings-exempt-users-add')
              .setLabel('Add User')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('settings-exempt-users-remove')
              .setLabel('Remove User')
              .setStyle(ButtonStyle.Danger)
          );

          let message = '';
          if (settings.exemptUsers.length === 0) {
            message += 'None\n\n';
          } else {
            message += settings.exemptUsers
              .map((user) => `<@${user.userId}>`)
              .join(', ');
            message += '\n\n';
          }

          message +=
            ':information_source: Click the buttons below to add or remove exempt users';

          const embed = new EmbedBuilder()
            .setTitle('Exempt Users')
            .setColor(client.color)
            .setDescription(message)
            .setTimestamp();

          await interaction.reply({
            embeds: [embed],
            components: [row as any],
            ephemeral: true,
          });

          break;
        }
        case 'SUPPORT': {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('settings-support-add')
              .setLabel('Setup New Department')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('settings-support-remove')
              .setLabel('Remove Department')
              .setStyle(ButtonStyle.Danger)
          );

          let message = '';
          if (settings.supportDepartments.length === 0) {
            message += 'None\n';
          } else {
            message += settings.supportDepartments
              .map(
                (department) =>
                  `${department.emoji ? department.emoji + ' ' : ''}*${
                    department.name
                  }* • <#${department.inboxChannelId}>\n- ${
                    department.description
                  }`
              )
              .join('\n');
            message += '\n\n';
          }

          message +=
            ':information_source: Click the buttons below to add or remove support departments';

          const embed = new EmbedBuilder()
            .setTitle('Support Departments')
            .setColor(client.color)
            .setDescription(message)
            .setTimestamp();

          await interaction.reply({
            embeds: [embed],
            components: [row as any],
            ephemeral: true,
          });

          break;
        }
        default: {
          await interaction.reply({
            content: `> :warning: \`${setting.toUpperCase()}\` is not a valid setting`,
            ephemeral: true,
          });
          break;
        }
      }
    }
  }
}
