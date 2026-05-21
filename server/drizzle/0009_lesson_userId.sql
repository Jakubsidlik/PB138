ALTER TABLE "Lesson" ADD COLUMN "userId" bigint REFERENCES "User"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Lesson_userId_idx" ON "Lesson" ("userId");
