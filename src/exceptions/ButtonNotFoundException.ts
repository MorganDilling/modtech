import Exception from './Exception';

export default class ButtonNotFoundException extends Exception {
  constructor(command: string) {
    super(`Could not find button ${command}`);
    this.name = 'ButtonNotFoundException';
  }
}
