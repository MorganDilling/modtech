import ExtendedClient from 'classes/ExtendedClient';

const generateCode = (): string => {
  const randomString = Math.random().toString(36).substring(2, 12);
  return randomString;
};

const generateInviteCode = async (client: ExtendedClient): Promise<string> => {
  const code = generateCode();
  const invite = await client.prisma.betaInviteCode.findUnique({
    where: {
      code,
    },
  });
  if (invite) {
    return generateInviteCode(client);
  }
  return code;
};

export default generateInviteCode;
