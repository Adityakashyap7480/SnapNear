-- Partner collect QR: native UPI payload (PhonePe/GPay) alongside existing payment-link share URL.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_qr_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_qr_upi" text;
