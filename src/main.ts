/* eslint-disable no-console */
import { Client, Guild, Intents } from 'discord.js';
import deployCommands from './deploy-commands';
import * as commandModules from './commands/karma';
import { CustomInteraction } from './@types/custom-interaction';
import dotenv from 'dotenv';
import { DiscordChannelCleanerConsumerService } from './services/discord-channel-cleaner-consumer/delegate-stat-update-consumer.service';

dotenv.config();

const LOG_CTX = 'main.ts';

function onError(err: Error) {
  console.error(err, LOG_CTX);
  process.exit(1);
}

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);

if (process.env.TZ !== 'UTC') throw new Error('TZ=UTC not set');
if (!process.env.NODE_ENV) throw new Error('NODE_ENV not set');

const allCommands = [commandModules];

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
});

client.on('guildCreate', async (guild: Guild) => {
  if (guild) {
    await deployCommands(guild.id);
  }
});

client.once('ready', async () => {
  const discordChannelCleanerConsumerService = new DiscordChannelCleanerConsumerService();
  discordChannelCleanerConsumerService.run();
  // we can update the commands everytime the bot stats
  // cuz it only update when added into a new server
  const clintGuilds = Array.from(await client.guilds.fetch());
  for (const guild of clintGuilds) {
    await deployCommands(guild[0]);
  }

  console.log('Ready');
});

client.on('interactionCreate', async (interaction: CustomInteraction) => {
  if (!interaction.isCommand()) {
    return interaction.reply('This command does not exist');
  }

  const { commandName } = interaction;
  const command = allCommands.find((command) => command.data.name === commandName);

  if (!command) return;
  try {
    await interaction.deferReply();
    await command.execute(interaction, client);
  } catch (error) {
    console.log('Error: ', error.message);
    await interaction.editReply(
      'There was an error while executing this command, please try again'
    );
  }
});

client.login(process.env.DISCORD_TOKEN);

export default client;
