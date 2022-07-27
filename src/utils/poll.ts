/* eslint-disable no-console */
export default class Poll {
  static channels = {};
  static timeToLeave = 30 * 60 * 1000; // 30 min

  static addChannel(channel) {
    try {
      if (this.channels[channel.id]) {
        this.channels[channel.id].timestamp = Date.now();
      } else {
        this.channels[channel.id] = { timestamp: Date.now(), channel };
        const interval = setInterval(() => {
          if (+this.channels[channel.id].timestamp + this.timeToLeave <= Date.now()) {
            this.channels[channel.id].channel.delete();
            delete this.channels[channel.id];
            clearInterval(interval);
          }
        }, this.timeToLeave / 2);
      }
    } catch (err) {
      console.log(`err to delete channel`);
    }
  }
}
