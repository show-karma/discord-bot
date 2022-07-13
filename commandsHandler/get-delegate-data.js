import { MessageEmbed } from "discord.js";
import { api } from "../service/api.js";

export default async function getDelegateData(interaction) {
  const member = interaction.member;
  const { id: guildId, name: guildName } = interaction.guild;
  const address = interaction.options.getString("param");
  const daoName = interaction.options.getString("dao");
  try {
    const userData = await (await api.get(`/user/${address}`)).data.data;
    if (!userData) {
      return interaction.reply("User not found");
    }

    const finalGuildName = daoName || guildName;

    let message = "";

    if (daoName && daoName.toLowerCase() === "all") {
      userData.delegates.map((delegate) => {
        const delegateLifetimeStats = delegate.stats.find(
          (item) => item.period === "lifetime"
        );

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
      const delegate = userData.delegates.find((item) =>
        finalGuildName.includes(item.daoName)
      );

      if (!delegate) {
        return interaction.reply("Delegate not found");
      }

      const delegateLifetimeStats = delegate.stats.find(
        (item) => item.period === "lifetime"
      );

      message = `
      Dao: ${delegate.daoName}
      Name: ${userData.ensName}
      Address: ${userData.address}
      Delegated votes: ${delegateLifetimeStats.delegatedVotes}
      On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct}%
      Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct}%
    `;
    }

    interaction.reply("");
    const userDataMessagemEmbed = new MessageEmbed().setDescription(message);

    return member.send({ embeds: [userDataMessagemEmbed] });
  } catch (err) {
    return interaction.reply("User not found");
  }
}
