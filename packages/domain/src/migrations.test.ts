import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Applies the committed SQL migrations, in journal order, to an empty Postgres (PGlite) with small stand-ins for what
// Supabase provides (auth.users, auth.uid(), storage.objects, the authenticated role), then checks that one user
// cannot see or write another user's rows. It proves the migrations are applicable from zero, not that a real
// Supabase project is configured.
const dir = new URL("../drizzle/", import.meta.url);
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

async function freshDb() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array(name, '/') $$;
    GRANT USAGE ON SCHEMA auth, storage, public TO authenticated;
    INSERT INTO auth.users VALUES ('${A}'), ('${B}');
  `);
  const journal = JSON.parse(readFileSync(new URL("meta/_journal.json", dir), "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) {
    for (const stmt of readFileSync(new URL(`${tag}.sql`, dir), "utf8").split("--> statement-breakpoint")) {
      if (stmt.trim()) await db.exec(stmt);
    }
  }
  await db.exec("GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated; GRANT ALL ON storage.objects TO authenticated;");
  return db;
}

async function as(db: PGlite, user: string, sql: string) {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${user}',false);`);
  try {
    return await db.query<Record<string, string>>(sql);
  } finally {
    await db.exec("RESET ROLE");
  }
}

describe("committed migrations", () => {
  it("apply in order to an empty database and isolate two users by row-level security", async () => {
    const db = await freshDb();
    await as(db, A, `INSERT INTO photos (storage_path, awb_locked) VALUES ('${A}/a.jpg', true)`);
    await as(db, B, `INSERT INTO photos (storage_path, awb_locked) VALUES ('${B}/b.jpg', true)`);

    const seen = await as(db, A, "SELECT storage_path FROM photos");
    expect(seen.rows.map((r) => r.storage_path)).toEqual([`${A}/a.jpg`]);

    await expect(as(db, A, `INSERT INTO photos (user_id, storage_path, awb_locked) VALUES ('${B}', 'x', true)`)).rejects.toThrow(
      /row-level security/,
    );
  }, 60_000);

  it("limit the photos bucket to the owner's folder", async () => {
    const db = await freshDb();
    await db.exec(`INSERT INTO storage.objects (bucket_id, name) VALUES ('photos', '${A}/a.jpg'), ('photos', '${B}/b.jpg')`);
    const seen = await as(db, A, "SELECT name FROM storage.objects");
    expect(seen.rows.map((r) => r.name)).toEqual([`${A}/a.jpg`]);
  }, 60_000);
});
