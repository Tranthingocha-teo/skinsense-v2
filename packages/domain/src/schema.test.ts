import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import * as schema from "./schema";
import { ZONES } from "./zones";

const tables = Object.values(schema).map(getTableConfig);
const byName = (name: string) => {
  const t = tables.find((t) => t.name === name);
  if (!t) throw new Error(`schema has no table ${name}`);
  return t;
};
const CORE_ENTITIES = ["photo_tags", "photos", "routine_entries", "routine_items", "spots", "zone_readings"];
const SELLER_TABLES = ["seller_orders", "seller_products", "seller_withdrawals", "shops"];
const coreEntities = CORE_ENTITIES.map(byName);
// Every table with a user_id owner column (seller_orders has customer/seller ids instead).
const ownerScoped = [...CORE_ENTITIES, "feedback", "seller_products", "seller_withdrawals", "shops"].map(byName);
const policiesOf = (name: string) => byName(name).policies.map((p) => [p.name, p.for]);

describe("domain-owned schema (ADR 0002)", () => {
  it("defines the persisted entities, photo tags, feedback and the seller tables, and nothing else", () => {
    expect(tables.map((t) => t.name).sort()).toEqual([...CORE_ENTITIES, "feedback", ...SELLER_TABLES].sort());
  });

  it("photos has a nullable Note of at most 500 characters", () => {
    const t = getTableConfig(schema.photos);
    expect(t.columns.find((c) => c.name === "note")?.notNull).toBe(false);
    expect(t.checks.map((c) => c.name)).toEqual(["photos_note_length"]);
  });

  it("photo_tags belong to a Photo (deleted with it), labelled 1–24 characters, unique per Photo ignoring case", () => {
    const t = getTableConfig(schema.photoTags);
    const photoFk = t.foreignKeys.find((fk) => fk.reference().columns[0].name === "photo_id");
    expect(photoFk?.reference().foreignTable).toBe(schema.photos);
    expect(photoFk?.onDelete).toBe("cascade");
    expect(t.columns.find((c) => c.name === "label")?.notNull).toBe(true);
    expect(t.checks.map((c) => c.name)).toEqual(["photo_tags_label_length"]);
    expect(t.indexes.map((i) => [i.config.name, i.config.unique])).toEqual([["photo_tags_photo_label_unique", true]]);
  });

  it.each(ownerScoped)("$name is owner-scoped: user_id not null with default auth.uid(), RLS on", (t) => {
    const userId = t.columns.find((c) => c.name === "user_id");
    expect(userId?.notNull).toBe(true);
    expect(JSON.stringify(userId?.default)).toContain("auth.uid()");
    expect(t.enableRLS).toBe(true);
  });

  it.each(coreEntities)("$name has one owner-only policy for authenticated", (t) => {
    expect(t.policies).toHaveLength(1);
    expect(t.policies[0].for).toBe("all");
    expect(t.policies[0].to).toBe(authenticatedRole);
  });

  it("feedback lets its author insert and read it back, nothing else", () => {
    const t = getTableConfig(schema.feedback);
    expect(t.policies.map((p) => [p.for, p.to])).toEqual([
      ["insert", authenticatedRole],
      ["select", authenticatedRole],
    ]);
    const column = (name: string) => t.columns.find((c) => c.name === name);
    expect(column("kind")?.enumValues).toEqual(["bug", "idea", "other"]);
    expect(column("platform")?.enumValues).toEqual(["web", "android"]);
    expect(column("message")?.notNull).toBe(true);
    expect(column("app_version")?.notNull).toBe(false);
    expect(column("device_note")?.notNull).toBe(false);
    expect(column("created_at")?.notNull).toBe(true);
  });

  it.each(SELLER_TABLES.map(byName))("$name has RLS on and no catch-all (FOR ALL) policy", (t) => {
    expect(t.enableRLS).toBe(true);
    expect(t.policies.map((p) => p.for)).not.toContain("all");
  });

  it("seller tables have one policy per allowed command, named like 0006_seller_system.sql", () => {
    expect(policiesOf("shops")).toEqual([
      ["shops_select", "select"],
      ["shops_insert", "insert"],
      ["shops_update", "update"],
    ]);
    expect(policiesOf("seller_products")).toEqual([
      ["seller_products_select", "select"],
      ["seller_products_insert", "insert"],
      ["seller_products_update", "update"],
      ["seller_products_delete", "delete"],
    ]);
    expect(policiesOf("seller_orders")).toEqual([
      ["seller_orders_select", "select"],
      ["seller_orders_insert", "insert"],
      ["seller_orders_update", "update"],
    ]);
    expect(policiesOf("seller_withdrawals")).toEqual([
      ["seller_withdrawals_select", "select"],
      ["seller_withdrawals_insert", "insert"],
    ]);
  });

  it("seller inserts are tied to the caller: shops and withdrawals pending, products and withdrawals in a shop they own", () => {
    const check = (table: string, name: string) => {
      const p = byName(table).policies.find((p) => p.name === name);
      return JSON.stringify(p?.withCheck);
    };
    expect(check("shops", "shops_insert")).toMatch(/status = 'pending'/);
    expect(check("seller_withdrawals", "seller_withdrawals_insert")).toMatch(/status = 'pending'/);
    expect(check("seller_withdrawals", "seller_withdrawals_insert")).toMatch(/exists \(select 1 from public\.shops/);
    expect(check("seller_products", "seller_products_insert")).toMatch(/exists \(select 1 from public\.shops/);
    expect(check("seller_orders", "seller_orders_insert")).toMatch(/customer_user_id = \(select auth\.uid\(\)\)/);
  });

  it("spots and zone_readings persist the zone as one of the five names", () => {
    for (const t of tables.filter((t) => ["spots", "zone_readings"].includes(t.name))) {
      const zone = t.columns.find((c) => c.name === "zone");
      expect(zone?.enumValues).toEqual(ZONES);
    }
  });
});
