/* eslint-disable no-console */
import { AwsSqsService } from '../../aws-sqs/aws-sqs.service';
import { DelegateStatUpdateMessage } from '../../@types/delegate-stat-update';

const LOG_CTX = 'DelegateStatUpdateProducerService';

export class DelegateStatUpdateProducerService {
  constructor(
    private readonly sqs = new AwsSqsService({
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_SQS_DELEGATE_STAT_UPDATE_URL
    })
  ) {}

  async produce(message: DelegateStatUpdateMessage) {
    try {
      const meesageId = await this.sqs.sendMessage(JSON.stringify(message));

      console.log(`[${meesageId}][${JSON.stringify(message)}]`, LOG_CTX);
    } catch (err) {
      console.error(err, LOG_CTX);
    }
  }
}
