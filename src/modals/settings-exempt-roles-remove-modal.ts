import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsExemptRolesRemoveModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const roleId = interaction.fields.getTextInputValue(
      'settings-exempt-roles-remove-input'
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

    if (!exemptRoles.find(exemptRole => exemptRole.roleId === role.id)) {
      await interaction.reply({
        content: `> :warning: Role \`${role.name}\` is not exempt`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.settings_ExemptRoles.delete({
      where: {
        id: exemptRoles.find(exemptRole => exemptRole.roleId === role.id)?.id,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Role \`${role.name}\` removed from exempt roles`,
      ephemeral: true,
    });
  }
}
