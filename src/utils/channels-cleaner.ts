/* eslint-disable no-console */
export default class ChannelsCleaner {
  channels = {};
  timeToLeave = 1 * 60 * 1000; // 30 min

  addChannel(channel) {
    try {
      if (this.channels[channel.id]) {
        this.channels[channel.id].timestamp = Date.now();
      } else {
        this.channels[channel.id] = { timestamp: Date.now(), channel };
        const interval = setInterval(() => {
          if (+this.channels[channel.id].timestamp + this.timeToLeave <= Date.now() - 100) {
            this.channels[channel.id].channel.delete();
            delete this.channels[channel.id];
            clearInterval(interval);
          }
        }, this.timeToLeave);
      }
    } catch (err) {
      console.log(`err to delete channel`);
    }
  }
}
