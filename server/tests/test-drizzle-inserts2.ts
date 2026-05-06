import { db } from './src/db/client.js'
import { tasks, events } from './src/db/schema.js'

async function run() {
  try {
    const taskRes = await db.insert(tasks).values({
      userId: 1n,
      title: "Test Task",
      done: false,
    }).returning();
    console.log("Task Insert success:", taskRes);

    const eventRes = await db.insert(events).values({
      userId: 1n,
      title: "Test Event",
      date: new Date(),
    }).returning();
    console.log("Event Insert success:", eventRes);
  } catch (err: any) {
    console.log("Insert error:", err.message);
  }
  process.exit(0);
}
run();
