import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';

import ExtendedClient from './ExtendedClient';

export default abstract class Command {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(`Undefined command ${this.name}`);
  }

  public execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): void {
    client.logger.warn(`Command ${this.name} is missing execute() method`);
    client.logger.info(interaction);
    interaction.reply({
      content: `> :warning: Command \`${this.name}\` is missing execute() method `,
      ephemeral: true,
    });
  }
}
