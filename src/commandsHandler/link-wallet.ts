/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { isEthAddress } from '../utils/is-eth-address';
import CryptoJsHandler from '../utils/aes256-generator';
import { SentryService } from '../sentry/sentry.service';

export default async function linkWalletHandler(address: string, daoName: string, userId: string) {
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
    return ` ${process.env.FRONTEND_URL}/discord/linking?message=${encryptedData}`;
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
      return ` Something went wrong, please try again`;
    } else {
      return `Invalid eth address!`;
    }
  }
}
