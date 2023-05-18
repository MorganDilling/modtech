import Exception from './Exception';

export default class DatabaseGuildNotFoundException extends Exception {
  constructor(guildId: string) {
    super(`Could not find guild database entry for guild ${guildId}`);
    this.name = 'DatabaseGuildNotFoundException';
  }
}
