CREATE TABLE "jacket"."sale_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"date" date NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jacket"."sale_payments" ADD CONSTRAINT "sale_payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "jacket"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Sales already marked paid get one payment for their full amount, so nothing they owe changes.
INSERT INTO "jacket"."sale_payments" ("sale_id", "date", "amount")
SELECT s."id", COALESCE(s."paid_date", s."date"), SUM(i."qty" * i."unit_price")
FROM "jacket"."sales" s
JOIN "jacket"."sale_items" i ON i."sale_id" = s."id"
WHERE s."payment_status" = 'paid'
GROUP BY s."id", s."paid_date", s."date";
