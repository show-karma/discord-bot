/* eslint-disable @typescript-eslint/no-explicit-any */
import { Channel, Client, CommandInteraction } from 'discord.js';
import { DiscordChannelCleanerProducerService } from '../services/discord-channel-cleaner-producer/delegate-stat-update-producer.service';

export const createTicketChannel = async (
  client: Client,
  interaction: CommandInteraction | any
) => {
  const discordChannelCleanerProducerService = new DiscordChannelCleanerProducerService();
  const userId = interaction.user.id || interaction.author.id;
  const userName = interaction.user.username || interaction.author.username;

  let interactionChannel = client.guilds.cache
    .get(interaction.guildId)
    .channels.cache.find((channel: any) => channel.topic == userId);

  if (!interactionChannel) {
    interactionChannel = await interaction.guild.channels.create(`karma.bot-${userName}`, {
      topic: userId,
      permissionOverwrites: [
        {
          id: userId,
          allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        },
        {
          id: process.env.DISCORD_APPLICATION_ID,
          allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
        },
        {
          id: interaction.guild.roles.everyone,
          deny: ['VIEW_CHANNEL']
        }
      ],
      type: 'GUILD_TEXT'
    });

    await discordChannelCleanerProducerService.produce({
      channelId: interactionChannel.id,
      timestamp: Date.now()
    });
  }

  return <Channel>interactionChannel;
};
