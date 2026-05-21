ALTER TABLE "Event" DROP CONSTRAINT "Event_subjectId_Subject_id_fk";
--> statement-breakpoint
ALTER TABLE "FileRecord" DROP CONSTRAINT "FileRecord_lessonId_Lesson_id_fk";
--> statement-breakpoint
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_studyPlanId_StudyPlan_id_fk";
--> statement-breakpoint
ALTER TABLE "Task" DROP CONSTRAINT "Task_subjectId_Subject_id_fk";
--> statement-breakpoint
ALTER TABLE "Task" DROP CONSTRAINT "Task_studyPlanId_StudyPlan_id_fk";
--> statement-breakpoint
DROP INDEX "Event_subjectId_idx";--> statement-breakpoint
DROP INDEX "FileRecord_lessonId_idx";--> statement-breakpoint
DROP INDEX "Lesson_studyPlanId_idx";--> statement-breakpoint
DROP INDEX "Task_subjectId_idx";--> statement-breakpoint
DROP INDEX "Task_studyPlanId_idx";--> statement-breakpoint
DROP INDEX "Task_deadline_idx";--> statement-breakpoint
ALTER TABLE "Event" DROP COLUMN "subjectId";--> statement-breakpoint
ALTER TABLE "FileRecord" DROP COLUMN "lessonId";--> statement-breakpoint
ALTER TABLE "Lesson" DROP COLUMN "studyPlanId";--> statement-breakpoint
ALTER TABLE "Task" DROP COLUMN "subjectId";--> statement-breakpoint
ALTER TABLE "Task" DROP COLUMN "studyPlanId";--> statement-breakpoint
ALTER TABLE "Task" DROP COLUMN "deadline";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "faculty";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "contactEmail";