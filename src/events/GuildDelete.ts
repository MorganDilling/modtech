import DiscordEvent from 'classes/Event';
import ExtendedClient from 'classes/ExtendedClient';
import { Guild } from 'discord.js';

export default class GuildCreate extends DiscordEvent {
  public once = false;

  public async execute(client: ExtendedClient, guild: Guild): Promise<void> {
    await client.prisma.guild.delete({
      where: {
        id: guild.id,
      },
      include: {
        settings: true,
      },
    });
    await client.prisma.settings.delete({
      where: {
        guildId: guild.id,
      },
    });
  }
}
