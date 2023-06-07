// Imports
import { Events, GatewayIntentBits } from 'discord.js';
import { token } from '../config.json';
import ExtendedClient from 'classes/ExtendedClient';
import { globSync } from 'glob';
import path from 'path';

// Client

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Events
const eventFiles = globSync('./src/events/**/*.ts');
const events = Object(Events);
for (const file of eventFiles) {
  const event = new (require(path.join(__dirname, `../${file}`)).default)(
    file.split(/[\\/]/).pop()?.split('.')[0]
  );

  client.logger.info(`Loaded event: ${event.name}`);

  if (event.once) {
    client.once(events[event.name], (...args: unknown[]) => {
      try {
        event.execute(client, ...args);
      } catch (error) {
        client.logger.error(error);
      }
    });
  } else {
    client.on(events[event.name], (...args: unknown[]) => {
      try {
        event.execute(client, ...args);
      } catch (error) {
        client.logger.error(error);
      }
    });
  }
}

process.on('exit', () => {
  client.logger.info('Exiting...');
  client.prisma.$disconnect();
  client.destroy();
});

// Initialise
client.login(token);
