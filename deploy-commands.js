import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "node-fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

export default async function deployCommands(guildId) {
  if (guildId) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const commands = [];
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);
      commands.push(command.default.data.toJSON());
    }

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

    rest
      .put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_APPLICATION_ID,
          guildId
        ),
        { body: commands }
      )
      .then(() => console.log("Successfully registered application commands."))
      .catch(console.error);
  }
  return;
}
