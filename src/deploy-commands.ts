import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as commandModules from './commands/index';
import dotenv from 'dotenv';
dotenv.config();

export default async function deployCommands(guildId: string) {
  const commands = [];

  for (const module of Object.values<any>(commandModules)) {
    commands.push(module.data);
  }
  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  rest
    .put(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, guildId), {
      body: commands
    })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
}
