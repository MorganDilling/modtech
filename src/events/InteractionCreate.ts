import DiscordEvent from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import {
  ButtonInteraction,
  Interaction,
  ModalSubmitInteraction,
} from 'discord.js';
import CommandNotFoundException from 'exceptions/CommandNotFoundException';
import ButtonNotFoundException from 'exceptions/ButtonNotFoundException';
import ModalNotFoundException from 'exceptions/ModalNotFoundException';
import Exception from 'exceptions/Exception';

export default class InteractionCreate extends DiscordEvent {
  public once = false;

  public async execute(
    client: ExtendedClient,
    interaction: Interaction
  ): Promise<void> {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) throw new CommandNotFoundException(interaction.commandName);

      try {
        await command.execute(client, interaction);

        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: `> :warning: Failed to execute command \`${command.name}\``,
            ephemeral: true,
          });
        }
      } catch (error) {
        const exception = error as Exception;
        client.logger.error(error);
        interaction.reply({
          content: `> :warning: ${exception.name}: ${exception.message}`,
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
    } else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(
        (interaction as ModalSubmitInteraction).customId
      );

      if (!modal)
        throw new ModalNotFoundException(
          (interaction as ModalSubmitInteraction).customId
        );

      try {
        modal.execute(client, interaction as ModalSubmitInteraction);
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
