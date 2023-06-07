import Exception from './Exception';

export default class StringSelectMenuNotFoundException extends Exception {
  constructor(command: string) {
    super(`Could not find string select menu ${command}`);
    this.name = 'StringSelectMenuNotFoundException';
  }
}
