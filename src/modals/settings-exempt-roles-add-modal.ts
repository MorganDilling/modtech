import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsExemptRolesAddModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const roleId = interaction.fields.getTextInputValue(
      'settings-exempt-roles-add-input'
    );

    const role = guild?.roles.cache.get(roleId);

    if (!role) {
      await interaction.reply({
        content: `> :warning: Role \`${roleId}\` not found`,
        ephemeral: true,
      });
      return;
    }

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild?.id,
      },
      include: {
        exemptRoles: true,
      },
    });

    if (!settings) {
      await interaction.reply({
        content: `> :warning: Settings not found`,
        ephemeral: true,
      });
      return;
    }

    const exemptRoles = settings.exemptRoles;

    if (exemptRoles.find(exemptRole => exemptRole.roleId === role.id)) {
      await interaction.reply({
        content: `> :warning: Role \`${role.name}\` is already exempt`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.settings_ExemptRoles.create({
      data: {
        roleId: role.id,
        settings: {
          connect: {
            guildId: guild?.id,
          },
        },
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Role \`${role.name}\` added to exempt roles`,
      ephemeral: true,
    });
  }
}
