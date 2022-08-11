/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { MessageEmbed, TextChannel } from 'discord.js';
import { isEthAddress } from '../utils/is-eth-address';
import { api } from '../api/index';

export default async function getDelegateData(
  address: string,
  daoName: string,
  guildName: string,
  userId: string,
  ticketChannel: TextChannel
) {
  try {
    const userData = await (await api.get(`/user/${address}`)).data.data;

    const finalGuildName = daoName || guildName;

    let message = `<@!${userId}> \n`;

    if (daoName && daoName.toLowerCase() === 'all') {
      userData.delegates.map((delegate) => {
        const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');

        message += `
        Dao: ${delegate.daoName}
        Name: ${userData.ensName}
        Address: ${userData.address}
        Delegated votes: ${delegateLifetimeStats.delegatedVotes}
        On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct || 0}%
        Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct || 0}%
      `;
      });
    } else {
      const delegate = userData.delegates.find((item) => finalGuildName.includes(item.daoName));

      if (!delegate) {
        const delegateNotFoundMessage = daoName
          ? `We couldn't find a delegate with this address in ${daoName}. Email info@showkarma.xyz if you would like us to index this address`
          : 'No delegate found in DAO associated with this server. Request stats by passing dao name or "all" to get all the stats of this delegate';
        return ticketChannel.send(delegateNotFoundMessage);
      }

      const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');

      message += `
      Dao: ${delegate.daoName}
      Name: ${userData.ensName}
      Address: ${userData.address}
      Delegated votes: ${delegateLifetimeStats.delegatedVotes}
      On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct || 0}%
      Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct || 0}%
    `;
    }

    const userDataMessagemEmbed = new MessageEmbed().setDescription(message);

    return ticketChannel.send({ embeds: [userDataMessagemEmbed] });
  } catch (err) {
    console.log(err.response.data.error);
    const userNotFoundError =
      err.response.data.error.message === 'User not found'
        ? !isEthAddress(address)
          ? "We couldn't find any contributor with that name"
          : "We couldn't find any contributor with that address"
        : 'Something went wrong, please try again';

    return ticketChannel.send(userNotFoundError);
  }
}
