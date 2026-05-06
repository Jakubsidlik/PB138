import { db } from './src/db/client.js'
import { events } from './src/db/schema.js'

async function run() {
  try {
    const actorId = 1n; // Mock actor
    
    // Simulate what bulkSync does
    const typedEvents = [
      {
        id: Date.now(),
        title: "Test Event",
        date: "2026-05-06",
        subjectId: undefined, // undefined to simulate no subject
      }
    ]

    const incomingIdSet = new Set(typedEvents.map((event) => BigInt(event.id).toString()))

    await db.transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(typedEvents.map((event) => event.subjectId).filter((id) => id != null))) as number[]
      console.log("subjectIds", subjectIds)
      
      for (const event of typedEvents) {
        const eventId = BigInt(event.id)
        let nextSubjectId = null // simplified
        
        await transaction
          .insert(events)
          .values({
            id: eventId,
            userId: actorId,
            title: event.title,
            date: new Date(event.date),
            time: null,
            location: null,
            isShared: false,
            subjectId: nextSubjectId,
            recurrence: 'NONE',
            recurrenceGroupId: null,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: events.id,
            set: {
              userId: actorId,
              title: event.title,
              date: new Date(event.date),
              time: null,
              location: null,
              isShared: false,
              subjectId: nextSubjectId,
              recurrence: 'NONE',
              recurrenceGroupId: null,
              deletedAt: null,
            },
          })
      }
    });

    console.log("PUT Event success");
  } catch (err: any) {
    console.log("PUT Event error:", err.message);
  }
  process.exit(0);
}
run();
