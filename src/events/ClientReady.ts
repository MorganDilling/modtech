import Event from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import { globSync } from 'glob';
import { REST, Routes, ImageURLOptions, ColorResolvable } from 'discord.js';
import CommandRegisterFailException from 'exceptions/CommandRegisterFailException';
import { getAverageColor } from 'fast-average-color-node';

import { token } from '../../config.json';
import Timer from 'classes/Timer';
import Modal from 'classes/Modal';
import Button from 'classes/Button';

const rest = new REST({ version: '10' }).setToken(token);

export default class ClientReady extends Event {
  public once = true;

  public async execute(client: ExtendedClient): Promise<void> {
    client.logger.info(`Logged in as ${client.user?.tag}`);

    // Cache
    const bans = await client.prisma.ban.findMany();

    for (const ban of bans) {
      client.cache.bans.set(ban.id, ban);
    }

    // Commands
    const commands = globSync('./src/commands/**/*.ts');

    for (const command of commands) {
      const cmd = new (require(`../../${command}`).default)(
        command.split(/[\\/]/).pop()?.split('.')[0]
      );

      client.logger.info(`Loaded command ${cmd.name}`);

      client.commands.set(cmd.name, cmd);
    }

    const id = client.user?.id;

    if (!id) throw new Error('Client ID not found');

    const commandData = client.commands.map((command) => command.data);

    client.logger.info(`Registering ${commandData.length} command(s)`);
    try {
      await rest.put(Routes.applicationCommands(id), {
        body: commandData,
      });
      client.logger.info('Successfully registered commands');
    } catch (error) {
      throw new CommandRegisterFailException(error as string);
    }

    // Buttons
    const buttons = globSync('./src/buttons/**/*.ts');

    for (const button of buttons) {
      const btn: Button = new (require(`../../${button}`).default)(
        button.split(/[\\/]/).pop()?.split('.')[0]
      );

      client.logger.info(`Loaded button ${btn.customId}`);

      client.buttons.set(btn.customId, btn);
    }

    // Modals
    const modals = globSync('./src/modals/**/*.ts');

    for (const modal of modals) {
      const mdl: Modal = new (require(`../../${modal}`).default)(
        modal.split(/[\\/]/).pop()?.split('.')[0]
      );

      client.logger.info(`Loaded modal ${mdl.customId}`);

      client.modals.set(mdl.customId, mdl);
    }

    // Timers
    const timers = globSync('./src/timers/**/*.ts');

    for (const timer of timers) {
      const tmr: Timer = new (require(`../../${timer}`).default)(
        timer.split(/[\\/]/).pop()?.split('.')[0]
      );

      client.logger.info(`Loaded timer ${tmr.name}`);

      client.timers.set(tmr.name, tmr);

      if (tmr.executeOnStart) {
        try {
          tmr.execute(client);
        } catch (error) {
          client.logger.error(error);
        }
      }

      if (tmr.once) {
        setTimeout(() => {
          try {
            tmr.execute(client);
          } catch (error) {
            client.logger.error(error);
          }
        }, tmr.interval);
      } else {
        setInterval(() => {
          try {
            tmr.execute(client);
          } catch (error) {
            client.logger.error(error);
          }
        }, tmr.interval);
      }
    }

    // Initialise Guilds
    const guilds = client.guilds.cache.map((guild) => guild);
    for (let i = 0; i < guilds.length; i++) {
      const guild = guilds[i];
      await client.prisma.guild.upsert({
        where: {
          id: guild.id,
        },
        update: {},
        create: {
          id: guild.id,
        },
      });

      await client.prisma.settings.upsert({
        where: {
          guildId: guild.id,
        },
        update: {},
        create: {
          guildId: guild.id,
        },
      });
    }

    // Set bot colour
    const avatarUrl = client.user?.displayAvatarURL({ extension: 'png' });
    if (!avatarUrl) throw new Error('Avatar URL not found');
    const { hex } = await getAverageColor(avatarUrl, {
      mode: 'speed',
    });
    if (hex) client.color = hex as ColorResolvable;

    // Finally
    client.logger.info(`Ready!`);
  }
}
