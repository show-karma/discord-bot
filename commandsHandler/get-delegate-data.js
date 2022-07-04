import { MessageEmbed } from "discord.js";
import { api } from "../service/api.js";

export default async function getDelegateData(interaction) {
  try {
    const { id: guildId, name: guildName } = interaction.guild;
    const address = interaction.options.getString("param");

    const userData = await (await api.get(`/user/${address}`)).data.data;
    const delegate = userData.delegates
      // .find((item) => guildName.includes(item.daoName))
      .find((item) => item.daoName === "ens");

    const delegateLifetimeStats = delegate.stats.find(
      (item) => item.period === "lifetime"
    );

    const userDataMessagemEmbed = new MessageEmbed().setDescription(`
        Dao: ${delegate.daoName}
        Name: ${userData.ensName}
        Address: ${userData.address}
        Delegated votes: ${delegateLifetimeStats.delegatedVotes}
        On-chain voting percent: ${delegateLifetimeStats.onChainVotesPct}%
        Off-chain voting percent: ${delegateLifetimeStats.offChainVotesPct}%
      `);

    return interaction.reply({
      embeds: [userDataMessagemEmbed],
    });
  } catch (err) {
    console.log(err);
    return interaction.reply(err.message);
  }
}
