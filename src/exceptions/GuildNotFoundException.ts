import Exception from './Exception';

export default class GuildNotFoundException extends Exception {
  constructor(guildId?: string) {
    super(guildId ? `Could not find guild ${guildId}` : 'Could not find guild');
    this.name = 'GuildNotFoundException';
  }
}
