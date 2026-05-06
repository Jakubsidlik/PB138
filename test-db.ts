import { db } from './src/db/client.js'
import { events } from './src/db/schema.js'

async function run() {
  const allEvents = await db.select().from(events);
  console.log("EVENTS IN DB:", allEvents);
  process.exit(0);
}
run();
