/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Client, Intents } from 'discord.js';
import UserRepository from '../repos/user-repo';
import DaoRepository from '../repos/dao-repo';
import { delay } from '../utils/delay';
import dotenv from 'dotenv';
import { LastMessageIdGetterService } from './last-message-id-getter.service';
import { MessageBulkWriter } from './message-bulk-writer';
dotenv.config();

interface MessageCustom {
  id: string;
  createdTimestamp: string;
  author: { id: string };
}

export default class GetPastMessagesService {
  constructor(
    private readonly userRepository = new UserRepository(),
    private readonly daoRepository = new DaoRepository(),
    private readonly getMessageService = new LastMessageIdGetterService(),
    private readonly messageBulkWriter = new MessageBulkWriter()
  ) {}

  // eslint-disable-next-line max-lines-per-function
  async getMessages(discordId?: string, guildIds?: string | string[]) {
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
      const allUsers = await this.userRepository.getUsersWithDiscordHandle(discordId);

      const allGuilds = guildIds?.length
        ? guildIds
        : (await this.daoRepository.getDaoWithDiscordGuildId()).map((dao) => dao.discordGuildId);
      const allMessagesToSave = [];
      if (!allGuilds.length || !allUsers.length) {
        throw new Error('Daos or Users are empty');
      }

      for (const guild of allGuilds) {
        if (!allBotGuilds.find((item) => item[0] === guild)) continue;

        const channels = (await client.guilds.fetch(guild)).channels.cache;
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
          const fixedMessageId = await this.getMessageService.getLastMessageId(guild, channel.id);
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
                const userExists = allUsers.find(
                  (user) => user.discordHandle === message.author.id
                );
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
                    guildId: guild,
                    channelId: channel.id,
                    userId: userExists.id
                  });
                }
              });

            pointerMessage = messagesToArray[messagesToArray.length - 1]?.[0];
          } while (pointerMessage && pointerMessage > fixedMessageId && flagTimeRangeContinue);
        }
      }

      if (allMessagesToSave.length > 0) {
        await this.messageBulkWriter.write(allMessagesToSave);
        await this.messageBulkWriter.end();
      }
    } catch (err) {
      console.log('error: ', err);
    }
    client.destroy();
    process.exit(1);
  }
}
