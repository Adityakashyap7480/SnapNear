ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;-->statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"client_id" text NOT NULL,
	"stars" integer NOT NULL,
	"remark" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);-->statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_ratings" ADD CONSTRAINT "booking_ratings_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;-->statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_ratings" ADD CONSTRAINT "booking_ratings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;-->statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_ratings" ADD CONSTRAINT "booking_ratings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;-->statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "booking_ratings_booking_uidx" ON "booking_ratings" USING btree ("booking_id");-->statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_ratings_creator_idx" ON "booking_ratings" USING btree ("creator_id","created_at");
