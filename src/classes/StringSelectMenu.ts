import { StringSelectMenuInteraction } from 'discord.js';
import ExtendedClient from './ExtendedClient';

export default abstract class StringSelectMenu {
  public customId: string;
  constructor(customId: string) {
    this.customId = customId;
  }

  public execute(
    client: ExtendedClient,
    interaction: StringSelectMenuInteraction,
    pathData?: { [slug: string]: string }
  ): void {
    client.logger.warn(
      `Button ${interaction.customId} is missing execute() method`
    );
    interaction.reply({
      content: `> :warning: Button \`${interaction.customId}\` is missing execute() method `,
      ephemeral: true,
    });
  }
}
