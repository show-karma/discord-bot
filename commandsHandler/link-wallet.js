import { isEthAddress } from "../helpers/is-eth-address.js";
import CryptoJsHandler from "../helpers/aes256-generator.js";

export default async function linkWalletHandler(interaction) {
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
    await member.send(
      `http://292e-2804-1b2-d080-eda6-50d5-db7b-c867-cd17.ngrok.io/discord/linking?message=${encryptedData}`
    );
    await interaction.reply("Check your DM");
  } catch (err) {
    console.log(err);
    if (err.code === 50007) {
      return await interaction.reply(`
            Can't DM you, please change your privacity settings`);
    }
  }
}
