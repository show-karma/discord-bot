import { SlashCommandBuilder } from '@discordjs/builders';
import linkWalletHandler from '../commandsHandler/link-wallet';
import getDelegateData from '../commandsHandler/get-delegate-data';
import { Client, CommandInteraction } from 'discord.js';
import { createTicketChannel } from '../utils/create-ticket-channel';

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
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('stats')
      .setDescription('get info delegate info using address, forum name or userId')
      .addStringOption((option) =>
        option.setName('user').setDescription('address, ens name').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('dao').setDescription(`Enter daoName or "all" to get all dao stats`)
      )
  );

export async function execute(interaction: CommandInteraction, client: Client) {
  const ticketChannel = await createTicketChannel(client, interaction);
  switch (interaction.options.getSubcommand()) {
    case 'linkwallet':
      await linkWalletHandler(interaction, ticketChannel);
      break;
    case 'stats':
      await getDelegateData(interaction, ticketChannel);
      break;
    default:
      await interaction.editReply('This command does not exist');
      break;
  }

  await interaction.deleteReply();
}
