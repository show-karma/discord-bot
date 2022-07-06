import { SlashCommandBuilder } from "@discordjs/builders";
import linkWalletHandler from "../commandsHandler/link-wallet.js";
import getDelegateData from "../commandsHandler/get-delegate-data.js";

export default {
  data: new SlashCommandBuilder()
    .setName("karma")
    .setDescription("karma bot commands!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("linkwallet")
        .setDescription("link you eth address!")
        .addStringOption((option) =>
          option
            .setName("address")
            .setDescription("Eth address")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription(
          "get info delegate info using address, forum name or userId"
        )
        .addStringOption((option) =>
          option
            .setName("param")
            .setDescription("address, ens name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("dao")
            .setDescription(`blank: default dao \n dao name \n all `)
        )
    ),

  async execute(interaction) {
    switch (interaction.options._subcommand) {
      case "linkwallet":
        return linkWalletHandler(interaction);
      case "stats":
        return getDelegateData(interaction);
      default:
        return await interaction.reply("This command does not exist");
    }
  },
};
