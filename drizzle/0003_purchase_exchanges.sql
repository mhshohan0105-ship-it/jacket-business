CREATE TABLE "jacket"."purchase_exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"date" date NOT NULL,
	"from_product_id" integer NOT NULL,
	"from_size" text NOT NULL,
	"to_product_id" integer NOT NULL,
	"to_size" text NOT NULL,
	"qty" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jacket"."purchase_exchanges" ADD CONSTRAINT "purchase_exchanges_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "jacket"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."purchase_exchanges" ADD CONSTRAINT "purchase_exchanges_from_product_id_products_id_fk" FOREIGN KEY ("from_product_id") REFERENCES "jacket"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jacket"."purchase_exchanges" ADD CONSTRAINT "purchase_exchanges_to_product_id_products_id_fk" FOREIGN KEY ("to_product_id") REFERENCES "jacket"."products"("id") ON DELETE no action ON UPDATE no action;