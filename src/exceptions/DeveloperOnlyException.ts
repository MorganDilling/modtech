export default class Exception extends Error {
  constructor(command: string) {
    super(`${command} is a developer-only command. You cannot use it.`);
    this.name = 'DeveloperOnlyException';
  }
}
