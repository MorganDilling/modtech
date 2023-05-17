import ExtendedClient from './ExtendedClient';

export default abstract class DiscordEvent {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  public once = false;

  public execute(client: ExtendedClient, ...args: unknown[]): void {
    client.logger.warn(`Event ${this.name} is missing execute() method`);
    client.logger.info(`Event ${this.name} was called with args: ${args}`);
  }
}
