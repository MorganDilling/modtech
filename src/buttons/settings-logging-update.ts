import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class SettingsLoggingUpdate extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction
  ): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('settings-logging-update-modal')
      .setTitle('Update logging channel');

    const name = new TextInputBuilder()
      .setCustomId('settings-logging-channel-id')
      .setLabel('Logging channel ID')
      .setPlaceholder('Enter channel ID')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(name);

    modal.addComponents(row as any);

    await interaction.showModal(modal);
  }
}
