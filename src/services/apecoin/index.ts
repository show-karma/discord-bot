/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios from 'axios';
import pool from '../../config/database-config';
import { Client, Intents } from 'discord.js';
import getTokenBalance from '../../utils/get-token-balance';

const ROLE_NAME = 'Assembly';

async function fetchDaoData() {
  const daoQuery = `
  SELECT "t1"."name", "t2"."discordGuildId", "t2"."forum", "t2"."tokenAddress"
  FROM "Dao" as t1 
  INNER JOIN "DaoInfo" as t2 ON "t1"."name" = "t2"."name"
  WHERE "t1"."name" = 'apecoin'
  `;
  try {
    const result = await pool.query(daoQuery);
    return result?.rows?.[0];
  } catch (err) {
    console.error('Error fetching Dao data:', err);
  }
}

async function fetchDelegates(daoName: string, delegateId?: number) {
  const delegateQuery = `
    SELECT "t1"."discordHandle",
        "u"."publicAddress",      
        "t2"."offChainVotesPct",
        "t1"."snapshotDelegatedVotes" as "balance",
        "t3"."handle"
  FROM "Delegate" AS t1
  INNER JOIN "User" as u on "t1"."userId" = "u"."id"
  INNER JOIN "DelegateStat" AS t2 ON "t1"."id" = "t2"."delegateId"
  LEFT JOIN "DelegateDiscourseEth" AS t3 ON "t1"."id" = "t3"."delegateId"
  WHERE "t1"."daoName" = $1
    AND "t2"."period" = '1y'
    AND "t1"."discordHandle" IS NOT NULL
    ${delegateId ? `AND "t1"."id" = ${delegateId}` : ''}
    `;
  try {
    const result = await pool.query(delegateQuery, [daoName]);
    return result?.rows;
  } catch (err) {
    console.error('Error fetching delegates:', err);
  }
}

async function fetchDelegateTrustLevel(
  delegateHandle: string,
  daoForum: string
): Promise<number | null> {
  try {
    const response = await axios.get(`${daoForum}/u/${delegateHandle}.json`);
    return response?.data?.user?.trust_level;
  } catch (err) {
    console.error(`Error fetching ${delegateHandle}'s trust level:, err`);
  }
}

async function delegateHasPermission(delegate, dao) {
  let hasPermission =
    delegate.offChainVotesPct >= 50 ||
    (+delegate.balance >= 50000 && delegate.offChainVotesPct > 0);

  if (!hasPermission && delegate.handle) {
    const trustLevel = await fetchDelegateTrustLevel(delegate.handle, dao.forum);
    hasPermission = hasPermission || trustLevel >= 2;
  }

  return hasPermission;
}

async function manageRoles(client: Client, guildId: string, handles: string[], action: string) {
  const guild = client.guilds.cache.get(guildId);

  if (!guild) throw new Error('Guild not found');

  const role = guild.roles.cache.find((role) => role.name === ROLE_NAME);

  if (!role) throw new Error('Role not found');

  for (const handle of handles) {
    const member = await guild.members.fetch(handle).catch(console.error);

    if (member) {
      await member.roles[action](role).catch(console.error);
      console.log(`Role: ${role.name} | action: ${action} | user: ${member.user.tag}`);
    }
  }
}

export default async function roleManager(delegateId?: number) {
  const dao = await fetchDaoData();

  const delegates = await fetchDelegates(dao.name, delegateId);

  if (!delegates?.length) return console.log('No delegates found');

  const addHandles = [];
  let revokeHandles = [];

  const delegatesBalance = await getTokenBalance(
    delegates.map((d) => d.publicAddress),
    dao.tokenAddress
  );

  for (const delegate of delegates) {
    delegate.balance = +delegate.balance + (delegatesBalance?.[delegate.publicAddress] || 0);
    const hasPermission = await delegateHasPermission(delegate, dao);

    (hasPermission ? addHandles : revokeHandles).push(delegate.discordHandle);
  }

  revokeHandles = revokeHandles.filter((handle) => !addHandles.includes(handle));

  console.log('addHandles', addHandles);
  console.log('revokeHandles', revokeHandles);

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES]
  });

  client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    await manageRoles(client, dao.discordGuildId, addHandles, 'add');
    await manageRoles(client, dao.discordGuildId, revokeHandles, 'remove');

    console.log('Roles updated successfully');
    client.destroy();
  });

  client.login(process.env.DISCORD_TOKEN);
}

(async () => await roleManager())();
