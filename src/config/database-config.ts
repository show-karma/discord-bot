import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { PGHOST, PGPORT, PGUSERNAME, PGPASSWORD, PGDATABASE } = process.env;

const pool = new Pool({
  user: PGUSERNAME,
  password: PGPASSWORD,
  database: PGDATABASE,
  host: PGHOST,
  port: PGPORT,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true
  }
});

export default pool;
