// Domain-owned Postgres schema (ADR 0002): Supabase migrations are generated
// from this file with `bun run db:generate`, never hand-written. Not re-exported
// from index.ts on purpose — apps talk to Supabase via supabase-js, and pulling
// drizzle-orm into the Metro/Next bundles buys nothing.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgPolicy,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUsers } from "drizzle-orm/supabase";
import { FEEDBACK_KINDS, FEEDBACK_MESSAGE_MAX, FEEDBACK_PLATFORMS } from "./feedback";
import { NOTE_MAX, TAG_MAX } from "./notes";
import { ZONES } from "./zones";

const ownerColumns = {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    // Not drizzle's authUid: that is a subquery, which Postgres rejects in DEFAULT.
    .default(sql`auth.uid()`)
    .references(() => authUsers.id, { onDelete: "cascade" }),
};

const ownerOnly = (name: string) =>
  pgPolicy(`${name}: owner only`, {
    for: "all",
    to: authenticatedRole,
    using: sql`user_id = (select auth.uid())`,
    withCheck: sql`user_id = (select auth.uid())`,
  });

export const photos = pgTable(
  "photos",
  {
    ...ownerColumns,
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
    storagePath: text("storage_path").notNull(),
    brightness: real(),
    awbLocked: boolean("awb_locked").notNull(),
    // Stored trimmed; null when the Photo has no Note (notes.ts).
    note: text(),
  },
  (t) => [check("photos_note_length", sql`char_length(${t.note}) <= ${sql.raw(String(NOTE_MAX))}`), ownerOnly("photos")],
).enableRLS();

// A Photo's Tags (notes.ts): trimmed labels, unique per Photo ignoring case, deleted with the Photo.
export const photoTags = pgTable(
  "photo_tags",
  {
    ...ownerColumns,
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    label: text().notNull(),
  },
  (t) => [
    check("photo_tags_label_length", sql`char_length(${t.label}) between 1 and ${sql.raw(String(TAG_MAX))}`),
    uniqueIndex("photo_tags_photo_label_unique").on(t.photoId, sql`lower(${t.label})`),
    // Also requires the Photo to be the caller's: a tag on someone else's Photo would block their label through the unique index.
    pgPolicy("photo_tags: owner only", {
      for: "all",
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
      withCheck: sql`user_id = (select auth.uid()) and exists (select 1 from photos p where p.id = photo_id and p.user_id = (select auth.uid()))`,
    }),
  ],
).enableRLS();

export const spots = pgTable(
  "spots",
  {
    ...ownerColumns,
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    // Normalized face-relative coordinates, plus the zone assigned at mark
    // time: landmarks aren't retained, so it can't be recomputed later.
    x: real().notNull(),
    y: real().notNull(),
    zone: text({ enum: ZONES as [string, ...string[]] }).notNull(),
  },
  () => [ownerOnly("spots")],
).enableRLS();

export const zoneReadings = pgTable(
  "zone_readings",
  {
    ...ownerColumns,
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    zone: text({ enum: ZONES as [string, ...string[]] }).notNull(),
    redness: real().notNull(),
    unevenness: real().notNull(),
    pixelCount: integer("pixel_count").notNull(),
  },
  (t) => [unique().on(t.photoId, t.zone), ownerOnly("zone_readings")],
).enableRLS();

export const routineItems = pgTable(
  "routine_items",
  {
    ...ownerColumns,
    label: text().notNull(),
    position: integer().notNull(),
  },
  // Labels are the snapshot key in routine_entries (ADR 0004), so they must be
  // unique per user; this also makes concurrent default-seeding idempotent.
  (t) => [unique().on(t.userId, t.label), ownerOnly("routine_items")],
).enableRLS();

// One night's record (ADR 0004): labels snapshotted at tick time, plus the
// item total at tick time so completion % never drifts when items change.
export const routineEntries = pgTable(
  "routine_entries",
  {
    ...ownerColumns,
    night: date().notNull(),
    completedLabels: text("completed_labels").array().notNull(),
    itemCount: integer("item_count").notNull(),
  },
  (t) => [unique().on(t.userId, t.night), ownerOnly("routine_entries")],
).enableRLS();

// Written by the user, read back only by its author; Dinh reads it in the Supabase dashboard
// (service role bypasses RLS). No update or delete policy: sent feedback is final.
export const feedback = pgTable(
  "feedback",
  {
    ...ownerColumns,
    kind: text({ enum: FEEDBACK_KINDS }).notNull(),
    message: text().notNull(),
    platform: text({ enum: FEEDBACK_PLATFORMS }).notNull(),
    // Both null unless the user opted in to attaching them.
    appVersion: text("app_version"),
    deviceNote: text("device_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    check("feedback_message_length", sql`char_length(message) between 1 and ${sql.raw(String(FEEDBACK_MESSAGE_MAX))}`),
    pgPolicy("feedback: owner insert", { for: "insert", to: authenticatedRole, withCheck: sql`user_id = (select auth.uid())` }),
    pgPolicy("feedback: owner read", { for: "select", to: authenticatedRole, using: sql`user_id = (select auth.uid())` }),
  ],
).enableRLS();
