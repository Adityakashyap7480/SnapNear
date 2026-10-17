DO $$ BEGIN
  ALTER TYPE "cancelled_by" ADD VALUE IF NOT EXISTS 'creator';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;-->statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancel_reason" text DEFAULT '' NOT NULL;-->statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancel_remark" text DEFAULT '' NOT NULL;
