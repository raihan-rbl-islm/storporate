-- Phase 7: real user accounts.
--
-- One row per Supabase-authenticated account. `auth_user_id` mirrors
-- `auth.users.id` so we can join from server actions / middleware to
-- the source-of-truth email/session Supabase manages. We deliberately
-- do not store the email here — that lives in auth.users and is read
-- back via `supabase.auth.getUser()` so email changes propagate
-- automatically.
--
-- `role`, `persona_id`, and `onboarded_at` flip from NULL → populated
-- as the user walks role-selection → minimum-required-fields
-- onboarding. While any of these are missing the user is treated as
-- "in onboarding" and bounced to the right step.

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" text NOT NULL,
	"role" text,
	"persona_id" text,
	"display_name" text DEFAULT '' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_uniq" ON "users" USING btree ("auth_user_id");