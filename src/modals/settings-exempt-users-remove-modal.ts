import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsExemptUsersRemoveModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const userId = interaction.fields.getTextInputValue(
      'settings-exempt-users-remove-input'
    );

    const user = await client.users.fetch(userId);

    if (!user) {
      await interaction.reply({
        content: `> :warning: Role \`${userId}\` not found`,
        ephemeral: true,
      });
      return;
    }

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild?.id,
      },
      include: {
        exemptUsers: true,
      },
    });

    if (!settings) {
      await interaction.reply({
        content: `> :warning: Settings not found`,
        ephemeral: true,
      });
      return;
    }

    const exemptUsers = settings.exemptUsers;

    if (!exemptUsers.find(exemptUser => exemptUser.userId === user.id)) {
      await interaction.reply({
        content: `> :warning: Role \`${user.tag}\` is not exempt`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.settings_ExemptUsers.delete({
      where: {
        id: exemptUsers.find(exemptUser => exemptUser.userId === user.id)?.id,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: User \`${user.tag}\` removed from exempt roles`,
      ephemeral: true,
    });
  }
}
