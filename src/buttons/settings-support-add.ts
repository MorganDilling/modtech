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
      .setCustomId('settings-support-add-modal')
      .setTitle('Setup new support department');

    const name = new TextInputBuilder()
      .setCustomId('settings-support-add-name')
      .setLabel('Name')
      .setPlaceholder('Name of the department')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const description = new TextInputBuilder()
      .setCustomId('settings-support-add-description')
      .setLabel('Description')
      .setPlaceholder('Department description (optional)')
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    const emoji = new TextInputBuilder()
      .setCustomId('settings-support-add-emoji')
      .setLabel('Emoji')
      .setPlaceholder('Department emoji (e.g. :moyai:) (optional)')
      .setRequired(false)
      .setStyle(TextInputStyle.Short);

    const channelId = new TextInputBuilder()
      .setCustomId('settings-support-add-inbox-channel-id')
      .setLabel('Inbox channel ID')
      .setPlaceholder('Channel ID for the incoming tickets')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const categoryId = new TextInputBuilder()
      .setCustomId('settings-support-add-tickets-category-id')
      .setLabel('Open tickets category ID')
      .setPlaceholder('Category ID for open tickets')
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row1 = new ActionRowBuilder().addComponents(name);
    const row2 = new ActionRowBuilder().addComponents(description);
    const row3 = new ActionRowBuilder().addComponents(emoji);
    const row4 = new ActionRowBuilder().addComponents(channelId);
    const row5 = new ActionRowBuilder().addComponents(categoryId);

    modal.addComponents(
      row1 as any,
      row2 as any,
      row3 as any,
      row4 as any,
      row5 as any
    );

    await interaction.showModal(modal);
  }
}
