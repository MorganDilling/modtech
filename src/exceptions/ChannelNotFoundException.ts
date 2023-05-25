import Exception from './Exception';

export default class ChannelNotFoundException extends Exception {
  constructor(channelId?: string) {
    super(
      channelId
        ? `Could not find channel ${channelId}`
        : 'Could not find channel'
    );
    this.name = 'ChannelNotFoundException';
  }
}
