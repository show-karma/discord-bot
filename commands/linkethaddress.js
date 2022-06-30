import { SlashCommandBuilder } from "@discordjs/builders";
import { isEthAddress } from "../helpers/eth-address.js";
import CryptoJsHandler from "../helpers/aes256-generator.js";

export default {
  data: new SlashCommandBuilder()
    .setName("linkethaddress")
    .setDescription("pass the eth address to link with eth address!")
    .addStringOption((option) =>
      option.setName("address").setDescription("Eth address").setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const address = interaction.options.getString("address");

    if (!isEthAddress(address)) {
      return await interaction.reply("Invalid eth address!");
    }
    try {
      const encryptedData = CryptoJsHandler.encrypt(
        JSON.stringify({
          discordId: interaction.user.id,
          userAddress: address,
        })
      );
      await member.send(`URL/${encryptedData}`);
      await interaction.reply("Check your DM");
    } catch (err) {
      console.log(err);
      if (err.code === 50007) {
        return await interaction.reply(
          `Can't DM you, please change your privacity settings`
        );
      }
    }
  },
};
