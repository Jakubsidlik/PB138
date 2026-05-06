import { db } from './src/db/client.js'
import { events } from './src/db/schema.js'

async function run() {
  try {
    const actorId = 18n; // Assuming user 18 exists
    const eventId = BigInt(Date.now());
    const parsedDate = new Date("2026-05-06");

    await db.insert(events).values({
      id: eventId,
      userId: actorId,
      title: "Test Event",
      date: parsedDate,
      time: "10:00",
      location: "Here",
      isShared: false,
      subjectId: null,
      recurrence: 'NONE',
      recurrenceGroupId: null,
      deletedAt: null,
    }).onConflictDoUpdate({
      target: events.id,
      set: {
        userId: actorId,
        title: "Test Event",
        date: parsedDate,
        time: "10:00",
        location: "Here",
        isShared: false,
        subjectId: null,
        recurrence: 'NONE',
        recurrenceGroupId: null,
        deletedAt: null,
      }
    });

    console.log("Insert success!");
  } catch (err) {
    console.error("Insert failed:", err);
  }
  process.exit(0);
}
run();
