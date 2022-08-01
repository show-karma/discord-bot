/* eslint-disable @typescript-eslint/no-explicit-any */
import { Channel, Client, CommandInteraction } from 'discord.js';
import ChannelsCleaner from './channels-cleaner';

export const createTicketChannel = async (
  client: Client,
  interaction: CommandInteraction,
  channelsCleaner: ChannelsCleaner
) => {
  let interactionChannel = client.guilds.cache
    .get(interaction.guildId)
    .channels.cache.find((channel: any) => channel.topic == interaction.user.id);

  if (!interactionChannel) {
    interactionChannel = await interaction.guild.channels.create(
      `karma.bot-${interaction.user.username}`,
      {
        topic: interaction.user.id,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL']
          }
        ],
        type: 'GUILD_TEXT'
      }
    );
  }

  // method do check the life cycle of a channel
  // delete if the channel is inactive for more 30 min
  channelsCleaner.addChannel(interactionChannel);

  return <Channel>interactionChannel;
};
