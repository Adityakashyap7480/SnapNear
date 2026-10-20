-- Partner payout requests from the Wallet screen, worked manually by the Super Admin.
CREATE TABLE IF NOT EXISTS "payout_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_id" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_requests_creator_idx" ON "payout_requests" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_requests_status_idx" ON "payout_requests" USING btree ("status","created_at");
