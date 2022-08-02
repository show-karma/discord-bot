/* eslint-disable @typescript-eslint/no-explicit-any */
import { Channel, Client, CommandInteraction } from 'discord.js';
import { DiscordChannelCleanerProducerService } from '../services/discord-channel-cleaner-producer/delegate-stat-update-producer.service';

export const createTicketChannel = async (client: Client, interaction: CommandInteraction) => {
  const discordChannelCleanerProducerService = new DiscordChannelCleanerProducerService();
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

    await discordChannelCleanerProducerService.produce({
      channelId: interactionChannel.id,
      createdAt: Date.now()
    });
  }

  return <Channel>interactionChannel;
};
