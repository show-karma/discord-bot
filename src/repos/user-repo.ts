import pool from '../config/database-config';

interface User {
  id: number;
  discordHandle: string;
}

export default class UserRepository {
  async getUsersWithDiscordHandle(discordId?: string) {
    const users = discordId
      ? (
          await pool.query(
            `
              SELECT "id", "discordHandle"
              FROM "User"
              WHERE "discordHandle" = $1`,
            [discordId]
          )
        ).rows
      : (
          await pool.query(`
          SELECT "id", "discordHandle"
          FROM "User"
          WHERE "discordHandle" IS NOT NULL`)
        ).rows;

    return <User[]>users;
  }
}
