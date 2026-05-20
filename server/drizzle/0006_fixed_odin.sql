DROP INDEX "Event_recurrenceGroupId_idx";--> statement-breakpoint
ALTER TABLE "Event" DROP COLUMN "recurrence";--> statement-breakpoint
ALTER TABLE "Event" DROP COLUMN "recurrenceGroupId";--> statement-breakpoint
ALTER TABLE "Task" DROP COLUMN "favorite";--> statement-breakpoint
ALTER TABLE "Task" DROP COLUMN "tag";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "birthDate";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "bio";--> statement-breakpoint
DROP TYPE "public"."EventRecurrence";