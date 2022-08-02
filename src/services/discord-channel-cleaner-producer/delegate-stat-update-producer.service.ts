/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { DiscordChannelCleanerMessage } from '../../@types/discord-channel-cleaner';

const LOG_CTX = 'DiscordChannelCleanerProducerService';

export class DiscordChannelCleanerProducerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_SQS_DISCORD_CHANNEL_CLEANER_URL
    })
  ) {}

  async produce(message: DiscordChannelCleanerMessage) {
    try {
      const meesageId = await this.sqs.sendMessage(JSON.stringify(message), 60);

      console.log(`[${meesageId}][${JSON.stringify(message)}]`, LOG_CTX);
    } catch (err) {
      console.error(err, LOG_CTX);
    }
  }
}
