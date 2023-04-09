import {WpChannel} from './WpChannel';

export class WpChannelAllocator {
  protected channels: WpChannel[] = [];

  public alloc(): WpChannel {
    const channels = this.channels;
    if (channels.length) return channels.pop()!;
    return new WpChannel(0);
  }

  public free(channel: WpChannel<any, any, any>): void {
    const channels = this.channels;
    if (channels.length < 128) {
      channel.reset();
      channels.push(channel);
    }
  }
}
