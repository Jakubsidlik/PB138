import { db } from './server/src/db/client.ts';
import { sql } from 'drizzle-orm';
import { lessonsRepository } from './server/src/modules/lessons/lessons.repository.ts';

async function main() {
  try {
    const actorId = 1; // Assuming user ID 1 exists
    const lessonId = 1n; // Assuming lesson ID 1 exists
    await lessonsRepository.setVote(lessonId, BigInt(actorId), 'LIKE');
    console.log("SUCCESS VOTE");
    
    const lesson = await lessonsRepository.findById(lessonId, actorId);
    console.log("LESSON:", lesson);
  } catch (e: any) {
    console.error("FULL ERROR:", e);
  }
  process.exit(0);
}

main();
