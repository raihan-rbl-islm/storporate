CREATE TABLE IF NOT EXISTS "club_sponsorship_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"corporate_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"corporate_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"corporate_id" text NOT NULL,
	"candidate_kind" text NOT NULL,
	"candidate_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "club_sponsorship_interests_club_corporate_uniq" ON "club_sponsorship_interests" USING btree ("club_id","corporate_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_applications_student_corporate_uniq" ON "student_applications" USING btree ("student_id","corporate_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_interests_corporate_candidate_uniq" ON "corporate_interests" USING btree ("corporate_id","candidate_kind","candidate_id");
