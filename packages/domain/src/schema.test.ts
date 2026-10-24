import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import * as schema from "./schema";
import { ZONES } from "./zones";

const tables = Object.values(schema).map(getTableConfig);
const entities = tables.filter((t) => t.name !== "feedback");

describe("domain-owned schema (ADR 0002)", () => {
  it("defines the persisted entities, photo tags and feedback", () => {
    expect(tables.map((t) => t.name).sort()).toEqual(
      ["feedback", "photo_tags", "photos", "routine_entries", "routine_items", "spots", "zone_readings"],
    );
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

  it.each(tables)("$name is owner-scoped: user_id not null with default auth.uid(), RLS on", (t) => {
    const userId = t.columns.find((c) => c.name === "user_id");
    expect(userId?.notNull).toBe(true);
    expect(JSON.stringify(userId?.default)).toContain("auth.uid()");
    expect(t.enableRLS).toBe(true);
  });

  it.each(entities)("$name has one owner-only policy for authenticated", (t) => {
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

  it("spots and zone_readings persist the zone as one of the five names", () => {
    for (const t of tables.filter((t) => ["spots", "zone_readings"].includes(t.name))) {
      const zone = t.columns.find((c) => c.name === "zone");
      expect(zone?.enumValues).toEqual(ZONES);
    }
  });
});
