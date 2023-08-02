/* eslint-disable @typescript-eslint/no-explicit-any */
import pool from '../config/database-config';

const BULK_SIZE = 1000;

export interface Message {
  userId: string;
  messageId: string;
  guildId: string;
  channelId: string;
  messageCreatedAt: Date;
  messageType: string;
}

export class BulkWriter {
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
    await this.end();
  }

  private async insertMessages(messages: Message[]) {
    const insertValues = messages
      .map(
        (m) =>
          `('${m.userId}', '${m.messageId}', '${m.guildId}', '${
            m.channelId
          }', '${m.messageCreatedAt.toISOString()}', '${m.messageType}')`
      )
      .join(',');

    const sql = `INSERT INTO "DelegateDiscordMessage" ("userId", "messageId", "guildId", "channelId", "messageCreatedAt", "messageType") VALUES ${insertValues} ON CONFLICT ("messageId", "userId", "guildId", "channelId") DO NOTHING`;

    await pool.query(sql);
  }

  async updateRolesLogs(action: string, delegates: any[], role: string) {
    const integration = 'discord';
    const description = 'discord role';
    const dateNow = Date.now();

    const insertValues = delegates
      .map(
        (d) =>
          `('${d.id}', '${integration}', '${description}', '${role.toLowerCase()}', '${dateNow}')`
      )
      .join(',');

    const sql =
      action === 'add'
        ? `INSERT INTO "DelegateIntegrations" ("delegateId", "integration", "description", "attribute", "issuedAt") VALUES ${insertValues} 
      ON CONFLICT ("delegateId", "integration", "attribute") 
      DO UPDATE SET "issuedAt" = CASE WHEN "DelegateIntegrations"."issuedAt" IS NULL THEN '${dateNow}'
          ELSE "DelegateIntegrations"."issuedAt" END`
        : `UPDATE "DelegateIntegrations" SET "issuedAt" = null
        WHERE "delegateId" IN (${delegates.map((d) => d.id as number).join(', ')}) 
        AND "attribute" = '${role.toLowerCase()}' `;

    await pool.query(sql);
  }
}
