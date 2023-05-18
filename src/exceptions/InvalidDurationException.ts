import Exception from './Exception';

export default class InvalidDurationException extends Exception {
  constructor(type: string) {
    super(`Invalid duration type: ${type}`);
    this.name = 'InvalidDurationException';
  }
}
