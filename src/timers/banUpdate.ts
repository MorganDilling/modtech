import ExtendedClient from 'classes/ExtendedClient';
import Timer from 'classes/Timer';
import { TextChannel } from 'discord.js';
import generateModLogEmbed from 'utils/generateModLogEmbed';

export default class TestTimer extends Timer {
  public once = false;

  public executeOnStart = true;

  public interval = 1000;

  public async execute(
    client: ExtendedClient,
    ...args: unknown[]
  ): Promise<void> {
    const bans = client.cache.bans.map((ban) => ban);

    for (const ban of bans) {
      if (Date.now() > ban.expiresAt.getTime()) {
        const guild = client.guilds.cache.get(ban.guildId);
        await guild?.members.unban(ban.userId);

        await client.prisma.ban.delete({
          where: {
            id: ban.id,
          },
        });

        client.cache.bans.delete(ban.id);

        const settings = await client.prisma.settings.findUnique({
          where: {
            guildId: ban.guildId,
          },
        });

        if (!settings?.loggingChannelId) return;

        const channel = guild?.channels.cache.get(settings?.loggingChannelId);

        if (!channel) return;

        const clientId = client.user?.id;

        if (!clientId) return;

        const embed = generateModLogEmbed(
          client,
          'unbanned',
          clientId,
          ban.userId,
          'Ban expired'
        );

        await (channel as TextChannel).send({ embeds: [embed] });
      }
    }
  }
}
