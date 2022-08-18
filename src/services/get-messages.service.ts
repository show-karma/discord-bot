/* eslint-disable max-lines-per-function */
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
import { messageContainsLink } from '../utils/messages-contain-link';

dotenv.config();

interface TextChannel {
  name: string;
  id: string;
  type: string;
}

export interface DiscordMessage {
  id: string;
  content: string;
  createdTimestamp: number;
  attachments: unknown[];
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

  async getAllTextChannelsOfAGuild(
    client: Client,
    guildId: string,
    specificChannels: { id: string }[]
  ) {
    const channels = (await client.guilds.fetch(guildId)).channels.cache;
    const channelsType = ['GUILD_TEXT', 'GUILD_PUBLIC_THREAD', 'GUILD_PRIVATE_THREAD'];
    const textChannels: TextChannel[] = [];
    [...channels].map((channel) => {
      if (
        channel[1].name &&
        channel[1].id &&
        channelsType.includes(channel[1].type) &&
        !channel[1].name.includes('karma.bot') // ignore bot reply channels
      ) {
        textChannels.push({
          name: channel[1].name,
          id: channel[1].id,
          type: channel[1].type
        });
      }
    });

    const filteredChannels = specificChannels
      ? [...specificChannels, ...textChannels.filter((channel) => channel.type !== 'GUILD_TEXT')]
      : textChannels;

    return filteredChannels;
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

        const textChannels = await this.getAllTextChannelsOfAGuild(
          client,
          guild.guildId,
          formattedGuildChannels
        );

        console.log(textChannels);

        for (const channel of textChannels) {
          try {
            const fixedMessageId = await this.getMessageService.getLastMessageId(
              guild.guildId,
              channel.id
            );
            let pointerMessage = undefined;
            let flagToContinue = true;
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
                  if (!messages.length || +message.createdTimestamp <= +requiredDate) {
                    flagToContinue = false;
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
                      userId: message.author.id,
                      messageType: Array.from(message.attachments).length
                        ? 'attachment'
                        : messageContainsLink(message.content)
                        ? 'link'
                        : 'text'
                    });
                  }
                });

              pointerMessage = messagesToArray[messagesToArray.length - 1]?.[0];
            } while (pointerMessage && pointerMessage > fixedMessageId && flagToContinue);
          } catch (err) {
            console.log(err.message, channel);
          }
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
