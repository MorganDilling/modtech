import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class SettingsExemptUsersAdd extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction
  ): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('settings-exempt-users-remove-modal')
      .setTitle('Remove user');

    const idInput = new TextInputBuilder()
      .setCustomId('settings-exempt-users-remove-input')
      .setLabel('User ID')
      .setPlaceholder('Enter user ID')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(row as any);

    await interaction.showModal(modal);
  }
}
