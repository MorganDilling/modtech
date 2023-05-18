import { Client, ClientOptions, Collection, ColorResolvable } from 'discord.js';
import Command from './Command';
import Button from './Button';
import Modal from './Modal';
import Logger from './Logger';
import { PrismaClient } from '@prisma/client';

export default class ExtendedClient extends Client {
  public logger: Logger;
  public commands: Collection<string, Command>;
  public buttons: Collection<string, Button>;
  public modals: Collection<string, Modal>;
  public prisma: PrismaClient;
  public color: ColorResolvable;

  constructor(options: ClientOptions) {
    super(options);

    this.logger = new Logger();
    this.commands = new Collection();
    this.buttons = new Collection();
    this.modals = new Collection();
    this.prisma = new PrismaClient();
    this.color = '#5865F2';
  }
}
