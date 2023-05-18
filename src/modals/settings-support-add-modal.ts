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

    const description = interaction.fields.getTextInputValue(
      'settings-support-add-description'
    );

    const emoji = interaction.fields.getTextInputValue(
      'settings-support-add-emoji'
    );

    const inboxChannelId = interaction.fields.getTextInputValue(
      'settings-support-add-inbox-channel-id'
    );

    const inboxChannel = guild?.channels.cache.get(inboxChannelId);

    if (!inboxChannel) {
      await interaction.reply({
        content: `> :warning: Channel \`${inboxChannelId}\` not found`,
      });
      return;
    }

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
      supportDepartments.find(
        (supportDepartment) => supportDepartment.name === name
      )
    ) {
      await interaction.reply({
        content: `> :warning: Support department \`${name}\` already exists`,
      });
      return;
    }

    await client.prisma.supportDepartments.create({
      data: {
        name,
        description,
        emoji,
        inboxChannelId,
        settings: {
          connect: {
            guildId: guild?.id,
          },
        },
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Support department ${emoji} \`${name}\` created`,
    });
  }
}
