import Exception from './Exception';

export default class CommandNotFoundException extends Exception {
  constructor(command: string) {
    super(`Could not find command ${command}`);
    this.name = 'CommandNotFoundException';
  }
}
