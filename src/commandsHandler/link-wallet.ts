/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { isEthAddress } from '../utils/is-eth-address';
import CryptoJsHandler from '../utils/aes256-generator';
import { CommandInteraction } from 'discord.js';

export default async function linkWalletHandler(interaction: CommandInteraction, ticketChannel) {
  const address = interaction.options.getString('address');

  if (!isEthAddress(address)) {
    return ticketChannel.send(`<@!${interaction.user.id}> \n Invalid eth address!`);
  }
  try {
    const encryptedData = new CryptoJsHandler(process.env.DISCORD_BOT_AES256_SECRET).encrypt(
      JSON.stringify({
        discordId: interaction.user.id,
        userAddress: address
      })
    );
    await ticketChannel.send(
      `<@!${interaction.user.id}> \n ${process.env.FRONTEND_URL}/discord/linking?message=${encryptedData}`
    );
  } catch (err) {
    console.log(err);
    if (err.code === 50007) {
      return await interaction.reply(`
      <@!${interaction.user.id}> \n Something went wrong, please try again`);
    }
  }
}
