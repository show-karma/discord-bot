/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { isEthAddress } from '../utils/is-eth-address';
import CryptoJsHandler from '../utils/aes256-generator';
import { CommandInteraction } from 'discord.js';
import { SentryService } from '../sentry/sentry.service';

export default async function linkWalletHandler(interaction: CommandInteraction) {
  const sentryService = new SentryService();
  const address = interaction.options.getString('address');
  const daoName = interaction.options.getString('dao');

  try {
    if (!isEthAddress(address)) {
      throw new Error('Invalid Eth address');
    }

    const encryptedData = new CryptoJsHandler(process.env.DISCORD_BOT_AES256_SECRET).encrypt(
      JSON.stringify({
        guildId: daoName || interaction.guildId,
        discordId: interaction.user.id,
        userAddress: address
      })
    );
    await interaction.reply({
      content: ` ${process.env.FRONTEND_URL}/discord/linking?message=${encryptedData}`,
      ephemeral: true
    });
  } catch (err) {
    console.log(err);

    sentryService.logError(
      err,
      {
        service: 'discord:link:wallet'
      },
      {
        info: {
          address,
          dao: daoName || interaction.guildId
        }
      }
    );
    if (err.code === 50007) {
      return interaction.reply({
        content: ` Something went wrong, please try again`,
        ephemeral: true
      });
    } else {
      return interaction.reply({ content: `Invalid eth address!`, ephemeral: true });
    }
  }
}
