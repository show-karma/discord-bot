/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { Client, Intents } from 'discord.js';
import { DiscordChannelCleanerMessage } from '../../@types/discord-channel-cleaner';
import { DiscordChannelCleanerProducerService } from '../discord-channel-cleaner-producer/delegate-stat-update-producer.service';
import { SentryService } from '../../sentry/sentry.service';

const LOG_CTX = 'DiscordChannelCleanerConsumerService';

export class DiscordChannelCleanerConsumerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_SQS_DISCORD_CHANNEL_CLEANER_URL
    }),
    private readonly delegateStatUpdateProducerService = new DiscordChannelCleanerProducerService(),
    private readonly timeToLeave = 30 * 60 * 1000, // 30 min
    private readonly sentryService = new SentryService()
  ) {}

  async run() {
    let parsedMessage = {} as DiscordChannelCleanerMessage;
    try {
      const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
      });

      await client.login(process.env.DISCORD_TOKEN);
      client.once('ready', async () => {
        console.log('Ready');
      });

      while (true) {
        try {
          const message = await this.sqs.receiveMessage(20);

          if (message) {
            const startTime = Date.now();
            await this.sqs.deleteMessage(message.receiptHandle);
            parsedMessage = JSON.parse(message.message) as DiscordChannelCleanerMessage;

            const channel = (await client.channels.cache.get(parsedMessage.channelId)) as any;
            if (!channel) continue;

            console.log(`[${message.messageId}][${JSON.stringify(parsedMessage)}]`, LOG_CTX);

            const lastMessage = await channel.messages.fetch({ limit: 1 });
            const formattedMessage = (Array.from(lastMessage)[0]?.['1'] as any) || null;
            const lastMassageTime = formattedMessage?.createdTimestamp || parsedMessage.timestamp;

            if (lastMassageTime + this.timeToLeave > Date.now()) {
              await this.delegateStatUpdateProducerService.produce(
                {
                  channelId: parsedMessage.channelId,
                  timestamp: +lastMassageTime
                },
                this.timeToLeave / 1000
              );
            } else {
              if (channel) await channel.delete();
            }

            console.log(`Time [${Date.now() - startTime}]`, LOG_CTX);
          }
        } catch (err) {
          this.sentryService.logError(
            err,
            {
              service: 'discord:delete:channel'
            },
            {
              info: {
                channelId: parsedMessage.channelId
              }
            }
          );
        }
      }
    } catch (err) {
      console.error(err, err.stack, LOG_CTX);

      process.exit(1);
    }
  }
}
