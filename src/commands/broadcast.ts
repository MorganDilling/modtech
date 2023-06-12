import {
  SlashCommandBuilder,
  CommandInteraction,
  CacheType,
  TextChannel,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import ExtendedClient from 'classes/ExtendedClient';
import Command from 'classes/Command';

export default class Broadcast extends Command {
  constructor(name: string) {
    super(name);
  }

  description = 'Broadcasts your message to all servers. [Developer-only]';

  devOnly = true;

  get data(): Partial<SlashCommandBuilder> {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(true)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
        option
          .setName('message')
          .setDescription('The message to broadcast')
          .setRequired(true)
      );
  }

  public async execute(
    client: ExtendedClient,
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Broadcast')
          .setDescription(
            'Broadcasting your message to all servers. This may take a while.'
          )
          .setColor(client.color),
      ],
      ephemeral: true,
    });

    const message = (
      interaction.options as CommandInteractionOptionResolver<CacheType>
    ).getString('message');

    const messageEmbed = new EmbedBuilder()
      .setTitle(`A message from the owners of ${client.user?.username}`)
      .setDescription(message)
      .setFooter({
        text: `This message was sent to you because you are a server owner. Message sent by ${interaction.user.tag}`,
      })
      .setColor(client.color);

    const guilds = client.guilds.cache;

    let successCount = 0;
    let totalCount = 0;

    for (const guild of guilds.values()) {
      totalCount++;
      const owner = await guild.fetchOwner();
      try {
        await owner.send({ embeds: [messageEmbed] });
        successCount++;
      } catch {}

      // wait 5 seconds to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Broadcast')
          .setDescription(
            `Broadcasted your message to ${successCount} out of ${totalCount} servers (${(
              (successCount / totalCount) *
              100
            ).toFixed(2)}%).`
          )
          .setColor(client.color),
      ],
    });
  }
}
