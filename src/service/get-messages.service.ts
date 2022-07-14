/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Client, Intents } from 'discord.js';
import UserRepository from '../repos/user-repo';
import DaoRepository from '../repos/dao-repo';
import MessageRepository from '../repos/message-repo';
import { delay } from '../utils/delay';
import dotenv from 'dotenv';

dotenv.config();

interface MessageCustom {
  createdTimestamp: string;
  author: { id: string };
}

export default class GetPastMessagesService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly daoRepository = new DaoRepository(),
    private readonly messageRepository = new MessageRepository()
  ) {}

  async getMessages() {
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
      const allUsers = await this.userRepository.getUsersWithDiscordHandle();
      const allDaos = await this.daoRepository.getDaoWithDiscordGuildId();
      const allMessagesToSave = []; // arrays to save all messages

      if (!allDaos.length || !allUsers.length) {
        throw new Error('Daos or Users are empty');
      }

      for (const dao of allDaos) {
        if (!allBotGuilds.find((item) => item[0] === dao.discordGuildId)) continue;

        const channels = (await client.guilds.fetch(dao.discordGuildId)).channels.cache;
        const textChannels = [];
        [...channels].map((channel) => {
          if (channel[1].name && channel[1].id && channel[1].type === 'GUILD_TEXT') {
            textChannels.push({
              name: channel[1].name,
              id: channel[1].id,
              countMessages: 0
            });
          }
        });

        for (const channel of textChannels) {
          const lastMessageId = await this.messageRepository.getLastMessageOfOneChannel(channel.id);
          let pointerMessage = lastMessageId.messageId || undefined;
          let flagToContinue = false;
          do {
            const messages = await (
              (await client.channels.cache.get(channel.id)) as any
            ).messages.fetch({
              limit: 100,
              before: pointerMessage
            });

            const messagesToArray = Array.from(messages);

            messagesToArray.length &&
              messages.map((message: MessageCustom) => {
                const userExists = allUsers.find(
                  (user) => user.discordHandle === message.author.id
                );
                if (userExists && +message.createdTimestamp >= +requiredDate) {
                  allMessagesToSave.push({
                    date: message.createdTimestamp,
                    guildId: dao.discordGuildId,
                    channelId: channel.id,
                    userId: userExists.id
                  });
                }
              });

            pointerMessage = messagesToArray[messagesToArray.length - 1]
              ? messagesToArray[messagesToArray.length - 1][0]
              : undefined;

            flagToContinue = messagesToArray.length && [...messages].length > 0;
          } while (flagToContinue);
        }
      }

      // here need to implement the query to insert allMessagesToSave

      return client.destroy();
    } catch (err) {
      console.log('error: ', err);
    }
  }
}

new GetPastMessagesService().getMessages();
