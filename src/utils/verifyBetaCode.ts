import { Guild } from '@prisma/client';
import ExtendedClient from 'classes/ExtendedClient';

const verify = async (
  client: ExtendedClient,
  guild: Guild
): Promise<boolean> => {
  if (!guild.betaInviteCode) return false;
  const invite = await client.prisma.betaInviteCode.findFirst({
    where: {
      code: guild.betaInviteCode,
    },
  });

  if (!invite) return false;

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return false;

  if (guild.betaInviteCode !== invite.code) return false;

  return true;
};

export default verify;
