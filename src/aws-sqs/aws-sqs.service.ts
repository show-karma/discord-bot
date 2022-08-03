/* eslint-disable @typescript-eslint/no-explicit-any */
import { SQS } from 'aws-sdk';
import { AwsSqsOptions } from './aws-sqs.options';

export class AwsSqsService {
  private readonly sqs: SQS;

  constructor(private readonly options: AwsSqsOptions) {
    this.sqs = new SQS({
      region: process.env.AWS_SQS_DISCORD_DELEGATE_MESSAGE_UPDATE_REGION
    });
  }

  async sendMessage(message: string, delaySeconds?: number): Promise<string> {
    const delay = Math.min(delaySeconds, 900) || 0;
    return new Promise((res, rej) => {
      this.sqs.sendMessage(
        {
          QueueUrl: this.options.queueUrl,
          MessageBody: message,
          DelaySeconds: delay
        },
        (err, data) => {
          if (err) rej(err);
          else res(data.MessageId);
        }
      );
    });
  }

  async receiveMessage(waitSeconds: number): Promise<{
    messageId: string;
    message: string;
    receiptHandle: string;
    messageAttributes: Record<string, any>;
  } | null> {
    return new Promise((res, rej) => {
      this.sqs.receiveMessage(
        {
          QueueUrl: this.options.queueUrl,
          WaitTimeSeconds: waitSeconds,
          MaxNumberOfMessages: 1
        },
        (err, data) => {
          if (err) {
            rej(err);
          } else {
            if (!data.Messages || data.Messages.length === 0) {
              res(null);
            } else {
              const { MessageId, MessageAttributes, ReceiptHandle, Body } = data.Messages[0];
              res({
                messageId: MessageId,
                messageAttributes: MessageAttributes,
                receiptHandle: ReceiptHandle,
                message: Body
              });
            }
          }
        }
      );
    });
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    return new Promise((res, rej) => {
      this.sqs.deleteMessage(
        {
          ReceiptHandle: receiptHandle,
          QueueUrl: this.options.queueUrl
        },
        (err, _data) => {
          if (err) rej(err);
          else res();
        }
      );
    });
  }

  async getMessagesInQueue(): Promise<number> {
    throw new Error('no yet');
  }
}
