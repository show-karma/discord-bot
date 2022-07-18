/* eslint-disable no-console */
import { Client, Guild, Intents } from 'discord.js';
import deployCommands from './deploy-commands';
import * as commandModules from './commands';
import { CustomInteraction } from './@types/custom-interaction';
import dotenv from 'dotenv';
dotenv.config();

const allCommands = [Object(commandModules)];

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
});

client.on('guildCreate', async (guild: Guild) => {
  if (guild) {
    await deployCommands(guild.id);
  }
});

client.once('ready', async () => {
  console.log('Ready');
});

client.on('interactionCreate', async (interaction: CustomInteraction) => {
  if (!interaction.isCommand()) {
    return interaction.reply('This command does not exist');
  }
  const { commandName } = interaction;

  const command = allCommands.find((item) => item.data.name === commandName);

  if (!command) return;
  try {
    await interaction.deferReply();
    await command.execute(interaction, client);
  } catch (error) {
    console.log('Error: ', error.message);
    await interaction.editReply(
      'There was an error while executing this command, please change your settings to allow dm messages'
    );
  }
});

client.login(process.env.DISCORD_TOKEN);

export default client;
