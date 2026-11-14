-- =============================================================================
-- Migration 0005: Complete Seller System Schema (Shops, Products, Orders, Withdrawals)
-- =============================================================================

-- 1. Shops Table
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_status_check" CHECK (status IN ('pending', 'approved', 'rejected')),
	CONSTRAINT "shops_operating_status_check" CHECK (operating_status IN ('open', 'temporarily_closed'))
);
ALTER TABLE "shops" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "shops: owner insert" ON "shops" AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK (user_id = (select auth.uid()) AND status = 'pending');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "shops: owner select & update" ON "shops" AS PERMISSIVE FOR ALL TO "authenticated"
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "shops: public select" ON "shops" AS PERMISSIVE FOR SELECT TO "authenticated"
    USING (status = 'approved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Seller Products Table
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_vnd_non_negative" CHECK (price_vnd >= 0),
	CONSTRAINT "stock_non_negative" CHECK (stock >= 0),
	CONSTRAINT "seller_products_status_check" CHECK (status IN ('draft', 'active', 'inactive', 'out_of_stock'))
);
ALTER TABLE "seller_products" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_shop_id_shops_id_fk"
    FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "seller_products: owner access" ON "seller_products" AS PERMISSIVE FOR ALL TO "authenticated"
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "seller_products: public select" ON "seller_products" AS PERMISSIVE FOR SELECT TO "authenticated"
    USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Seller Orders Table
CREATE TABLE IF NOT EXISTS "seller_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" text UNIQUE NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_quantity_positive" CHECK (quantity > 0),
	CONSTRAINT "seller_orders_status_check" CHECK (status IN ('pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled', 'refunded'))
);
ALTER TABLE "seller_orders" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_shop_id_shops_id_fk"
    FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "seller_orders: seller select & update" ON "seller_orders" AS PERMISSIVE FOR ALL TO "authenticated"
    USING (seller_user_id = (select auth.uid())) WITH CHECK (seller_user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "seller_orders: customer select" ON "seller_orders" AS PERMISSIVE FOR SELECT TO "authenticated"
    USING (customer_user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Seller Withdrawals Table
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
	"processed_at" timestamp with time zone,
	CONSTRAINT "withdrawal_amount_positive" CHECK (amount_vnd > 0),
	CONSTRAINT "seller_withdrawals_status_check" CHECK (status IN ('pending', 'approved', 'rejected'))
);
ALTER TABLE "seller_withdrawals" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE "seller_withdrawals" ADD CONSTRAINT "seller_withdrawals_shop_id_shops_id_fk"
    FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "seller_withdrawals: owner access" ON "seller_withdrawals" AS PERMISSIVE FOR ALL TO "authenticated"
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
