import pool from '../config/database-config';

interface Dao {
  id: number;
  discordGuildId: string;
}

export default class DaoRepository {
  async getDaoWithDiscordGuildId() {
    return <Dao[]>(
      await pool.query(`
        SELECT "discordGuildId"
        FROM "DaoInfo"
        WHERE "discordGuildId" IS NOT NULL`)
    ).rows;
  }
}
