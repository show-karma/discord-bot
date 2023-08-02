/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios from 'axios';
import pool from '../../config/database-config';
import { Client, Intents } from 'discord.js';
import getTokenBalance from '../../utils/get-token-balance';
import { BulkWriter } from '../bulk-writer';

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

async function fetchDelegates(daoName: string, publicAddress?: string) {
  const params: any[] = [daoName];

  let delegateQuery = `
    SELECT 
      "t1"."id",
      "t1"."discordHandle",
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
    `;

  if (publicAddress) {
    params.push(publicAddress);
    delegateQuery += ` AND "u"."publicAddress" = $2`;
  }

  try {
    const result = await pool.query(delegateQuery, params);
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
  delegate.trustLevel = !delegate.handle ? 'no forum link' : 'already have the criterea';

  delegate.hasPermission =
    delegate.offChainVotesPct >= 50 ||
    (+delegate.balance >= 50000 && delegate.offChainVotesPct > 0);

  if (!delegate.hasPermission && delegate.handle) {
    delegate.trustLevel = await fetchDelegateTrustLevel(delegate.handle, dao.forum);
    delegate.hasPermission = delegate.hasPermission || delegate.trustLevel >= 2;
  }

  return delegate;
}

async function manageRoles(client: Client, guildId: string, handles: any[], action: string) {
  if (!handles.length) return;

  const guild = client.guilds.cache.get(guildId);

  if (!guild) throw new Error('Guild not found');

  const role = guild.roles.cache.find((role) => role.name === ROLE_NAME);

  if (!role) throw new Error('Role not found');

  for (const handle of handles) {
    const member = await guild.members.fetch(handle.discordHandle).catch(console.error);

    if (member) {
      await member.roles[action](role).catch(console.error);
      console.log(
        `Role: ${role.name} | action: ${action} | user: ${member.user.tag} | address: ${handle.publicAddress} | offChain: ${handle.offChainVotesPct} | balance: ${handle.balance} | forumLevel: ${handle.trustLevel} | hasCriterea: ${handle.hasPermission}`
      );
    }
  }

  const BulkWriterClient = new BulkWriter();
  await BulkWriterClient.updateRolesLogs(action, handles, ROLE_NAME);
}

export async function discordRoleManager(_?: string, publicAddress?: string) {
  const dao = await fetchDaoData();
  const delegates = await fetchDelegates(dao.name, publicAddress);
  console.log(delegates);

  if (!delegates?.length) return console.log('No delegates found');

  const addHandles = [];
  const revokeHandles = [];

  const delegatesBalance = await getTokenBalance(
    delegates.map((d) => d.publicAddress),
    dao.tokenAddress
  );

  for (const delegate of delegates) {
    delegate.balance = +delegate.balance + (delegatesBalance?.[delegate.publicAddress] || 0);
    const delegateWithStatus = await delegateHasPermission(delegate, dao);

    (delegateWithStatus.hasPermission ? addHandles : revokeHandles).push(delegateWithStatus);
  }

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
