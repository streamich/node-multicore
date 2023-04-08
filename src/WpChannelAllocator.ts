import {WpChannel} from './WpChannel';

export class WpChannelAllocator {
  protected channels: WpChannel[] = [];

  public alloc(): WpChannel {
    if (this.channels.length) return this.channels.pop()!;
    return new WpChannel(0);
  }

  public free(channel: WpChannel<any, any, any>): void {
    if (this.channels.length < 128) {
      channel.reset();
      this.channels.push(channel);
    }
  }
}
