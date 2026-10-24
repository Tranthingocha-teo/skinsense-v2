-- =============================================================================
-- SkinSense v2 Master Database Schema & Row-Level Security Policies
-- Paste and execute this entire script in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. Photos Table
CREATE TABLE IF NOT EXISTS "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"storage_path" text NOT NULL,
	"brightness" real,
	"awb_locked" boolean NOT NULL,
	"note" text,
	CONSTRAINT "photos_note_length" CHECK (char_length("note") <= 500)
);
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "photos: owner only" ON "photos" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Routine Items Table (Checklist definitions)
CREATE TABLE IF NOT EXISTS "routine_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "routine_items_user_id_label_unique" UNIQUE("user_id","label")
);
ALTER TABLE "routine_items" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "routine_items: owner only" ON "routine_items" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Routine Entries Table (Daily completions)
CREATE TABLE IF NOT EXISTS "routine_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"night" date NOT NULL,
	"completed_labels" text[] NOT NULL,
	"item_count" integer NOT NULL,
	CONSTRAINT "routine_entries_user_id_night_unique" UNIQUE("user_id","night")
);
ALTER TABLE "routine_entries" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "routine_entries: owner only" ON "routine_entries" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Facial Zone Readings Table
CREATE TABLE IF NOT EXISTS "zone_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"zone" text NOT NULL,
	"redness" real NOT NULL,
	"unevenness" real NOT NULL,
	"pixel_count" integer NOT NULL,
	CONSTRAINT "zone_readings_photo_id_zone_unique" UNIQUE("photo_id","zone")
);
ALTER TABLE "zone_readings" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "zone_readings" ADD CONSTRAINT "zone_readings_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "zone_readings" ADD CONSTRAINT "zone_readings_photo_id_photos_id_fk" 
    FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "zone_readings: owner only" ON "zone_readings" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Spots Table (Acne & Markings)
CREATE TABLE IF NOT EXISTS "spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"zone" text NOT NULL
);
ALTER TABLE "spots" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "spots" ADD CONSTRAINT "spots_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "spots" ADD CONSTRAINT "spots_photo_id_photos_id_fk" 
    FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "spots: owner only" ON "spots" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Photo Tags Table
CREATE TABLE IF NOT EXISTS "photo_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "photo_tags_label_length" CHECK (char_length("label") between 1 and 24)
);
ALTER TABLE "photo_tags" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_photo_id_photos_id_fk" 
    FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "photo_tags_photo_label_unique" ON "photo_tags" USING btree ("photo_id", lower("label"));

DO $$ BEGIN
  CREATE POLICY "photo_tags: owner only" ON "photo_tags" AS PERMISSIVE FOR ALL TO "authenticated" 
    USING (user_id = (select auth.uid())) 
    WITH CHECK (user_id = (select auth.uid()) and exists (select 1 from photos p where p.id = photo_id and p.user_id = (select auth.uid())));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 7. Feedback Table
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"platform" text NOT NULL,
	"app_version" text,
	"device_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_message_length" CHECK (char_length(message) between 1 and 2000)
);
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "feedback: owner insert" ON "feedback" AS PERMISSIVE FOR INSERT TO "authenticated" 
    WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "feedback: owner read" ON "feedback" AS PERMISSIVE FOR SELECT TO "authenticated" 
    USING (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 8. Storage RLS Policy for Private `photos` Bucket
-- Note: Create the private bucket named 'photos' under Storage before running this
DO $$ BEGIN
  CREATE POLICY "photos: owner folder" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = (select auth.uid())::text)
    WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
