import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const sql = fs.readFileSync('create_missing_tables.sql', 'utf8');
  await client.query(sql);
  console.log('Successfully created tables.');
  await client.end();
}

run().catch(console.error);
