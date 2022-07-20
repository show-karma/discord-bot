import { Pool, Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { PGHOST, PGPORT, PGUSERNAME, PGPASSWORD, PGDATABASE } = process.env;

const config = {
  user: PGUSERNAME,
  password: PGPASSWORD,
  database: PGDATABASE,
  host: PGHOST,
  port: +PGPORT
};

const pool = new Pool(config);

export function getClient(): Client {
  return new Client(config);
}

export default pool;
