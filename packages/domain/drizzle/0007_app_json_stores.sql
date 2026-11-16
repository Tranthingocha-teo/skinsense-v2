-- The web app's JSON stores (orders, chat threads, shop/specialist/product registries, clinical cases, routines...),
-- moved out of JSON files in the "photos" Storage bucket. Each store is one row: `key` is the Storage path the file
-- used to live at, `data` the whole JSON document, `version` a counter every write bumps. Writers compare-and-swap
-- (UPDATE ... WHERE key = $k AND version = $v), so two serverless instances can no longer both read the same list and
-- have the later write erase the other's row. Hand-written (like 0005/0006): not part of src/schema.ts.
--
-- Service role only: RLS is on with no policy, and the client roles hold no privilege on the table.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS "app_json_stores" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"version" bigint DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_json_stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "app_json_stores" FROM anon, authenticated;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
		GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "app_json_stores" TO service_role;
	END IF;
END $$;
