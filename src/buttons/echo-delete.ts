import Button from 'classes/Button';
import { ButtonInteraction } from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';

export default class EchoDelete extends Button {
  public async execute(
    client: ExtendedClient,
    interaction: ButtonInteraction
  ): Promise<void> {
    await interaction.reply({
      content: `> :white_check_mark: Button \`${interaction.customId}\` was clicked`,
      ephemeral: true,
    });
    await interaction.message.delete();
  }
}
