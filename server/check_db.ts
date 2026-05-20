import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DIRECT_URL!);

async function checkDb() {
  try {
    const activity = await client`SELECT pid, state, query, wait_event_type, wait_event FROM pg_stat_activity WHERE state != 'idle'`;
    console.log('Active queries:', activity);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkDb();
