/* eslint-disable max-lines-per-function */
import { Client, TextChannel } from 'discord.js';
import 'dotenv/config';
import linkWalletHandler from '../src/commandsHandler/link-wallet';
import getDelegateData from '../src/commandsHandler/get-delegate-data';
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

  describe('BOT - Status Commands', () => {
    jest.setTimeout(30000);
    it(`User not found`, async () => {
      const ticketChannel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;

      const response = await getDelegateData(
        'notfounduser.eth',
        'ens',
        'KarmaBot-TestServer',
        process.env.DISCORD_TEST_APPLICATION_ID,
        ticketChannel
      );
      expect(response.content).toBe('Something went wrong, please try again');
    });

    it(`Dao not found`, async () => {
      const ticketChannel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;

      const response = await getDelegateData(
        'nick.eth',
        'invaliddao',
        'KarmaBot-TestServer',
        process.env.DISCORD_TEST_APPLICATION_ID,
        ticketChannel
      );
      expect(response.content).toContain(`We couldn't find a delegate with this address`);
    });

    it(`User found`, async () => {
      const ticketChannel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;

      const response = await getDelegateData(
        'nick.eth',
        'ens',
        'KarmaBot-TestServer',
        process.env.DISCORD_TEST_APPLICATION_ID,
        ticketChannel
      );
      expect(response.embeds.length).toBe(1);
    });
  });

  describe('BOT - Linkwallet Commands', () => {
    jest.setTimeout(30000);
    it(`Linkwallet invalid address`, async () => {
      const ticketChannel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;

      const response = await linkWalletHandler(
        '1111111',
        'ens',
        process.env.DISCORD_TEST_APPLICATION_ID,
        ticketChannel
      );

      expect(response.content).toContain('Invalid eth address');
    });

    it(`Linkwallet valid address`, async () => {
      const ticketChannel = (await (
        await client.guilds.fetch(process.env.DISCORD_TEST_GUILD_ID)
      ).channels.fetch(process.env.DISCORD_TEST_CHANNEL_ID)) as TextChannel;

      expect(
        async () =>
          await linkWalletHandler(
            '0x65C818191F9dF5381472a91571d50B3234402C54',
            'ens',
            process.env.DISCORD_TEST_APPLICATION_ID,
            ticketChannel
          )
      ).not.toThrowError();
    });
  });
});
