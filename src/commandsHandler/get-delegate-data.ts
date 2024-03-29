/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import { isEthAddress } from '../utils/is-eth-address';
import { api } from '../api/index';

function createStatusMessage(
  daoName: string,
  ensName: string,
  address: string,
  delegatedVotes: string,
  onChainVotesPct: string,
  offChainVotesPct: string
) {
  return `
Dao: ${daoName}\n${ensName ? `Name: ${ensName}\n` : ''}Address: ${address}\n${
    delegatedVotes ? `Delegated votes: ${delegatedVotes || 0}\n` : ''
  }${onChainVotesPct ? `On-chain voting percent: ${onChainVotesPct || 0}%\n` : ''}${
    offChainVotesPct ? `Off-chain voting percent: ${offChainVotesPct || 0}%` : ''
  }
      `;
}

export default async function getDelegateData(address: string, daoName: string, guildId: string) {
  try {
    const { data } = await api.get(`/user/${address}`);
    const userData = data?.data;

    const finalGuildIdentifier = daoName || guildId.toString();

    let message = ``;

    if (daoName && daoName.toLowerCase() === 'all') {
      userData.delegates.map((delegate) => {
        const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');
        message += createStatusMessage(
          delegate.daoName,
          userData.ensName,
          userData.address,
          delegate.delegatedVotes,
          delegateLifetimeStats.onChainVotesPct,
          delegateLifetimeStats.offChainVotesPct
        );
      });
    } else {
      const delegate = userData.delegates.find(
        (item) =>
          finalGuildIdentifier === item.daoName ||
          finalGuildIdentifier === item.socialLinks.discordGuildId
      );

      if (!delegate) {
        const delegateNotFoundMessage = daoName
          ? `We couldn't find a delegate with this address in ${daoName}. Email info@showkarma.xyz if you would like us to index this address`
          : 'No delegate found in DAO associated with this server. Request stats by passing dao name or "all" to get all the stats of this delegate';
        return delegateNotFoundMessage;
      }

      const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');

      message += createStatusMessage(
        delegate.daoName,
        userData.ensName,
        userData.address,
        delegate.delegatedVotes,
        delegateLifetimeStats?.onChainVotesPct,
        delegateLifetimeStats?.offChainVotesPct
      );
    }

    return message;
  } catch (err) {
    console.log(err.response.data.error);

    const userNotFoundError =
      err.response.data.error.message === 'User not found' ||
      err.response.data.error.errors[0].constraints
        ? !isEthAddress(address)
          ? "We couldn't find any contributor with that name"
          : "We couldn't find any contributor with that address"
        : 'Something went wrong, please try again';

    return userNotFoundError;
  }
}
