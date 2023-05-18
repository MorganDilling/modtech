import DiscordEvent from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import { Guild } from 'discord.js';

export default class GuildCreate extends DiscordEvent {
  public once = false;

  public async execute(client: ExtendedClient, guild: Guild): Promise<void> {
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
}
