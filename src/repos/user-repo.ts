import pool from '../config/database-config';

interface User {
  id: number;
  discordHandle: string;
}

export default class UserRepository {
  async getUsersWithDiscordHandle() {
    return <User[]>(
      await pool.query(`
    SELECT "id", "discordHandle"
    FROM "User"
    WHERE "discordHandle" IS NOT NULL`)
    ).rows;
  }
}
