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
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('stats')
      .setDescription('get info delegate info using address, forum name or userId')
      .addStringOption((option) =>
        option.setName('param').setDescription('address, ens name').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('dao').setDescription(`blank: default dao \n dao name \n all `)
      )
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.reply('Check your DM');
  switch (interaction.options.getSubcommand()) {
    case 'linkwallet':
      return linkWalletHandler(interaction);
    case 'stats':
      return getDelegateData(interaction);
    default:
      return await interaction.reply('This command does not exist');
  }
}
