import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';

export default class Support extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Opens a support ticket';

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(false)
      .addStringOption(option =>
        option
          .setName('title')
          .setDescription('Summarise your issue in a few words')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('issue')
          .setDescription('Describe your issue in detail')
          .setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a server',
        ephemeral: true,
      });
      return;
    }

    const ticket = await client.prisma.ticket.create({
      data: {
        userId: interaction.user.id,
        title:
          (
            interaction.options as CommandInteractionOptionResolver<CacheType>
          ).getString('title') || 'No title provided',
        issue:
          (
            interaction.options as CommandInteractionOptionResolver<CacheType>
          ).getString('issue') || 'No issue provided',

        guildId: guild.id,
      },
    });

    const availableDepartments =
      await client.prisma.supportDepartments.findMany({
        where: {
          settingsId: guild.id,
        },
      });

    const departmentOptions = availableDepartments.map(department => {
      return {
        label: department.name,
        value: department.id.toString(),
        description: department.description || undefined,
      };
    });

    const department = new StringSelectMenuBuilder()
      .setCustomId(`support-ticket-open-department-${ticket.id}`)
      .setPlaceholder('Select a department')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(departmentOptions);

    const row = new ActionRowBuilder().addComponents(department);

    const embed = new EmbedBuilder()
      .setTitle('Finally...')
      .setColor(client.color)
      .setDescription(
        'Please select a department to open a ticket in. A member of staff will be with you shortly.'
      );

    await interaction.reply({
      embeds: [embed],
      components: [row as any],
      ephemeral: true,
    });

    setTimeout(async () => {
      const fetchedTicket = await client.prisma.ticket.findUnique({
        where: {
          id: ticket.id,
        },
      });

      if (!fetchedTicket) {
        return;
      }

      if (fetchedTicket?.supportDepartmentId) {
        return;
      }

      await client.prisma.ticket.delete({
        where: {
          id: ticket.id,
        },
      });

      const editEmbed = new EmbedBuilder()
        .setTitle('Support timeout')
        .setColor(client.color)
        .setDescription(
          'Your support ticket has timed out. Please run the command again to open a new ticket.'
        );
      try {
        await interaction.editReply({
          embeds: [editEmbed],
          components: [],
        });
      } catch (error) {
        client.logger.error(error);
      }
    }, 60000);
  }
}
