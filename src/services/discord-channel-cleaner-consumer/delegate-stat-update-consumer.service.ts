/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { Client, Intents } from 'discord.js';
import { DiscordChannelCleanerMessage } from '../../@types/discord-channel-cleaner';
import { DiscordChannelCleanerProducerService } from '../discord-channel-cleaner-producer/delegate-stat-update-producer.service';
import { delay } from '../../utils/delay';

const LOG_CTX = 'DiscordChannelCleanerConsumerService';

export class DiscordChannelCleanerConsumerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_SQS_DISCORD_CHANNEL_CLEANER_URL
    }),
    private readonly delegateStatUpdateProducerService = new DiscordChannelCleanerProducerService(),
    private readonly timeToLeave = 30 * 60 * 1000 // 30 min
  ) {}

  async run() {
    try {
      const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
      });

      await client.login(process.env.DISCORD_TOKEN);
      client.once('ready', async () => {
        console.log('Ready');
      });

      while (true) {
        const message = await this.sqs.receiveMessage(20);

        if (message) {
          const startTime = Date.now();
          await this.sqs.deleteMessage(message.receiptHandle);
          const parsedMessage = JSON.parse(message.message) as DiscordChannelCleanerMessage;

          const channel = (await client.channels.cache.get(parsedMessage.channelId)) as any;
          if (!channel) continue;

          console.log(`[${message.messageId}][${JSON.stringify(parsedMessage)}]`, LOG_CTX);

          if (parsedMessage.timestamp + this.timeToLeave > Date.now()) {
            const lastMessage = await channel.messages.fetch({ limit: 1 });
            const formattedMessage = (Array.from(lastMessage)[0]['1'] as any) || null;

            console.log(formattedMessage);

            parsedMessage.timestamp;
            await this.delegateStatUpdateProducerService.produce({
              channelId: parsedMessage.channelId,
              timestamp: +formattedMessage.createdTimestamp || parsedMessage.timestamp
            });
          } else {
            if (channel) await channel.delete();
          }

          console.log(`Time [${Date.now() - startTime}]`, LOG_CTX);
        }
      }
    } catch (err) {
      console.error(err, err.stack, LOG_CTX);
      process.exit(1);
    }
  }
}
