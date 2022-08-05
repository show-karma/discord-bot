/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Client, Intents } from 'discord.js';
import { delay } from '../utils/delay';
import dotenv from 'dotenv';
import { LastMessageIdGetterService } from './last-message-id-getter.service';
import { Message, MessageBulkWriter } from './message-bulk-writer';
import { DiscordSQSMessage } from '../@types/discord-message-update';
import _ from 'lodash';
import { DelegateStatUpdateProducerService } from './delegate-stat-update-producer/delegate-stat-update-producer.service';

dotenv.config();

interface TextChannel {
  name: string;
  id: string;
}

export interface DiscordMessage {
  id: string;
  createdTimestamp: number;
  author: { id: string };
}

interface MessageCustom extends Message {
  daoName: string;
}

export default class GetPastMessagesService {
  constructor(
    private readonly getMessageService = new LastMessageIdGetterService(),
    private readonly messageBulkWriter = new MessageBulkWriter(),
    private readonly delegateStatUpdateProducerService = new DelegateStatUpdateProducerService()
  ) {}

  async getAllTextChannelsOfAGuild(client: Client, guildId: string) {
    const channels = (await client.guilds.fetch(guildId)).channels.cache;
    const textChannels: TextChannel[] = [];
    [...channels].map((channel) => {
      if (
        channel[1].name &&
        channel[1].id &&
        channel[1].type === 'GUILD_TEXT' &&
        !channel[1].name.includes('karma.bot') // ignore bot reply channels
      ) {
        textChannels.push({
          name: channel[1].name,
          id: channel[1].id
        });
      }
    });
    return textChannels;
  }

  async insertAllMessages(allMessagesToSave: Message[]) {
    await this.messageBulkWriter.write(allMessagesToSave);
    await this.messageBulkWriter.end();
  }

  async createUpdateDelegateStatsMessage(
    allMessagesToSave: MessageCustom[],
    publicAddress,
    reason
  ) {
    for (const message of _.uniqBy(allMessagesToSave, 'userId')) {
      await this.delegateStatUpdateProducerService.produce({
        dao: message.daoName,
        publicAddress,
        reason,
        timestamp: Date.now()
      });
    }
  }

  async getMessages(
    client: Client,
    { reason, publicAddress, discordId, daos, users }: DiscordSQSMessage
  ) {
    const dateObj = new Date();
    const requiredDate = new Date().setMonth(dateObj.getMonth() - 6);

    try {
      const allBotGuilds = Array.from(await client.guilds.fetch());
      const allUsers = [discordId || users].flat();
      const allMessagesToSave = [];
      let messagescount = 0;
      if (!daos.length) {
        throw new Error('Daos are empty');
      }
      console.log('Daos of user: ', daos);
      console.log('Servers -> bot is inside: ', allBotGuilds);

      for (const guild of daos) {
        if (!allBotGuilds.find((item) => +item[0] === +guild.guildId)) continue;

        const formattedGuildChannels = guild.channelIds
          ? guild.channelIds.map((guild) => ({
              id: guild
            }))
          : null;

        const textChannels =
          formattedGuildChannels || (await this.getAllTextChannelsOfAGuild(client, guild.guildId));

        for (const channel of textChannels) {
          const fixedMessageId = await this.getMessageService.getLastMessageId(
            guild.guildId,
            channel.id
          );
          let pointerMessage = undefined;
          let flagTimeRangeContinue = true;
          do {
            const channelExists = (await client.channels.cache.get(channel.id)) as any;
            if (!channelExists) continue;

            const messages = await channelExists.messages.fetch({
              before: pointerMessage
            });

            const messagesToArray = Array.from(messages);

            messagesToArray.length &&
              messages.map((message: DiscordMessage) => {
                messagescount += 1;
                const userExists = allUsers.find((user) => +user === +message.author.id);
                if (+message.createdTimestamp <= +requiredDate) {
                  flagTimeRangeContinue = false;
                }

                if (
                  userExists &&
                  +message.createdTimestamp >= +requiredDate &&
                  +message.id > +fixedMessageId
                ) {
                  allMessagesToSave.push({
                    messageCreatedAt: new Date(message.createdTimestamp),
                    messageId: message.id,
                    guildId: guild.guildId,
                    daoName: guild.name,
                    channelId: channel.id,
                    userId: message.author.id
                  });
                }
              });

            pointerMessage = messagesToArray[messagesToArray.length - 1]?.[0];
          } while (pointerMessage && pointerMessage > fixedMessageId && flagTimeRangeContinue);
        }
      }

      console.log('All messages count: ', messagescount);
      console.log('allMessagesToSave length: ', allMessagesToSave.length);
      if (allMessagesToSave.length > 0) {
        await this.insertAllMessages(allMessagesToSave);

        if (reason === 'user-discord-link') {
          await this.createUpdateDelegateStatsMessage(allMessagesToSave, publicAddress, reason);
        }
      }
    } catch (err) {
      console.log('error: ', err);
    }
  }
}
