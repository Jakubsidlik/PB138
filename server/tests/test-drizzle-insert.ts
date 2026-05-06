import { db } from './src/db/client.js'
import { fileRecords } from './src/db/schema.js'

async function run() {
  try {
    const res = await db.insert(fileRecords).values({
      userId: 1n,
      subjectId: null,
      lessonId: null,
      fileKey: "x",
      fileUrl: "x",
      name: "x",
      size: 0,
      addedLabel: "x",
      isShared: false,
    }).returning();
    console.log("Drizzle Insert success:", res);
  } catch (err: any) {
    console.log("Drizzle Insert error:", err.message);
  }
  process.exit(0);
}
run();
