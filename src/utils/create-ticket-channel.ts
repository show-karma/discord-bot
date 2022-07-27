import { Channel } from 'discord.js';
import Poll from './poll';

export const createTicketChannel = async (client, interaction) => {
  let interactionChannel = client.guilds.cache
    .get(interaction.guildId)
    .channels.cache.find((channel) => channel.topic == interaction.user.id);

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
  Poll.addChannel(interactionChannel);

  return <Channel>interactionChannel;
};
