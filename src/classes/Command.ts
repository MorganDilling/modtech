import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';

import ExtendedClient from './ExtendedClient';

export default abstract class Command {
  public name: string;
  public description: string;
  public devOnly: boolean = false;
  public betaOnly: boolean = false;
  /**
   * Cooldown in seconds
   */
  public cooldown: number = 0;

  constructor(name: string) {
    this.name = name;
    this.description = `Undefined command ${name}`;
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    client.logger.warn(`Command ${this.name} is missing execute() method`);
    client.logger.info(interaction);
    interaction.reply({
      content: `> :warning: Command \`${this.name}\` is missing execute() method `,
      ephemeral: true,
    });
  }
}
