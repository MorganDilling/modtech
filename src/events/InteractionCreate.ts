import DiscordEvent from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import { ButtonInteraction, Interaction } from 'discord.js';
import CommandNotFoundException from 'exceptions/CommandNotFoundException';
import ButtonNotFoundException from 'exceptions/ButtonNotFoundException';
import Exception from 'exceptions/Exception';

export default class InteractionCreate extends DiscordEvent {
  public once = false;

  public execute(client: ExtendedClient, interaction: Interaction): void {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) throw new CommandNotFoundException(interaction.commandName);

      try {
        command.execute(client, interaction);
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name} ${exception.message}`,
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      const button = client.buttons.get(
        (interaction as ButtonInteraction).customId
      );

      if (!button)
        throw new ButtonNotFoundException(
          (interaction as ButtonInteraction).customId
        );

      try {
        button.execute(client, interaction as ButtonInteraction);
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name} ${exception.message}`,
          ephemeral: true,
        });
      }
    }
  }
}
