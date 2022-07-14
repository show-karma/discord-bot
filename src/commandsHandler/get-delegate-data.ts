/* eslint-disable no-console */
import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js';
import { api } from '../api/index';

export default async function getDelegateData(interaction: CommandInteraction) {
  const member = interaction.member as GuildMember;
  const { name: guildName } = interaction.guild;
  const address = interaction.options.getString('param');
  const daoName = interaction.options.getString('dao');

  try {
    const userData = await (await api.get(`/user/${address}`)).data.data;

    if (!userData) {
      return member.send('User not found');
    }

    const finalGuildName = daoName || guildName;

    let message = '';

    if (daoName && daoName.toLowerCase() === 'all') {
      userData.delegates.map((delegate) => {
        const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');

        message = message.concat(`
        Dao: ${delegate.daoName}
        Name: ${userData.ensName}
        Address: ${userData.address}
        Delegated votes: ${delegateLifetimeStats.delegatedVotes}
        On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct}%
        Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct}%
      `);
      });
    } else {
      const delegate = userData.delegates.find((item) => finalGuildName.includes(item.daoName));

      if (!delegate) {
        return member.send('Delegate not found');
      }

      const delegateLifetimeStats = delegate.stats.find((item) => item.period === 'lifetime');

      message = `
      Dao: ${delegate.daoName}
      Name: ${userData.ensName}
      Address: ${userData.address}
      Delegated votes: ${delegateLifetimeStats.delegatedVotes}
      On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct}%
      Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct}%
    `;
    }

    const userDataMessagemEmbed = new MessageEmbed().setDescription(message);

    return member.send({ embeds: [userDataMessagemEmbed] });
  } catch (err) {
    console.log(err.response.data.error);
    return member.send(err.response.data.error.message || 'Something went wrong, please try again');
  }
}
