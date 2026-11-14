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

// -------------------------------------------------------------
// Seller / Supplier & Marketplace Tables (Modules 1 - 6)
// -------------------------------------------------------------

export const shops = pgTable(
  "shops",
  {
    ...ownerColumns,
    shopName: text("shop_name").notNull(),
    ownerName: text("owner_name").notNull(),
    contactName: text("contact_name"),
    phone: text().notNull(),
    email: text(),
    address: text().notNull(),
    category: text().notNull(),
    description: text(),
    avatarUrl: text("avatar_url"),
    bannerUrl: text("banner_url"),
    status: text({ enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    operatingStatus: text("operating_status", { enum: ["open", "temporarily_closed"] }).notNull().default("open"),
    rating: real().notNull().default(5.0),
    reviewCount: integer("review_count").notNull().default(0),
    isOfficial: boolean("is_official").notNull().default(false),
    walletBalanceVnd: integer("wallet_balance_vnd").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("shops: owner insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid()) and status = 'pending'`,
    }),
    pgPolicy("shops: owner select & update", {
      for: "all",
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    pgPolicy("shops: public select", {
      for: "select",
      to: authenticatedRole,
      using: sql`status = 'approved'`,
    }),
  ],
).enableRLS();

export const sellerProducts = pgTable(
  "seller_products",
  {
    id: uuid().primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text().notNull(),
    brand: text().notNull(),
    category: text().notNull(),
    priceVnd: integer("price_vnd").notNull(),
    originalPriceVnd: integer("original_price_vnd"),
    stock: integer().notNull().default(0),
    status: text({ enum: ["draft", "active", "inactive", "out_of_stock"] }).notNull().default("active"),
    images: text().array(),
    primaryImageUrl: text("primary_image_url"),
    summary: text(),
    description: text(),
    ingredients: text(),
    skinTypeCompatibility: text("skin_type_compatibility").array(),
    howToUse: text("how_to_use"),
    caution: text(),
    origin: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("price_vnd_non_negative", sql`${t.priceVnd} >= 0`),
    check("stock_non_negative", sql`${t.stock} >= 0`),
    pgPolicy("seller_products: owner access", {
      for: "all",
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    pgPolicy("seller_products: public select", {
      for: "select",
      to: authenticatedRole,
      using: sql`status = 'active'`,
    }),
  ],
).enableRLS();

export const sellerOrders = pgTable(
  "seller_orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderCode: text("order_code").notNull().unique(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    sellerUserId: uuid("seller_user_id")
      .notNull()
      .references(() => authUsers.id),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => authUsers.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerAddress: text("customer_address").notNull(),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    productImage: text("product_image"),
    priceVnd: integer("price_vnd").notNull(),
    quantity: integer().notNull().default(1),
    totalVnd: integer("total_vnd").notNull(),
    shopEarningsVnd: integer("shop_earnings_vnd").notNull(),
    platformFeeVnd: integer("platform_fee_vnd").notNull(),
    note: text(),
    paymentMethod: text("payment_method", { enum: ["cod", "vietqr"] }).notNull().default("cod"),
    status: text({ enum: ["pending", "confirmed", "processing", "shipping", "completed", "cancelled", "refunded"] }).notNull().default("pending"),
    trackingCode: text("tracking_code"),
    shippingProvider: text("shipping_provider").default("SPX Express"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("order_quantity_positive", sql`${t.quantity} > 0`),
    pgPolicy("seller_orders: seller select & update", {
      for: "all",
      to: authenticatedRole,
      using: sql`seller_user_id = (select auth.uid())`,
      withCheck: sql`seller_user_id = (select auth.uid())`,
    }),
    pgPolicy("seller_orders: customer select", {
      for: "select",
      to: authenticatedRole,
      using: sql`customer_user_id = (select auth.uid())`,
    }),
  ],
).enableRLS();

export const sellerWithdrawals = pgTable(
  "seller_withdrawals",
  {
    id: uuid().primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => authUsers.id, { onDelete: "cascade" }),
    amountVnd: integer("amount_vnd").notNull(),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountHolder: text("account_holder").notNull(),
    status: text({ enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    check("withdrawal_amount_positive", sql`${t.amountVnd} > 0`),
    pgPolicy("seller_withdrawals: owner access", {
      for: "all",
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
  ],
).enableRLS();
