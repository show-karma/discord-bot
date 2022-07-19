/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { DiscordSQSMessage } from 'src/@types/discord-message-update';
import GetPastMessagesService from '../get-messages.service';
const LOG_CTX = 'DelegateStatUpdateConsumerService';

export class DiscordMessageConsumerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      queueUrl: process.env.AWS_SQS_DISCORD_DELEGATE_MESSAGE_UPDATE_URL
    })
  ) {}

  async run() {
    try {
      while (true) {
        const message = await this.sqs.receiveMessage(20);
        if (message) {
          const startTime = Date.now();
          await this.sqs.deleteMessage(message.receiptHandle);

          const parsedMessage = JSON.parse(message.message) as DiscordSQSMessage;

          console.log(`[${message.messageId}][${JSON.stringify(parsedMessage)}]`, LOG_CTX);
          if (parsedMessage.daos) {
            console.log(parsedMessage);
            await new GetPastMessagesService().getMessages(parsedMessage);
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
