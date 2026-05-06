CREATE TABLE "FileShare" (
	"fileId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"permission" text DEFAULT 'read' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "FileShare_fileId_userId_pk" PRIMARY KEY("fileId","userId")
);
--> statement-breakpoint
CREATE INDEX "FileShare_fileId_idx" ON "FileShare" USING btree ("fileId");--> statement-breakpoint
CREATE INDEX "FileShare_userId_idx" ON "FileShare" USING btree ("userId");