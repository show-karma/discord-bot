/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import CryptoJsHandler from '../utils/aes256-generator';
import { SentryService } from '../sentry/sentry.service';
import { EthService } from '../services/eth.service';

export default async function linkWalletHandler(address: string, daoName: string, userId: string) {
  const sentryService = new SentryService();
  const ethService = new EthService();

  try {
    const validAddressOrEnsAddress = await ethService.checkIfAddressOrEnsNameIsValid(
      address.toLowerCase()
    );

    if (!validAddressOrEnsAddress) {
      throw new Error('Invalid eth address or ens name');
    }

    const encryptedData = new CryptoJsHandler(process.env.DISCORD_BOT_AES256_SECRET).encrypt(
      JSON.stringify({
        guildId: daoName.toLowerCase(),
        discordId: userId,
        userAddress: validAddressOrEnsAddress
      })
    );
    return ` ${process.env.FRONTEND_URL}/discord/linking?message=${encryptedData}`;
  } catch (err) {
    console.log(err.message);

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
      return err.message;
    }
  }
}
