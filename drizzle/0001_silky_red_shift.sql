CREATE TABLE IF NOT EXISTS "outreach_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"role" text NOT NULL,
	"persona_id" text NOT NULL,
	"corporate_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "outreach_events_persona_corporate_kind_uniq" ON "outreach_events" USING btree ("role","persona_id","kind","corporate_id");
