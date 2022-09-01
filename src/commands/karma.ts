import { SlashCommandBuilder } from '@discordjs/builders';
import linkWalletHandler from '../commandsHandler/link-wallet';
import getDelegateData from '../commandsHandler/get-delegate-data';
import { CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('karma')
  .setDescription('karma bot commands!')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('linkwallet')
      .setDescription('link you eth address!')
      .addStringOption((option) =>
        option.setName('address').setDescription('Eth address').setRequired(true)
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
  switch (interaction.options.getSubcommand()) {
    case 'linkwallet':
      await linkWalletHandler(interaction);
      break;
    case 'stats':
      await getDelegateData(interaction);
      break;
    default:
      await interaction.editReply('This command does not exist');
      break;
  }
}
