/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, TextChannel } from 'discord.js';
import 'dotenv/config';
import request from 'supertest';
import deployCommands from '../src/deploy-commands';

const client = new Client({
  intents: []
});

afterAll(() => client.destroy());

describe('BOT', () => {
  const api = request(process.env.PROD_API_URL);

  describe('BOT - Login', () => {
    it(`BOT shouldn't login`, async () => {
      try {
        await client.login('fakeToken');
      } catch (err) {
        expect(err.message).toBe('An invalid token was provided.');
      }
    });

    it('BOT should login', async () => {
      const response = await client.login(process.env.DISCORD_TOKEN);
      expect(typeof response).toBe('string');
    });
  });

  describe('BOT - Deploy Commands', () => {
    jest.setTimeout(10000);
    it(`BOT shouldn't deploy commands`, async () => {
      try {
        await deployCommands('fakeGuildID');
      } catch (err) {
        expect(err.message).toContain('Value "fakeGuildID" is not snowflake');
      }
    });

    it(`BOT should deploy commands`, async () => {
      jest.setTimeout(10000);
      const response = await deployCommands('781670867129335869');
      expect(response[0]).toHaveProperty('id');
      expect(response[0]).toHaveProperty('application_id');
    });
  });

  describe('BOT - Status Commands', () => {
    jest.setTimeout(10000);

    it(`BOT shouldn't answear status commands`, async () => {
      await client.login(process.env.DISCORD_TOKEN);
      const channel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;
      const resp = await channel.send('/karma stats user:nick.eth dao:ens');
      console.log(resp);
    });
  });

  //   it(`BOT should deploy commands`, async () => {
  //     const response = await deployCommands('781670867129335869');
  //     expect(response[0]).toHaveProperty('id');
  //     expect(response[0]).toHaveProperty('application_id');
  //   });
  // });
});
