import Exception from './Exception';

export default class FailedToCreateTicketChannelException extends Exception {
  constructor(ticketId: number) {
    super(`Could not create ticket channel for ticket ${ticketId}`);
    this.name = 'FailedToCreateTicketChannelException';
  }
}
