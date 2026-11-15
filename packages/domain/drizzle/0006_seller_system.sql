-- Seller system: shops, seller_products, seller_orders, seller_withdrawals. Hand-written (like 0005) because it
-- carries what drizzle cannot model: column-level GRANTs and the seller_orders insert trigger. The policies mirror
-- src/schema.ts; change both together.
--
-- Idempotent on purpose: production already has these four tables and policies, created out-of-band. Every table is
-- CREATE ... IF NOT EXISTS, every constraint is dropped-if-exists then re-added, and every policy name this project
-- has ever used (the first PR draft's, production's, and the ones below) is dropped before the policies are created.
--
-- Who may write what (status, is_official, wallet balance, order totals and earnings are service-role only):
--   shops               owner inserts a pending, non-official, zero-balance shop; owner updates profile columns only.
--   seller_products     owner of the row AND of its shop inserts/updates; owner deletes; anyone reads active ones.
--   seller_orders       a customer inserts their own pending order (price, seller, totals derived by trigger);
--                       the shop's owner updates status/shipping columns only; customer and shop owner read.
--   seller_withdrawals  shop owner inserts a pending request and reads it; nobody but the service role updates it.
CREATE TABLE IF NOT EXISTS "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"shop_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"contact_name" text,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"avatar_url" text,
	"banner_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"operating_status" text DEFAULT 'open' NOT NULL,
	"rating" real DEFAULT 5.0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"wallet_balance_vnd" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"category" text NOT NULL,
	"price_vnd" integer NOT NULL,
	"original_price_vnd" integer,
	"stock" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"images" text[],
	"primary_image_url" text,
	"summary" text,
	"description" text,
	"ingredients" text,
	"skin_type_compatibility" text[],
	"how_to_use" text,
	"caution" text,
	"origin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" text NOT NULL,
	"shop_id" uuid NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_address" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"product_image" text,
	"price_vnd" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_vnd" integer NOT NULL,
	"shop_earnings_vnd" integer NOT NULL,
	"platform_fee_vnd" integer NOT NULL,
	"note" text,
	"payment_method" text DEFAULT 'cod' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tracking_code" text,
	"shipping_provider" text DEFAULT 'SPX Express',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seller_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"amount_vnd" integer NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_holder" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seller_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seller_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seller_withdrawals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Postgres' auto-generated names, in case the out-of-band tables declared these constraints inline; the named
-- equivalents are re-added below, so dropping them never leaves a table unconstrained.
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_user_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_shop_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_user_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_price_vnd_check";--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_stock_check";--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_order_code_key";--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_shop_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_seller_user_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_customer_user_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_quantity_check";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_shop_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_user_id_fkey";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_amount_vnd_check";--> statement-breakpoint
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_status_check";--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_status_check" CHECK (status IN ('pending', 'approved', 'rejected'));--> statement-breakpoint
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_operating_status_check";--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_operating_status_check" CHECK (operating_status IN ('open', 'temporarily_closed'));--> statement-breakpoint
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "price_vnd_non_negative";--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "price_vnd_non_negative" CHECK (price_vnd >= 0);--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "stock_non_negative";--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "stock_non_negative" CHECK (stock >= 0);--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_status_check";--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_status_check" CHECK (status IN ('draft', 'active', 'inactive', 'out_of_stock'));--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_shop_id_shops_id_fk";--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_products" DROP CONSTRAINT IF EXISTS "seller_products_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_order_code_unique";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_order_code_unique" UNIQUE ("order_code");--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "order_quantity_positive";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "order_quantity_positive" CHECK (quantity > 0);--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_payment_method_check";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_payment_method_check" CHECK (payment_method IN ('cod', 'vietqr'));--> statement-breakpoint
-- Same list as ORDER_STATUSES in src/marketplace.ts (the transition table only moves between these).
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_status_check";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_status_check" CHECK (status IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'completed', 'cancelled', 'refunded'));--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_shop_id_shops_id_fk";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_seller_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_seller_user_id_users_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders" DROP CONSTRAINT IF EXISTS "seller_orders_customer_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "withdrawal_amount_positive";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" ADD CONSTRAINT "withdrawal_amount_positive" CHECK (amount_vnd > 0);--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_status_check";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" ADD CONSTRAINT "seller_withdrawals_status_check" CHECK (status IN ('pending', 'approved', 'rejected'));--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_shop_id_shops_id_fk";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" ADD CONSTRAINT "seller_withdrawals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_withdrawals" DROP CONSTRAINT IF EXISTS "seller_withdrawals_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "seller_withdrawals" ADD CONSTRAINT "seller_withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Policies: drop every name ever used (first PR draft, production, current), then create the current set.
DROP POLICY IF EXISTS "shops: owner insert" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops: owner select & update" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops: public select" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops_select" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops_insert" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops_update" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "shops_delete" ON "shops";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products: owner access" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products: public select" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products_select" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products_insert" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products_update" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_products_delete" ON "seller_products";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders: seller select & update" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders: customer select" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders_select" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders_insert" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders_update" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_orders_delete" ON "seller_orders";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_withdrawals: owner access" ON "seller_withdrawals";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_withdrawals_select" ON "seller_withdrawals";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_withdrawals_insert" ON "seller_withdrawals";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_withdrawals_update" ON "seller_withdrawals";--> statement-breakpoint
DROP POLICY IF EXISTS "seller_withdrawals_delete" ON "seller_withdrawals";--> statement-breakpoint
CREATE POLICY "shops_select" ON "shops" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (status = 'approved' or user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "shops_insert" ON "shops" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()) and status = 'pending' and is_official = false and wallet_balance_vnd = 0);--> statement-breakpoint
CREATE POLICY "shops_update" ON "shops" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "seller_products_select" ON "seller_products" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (status = 'active' or user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "seller_products_insert" ON "seller_products" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()) and exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_products_update" ON "seller_products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()) and exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_products_delete" ON "seller_products" AS PERMISSIVE FOR DELETE TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "seller_orders_select" ON "seller_orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (customer_user_id = (select auth.uid()) or exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_orders_insert" ON "seller_orders" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (customer_user_id = (select auth.uid()) and status = 'pending');--> statement-breakpoint
CREATE POLICY "seller_orders_update" ON "seller_orders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid()))) WITH CHECK (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_withdrawals_select" ON "seller_withdrawals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "seller_withdrawals_insert" ON "seller_withdrawals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (select auth.uid()) and status = 'pending' and processed_at is null and exists (select 1 from public.shops s where s.id = shop_id and s.user_id = (select auth.uid())));--> statement-breakpoint
-- Column privileges. Supabase grants ALL on public tables to anon and authenticated by default; RLS filters rows,
-- these GRANTs decide which columns a client may write at all. Not granted = service role only.
REVOKE INSERT, UPDATE, DELETE ON "shops", "seller_products", "seller_orders", "seller_withdrawals" FROM "anon";--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "shops" FROM "authenticated";--> statement-breakpoint
GRANT INSERT ("id", "user_id", "shop_name", "owner_name", "contact_name", "phone", "email", "address", "category", "description", "avatar_url", "banner_url", "operating_status", "status") ON "shops" TO "authenticated";--> statement-breakpoint
GRANT UPDATE ("shop_name", "owner_name", "contact_name", "phone", "email", "address", "category", "description", "avatar_url", "banner_url", "operating_status", "updated_at") ON "shops" TO "authenticated";--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "seller_orders" FROM "authenticated";--> statement-breakpoint
GRANT INSERT ("id", "order_code", "shop_id", "customer_user_id", "customer_name", "customer_phone", "customer_address", "product_id", "product_name", "product_image", "quantity", "note", "payment_method") ON "seller_orders" TO "authenticated";--> statement-breakpoint
GRANT UPDATE ("status", "tracking_code", "shipping_provider", "updated_at") ON "seller_orders" TO "authenticated";--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "seller_withdrawals" FROM "authenticated";--> statement-breakpoint
GRANT INSERT ("id", "shop_id", "user_id", "amount_vnd", "bank_name", "account_number", "account_holder", "status") ON "seller_withdrawals" TO "authenticated";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "seller_products" TO "authenticated";--> statement-breakpoint
-- A client-inserted order takes its price from the shop's active product and its seller from the approved shop,
-- whatever the client sent; totals, fee (5 %, as calculateOrderFinancials) and earnings are always computed here.
-- SECURITY INVOKER on purpose: the lookups run under the customer's RLS, so only approved shops and active products
-- can be ordered from. The service role (current_user is not a client role) keeps the price it supplies.
CREATE OR REPLACE FUNCTION public.seller_orders_before_insert() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    SELECT s.user_id INTO NEW.seller_user_id FROM public.shops s WHERE s.id = NEW.shop_id AND s.status = 'approved';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'seller_orders: shop % is not open for orders', NEW.shop_id USING ERRCODE = 'check_violation';
    END IF;
    SELECT p.price_vnd INTO NEW.price_vnd FROM public.seller_products p
      WHERE p.id::text = NEW.product_id AND p.shop_id = NEW.shop_id AND p.status = 'active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'seller_orders: product % is not on sale in shop %', NEW.product_id, NEW.shop_id USING ERRCODE = 'check_violation';
    END IF;
    NEW.status := 'pending';
    NEW.tracking_code := NULL;
  END IF;
  NEW.total_vnd := NEW.price_vnd * NEW.quantity;
  NEW.platform_fee_vnd := round(NEW.total_vnd * 0.05)::integer;
  NEW.shop_earnings_vnd := NEW.total_vnd - NEW.platform_fee_vnd;
  RETURN NEW;
END
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "seller_orders_before_insert" ON "seller_orders";--> statement-breakpoint
CREATE TRIGGER "seller_orders_before_insert" BEFORE INSERT ON "seller_orders" FOR EACH ROW EXECUTE FUNCTION public.seller_orders_before_insert();
