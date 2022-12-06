import { SlashCommandBuilder } from '@discordjs/builders';
import linkWalletHandler from '../commandsHandler/link-wallet';
import getDelegateData from '../commandsHandler/get-delegate-data';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { MixpanelProvider } from 'src/mixpanel/mixpanel.provider';

export const data = new SlashCommandBuilder()
  .setName('karma')
  .setDescription('karma bot commands!')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('linkwallet')
      .setDescription('link you eth address!')
      .addStringOption((option) =>
        option.setName('address').setDescription('Eth address or ens name').setRequired(true)
      )
      .addStringOption((option) => option.setName('dao').setDescription(`Enter daoName to link`))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('stats')
      .setDescription('get info delegate info using address, forum name or userId')
      .addStringOption((option) =>
        option.setName('user').setDescription('Enter address or ens name').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('dao').setDescription(`Enter daoName or "all" to get all dao stats`)
      )
  );

export async function execute(interaction: CommandInteraction) {
  let replyMessage = '';

  const mixpanel = MixpanelProvider.factory({
    eventNamePrefix: 'discordBot',
    appendData: {
      guild: interaction.guild.name,
      guildId: interaction.guildId
    }
  });

  switch (interaction.options.getSubcommand()) {
    case 'linkwallet':
      const addressWallet = interaction.options.getString('address');
      const daoNameWallet = interaction.options.getString('dao') || interaction.guildId;
      replyMessage = await linkWalletHandler(addressWallet, daoNameWallet, interaction.user.id);

      mixpanel.enqueue({
        event: 'linkwallet',
        properties: {
          addressWallet,
          daoNameWallet
        }
      });

      break;
    case 'stats':
      const addressStats = interaction.options.getString('user');
      const daoNameStats = interaction.options.getString('dao');
      const guildId = interaction.guild.id;
      replyMessage = await getDelegateData(addressStats, daoNameStats, guildId);

      mixpanel.enqueue({
        event: 'stats',
        properties: {
          addressStats,
          daoNameStats
        }
      });

      break;
    default:
      await interaction.editReply('This command does not exist');
      break;
  }

  const messageEmbed = new MessageEmbed().setDescription(replyMessage);
  mixpanel.dispatch();
  return interaction.editReply({
    embeds: [messageEmbed]
  });
}
