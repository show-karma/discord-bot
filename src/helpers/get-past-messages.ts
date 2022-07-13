import { Channel, Client, GuildChannel, Intents, Interaction } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const getPastMessages = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
  });

  await client.login(process.env.DISCORD_TOKEN);
  client.once('ready', async () => {
    console.log('Ready');
  });

  var dateObj = new Date();
  var requiredDate = dateObj.setMonth(dateObj.getMonth() - 6);

  // delay to client starts
  await delay(5000);

  const { userId, daoId } = { userId: '508309789210836993', daoId: '781670867129335869' };
  try {
    const channels = await (await client.guilds.fetch(daoId)).channels.cache;
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
    let numberOfComentsOnTheServer = 0;
    // loop all channels
    for (const channel of textChannels) {
      // set the ID of the first message
      let pointerMessage = undefined;
      let flagToContinue = false;
      do {
        // get all the messages of the channel
        let messages = await ((await client.channels.cache.get(channel.id)) as any).messages.fetch({
          limit: 100,
          before: pointerMessage
        });

        const messagesToArray = Array.from(messages);

        // loop all the messages to see how many messages belong to the user
        messagesToArray.length &&
          messages.map((message: any) => {
            if (+message.author.id === +userId && +message.createdTimestamp >= +requiredDate) {
              // console.log(+message.createdTimestamp, +requiredDate);
              // count the messages in each channel and the total messages in the server
              numberOfComentsOnTheServer++;
              channel.countMessages++;
            }
          });
        // change the pointer array, like:
        // 0 => 100
        // 101 => 200
        pointerMessage = messagesToArray[messagesToArray.length - 1]
          ? messagesToArray[messagesToArray.length - 1][0]
          : undefined;
        // flag to know if have more messages to continue the loop
        flagToContinue = messagesToArray.length && [...messages].length > 0;
      } while (flagToContinue);
    }
    console.log(textChannels);
    console.log('Total Messages send: ' + numberOfComentsOnTheServer);
    // return res.json({
    //   textChannels,
    //   numberOfComentsOnTheServer
    // });
    return;
  } catch (err) {
    console.log('error: ', err);
    // return res.status(err.httpStatus).json({
    //   err: err.message === 'Missing Access' ? `This server doesn't have the bot` : err.message
    // });
  }
};

getPastMessages();
