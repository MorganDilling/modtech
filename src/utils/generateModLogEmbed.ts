import ExtendedClient from 'classes/ExtendedClient';
import { EmbedBuilder } from 'discord.js';

export default (
  client: ExtendedClient,
  action: string,
  moderatorId: string,
  userId: string
) => {
  return new EmbedBuilder()
    .setTitle('Moderation Log')
    .setDescription(`<@${moderatorId}> ${action} <@${userId}>`)
    .setTimestamp()
    .setColor(client.color);
};
