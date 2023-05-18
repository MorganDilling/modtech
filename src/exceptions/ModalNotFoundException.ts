import Exception from './Exception';

export default class ModalNotFoundException extends Exception {
  constructor(customId: string) {
    super(`Could not find modal ${customId}`);
    this.name = 'ModalNotFoundException';
  }
}
