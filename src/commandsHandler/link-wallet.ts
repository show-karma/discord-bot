/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { isEthAddress } from '../utils/is-eth-address';
import CryptoJsHandler from '../utils/aes256-generator';
import { TextChannel } from 'discord.js';
import { SentryService } from '../sentry/sentry.service';

export default async function linkWalletHandler(
  address: string,
  daoName: string,
  userId: string,
  ticketChannel: TextChannel
) {
  const sentryService = new SentryService();

  try {
    if (!isEthAddress(address)) {
      throw new Error('Invalid Eth address');
    }

    const encryptedData = new CryptoJsHandler(process.env.DISCORD_BOT_AES256_SECRET).encrypt(
      JSON.stringify({
        guildId: daoName.toLowerCase(),
        discordId: userId,
        userAddress: address
      })
    );
    await ticketChannel.send(
      `<@!${userId}> \n ${process.env.FRONTEND_URL}/discord/linking?message=${encryptedData}`
    );
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
          dao: daoName
        }
      }
    );
    if (err.code === 50007) {
      return ticketChannel.send(`
      <@!${userId}> \n Something went wrong, please try again`);
    } else {
      return ticketChannel.send(`<@!${userId}> \n Invalid eth address!`);
    }
  }
}
