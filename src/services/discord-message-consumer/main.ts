/* eslint-disable no-console */
import { DiscordMessageConsumerService } from './discord-message-consumer.service';
import dotenv from 'dotenv';
dotenv.config();

const LOG_CTX = 'delegate-discord-message-update-consumer-main';

function onError(err: Error) {
  console.log(err, LOG_CTX);
  process.exit(1);
}

async function bootstrap() {
  process.on('uncaughtException', onError);
  process.on('unhandledRejection', onError);

  if (process.env.TZ !== 'UTC') throw new Error('TZ=UTC not set');
  if (!process.env.NODE_ENV) throw new Error('NODE_ENV not set');

  const DiscordMessageConsumer = new DiscordMessageConsumerService();
  DiscordMessageConsumer.run();
}

bootstrap();
