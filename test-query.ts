import { db } from './server/src/db/client.ts';
import { sql } from 'drizzle-orm';
import { fileRecords } from './server/src/db/schema.ts';

async function main() {
  try {
    await db.execute(sql`
      select "FileRecord"."id", max(case when "FileRating"."userId" = 1 then "FileRating"."vote"::text else null end)
      from "FileRecord"
      left join "FileRating" on "FileRecord"."id" = "FileRating"."fileId"
      group by "FileRecord"."id"
    `);
    console.log("SUCCESS");
  } catch (e: any) {
    console.error("FULL ERROR:", e);
  }
  process.exit(0);
}

main();
