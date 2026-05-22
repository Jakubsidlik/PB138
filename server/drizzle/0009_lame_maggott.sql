ALTER TABLE "Lesson" ADD COLUMN "userId" bigint;--> statement-breakpoint
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Lesson_userId_idx" ON "Lesson" USING btree ("userId");