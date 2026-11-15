-- Tables the web /api/profile route reads and writes (with the service role). Hand-written: the safe subset of
-- supabase/schema.sql. Owners may read their own profile; nobody but the service role may write, so a user cannot
-- change their own `role`. specialists has no client policy at all (service role only).
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_role_check" CHECK (role in ('customer', 'specialist', 'shop', 'admin')),
	CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles: owner read" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (id = (select auth.uid()));--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "specialists" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"license_number" text NOT NULL,
	"specialty" text NOT NULL,
	"hospital" text,
	"experience_years" integer DEFAULT 5 NOT NULL,
	"phone" text,
	"email" text,
	"avatar_url" text,
	"status" text DEFAULT 'approved' NOT NULL,
	"bio" text,
	"rating" numeric(2, 1) DEFAULT 5.0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"cases_count" integer DEFAULT 0 NOT NULL,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specialists_status_check" CHECK (status in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "specialists" ENABLE ROW LEVEL SECURITY;
