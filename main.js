import dotenv from "dotenv";
import { Client, Intents, Collection } from "discord.js";
import { fileURLToPath } from "url";
import deployCommands from "./deploy-commands.js";
import fs from "node-fs";
import path from "node:path";

dotenv.config();

export default async function initBot() {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
    fetchAllMembers: true,
  });

  client.commands = new Collection();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);

    client.commands.set(command.default.data.name, command);
  }

  client.on("guildCreate", async (guild) => {
    if (guild) {
      await deployCommands(guild.id);
    }
  });

  client.once("ready", async () => {
    console.log("Ready");
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
      return interaction.reply("This command does not exist");
    }

    const { commandName } = interaction;

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
      await command.default.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  client.login(process.env.DISCORD_TOKEN);
  return client;
}

await initBot();
