/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';
import { delay } from 'src/utils/delay';
dotenv.config();

interface MessageCustom {
  createdTimestamp: string;
  author: { id: string };
}

export const getPastMessages = async () => {
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
    // replace getAllUser with discordHandle query
    //  SELECT "id", "discordHandle"
    //  FROM "User"
    //  WHERE "discordHandle" IS NOT NULL
    const allUsers = [];

    // replace getAllDaos with discordGuildId query
    //  SELECT "discordGuildId"
    //  FROM "DaoInfo"
    //  WHERE "discordGuildId" IS NOT NULL
    const allDaos = [];
    const allMessagesToSave = []; // arrays to save all messages

    if (!allDaos.length || !allUsers.length) {
      throw new Error('Daos or Users are empty');
    }

    for (const dao of allDaos) {
      const channels = await (await client.guilds.fetch(dao.discordGuildId)).channels.cache;
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
        // query to get the last messageId of this channel in this guild
        //  SELECT "messageId"
        //  FROM "MessageTable"
        //  WHERE "channelId" = 'channelId'
        //  ORDER BY "messageId" DESC
        //  LIMIT 1
        const lastMessageId = undefined;

        let pointerMessage = lastMessageId || undefined;
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
              const userExists = allUsers.find((user) => user.discordHandle === message.author.id);
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
    return;
  } catch (err) {
    console.log('error: ', err);
  }
};

getPastMessages();
