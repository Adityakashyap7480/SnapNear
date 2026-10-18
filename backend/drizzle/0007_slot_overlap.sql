-- Partners may hold multiple active jobs on different non-overlapping time slots.
DROP INDEX IF EXISTS "bookings_one_active_job_per_creator";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_creator_active_idx" ON "bookings" USING btree ("creator_id") WHERE "bookings"."status" in ('assigned', 'arrived', 'shooting');
