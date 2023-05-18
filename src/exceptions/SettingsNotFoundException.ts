import Exception from './Exception';

export default class SettingsNotFoundException extends Exception {
  constructor(guildId: string) {
    super(`Could not find settings object for guild ${guildId}`);
    this.name = 'SettingsNotFoundException';
  }
}
