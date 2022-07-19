/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Client, Intents } from 'discord.js';
import { delay } from '../utils/delay';
import dotenv from 'dotenv';
import { LastMessageIdGetterService } from './last-message-id-getter.service';
import { MessageBulkWriter } from './message-bulk-writer';
import { DiscordSQSMessage } from '../@types/discord-message-update';
dotenv.config();

interface MessageCustom {
  id: string;
  createdTimestamp: string;
  author: { id: string };
}

export default class GetPastMessagesService {
  constructor(
    private readonly getMessageService = new LastMessageIdGetterService(),
    private readonly messageBulkWriter = new MessageBulkWriter()
  ) {}

  // eslint-disable-next-line max-lines-per-function
  async getMessages({ reason, publicAddress, discordId, daos, timestamp }: DiscordSQSMessage) {
    const client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
    });

    await client.login(process.env.DISCORD_TOKEN);
    client.once('ready', async () => {
      console.log('Ready');
    });

    const dateObj = new Date();
    const requiredDate = new Date().setMonth(dateObj.getMonth() - 6);

    // delay to client starts
    await delay(5000);

    try {
      const allBotGuilds = Array.from(await client.guilds.fetch());
      const allUsers = [discordId].flat();
      const allGuilds = daos;
      const allMessagesToSave = [];
      let messagescount = 0;
      if (!allGuilds.length) {
        throw new Error('Daos are empty');
      }
      console.log('Daos of user: ', allGuilds);
      console.log('Servers -> bot is inside: ', allBotGuilds);

      for (const guild of allGuilds) {
        if (!allBotGuilds.find((item) => +item[0] === +guild.guildId)) continue;

        const channels = (await client.guilds.fetch(guild.guildId)).channels.cache;
        const textChannels = [];
        [...channels].map((channel) => {
          if (channel[1].name && channel[1].id && channel[1].type === 'GUILD_TEXT') {
            textChannels.push({
              name: channel[1].name,
              id: channel[1].id
            });
          }
        });

        for (const channel of textChannels) {
          const fixedMessageId = await this.getMessageService.getLastMessageId(
            guild.guildId,
            channel.id
          );
          let pointerMessage = undefined;
          let flagTimeRangeContinue = true;
          do {
            const messages = await (
              (await client.channels.cache.get(channel.id)) as any
            ).messages.fetch({
              before: pointerMessage
            });

            const messagesToArray = Array.from(messages);

            messagesToArray.length &&
              messages.map((message: MessageCustom) => {
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
        await this.messageBulkWriter.write(allMessagesToSave);
        await this.messageBulkWriter.end();
      }
    } catch (err) {
      console.log('error: ', err);
    } finally {
      client.destroy();
    }
  }
}
