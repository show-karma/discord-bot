/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { DiscordSQSMessage } from 'src/@types/discord-message-update';
import GetPastMessagesService from '../get-messages.service';
import { Client, Intents } from 'discord.js';

const LOG_CTX = 'DelegateStatUpdateConsumerService';

export class DiscordMessageConsumerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_SQS_DELEGATE_DISCORD_MESSAGE_STAT_UPDATE_URL
    }),
    private readonly getPastMessagesService = new GetPastMessagesService()
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

          const parsedMessage = JSON.parse(message.message) as DiscordSQSMessage;

          console.log(`[${message.messageId}][${JSON.stringify(parsedMessage)}]`, LOG_CTX);
          if (parsedMessage.daos) {
            console.log(parsedMessage);
            await this.getPastMessagesService.getMessages(client, parsedMessage);
          } else {
            console.log('no daos');
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
