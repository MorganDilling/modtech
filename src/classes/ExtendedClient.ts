import { Client, ClientOptions, Collection, ColorResolvable } from 'discord.js';
import Command from './Command';
import Button from './Button';
import Modal from './Modal';
import Timer from './Timer';
import Logger from './Logger';
import { Ban, PrismaClient, Feedback } from '@prisma/client';
import StringSelectMenu from './StringSelectMenu';

export interface ClientCache {
  bans: Collection<number, Ban>;
  feedback: Collection<number, Feedback>;
}

export default class ExtendedClient extends Client {
  public logger: Logger;
  public commands: Collection<string, Command>;
  public buttons: Collection<string, Button>;
  public modals: Collection<string, Modal>;
  public stringSelectMenus: Collection<string, StringSelectMenu>;
  public timers: Collection<string, Timer>;
  public prisma: PrismaClient;
  public color: ColorResolvable;
  public cache: ClientCache;

  /**
   * Key: Command name + user ID (e.g. 'ping-1234567890')
   *
   * Value: unix timestamp of when the cooldown will expire
   */
  public cooldowns: Collection<string, number>;

  constructor(options: ClientOptions) {
    super(options);

    this.logger = new Logger();
    this.commands = new Collection();
    this.buttons = new Collection();
    this.modals = new Collection();
    this.stringSelectMenus = new Collection();
    this.timers = new Collection();
    this.prisma = new PrismaClient();
    this.color = '#5865F2';
    this.cache = {
      bans: new Collection(),
      feedback: new Collection(),
    };
    this.cooldowns = new Collection();
  }
}
