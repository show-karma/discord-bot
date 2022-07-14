import pool from '../config/database-config';

interface Message {
  messageId: string;
}

export default class MessageRepository {
  async getLastMessageOfOneChannel(channelId: string) {
    return <Message>(
      await pool.query(
        `
        SELECT "messageId"
        FROM "MessageTable"
        WHERE "channelId" = '$1'
        ORDER BY "messageId" DESC
        LIMIT 1`,
        [channelId]
      )
    ).rows;
  }
}
