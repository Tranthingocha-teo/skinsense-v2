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
    GRANT USAGE ON SCHEMA auth, storage, public TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
    -- Supabase's default: every new public table is fully granted to the client roles; migrations narrow it.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon;
    GRANT ALL ON storage.objects TO authenticated;
    INSERT INTO auth.users VALUES ('${A}'), ('${B}');
  `);
  const journal = JSON.parse(readFileSync(new URL("meta/_journal.json", dir), "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await applyMigration(db, tag);
  return db;
}

async function applyMigration(db: PGlite, tag: string) {
  for (const stmt of readFileSync(new URL(`${tag}.sql`, dir), "utf8").split("--> statement-breakpoint")) {
    if (stmt.trim()) await db.exec(stmt);
  }
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

  it("let a user read only their own profile and never write it (role stays server-controlled)", async () => {
    const db = await freshDb();
    await db.exec(`INSERT INTO profiles (id, email) VALUES ('${A}', 'a@x'), ('${B}', 'b@x')`);
    await db.exec(`INSERT INTO specialists (id, full_name, license_number, specialty) VALUES ('s1', 'Dr', 'L1', 'Derm')`);

    const seen = await as(db, A, "SELECT id FROM profiles");
    expect(seen.rows.map((r) => r.id)).toEqual([A]);

    await as(db, A, `UPDATE profiles SET role = 'admin' WHERE id = '${A}'`);
    const role = await db.query<{ role: string }>(`SELECT role FROM profiles WHERE id = '${A}'`);
    expect(role.rows[0].role).toBe("customer");

    await expect(as(db, A, `INSERT INTO profiles (id, email) VALUES ('${A}', 'z')`)).rejects.toThrow(/row-level security|duplicate/);
    expect((await as(db, A, "SELECT id FROM specialists")).rows).toEqual([]);
  }, 60_000);

  describe("seller system", () => {
    const SHOP_A = "aaaaaaaa-0000-0000-0000-000000000001";
    const PRODUCT_A = "aaaaaaaa-0000-0000-0000-0000000000a1";
    const newShop = (id: string, extra = "", extraValues = "") =>
      `INSERT INTO shops (id, shop_name, owner_name, phone, address, category${extra}) ` +
      `VALUES ('${id}', 'Shop', 'Owner', '0912345678', '1 Street, Hanoi', 'Serum'${extraValues})`;

    // A owns an approved shop with one active product; approval is a service-role action.
    async function sellerDb() {
      const db = await freshDb();
      await as(db, A, newShop(SHOP_A));
      await db.exec(`UPDATE shops SET status = 'approved' WHERE id = '${SHOP_A}'`);
      await as(
        db,
        A,
        `INSERT INTO seller_products (id, shop_id, name, brand, category, price_vnd, stock) VALUES ('${PRODUCT_A}', '${SHOP_A}', 'Serum B5', 'LRP', 'Serum', 200000, 5)`,
      );
      return db;
    }
    const orderInsert = (customer: string, extraCols = "", extraVals = "") =>
      `INSERT INTO seller_orders (order_code, shop_id, customer_user_id, customer_name, customer_phone, customer_address, product_id, product_name, quantity${extraCols}) ` +
      `VALUES ('ORD-1', '${SHOP_A}', '${customer}', 'B', '0988776655', '2 Street', '${PRODUCT_A}', 'Serum B5', 2${extraVals})`;

    it("let an owner register only a pending shop and never approve it or touch its wallet", async () => {
      const db = await sellerDb();
      const other = "aaaaaaaa-0000-0000-0000-000000000002";
      await expect(as(db, B, newShop(other, ", status", ", 'approved'"))).rejects.toThrow(/row-level security/);
      await expect(as(db, B, newShop(other, ", is_official", ", true"))).rejects.toThrow(/permission denied/);
      await expect(as(db, B, newShop(other, ", wallet_balance_vnd", ", 1000000"))).rejects.toThrow(/permission denied/);
      await expect(as(db, B, newShop(other, ", user_id", `, '${A}'`))).rejects.toThrow(/row-level security/);
      await as(db, B, newShop(other));
      expect((await db.query<{ status: string }>(`SELECT status FROM shops WHERE id = '${other}'`)).rows[0].status).toBe("pending");

      await expect(as(db, B, `UPDATE shops SET status = 'approved' WHERE id = '${other}'`)).rejects.toThrow(/permission denied/);
      await expect(as(db, A, `UPDATE shops SET wallet_balance_vnd = 999999999 WHERE id = '${SHOP_A}'`)).rejects.toThrow(/permission denied/);
      await expect(as(db, A, `UPDATE shops SET is_official = true WHERE id = '${SHOP_A}'`)).rejects.toThrow(/permission denied/);

      await as(db, A, `UPDATE shops SET shop_name = 'Renamed' WHERE id = '${SHOP_A}'`);
      await as(db, B, `UPDATE shops SET shop_name = 'Hijacked' WHERE id = '${SHOP_A}'`);
      const shop = await db.query<{ shop_name: string; status: string; wallet_balance_vnd: number }>(
        `SELECT shop_name, status, wallet_balance_vnd FROM shops WHERE id = '${SHOP_A}'`,
      );
      expect(shop.rows[0]).toEqual({ shop_name: "Renamed", status: "approved", wallet_balance_vnd: 0 });
    }, 60_000);

    it("keep another user's products and withdrawals out of a shop they do not own", async () => {
      const db = await sellerDb();
      await expect(
        as(db, B, `INSERT INTO seller_products (shop_id, name, brand, category, price_vnd) VALUES ('${SHOP_A}', 'Fake', 'X', 'Serum', 1)`),
      ).rejects.toThrow(/row-level security/);
      await expect(
        as(db, B, `INSERT INTO seller_withdrawals (shop_id, amount_vnd, bank_name, account_number, account_holder) VALUES ('${SHOP_A}', 100, 'MB', '1', 'B')`),
      ).rejects.toThrow(/row-level security/);
      await as(db, B, `UPDATE seller_products SET price_vnd = 1 WHERE id = '${PRODUCT_A}'`);
      expect((await db.query<{ price_vnd: number }>("SELECT price_vnd FROM seller_products")).rows[0].price_vnd).toBe(200000);
    }, 60_000);

    it("let an owner request a pending withdrawal but never approve it", async () => {
      const db = await sellerDb();
      const withdraw = (status = "") =>
        `INSERT INTO seller_withdrawals (shop_id, amount_vnd, bank_name, account_number, account_holder${status ? ", status" : ""}) ` +
        `VALUES ('${SHOP_A}', 100, 'MB', '1', 'A'${status ? `, '${status}'` : ""})`;
      await expect(as(db, A, withdraw("approved"))).rejects.toThrow(/row-level security/);
      await as(db, A, withdraw());
      await expect(as(db, A, "UPDATE seller_withdrawals SET status = 'approved'")).rejects.toThrow(/permission denied/);
      expect((await db.query<{ status: string }>("SELECT status FROM seller_withdrawals")).rows[0].status).toBe("pending");
    }, 60_000);

    it("let a customer create their own order, priced and totalled by the database", async () => {
      const db = await sellerDb();
      await expect(as(db, B, orderInsert(A))).rejects.toThrow(/row-level security/);
      await expect(as(db, B, orderInsert(B, ", total_vnd", ", 1"))).rejects.toThrow(/permission denied/);
      await expect(as(db, B, orderInsert(B, ", status", ", 'completed'"))).rejects.toThrow(/permission denied/);

      await as(db, B, orderInsert(B));
      const order = await as(db, B, "SELECT seller_user_id, price_vnd, total_vnd, platform_fee_vnd, shop_earnings_vnd, status FROM seller_orders");
      expect(order.rows).toEqual([
        { seller_user_id: A, price_vnd: 200000, total_vnd: 400000, platform_fee_vnd: 20000, shop_earnings_vnd: 380000, status: "pending" },
      ]);
      expect((await as(db, A, "SELECT order_code FROM seller_orders")).rows).toEqual([{ order_code: "ORD-1" }]);
    }, 60_000);

    it("let the shop's seller move an order's status but never rewrite its totals", async () => {
      const db = await sellerDb();
      await as(db, B, orderInsert(B));
      await expect(as(db, A, "UPDATE seller_orders SET total_vnd = 1")).rejects.toThrow(/permission denied/);
      await expect(as(db, A, "UPDATE seller_orders SET shop_earnings_vnd = 999999999")).rejects.toThrow(/permission denied/);
      await expect(as(db, A, `UPDATE seller_orders SET shop_id = '${SHOP_A}'`)).rejects.toThrow(/permission denied/);
      await as(db, B, "UPDATE seller_orders SET status = 'cancelled'");
      await as(db, A, "UPDATE seller_orders SET status = 'confirmed'");
      expect((await db.query<{ status: string; total_vnd: number }>("SELECT status, total_vnd FROM seller_orders")).rows).toEqual([
        { status: "confirmed", total_vnd: 400000 },
      ]);
      await expect(as(db, A, "UPDATE seller_orders SET status = 'teleported'")).rejects.toThrow(/seller_orders_status_check/);
    }, 60_000);

    it("re-apply cleanly over tables and policies that already exist, replacing the old broad ones", async () => {
      const db = await sellerDb();
      await db.exec(`CREATE POLICY "shops: owner select & update" ON shops FOR ALL TO authenticated USING (true) WITH CHECK (true)`);
      await db.exec("GRANT ALL ON shops TO authenticated");
      await applyMigration(db, "0006_seller_system");
      const policies = await db.query<{ policyname: string }>("SELECT policyname FROM pg_policies WHERE tablename = 'shops' ORDER BY 1");
      expect(policies.rows.map((r) => r.policyname)).toEqual(["shops_insert", "shops_select", "shops_update"]);
      await expect(as(db, A, `UPDATE shops SET status = 'pending' WHERE id = '${SHOP_A}'`)).rejects.toThrow(/permission denied/);
      expect((await db.query("SELECT id FROM seller_products")).rows).toHaveLength(1);
    }, 60_000);
  });
});
