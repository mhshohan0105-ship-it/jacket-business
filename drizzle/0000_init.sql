CREATE SCHEMA IF NOT EXISTS "jacket";
--> statement-breakpoint
CREATE TABLE "jacket"."preorder_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"preorder_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"size" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jacket"."preorders" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"customer" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jacket"."products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#0F5C45' NOT NULL,
	"buy_price" integer NOT NULL,
	"sell_prices" integer[] NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "jacket"."purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"size" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_cost" integer NOT NULL,
	"courier" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jacket"."purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"supplier" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jacket"."sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"size" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jacket"."sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"customer" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"payment_status" text NOT NULL,
	"expected_pay_date" date,
	"paid_date" date,
	"preorder_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jacket"."preorder_items" ADD CONSTRAINT "preorder_items_preorder_id_preorders_id_fk" FOREIGN KEY ("preorder_id") REFERENCES "jacket"."preorders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."preorder_items" ADD CONSTRAINT "preorder_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "jacket"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "jacket"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "jacket"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "jacket"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "jacket"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."sales" ADD CONSTRAINT "sales_preorder_id_preorders_id_fk" FOREIGN KEY ("preorder_id") REFERENCES "jacket"."preorders"("id") ON DELETE set null ON UPDATE no action;