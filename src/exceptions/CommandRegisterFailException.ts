import Exception from './Exception';

export default class CommandRegisterFailException extends Exception {
  constructor(message: string) {
    super(`Failed whilst registering commands: ${message}`);
    this.name = 'CommandRegisterFailException';
  }
}
