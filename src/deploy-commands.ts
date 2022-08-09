import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as karmaCommands from './commands/karma';
import dotenv from 'dotenv';
dotenv.config();

export default async function deployCommands(guildId: string) {
  const commands = [karmaCommands.data];
  const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

  return rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, guildId), {
    body: commands
  });
}
