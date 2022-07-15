import pool from '../config/database-config';

export class LastMessageIdGetterService {
  async getLastMessageId(guildId: string, channelId: string): Promise<string | null> {
    const sql = `SELECT "messageId" FROM "DelegateDiscordMessage" WHERE "guildId" = '${guildId}' AND "channelId" = '${channelId}' ORDER BY "messageCreatedAt" DESC LIMIT 1`;

    const result = await pool.query(sql);

    if (result.rows.length > 0) {
      return result.rows[0].messageId as string;
    }

    return null;
  }
}
