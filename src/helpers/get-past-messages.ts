import { Channel, Client, GuildChannel, Intents, Interaction } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

export const getPastMessages = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
  });

  client.once('ready', async () => {
    console.log('Ready');
  });

  await client.login(process.env.DISCORD_TOKEN);

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
        // loop all the messages to see how many messages belong to the user
        Array.from(messages).length &&
          messages.map((message: any) => {
            if (+message.author.id === +userId) {
              // count the messages in each channel and the total messages in the server
              numberOfComentsOnTheServer++;
              channel.countMessages++;
            }
          });
        // change the pointer array, like:
        // 0 => 100
        // 101 => 200
        pointerMessage = Array.from(messages)[Array.from(messages).length - 1]
          ? Array.from(messages)[Array.from(messages).length - 1][0]
          : undefined;
        // flag to know if have more messages to continue the loop
        flagToContinue = Array.from(messages).length && [...messages].length > 0;
      } while (flagToContinue);
    }
    console.log(textChannels);
    console.log('Total Messages send: ' + numberOfComentsOnTheServer);
    // return res.json({
    //   textChannels,
    //   numberOfComentsOnTheServer
    // });
  } catch (err) {
    console.log('error: ', err);
    // return res.status(err.httpStatus).json({
    //   err: err.message === 'Missing Access' ? `This server doesn't have the bot` : err.message
    // });
  }
};

getPastMessages();
