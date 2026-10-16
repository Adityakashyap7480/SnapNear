ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "latitude" double precision;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "longitude" double precision;
