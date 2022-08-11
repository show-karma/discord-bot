import { Client } from 'discord.js';
import 'dotenv/config';
import deployCommands from '../src/deploy-commands';

const client = new Client({
  intents: []
});

afterAll(() => client.destroy());

describe('BOT', () => {
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
});
