import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsSupportAddModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const name = interaction.fields.getTextInputValue(
      'settings-support-add-name'
    );

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild?.id,
      },
      include: {
        supportDepartments: true,
      },
    });

    if (!settings) {
      await interaction.reply({
        content: `> :warning: Settings not found`,
      });
      return;
    }

    const supportDepartments = settings.supportDepartments;

    if (
      !supportDepartments.find(
        (supportDepartment) => supportDepartment.name === name
      )
    ) {
      await interaction.reply({
        content: `> :warning: Support department \`${name}\` doesn\'t exist`,
      });
      return;
    }

    const supportDepartment = supportDepartments.find(
      (supportDepartment) =>
        supportDepartment.name === name &&
        supportDepartment.settingsId === settings.guildId
    );

    if (!supportDepartment) {
      await interaction.reply({
        content: `> :warning: Support department \`${name}\` not found`,
      });
      return;
    }

    await client.prisma.supportDepartments.delete({
      where: {
        id: supportDepartment?.id,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Support department \`${name}\` removed`,
    });
  }
}
