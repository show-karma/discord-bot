import express, { text } from "express";
import initBot from "./main.js";

const client = await initBot();
const app = express();
app.use(express.json());
const port = 3000;
app.listen(port, () => {
  console.log("Server on: ", port);
});

app.get("/:userId/:daoId", async (req, res) => {
  const { userId, daoId } = req.params;
  try {
    const channels = await (await client.guilds.fetch(daoId)).channels.cache;
    const textChannels = [];

    [...channels].map((channel) => {
      if (
        channel[1].name &&
        channel[1].id &&
        channel[1].type === "GUILD_TEXT"
      ) {
        textChannels.push({
          name: channel[1].name,
          id: channel[1].id,
          countMessages: 0,
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
        let messages = await client.channels.cache
          .get(channel.id)
          .messages.fetch({ limit: 100, before: pointerMessage });

        // loop all the messages to see how many messages belong to the user
        messages.map((message) => {
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
        flagToContinue = messages && [...messages].length > 0;
      } while (flagToContinue);
    }
    console.log(textChannels);
    console.log("Total Messages send: " + numberOfComentsOnTheServer);

    return res.json({
      textChannels,
      numberOfComentsOnTheServer,
    });
  } catch (err) {
    console.log(err);
    return res.status(err.httpStatus).json({
      err:
        err.message === "Missing Access"
          ? `This server doesn't have the bot`
          : err.message,
    });
  }
});
