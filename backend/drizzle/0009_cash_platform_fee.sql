-- Cash collections: partner can mark a shoot paid in cash, then owes the platform fee online.
ALTER TYPE "payment_via" ADD VALUE IF NOT EXISTS 'cash';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_status" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_order_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_payment_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_paid_at" timestamp with time zone;
