import Button from 'classes/Button';
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class SettingsExemptRolesAdd extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction
  ): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('settings-exempt-roles-remove-modal')
      .setTitle('Remove role');

    const idInput = new TextInputBuilder()
      .setCustomId('settings-exempt-roles-remove-input')
      .setLabel('Role ID')
      .setPlaceholder('Enter role ID')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(idInput);

    modal.addComponents(row as any);

    await interaction.showModal(modal);
  }
}
