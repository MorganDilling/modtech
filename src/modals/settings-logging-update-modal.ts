import { ModalSubmitInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Modal from 'classes/Modal';

export default class SettingsExemptRolesAddModal extends Modal {
  public async execute(
    client: ExtendedClient,
    interaction: ModalSubmitInteraction
  ): Promise<void> {
    const guild = interaction.guild;

    const channelId = interaction.fields.getTextInputValue(
      'settings-logging-channel-id'
    );

    const channel = guild?.channels.cache.get(channelId);

    if (!channel) {
      await interaction.reply({
        content: `> :warning: Channel \`${channelId}\` not found`,
        ephemeral: true,
      });
      return;
    }

    const settings = await client.prisma.settings.findUnique({
      where: {
        guildId: guild?.id,
      },
    });

    if (!settings) {
      await interaction.reply({
        content: `> :warning: Settings not found`,
        ephemeral: true,
      });
      return;
    }

    await client.prisma.settings.update({
      where: {
        guildId: guild?.id,
      },
      data: {
        loggingChannelId: channelId,
      },
    });

    await interaction.reply({
      content: `> :white_check_mark: Channel <#${channelId}> set as logging channel.`,
      ephemeral: true,
    });
  }
}
