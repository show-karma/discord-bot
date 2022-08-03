/* eslint-disable no-console */
import { DiscordChannelCleanerConsumerService } from './delegate-stat-update-consumer.service';
import dotenv from 'dotenv';
dotenv.config();

const LOG_CTX = 'discord-channel-cleaner-consumer-main';

function onError(err: Error) {
  console.log(err, LOG_CTX);
  process.exit(1);
}

async function bootstrap() {
  process.on('uncaughtException', onError);
  process.on('unhandledRejection', onError);

  if (process.env.TZ !== 'UTC') throw new Error('TZ=UTC not set');
  if (!process.env.NODE_ENV) throw new Error('NODE_ENV not set');

  const DiscordChannelCleanerConsumer = new DiscordChannelCleanerConsumerService();
  DiscordChannelCleanerConsumer.run();
}

bootstrap();
