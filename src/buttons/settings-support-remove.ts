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
      .setCustomId('settings-support-remove-modal')
      .setTitle('Remove a support department');

    const name = new TextInputBuilder()
      .setCustomId('settings-support-add-name')
      .setLabel('Name')
      .setPlaceholder('Name of the department')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(name);

    modal.addComponents(row as any);

    await interaction.showModal(modal);
  }
}
