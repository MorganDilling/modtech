import ExtendedClient from './ExtendedClient';

export default abstract class Timer {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  public once = false;

  public executeOnStart = false;

  public interval = 300000;

  public execute(client: ExtendedClient, ...args: unknown[]): void {
    client.logger.warn(`Timer ${this.name} is missing execute() method`);
    client.logger.info(`Timer ${this.name} was called with args: ${args}`);
  }
}
