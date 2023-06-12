import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsExemptUsersAddModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const userId = interaction.fields.getTextInputValue(
      'settings-exempt-users-add-input'
    );

    const user = await client.users.fetch(userId);

    if (!user) {
      await interaction.reply({
        content: `> :warning: User \`${userId}\` not found`,
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

    if (exemptUsers.find(exemptUser => exemptUser.userId === user.id)) {
      await interaction.reply({
        content: `> :warning: User \`${user.tag}\` is already exempt`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.settings_ExemptUsers.create({
      data: {
        userId: user.id,
        settings: {
          connect: {
            guildId: guild?.id,
          },
        },
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: User \`${user.tag}\` added to exempt roles`,
      ephemeral: true,
    });
  }
}
