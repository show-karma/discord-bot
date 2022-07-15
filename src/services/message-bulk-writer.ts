import pool from '../config/database-config';

const BULK_SIZE = 1000;

export interface Message {
  userId: string;
  messageId: string;
  guildId: string;
  channelId: string;
  messageCreatedAt: Date;
}

export class MessageBulkWriter {
  private messages: Message[] = [];
  private messageCount = 0;
  private messageInsertCount = 0;

  async write(messages: Message[]) {
    this.messages.push(...messages);
    this.messageCount += messages.length;
    await this.tryToWriteMessages();
  }

  async end() {
    if (this.messages.length > 0) {
      await this.tryToWriteMessages(true);
    }
  }

  private async tryToWriteMessages(isEndWrite = false) {
    while (this.messages.length >= BULK_SIZE || (isEndWrite && this.messages.length > 0)) {
      const toWriteMessages = this.messages.splice(0, BULK_SIZE);
      await this.insertMessages(toWriteMessages);
      this.messageInsertCount += toWriteMessages.length;
    }
  }

  private async insertMessages(messages: Message[]) {
    const insertValues = messages
      .map(
        (m) =>
          `('${m.userId}', '${m.messageId}', '${m.guildId}', '${
            m.channelId
          }', '${m.messageCreatedAt.toISOString()}')`
      )
      .join(',');

    const sql = `INSERT INTO "DelegateDiscordMessage" ("userId", "messageId", "guildId", "channelId", "messageCreatedAt") VALUES ${insertValues} ON CONFLICT ("messageId", "userId", "guildId", "channelId") DO NOTHING`;

    await pool.query(sql);
  }
}
