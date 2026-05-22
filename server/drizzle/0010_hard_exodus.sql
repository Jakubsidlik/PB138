CREATE TYPE "public"."VoteType" AS ENUM('LIKE', 'DISLIKE');--> statement-breakpoint
CREATE TABLE "FileRating" (
	"fileId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"vote" "VoteType" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "FileRating_fileId_userId_pk" PRIMARY KEY("fileId","userId")
);
--> statement-breakpoint
CREATE TABLE "LessonRating" (
	"lessonId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"vote" "VoteType" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "LessonRating_lessonId_userId_pk" PRIMARY KEY("lessonId","userId")
);
--> statement-breakpoint
ALTER TABLE "FileRating" ADD CONSTRAINT "FileRating_fileId_FileRecord_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."FileRecord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FileRating" ADD CONSTRAINT "FileRating_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LessonRating" ADD CONSTRAINT "LessonRating_lessonId_Lesson_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LessonRating" ADD CONSTRAINT "LessonRating_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "FileRating_fileId_idx" ON "FileRating" USING btree ("fileId");--> statement-breakpoint
CREATE INDEX "FileRating_userId_idx" ON "FileRating" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LessonRating_lessonId_idx" ON "LessonRating" USING btree ("lessonId");--> statement-breakpoint
CREATE INDEX "LessonRating_userId_idx" ON "LessonRating" USING btree ("userId");