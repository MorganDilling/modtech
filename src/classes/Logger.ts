import chalk from 'chalk';

export default class Logger {
  public info(...args: unknown[]): void {
    console.log(
      `[${chalk.cyan('INFO')}] ${chalk.bold(
        chalk.grey(new Date().toISOString())
      )}`,
      ...args
    );
  }

  public warn(...args: unknown[]): void {
    console.log(
      `[${chalk.yellow('WARNING')}] ${chalk.bold(
        chalk.grey(new Date().toISOString())
      )}`,
      ...args
    );
  }

  public error(...args: unknown[]): void {
    console.log(
      `[${chalk.red('ERROR')}] ${chalk.bold(
        chalk.grey(new Date().toISOString())
      )}`,
      ...args
    );
  }
}
